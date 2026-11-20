import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getSetting, setSetting } from "@/lib/admin/settings";
import { HttpError } from "@/lib/admin/http";

// documents.readonly: Gemini 회의록(캘린더 첨부 문서)을 읽어 후속 작업을 뽑는다.
const SCOPES = ["openid", "email", "https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/documents.readonly"];
const CAL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
// 복사할 때 딸려온 공백·줄바꿈 때문에 invalid_client가 나지 않도록 잘라서 쓴다.
const clientId = () => (process.env.GOOGLE_CLIENT_ID || "").trim();
const clientSecret = () => (process.env.GOOGLE_CLIENT_SECRET || "").trim();

export const googleConfigured = () =>
  Boolean(clientId() && clientSecret() && process.env.GOOGLE_TOKEN_KEY?.trim());

function key() {
  const raw = (process.env.GOOGLE_TOKEN_KEY || "").trim();
  if (!raw) throw new HttpError(500, "GOOGLE_TOKEN_KEY 환경변수가 필요합니다.");
  return createHash("sha256").update(raw).digest();
}

export function encrypt(text: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(".");
}

export function decrypt(value: string) {
  const [version, iv, tag, data] = value.split(".");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("bad token format");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}

export const redirectUri = (origin: string) => `${origin.replace(/\/$/, "")}/api/admin/google/callback`;

export function authUrl(origin: string, state: string) {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function tokenRequest(params: Record<string, string>) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId(),
      client_secret: clientSecret(),
      ...params,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: response.ok, data };
}

/** 인가 코드를 교환해 refresh token(암호화)과 계정 이메일을 저장한다. */
export async function completeConnect(origin: string, code: string) {
  const { ok, data } = await tokenRequest({ code, grant_type: "authorization_code", redirect_uri: redirectUri(origin) });
  if (!ok || typeof data.refresh_token !== "string") throw new Error(`token exchange failed: ${String(data.error || "")}`);
  let email = "";
  if (typeof data.id_token === "string") {
    try {
      // 구글 토큰 엔드포인트에서 TLS로 직접 받은 id_token이라 서명 검증 없이 이메일만 읽는다.
      email = String(JSON.parse(Buffer.from(data.id_token.split(".")[1], "base64url").toString()).email || "");
    } catch { /* 이메일은 표시용 */ }
  }
  await setSetting("google_refresh_token", encrypt(data.refresh_token));
  await setSetting("google_email", email);
  cachedToken = null;
}

let cachedToken: { token: string; expires: number } | null = null;

export async function googleConnected() {
  return googleConfigured() && Boolean(await getSetting("google_refresh_token"));
}

async function accessToken() {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.token;
  const stored = await getSetting("google_refresh_token");
  if (!stored || !googleConfigured()) throw new HttpError(409, "Google 캘린더를 먼저 연결하세요.");
  const { ok, data } = await tokenRequest({ refresh_token: decrypt(stored), grant_type: "refresh_token" });
  if (!ok || typeof data.access_token !== "string") {
    if (data.error === "invalid_grant") throw new HttpError(409, "Google 연결이 만료됐어요. 설정에서 다시 연결하세요.");
    throw new HttpError(502, "Google 인증에 실패했습니다.");
  }
  cachedToken = { token: data.access_token, expires: Date.now() + Number(data.expires_in || 3000) * 1000 };
  return cachedToken.token;
}

