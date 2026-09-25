import "server-only";
import { randomBytes } from "node:crypto";
import { HttpError } from "@/lib/admin/http";

export type Row = Record<string, unknown>;
export type Body = Record<string, unknown>;
export type Method = "GET" | "POST" | "PATCH" | "DELETE";
export type Context = {
  request: Request;
  url: URL;
  params: Record<string, string>;
  body: Body;
  rpID: string;
};
export type Route = {
  method: Method;
  /** 예: "projects/:id/tasks" */
  path: string;
  handler: (context: Context) => Promise<Response>;
};

export const now = () => new Date().toISOString();
export const newId = () => randomBytes(16).toString("hex");
export const parse = (value: unknown) => (typeof value === "string" ? JSON.parse(value) : value);

/** 폼에서 온 빈 문자열 날짜는 NULL로 저장한다. */
export const dateOrNull = (value: unknown) => (value ? String(value) : null);

export function safeProject(row: Row) {
  return {
    ...row,
    links: parse(row.links),
    contract_amount: row.contract_amount === null ? null : Number(row.contract_amount),
  };
}

export function safeTask(row: Row) {
  return {
    ...row,
    checklist: parse(row.checklist),
    links: parse(row.links),
    archived: Boolean(row.archived),
  };
}

export const CONFLICT_MESSAGE = "다른 화면에서 먼저 수정됐습니다. 새로고침 후 다시 저장하세요.";

/**
 * 수정 충돌 감지. 클라이언트가 불러온 시점의 updated_at을 expected_updated_at으로 보내면
 * 그 사이 다른 곳에서 수정됐는지 확인한다. 값을 보내지 않으면 검사하지 않는다(빠른 상태 변경 등).
 */
export function expectedVersion(body: Body) {
  const value = body.expected_updated_at;
  return typeof value === "string" && value ? value : null;
}

export function assertFresh(current: unknown, expected: string | null) {
  if (expected && String(current) !== expected) throw new HttpError(409, CONFLICT_MESSAGE, "conflict");
}
