"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FiCalendar, FiChevronDown, FiExternalLink, FiPlus, FiUsers, FiVideo, FiX } from "react-icons/fi";
import { projectColor } from "@/lib/admin/project-colors";
import type { ProjectKind } from "@/lib/admin/project-kinds";
import { api } from "@/components/admin/api";

type Project = { id: string; name: string; kind: ProjectKind };
type Followup = { id: string; title: string; status: string; due_date: string | null; archived: number };
export type Meeting = {
  id: string; project_id: string; project_name: string; project_kind: ProjectKind; updated_at: string;
  title: string; meeting_date: string; start_time: string; attendees: string;
  location: string; agenda: string; decisions: string; tasks: Followup[];
  duration_minutes: number; guest_emails: string; google_event_id: string; meet_url: string; google_error: string;
};
type GoogleStatus = { configured: boolean; connected: boolean; email: string };
type SaveResult = { google?: "off" | "synced" | "failed"; google_error?: string };
type Draft = Pick<Meeting, "project_id" | "title" | "meeting_date" | "start_time" | "attendees" | "location" | "agenda" | "decisions" | "duration_minutes" | "guest_emails">;
const toDraft = (m: Meeting): Draft => ({ project_id: m.project_id, title: m.title, meeting_date: m.meeting_date, start_time: m.start_time, attendees: m.attendees, location: m.location, agenda: m.agenda, decisions: m.decisions, duration_minutes: m.duration_minutes || 60, guest_emails: m.guest_emails || "" });
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
const newDraft = (projectId: string): Draft => ({ project_id: projectId, title: "", meeting_date: today(), start_time: "10:00", attendees: "", location: "", agenda: "", decisions: "", duration_minutes: 60, guest_emails: "" });

async function fetchData(projectId: string) {
  const [meetings, projects] = await Promise.all([
    api<Meeting[]>(`/api/admin/meetings${projectId ? `?project=${encodeURIComponent(projectId)}` : ""}`),
    api<Project[]>("/api/admin/projects?status=전체"),
  ]);
  return { meetings, projects };
}

