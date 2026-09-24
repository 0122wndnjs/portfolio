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
    ssl: "require",
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
      void current.end({ timeout: 1 }).catch(() => undefined);
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
      const active = transactionContext.getStore();
      const sql = active ?? await connection();
      const rows = await sql.unsafe(parameters(query, normalized), normalized);
      lastHealthyAt = Date.now();
      return rows;
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
    const sql = await connection();
    activeTransactions++;
    try {
      return await sql.begin((tx) => transactionContext.run(tx, callback)) as T;
    } finally {
      activeTransactions--;
    }
  },
};
