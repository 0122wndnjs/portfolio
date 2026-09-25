import type { Method, Route } from "./common";

/** "projects/:id/tasks" 형식 경로를 비교해 일치하면 매개변수를 돌려준다. */
export function matchPath(pattern: string, segments: string[]) {
  const parts = pattern.split("/");
  if (parts.length !== segments.length) return null;
  const params: Record<string, string> = {};
  for (const [index, part] of parts.entries()) {
    const segment = segments[index];
    if (part.startsWith(":")) {
      if (!segment) return null;
      params[part.slice(1)] = segment;
    } else if (part !== segment) return null;
  }
  return params;
}

export function findRoute(routes: Route[], method: Method, segments: string[]) {
  for (const route of routes) {
    if (route.method !== method) continue;
    const params = matchPath(route.path, segments);
    if (params) return { route, params };
  }
  return null;
}
