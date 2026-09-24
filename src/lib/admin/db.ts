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
const transactionContext = new AsyncLocalStorage<QuerySql>();

function connection(): QuerySql {
  const active = transactionContext.getStore();
  if (active) return active;
  if (!client) {
    const url = process.env.ADMIN_DATABASE_URL;
    if (!url) throw new Error("ADMIN_DATABASE_URL 환경변수가 필요합니다.");
    client = postgres(url, { max: 1, prepare: false, ssl: "require" });
  }
  return client;
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
      return connection().unsafe(parameters(query, normalized), normalized);
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
  transaction<T>(callback: () => Promise<T>): Promise<T> {
    if (!client) connection();
    return client!.begin((tx) => transactionContext.run(tx, callback)) as Promise<T>;
  },
};
