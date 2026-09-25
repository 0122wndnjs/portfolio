import { isAuthenticated } from "@/lib/admin/auth";
import { billingRoutes } from "@/lib/admin/api/billing";
import type { Body, Method } from "@/lib/admin/api/common";
import { documentRoutes } from "@/lib/admin/api/documents";
import { projectRoutes } from "@/lib/admin/api/projects";
import { findRoute } from "@/lib/admin/api/router";
import { taskRoutes } from "@/lib/admin/api/tasks";
import { workspaceRoutes } from "@/lib/admin/api/workspace";
import { errorResponse, fail } from "@/lib/admin/http";
import { assertOrigin, relyingParty } from "@/lib/admin/webauthn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ path: string[] }> };

const routes = [...projectRoutes, ...taskRoutes, ...billingRoutes, ...documentRoutes, ...workspaceRoutes];
const fallbackMessage: Record<Method, string> = {
  GET: "불러오지 못했습니다.",
  POST: "저장하지 못했습니다.",
  PATCH: "수정하지 못했습니다.",
  DELETE: "삭제하지 못했습니다.",
};

async function handle(method: Method, request: Request, context: Context) {
  if (!(await isAuthenticated())) return fail("로그인이 필요합니다.", 401);
  if (method !== "GET") {
    try {
      await assertOrigin(request);
    } catch {
      return fail("잘못된 요청 출처입니다.", 403);
    }
  }
  const { path } = await context.params;
  const match = findRoute(routes, method, path);
  if (!match) return fail("요청한 항목을 찾을 수 없습니다.", 404);
  const body = method === "GET" ? {} : ((await request.json().catch(() => ({}))) as Body);
  try {
    const { rpID } = await relyingParty();
    return await match.route.handler({
      request,
      url: new URL(request.url),
      params: match.params,
      body: body && typeof body === "object" ? body : {},
      rpID,
    });
  } catch (error) {
    return errorResponse(error, fallbackMessage[method]);
  }
}

export const GET = (request: Request, context: Context) => handle("GET", request, context);
export const POST = (request: Request, context: Context) => handle("POST", request, context);
export const PATCH = (request: Request, context: Context) => handle("PATCH", request, context);
export const DELETE = (request: Request, context: Context) => handle("DELETE", request, context);
