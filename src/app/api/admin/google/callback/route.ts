import { audit } from "@/lib/admin/auth";
import { completeConnect, googleConfigured } from "@/lib/admin/google";
import { stateHash } from "@/lib/admin/api/google";
import { getSetting, setSetting } from "@/lib/admin/settings";
import { relyingParty } from "@/lib/admin/webauthn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 세션 쿠키가 SameSite=Strict라 구글에서 돌아오는 이 요청에는 쿠키가 없다.
// 대신 로그인한 상태에서만 만들 수 있는 1회용 state(10분)로 검증하고,
// 같은 사이트 안에서 다시 이동하도록 작은 HTML을 돌려준다.
function page(status: "connected" | "error") {
  const target = `/admin/settings?google=${status}#settings-google`;
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${target}"><script>location.replace(${JSON.stringify(target)})</script>`,
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } },
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  try {
    if (!googleConfigured() || !code || !state) return page("error");
    const [expected, expires] = await Promise.all([getSetting("google_oauth_state"), getSetting("google_oauth_expires")]);
    await setSetting("google_oauth_state", "");
    if (!expected || expected !== stateHash(state) || !expires || Date.parse(expires) < Date.now()) return page("error");
    const { origin } = await relyingParty();
    await completeConnect(origin, code);
    await audit("google.connected");
    return page("connected");
  } catch (error) {
    console.error("[admin] google callback", error instanceof Error ? error.message : "unknown");
    return page("error");
  }
}