export default function MeetingsPage({ initialProjectId = "", initialMeetingId = "", embedded = false }: { initialProjectId?: string; initialMeetingId?: string; embedded?: boolean }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState(initialProjectId);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [expandedMeetingId, setExpandedMeetingId] = useState<string | null>(initialMeetingId || null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [google, setGoogle] = useState<GoogleStatus | null>(null);
  const [gSync, setGSync] = useState(true);
  const [gMeet, setGMeet] = useState(false);
  const [gInvite, setGInvite] = useState(false);
  useEffect(() => {
    void api<GoogleStatus>("/api/admin/google/status").then(setGoogle).catch(() => setGoogle(null));
  }, []);
  const load = useCallback(async () => {
    const data = await fetchData(filter);
    setMeetings(data.meetings);
    setProjects(data.projects);
    setError("");
    return data;
  }, [filter]);
  useEffect(() => {
    let active = true;
    void fetchData(filter).then((data) => {
      if (!active) return;
      setMeetings(data.meetings);
      setProjects(data.projects);
      if (initialMeetingId) {
        const meeting = data.meetings.find((item) => item.id === initialMeetingId);
        if (meeting) {
          setExpandedMeetingId(meeting.id);
          setDraft(toDraft(meeting));
          setEditingId(meeting.id);
          requestAnimationFrame(() => document.getElementById(`meeting-${initialMeetingId}`)?.scrollIntoView({ block: "center" }));
        }
      }
      setLoading(false);
    }).catch((e: unknown) => {
      if (!active) return;
      setError(e instanceof Error ? e.message : "미팅을 불러오지 못했어요.");
      setLoading(false);
    });
    return () => { active = false; };
  }, [filter, initialMeetingId]);

  const openNew = () => {
    setDraft(newDraft(filter || projects[0]?.id || ""));
    setEditingId(null);
    setGSync(true); setGMeet(true); setGInvite(false);
    setError("");
  };
  const edit = (meeting: Meeting) => {
    setDraft(toDraft(meeting));
    setEditingId(meeting.id);
    setGSync(true); setGMeet(false); setGInvite(false);
    setError("");
  };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || saving) return;
    setSaving(true);
    setError("");
    try {
      const googleOptions = google?.connected ? { google_sync: gSync, create_meet: gSync && gMeet, send_invites: gSync && gInvite } : { google_sync: false };
      const result = await api<SaveResult>(editingId ? `/api/admin/meetings/${editingId}` : "/api/admin/meetings", editingId ? "PATCH" : "POST", { ...draft, ...googleOptions, ...(editingId ? { expected_updated_at: meetings.find((meeting) => meeting.id === editingId)?.updated_at } : {}) });
      await load();
      setDraft(null);
      const base = editingId ? "미팅 기록을 수정했어요." : "미팅을 등록했어요.";
      if (result.google === "failed") setError(`${base} 다만 Google 캘린더 반영은 실패했어요: ${result.google_error || ""}`);
      setNotice(result.google === "synced" ? `${base} Google 캘린더에도 반영했어요.` : base);
    } catch (e) { setError(e instanceof Error ? e.message : "미팅을 저장하지 못했어요."); }
    finally { setSaving(false); }
  };
  const remove = async (meeting: Meeting) => {
    if (saving) return;
    if (!confirm(`'${meeting.title}' 미팅을 삭제할까요?${meeting.google_event_id ? "\nGoogle 캘린더 일정도 함께 지워져요." : ""}`)) return;
    const notify = Boolean(meeting.google_event_id && meeting.guest_emails && confirm("초대한 사람들에게 취소 메일을 보낼까요?"));
    setSaving(true);
    try {
      await api(`/api/admin/meetings/${meeting.id}${notify ? "?notify=1" : ""}`, "DELETE");
      await load();
      setDraft(null);
      setNotice("미팅을 삭제했어요.");
    } catch (e) { setError(e instanceof Error ? e.message : "미팅을 삭제하지 못했어요."); }
    finally { setSaving(false); }
  };
  const addFollowup = async (event: FormEvent<HTMLFormElement>, meeting: Meeting) => {
    event.preventDefault();
    if (saving) return;
    const fields = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      await api(`/api/admin/meetings/${meeting.id}/tasks`, "POST", { title: fields.get("title"), due_date: fields.get("due_date") || null });
      await load();
      setAddingTo(null);
      setNotice("후속 작업을 칸반 보드에 추가했어요.");
    } catch (e) { setError(e instanceof Error ? e.message : "후속 작업을 추가하지 못했어요."); }
    finally { setSaving(false); }
  };
  const visible = filter ? meetings.filter((meeting) => meeting.project_id === filter) : meetings;
  const currentDate = today();
  const meetingGroups = [
    {
      title: "다가오는 미팅",
      rows: visible.filter((meeting) => meeting.meeting_date >= currentDate).sort((a, b) =>
        a.meeting_date.localeCompare(b.meeting_date) || a.start_time.localeCompare(b.start_time),
      ),
    },
    { title: "지난 기록", rows: visible.filter((meeting) => meeting.meeting_date < currentDate) },
  ].filter((group) => group.rows.length > 0);

  return <div className={`meetings-page ${embedded ? "is-embedded" : ""}`}>
    <header className="meetings-heading">
      <h1>{embedded ? "프로젝트 미팅" : "미팅"}</h1>
      <button type="button" className="board-primary" onClick={openNew} disabled={!projects.length}><FiPlus /> 미팅 등록</button>
    </header>
    {error && <div className="board-error" role="alert">{error}<button type="button" onClick={() => setError("")} aria-label="오류 닫기"><FiX /></button></div>}
    {notice && <p className="quotes-notice" role="status">{notice}</p>}
    {!embedded && <div className="meetings-toolbar"><select aria-label="프로젝트 필터" value={filter} onChange={(event) => { setFilter(event.target.value); setLoading(true); }}><option value="">모든 프로젝트</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><span>{visible.length}건</span></div>}
    {loading ? <p className="meetings-empty">미팅을 불러오는 중…</p> : !projects.length ? <div className="meetings-empty">프로젝트를 만든 뒤 미팅을 기록할 수 있어요.<br /><Link href="/admin/projects?new=1">프로젝트 만들기 →</Link></div> : !visible.length ? <div className="meetings-empty">등록된 미팅이 없어요.<br />일정을 잡거나 지난 미팅의 결정사항을 기록해보세요.</div> : (
      <div className="meeting-timeline">
        {meetingGroups.map((group) => (
          <section className="meeting-timeline-group" key={group.title}>
            <header className="meeting-timeline-heading"><h2>{group.title}</h2><span>{group.rows.length}</span></header>
            <div className="meeting-timeline-list">
              {group.rows.map((meeting) => {
                const isUrl = /^https?:\/\//i.test(meeting.location);
                const expanded = expandedMeetingId === meeting.id;
                return (
                  <article id={`meeting-${meeting.id}`} className="meeting-card" key={meeting.id} style={{ "--project-solid": projectColor(meeting.project_id).solid } as React.CSSProperties}>
                    <button type="button" className="meeting-card-toggle" aria-expanded={expanded} aria-controls={expanded ? `meeting-detail-${meeting.id}` : undefined} onClick={() => setExpandedMeetingId(expanded ? null : meeting.id)}>
                      <span className="meeting-card-date"><FiCalendar aria-hidden="true" /> {meeting.meeting_date}<small>{meeting.start_time}</small></span>
                      <span className="meeting-card-summary"><small>{meeting.project_name} · {meeting.project_kind}</small><strong>{meeting.title}</strong></span>
                      <span className="meeting-card-preview">{meeting.decisions ? `결정 · ${meeting.decisions}` : meeting.agenda ? `안건 · ${meeting.agenda}` : "기록된 결정사항 없음"}</span>
                      <span className="meeting-card-followup-count">후속 작업 {meeting.tasks.length}</span>
                      <FiChevronDown className="meeting-card-chevron" aria-hidden="true" />
                    </button>
                    {expanded && <div className="meeting-card-detail" id={`meeting-detail-${meeting.id}`}>
                      <div className="meeting-detail-actions"><Link href={`/admin/projects/${meeting.project_id}`}>프로젝트 보기</Link><button type="button" className="board-secondary" onClick={() => edit(meeting)}>수정</button></div>
                      {(meeting.meet_url || meeting.google_event_id || meeting.google_error) && <div className="meeting-meta">{meeting.meet_url && <span><a href={meeting.meet_url} target="_blank" rel="noopener noreferrer"><FiVideo /> Google Meet 참여</a></span>}{meeting.google_event_id && <span><FiCalendar /> Google 캘린더에 있음</span>}{meeting.google_error && <span className="meeting-google-error" title={meeting.google_error}>⚠️ 캘린더 동기화 실패 — 수정 후 다시 저장하세요</span>}</div>}
                      {(meeting.attendees || meeting.location) && <div className="meeting-meta">{meeting.attendees && <span><FiUsers /> {meeting.attendees}</span>}{meeting.location && <span>{isUrl ? <a href={meeting.location} target="_blank" rel="noopener noreferrer"><FiExternalLink /> 미팅 링크</a> : meeting.location}</span>}</div>}
                      {(meeting.agenda || meeting.decisions) && <div className="meeting-notes">{meeting.agenda && <div><strong>안건</strong><p>{meeting.agenda}</p></div>}{meeting.decisions && <div><strong>결정사항</strong><p>{meeting.decisions}</p></div>}</div>}
                      <div className="meeting-followups"><div className="meeting-followups-heading"><strong>후속 작업 <span>{meeting.tasks.length}</span></strong><button type="button" onClick={() => setAddingTo(addingTo === meeting.id ? null : meeting.id)}><FiPlus /> 작업 추가</button></div>
                        {meeting.tasks.length > 0 && <div className="meeting-task-list">{meeting.tasks.map((task) => <Link key={task.id} href={`/admin/projects/${meeting.project_id}?task=${task.id}`} className={task.archived ? "is-archived" : ""}><span>{task.title}</span><small>{task.archived ? "보관됨" : task.status}{task.due_date ? ` · ${task.due_date}` : ""}</small></Link>)}</div>}
                        {addingTo === meeting.id && <form className="meeting-task-form" onSubmit={(event) => void addFollowup(event, meeting)}><input name="title" autoFocus required maxLength={200} aria-label="후속 작업 제목" placeholder="결정된 다음 할 일" /><input name="due_date" type="date" aria-label="후속 작업 마감일" /><button type="submit" className="board-primary" disabled={saving}>추가</button></form>}
                      </div>
                    </div>}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    )}
    {draft && <div className="meeting-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDraft(null); }} onKeyDown={(event) => { if (event.key === "Escape") setDraft(null); }}><section role="dialog" aria-modal="true" aria-label={editingId ? "미팅 수정" : "미팅 등록"} className="meeting-editor"><div className="meeting-editor-heading"><div><h2>{editingId ? "미팅 수정" : "새 미팅"}</h2><p>길게 쓰지 않아도 괜찮아요. 결정사항만 남겨도 충분해요.</p></div><button type="button" onClick={() => setDraft(null)} aria-label="닫기"><FiX /></button></div>{error && <p className="meeting-editor-error" role="alert">{error}</p>}<form onSubmit={(event) => void save(event)} className="meeting-form">
      <div className="meeting-form-grid"><label>프로젝트<select required value={draft.project_id} disabled={embedded || (editingId !== null && meetings.find((meeting) => meeting.id === editingId)?.tasks.length !== 0)} onChange={(event) => setDraft({ ...draft, project_id: event.target.value })}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label>미팅 제목<input autoFocus required maxLength={160} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="킥오프 미팅" /></label><label>날짜<input type="date" required value={draft.meeting_date} onChange={(event) => setDraft({ ...draft, meeting_date: event.target.value })} /></label><label>시간<input type="time" required value={draft.start_time} onChange={(event) => setDraft({ ...draft, start_time: event.target.value })} /></label><label>참석자<input maxLength={500} value={draft.attendees} onChange={(event) => setDraft({ ...draft, attendees: event.target.value })} placeholder="홍길동, 김철수" /></label><label>장소 / 화상회의 링크<input maxLength={1000} value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder="회의실 또는 https://..." /></label><label>길이<select value={draft.duration_minutes} onChange={(event) => setDraft({ ...draft, duration_minutes: Number(event.target.value) })}>{[15, 30, 45, 60, 90, 120, 180].map((m) => <option key={m} value={m}>{m < 60 ? `${m}분` : m % 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m / 60}시간`}</option>)}{![15, 30, 45, 60, 90, 120, 180].includes(draft.duration_minutes) && <option value={draft.duration_minutes}>{draft.duration_minutes}분</option>}</select></label><label>초대할 이메일<input maxLength={2000} value={draft.guest_emails} onChange={(event) => setDraft({ ...draft, guest_emails: event.target.value })} placeholder="client@example.com, ..." inputMode="email" /></label>{google?.connected && <fieldset className="meeting-form-wide meeting-google"><legend>Google 캘린더 · {google.email}</legend><label><input type="checkbox" checked={gSync} onChange={(e) => setGSync(e.target.checked)} /> 캘린더에 반영</label>{gSync && !(editingId && meetings.find((m) => m.id === editingId)?.meet_url) && <label><input type="checkbox" checked={gMeet} onChange={(e) => setGMeet(e.target.checked)} /> Google Meet 링크 만들기</label>}{gSync && draft.guest_emails.trim() && <label><input type="checkbox" checked={gInvite} onChange={(e) => setGInvite(e.target.checked)} /> 초대·변경 메일 보내기</label>}</fieldset>}{google && !google.connected && google.configured && <p className="meeting-form-wide meeting-google-hint"><Link href="/admin/settings#settings-google">Google 캘린더를 연결</Link>하면 Meet 링크와 초대를 자동으로 만들 수 있어요.</p>}<label className="meeting-form-wide">안건<textarea rows={3} maxLength={10000} value={draft.agenda} onChange={(event) => setDraft({ ...draft, agenda: event.target.value })} placeholder="논의할 내용" /></label><label className="meeting-form-wide">결정사항<textarea rows={5} maxLength={10000} value={draft.decisions} onChange={(event) => setDraft({ ...draft, decisions: event.target.value })} placeholder="결정한 내용과 다음 단계" /></label></div>
      <div className="meeting-editor-footer">{editingId && (() => { const m = meetings.find((x) => x.id === editingId); return m && !m.tasks.length ? <button type="button" className="board-secondary meeting-delete" onClick={() => void remove(m)} disabled={saving}>삭제</button> : null; })()}<button type="button" className="board-secondary" onClick={() => setDraft(null)}>취소</button><button type="submit" className="board-primary" disabled={saving}>{saving ? "저장 중…" : "미팅 저장"}</button></div>
    </form></section></div>}
  </div>;
}
