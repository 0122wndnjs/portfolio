import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;
type QuerySql = Pick<Sql, "unsafe">;
type Value = string | number | boolean | null;
const numericColumns = new Set([
  "count", "task_count", "done_count", "imported_item_count", "amount", "tax_amount",
  "contract_amount", "total", "paid", "counter",
]);

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const result = { ...row };
  for (const key of numericColumns) {
    const value = result[key];
    if (typeof value === "string" && /^-?\d+$/.test(value)) {
      const number = Number(value);
      if (Number.isSafeInteger(number)) result[key] = number;
    }
  }
  return result;
}

let client: Sql | undefined;
let healthCheck: Promise<Sql> | undefined;
let activeTransactions = 0;
let lastHealthyAt = 0;
const transactionContext = new AsyncLocalStorage<QuerySql>();

function createClient(): Sql {
  const url = process.env.ADMIN_DATABASE_URL;
  if (!url) throw new Error("ADMIN_DATABASE_URL 환경변수가 필요합니다.");
  return postgres(url, {
    max: 1,
    prepare: false,
    // 로컬 개발용 DB는 연결 문자열에 sslmode=disable을 붙여 TLS 없이 연결할 수 있다.
    ssl: /[?&]sslmode=disable(&|$)/.test(url) ? false : "require",
    connect_timeout: 5,
    idle_timeout: 10,
  });
}

function withTimeout<T>(operation: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    operation,
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error("데이터베이스 연결 확인 시간이 초과되었습니다.")), milliseconds);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function connection(): Promise<Sql> {
  if (healthCheck) return healthCheck;
  if (!client) {
    client = createClient();
    lastHealthyAt = Date.now();
    return client;
  }
  const current = client;
  if (activeTransactions > 0 || Date.now() - lastHealthyAt < 30_000)
    return current;

  healthCheck = (async () => {
    try {
      await withTimeout(current.unsafe("SELECT 1"), 5000);
      lastHealthyAt = Date.now();
      return current;
    } catch {
      const replacement = createClient();
      if (client === current) client = replacement;
      // 대기열로 직렬화되어 있어 교체 시점에 이 연결에서 실행 중인 쿼리는 없다.
      void current.end({ timeout: 5 }).catch(() => undefined);
      await withTimeout(replacement.unsafe("SELECT 1"), 5000);
      lastHealthyAt = Date.now();
      return replacement;
    }
  })();
  try {
    return await healthCheck;
  } finally {
    healthCheck = undefined;
  }
}

/**
 * 연결이 1개뿐이라 쿼리를 한 번에 하나씩만 보낸다. Supabase 풀러(Supavisor)는 한 연결에
 * 여러 쿼리를 파이프라인으로 보내면 응답이 멈추는 경우가 있어(파라미터 없는 쿼리 동시 5개에서 재현),
 * 호출 쪽 Promise.all도 여기서 순서대로 실행된다. 트랜잭션은 끝날 때까지 한 슬롯을 차지한다.
 */
let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

const QUERY_TIMEOUT_MS = 20_000;

function parameters(query: string, values: unknown[]) {
  let index = 0;
  const sql = query.replace(/\?/g, () => `$${++index}`);
  if (index !== values.length) throw new Error("SQL 매개변수 개수가 맞지 않습니다.");
  return sql;
}

export const db = {
  prepare(query: string) {
    const execute = async (values: unknown[]) => {
      const normalized = values.map((value): Value => {
        if (value === undefined || value === null) return null;
        if (["string", "number", "boolean"].includes(typeof value)) return value as Value;
        throw new Error("지원하지 않는 SQL 매개변수입니다.");
      });
      const text = parameters(query, normalized);
      const active = transactionContext.getStore();
      if (active) return active.unsafe(text, normalized);
      return serialize(async () => {
        const sql = await connection();
        try {
          const rows = await withTimeout(sql.unsafe(text, normalized), QUERY_TIMEOUT_MS);
          lastHealthyAt = Date.now();
          return rows;
        } catch (error) {
          // 응답 없는 연결은 다음 호출에서 상태 확인 후 교체되도록 표시한다.
          lastHealthyAt = 0;
          throw error;
        }
      });
    };
    return {
      async get(...values: unknown[]): Promise<Record<string, unknown> | undefined> {
        const rows = await execute(values);
        return rows[0] ? normalizeRow(rows[0]) : undefined;
      },
      async all(...values: unknown[]): Promise<Record<string, unknown>[]> {
        const rows = await execute(values);
        return rows.map(normalizeRow);
      },
      async run(...values: unknown[]): Promise<{ changes: number }> {
        const rows = await execute(values);
        return { changes: rows.count };
      },
    };
  },
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    // 이미 트랜잭션 안이면 같은 트랜잭션에서 실행한다(대기열 교착 방지).
    if (transactionContext.getStore()) return callback();
    return serialize(async () => {
      const sql = await connection();
      activeTransactions++;
      try {
        const result = await sql.begin((tx) => transactionContext.run(tx, callback)) as T;
        lastHealthyAt = Date.now();
        return result;
      } finally {
        activeTransactions--;
      }
    });
  },
};