export async function disconnectGoogle() {
  const stored = await getSetting("google_refresh_token");
  if (stored) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(decrypt(stored))}`, { method: "POST", signal: AbortSignal.timeout(10_000) });
    } catch { /* 폐기 실패해도 로컬 연결은 끊는다 */ }
  }
  await setSetting("google_refresh_token", "");
  await setSetting("google_email", "");
  cachedToken = null;
}

export type CalendarMeeting = {
  id: string; title: string; meeting_date: string; start_time: string; duration_minutes: number;
  location: string; agenda: string; guest_emails: string; google_event_id: string; meet_url: string;
  project_name: string;
  attendees?: string; decisions?: string;
  project_client?: string; project_status?: string; project_due?: string | null;
  project_next_action?: string; project_description?: string;
  open_tasks?: Array<{ title: string; status: string; due_date: string | null }>;
  followups?: Array<{ title: string; status: string; due_date: string | null }>;
};

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
const taskLines = (rows: Array<{ title: string; status: string; due_date: string | null }>) =>
  rows.map((t) => `• ${t.title} (${t.status}${t.due_date ? ` · ${t.due_date.slice(5).replace("-", "/")} 마감` : ""})`);

/**
 * 일정 설명. 초대 손님이 있으면 손님도 설명을 보게 되므로
 * 안건·결정사항 같은 공유 가능한 내용만 넣고, 프로젝트 내부 정보는 손님이 없을 때만 넣는다.
 */
export function eventDescription(m: CalendarMeeting, adminUrl?: string) {
  const shared = [
    m.attendees ? `참석자: ${m.attendees}` : "",
    m.agenda ? `📝 안건\n${m.agenda}` : "",
    m.decisions ? `✅ 결정사항\n${m.decisions}` : "",
  ];
  const internal = parseEmails(m.guest_emails).length ? [] : [
    [`📁 ${m.project_name}${m.project_client ? ` · ${m.project_client}` : ""}`,
      [m.project_status, m.project_due ? `마감 ${m.project_due}` : ""].filter(Boolean).join(" · "),
      m.project_next_action ? `다음 할 일: ${m.project_next_action}` : "",
      m.project_description ? clip(m.project_description, 300) : ""].filter(Boolean).join("\n"),
    m.followups?.length ? `🔁 후속 작업\n${taskLines(m.followups).join("\n")}` : "",
    m.open_tasks?.length ? `📌 진행 중인 작업\n${taskLines(m.open_tasks).join("\n")}` : "",
    adminUrl ? `작업실에서 열기: ${adminUrl}/admin/meetings?view=list&meeting=${m.id}` : "",
  ];
  return clip([...shared, ...internal].filter(Boolean).join("\n\n"), 7000);
}

const pad = (n: number) => String(n).padStart(2, "0");
export function endOf(date: string, time: string, minutes: number) {
  const start = new Date(`${date}T${time.slice(0, 5)}:00+09:00`).getTime();
  const end = new Date(start + minutes * 60_000 + 9 * 3600_000); // KST 벽시계로 표시
  return `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}T${pad(end.getUTCHours())}:${pad(end.getUTCMinutes())}:00`;
}

export const parseEmails = (value: string) =>
  [...new Set(value.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];

/** 미팅을 구글 이벤트로 만들거나 갱신한다. 반환: 이벤트 id와 Meet 링크. */
export async function upsertMeetingEvent(meeting: CalendarMeeting, options: { createMeet: boolean; sendInvites: boolean; adminUrl?: string }) {
  const token = await accessToken();
  const description = eventDescription(meeting, options.adminUrl);
  const body: Record<string, unknown> = {
    summary: `[${meeting.project_name}] ${meeting.title}`,
    description,
    location: meeting.location,
    start: { dateTime: `${meeting.meeting_date}T${meeting.start_time.slice(0, 5)}:00`, timeZone: "Asia/Seoul" },
    end: { dateTime: endOf(meeting.meeting_date, meeting.start_time, meeting.duration_minutes), timeZone: "Asia/Seoul" },
    attendees: parseEmails(meeting.guest_emails).map((email) => ({ email })),
    extendedProperties: { private: { adminMeetingId: meeting.id } },
  };
  if (options.createMeet && !meeting.meet_url)
    body.conferenceData = { createRequest: { requestId: randomBytes(12).toString("hex"), conferenceSolutionKey: { type: "hangoutsMeet" } } };
  const query = `?conferenceDataVersion=1&sendUpdates=${options.sendInvites ? "all" : "none"}`;
  const send = (method: string, url: string) => fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  let response = meeting.google_event_id
    ? await send("PATCH", `${CAL}/${encodeURIComponent(meeting.google_event_id)}${query}`)
    : await send("POST", `${CAL}${query}`);
  // 구글에서 직접 지운 이벤트면 새로 만든다.
  if (meeting.google_event_id && (response.status === 404 || response.status === 410)) {
    if (options.createMeet) body.conferenceData = { createRequest: { requestId: randomBytes(12).toString("hex"), conferenceSolutionKey: { type: "hangoutsMeet" } } };
    response = await send("POST", `${CAL}${query}`);
  }
  const data = (await response.json().catch(() => ({}))) as { id?: string; hangoutLink?: string; error?: { message?: string } };
  if (!response.ok || !data.id) throw new HttpError(502, `Google 캘린더 저장 실패: ${data.error?.message || response.status}`);
  return { eventId: data.id, meetUrl: data.hangoutLink || meeting.meet_url || "" };
}

export async function deleteMeetingEvent(eventId: string, sendInvites: boolean) {
  if (!eventId) return;
  const token = await accessToken();
  const response = await fetch(`${CAL}/${encodeURIComponent(eventId)}?sendUpdates=${sendInvites ? "all" : "none"}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok && response.status !== 404 && response.status !== 410)
    throw new HttpError(502, `Google 캘린더 삭제 실패: ${response.status}`);
}

type DocNode = { paragraph?: { elements?: { textRun?: { content?: string } }[] }; table?: { tableRows?: { tableCells?: { content?: DocNode[] }[] }[] } };
const nodesText = (nodes: DocNode[] = []): string => nodes.map((n) =>
  n.paragraph ? (n.paragraph.elements ?? []).map((e) => e.textRun?.content ?? "").join("")
  : n.table ? (n.table.tableRows ?? []).flatMap((r) => r.tableCells ?? []).map((c) => nodesText(c.content)).join("\n") : "").join("");

/** 캘린더 일정에 붙은 Gemini 회의록(첫 탭 = 요약)을 텍스트로. 없으면 null. */
export async function meetingNotes(eventId: string): Promise<string | null> {
  const token = await accessToken();
  const ev = await fetch(`${CAL}/${encodeURIComponent(eventId)}?fields=attachments`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) });
  if (!ev.ok) return null;
  const { attachments = [] } = await ev.json() as { attachments?: { fileId?: string; title?: string; mimeType?: string }[] };
  const docs = attachments.filter((a) => a.fileId && a.mimeType === "application/vnd.google-apps.document");
  const doc = docs.find((a) => /gemini|회의록|notes/i.test(a.title ?? "")) ?? docs[0];
  return doc?.fileId ? docText(doc.fileId) : null;
}

/** Google Docs 문서(첫 탭)를 텍스트로. 읽을 수 없으면 null. */
export async function docText(fileId: string): Promise<string | null> {
  const token = await accessToken();
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(fileId)}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) });
  if (res.status === 403) throw new HttpError(409, "Google 회의록 읽기 권한이 없어요. 설정에서 Google을 다시 연결하세요.");
  if (!res.ok) return null;
  const text = nodesText(((await res.json()) as { body?: { content?: DocNode[] } }).body?.content).trim();
  return text || null;
}
