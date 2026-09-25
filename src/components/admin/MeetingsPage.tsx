"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FiCalendar, FiExternalLink, FiPlus, FiUsers, FiX } from "react-icons/fi";
import { projectColor } from "@/lib/admin/project-colors";
import type { ProjectKind } from "@/lib/admin/project-kinds";
import { api } from "@/components/admin/api";

type Project = { id: string; name: string; kind: ProjectKind };
type Followup = { id: string; title: string; status: string; due_date: string | null; archived: number };
export type Meeting = {
  id: string; project_id: string; project_name: string; project_kind: ProjectKind; updated_at: string;
  title: string; meeting_date: string; start_time: string; attendees: string;
  location: string; agenda: string; decisions: string; tasks: Followup[];
};
type Draft = Pick<Meeting, "project_id" | "title" | "meeting_date" | "start_time" | "attendees" | "location" | "agenda" | "decisions">;
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
const newDraft = (projectId: string): Draft => ({ project_id: projectId, title: "", meeting_date: today(), start_time: "10:00", attendees: "", location: "", agenda: "", decisions: "" });

async function fetchData(projectId: string) {
  const [meetings, active, finished, cancelled] = await Promise.all([
    api<Meeting[]>(`/api/admin/meetings${projectId ? `?project=${encodeURIComponent(projectId)}` : ""}`),
    api<Project[]>("/api/admin/projects"),
    api<Project[]>("/api/admin/projects?status=완료"),
    api<Project[]>("/api/admin/projects?status=취소"),
  ]);
  return { meetings, projects: [...active, ...finished, ...cancelled] };
}

export default function MeetingsPage({ initialProjectId = "", initialMeetingId = "", embedded = false }: { initialProjectId?: string; initialMeetingId?: string; embedded?: boolean }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState(initialProjectId);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
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
      setLoading(false);
    }).catch((e: unknown) => {
      if (!active) return;
      setError(e instanceof Error ? e.message : "미팅을 불러오지 못했어요.");
      setLoading(false);
    });
    return () => { active = false; };
  }, [filter]);
  useEffect(() => {
    if (!loading && initialMeetingId) document.getElementById(`meeting-${initialMeetingId}`)?.scrollIntoView({ block: "center" });
  }, [initialMeetingId, loading]);

  const openNew = () => {
    setDraft(newDraft(filter || projects[0]?.id || ""));
    setEditingId(null);
    setError("");
  };
  const edit = (meeting: Meeting) => {
    setDraft({ project_id: meeting.project_id, title: meeting.title, meeting_date: meeting.meeting_date, start_time: meeting.start_time, attendees: meeting.attendees, location: meeting.location, agenda: meeting.agenda, decisions: meeting.decisions });
    setEditingId(meeting.id);
    setError("");
  };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || saving) return;
    setSaving(true);
    setError("");
    try {
      await api(editingId ? `/api/admin/meetings/${editingId}` : "/api/admin/meetings", editingId ? "PATCH" : "POST", editingId ? { ...draft, expected_updated_at: meetings.find((meeting) => meeting.id === editingId)?.updated_at } : draft);
      await load();
      setDraft(null);
      setNotice(editingId ? "미팅 기록을 수정했어요." : "미팅을 등록했어요.");
    } catch (e) { setError(e instanceof Error ? e.message : "미팅을 저장하지 못했어요."); }
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

  return <div className={`meetings-page ${embedded ? "is-embedded" : ""}`}>
    <header className="meetings-heading">
      <div><h1>{embedded ? "프로젝트 미팅" : "미팅"}</h1>{!embedded && <p>안건과 결정사항을 기록하고, 후속 작업을 보드로 연결하세요.</p>}</div>
      <button type="button" className="board-primary" onClick={openNew} disabled={!projects.length}><FiPlus /> 미팅 등록</button>
    </header>
    {error && <div className="board-error" role="alert">{error}<button type="button" onClick={() => setError("")} aria-label="오류 닫기"><FiX /></button></div>}
    {notice && <p className="quotes-notice" role="status">{notice}</p>}
    {!embedded && <div className="meetings-toolbar"><select aria-label="프로젝트 필터" value={filter} onChange={(event) => { setFilter(event.target.value); setLoading(true); }}><option value="">모든 프로젝트</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><span>{visible.length}건</span></div>}
    {loading ? <p className="meetings-empty">미팅을 불러오는 중…</p> : !projects.length ? <div className="meetings-empty">프로젝트를 만든 뒤 미팅을 기록할 수 있어요.<br /><Link href="/admin/projects?new=1">프로젝트 만들기 →</Link></div> : !visible.length ? <div className="meetings-empty">등록된 미팅이 없어요.<br />일정을 잡거나 지난 미팅의 결정사항을 기록해보세요.</div> : <div className="meetings-list">{visible.map((meeting) => {
      const isUrl = /^https?:\/\//i.test(meeting.location);
      return <article id={`meeting-${meeting.id}`} className="meeting-card" key={meeting.id} style={{ "--project-solid": projectColor(meeting.project_id).solid, "--project-soft": projectColor(meeting.project_id).soft, "--project-strong": projectColor(meeting.project_id).strong } as React.CSSProperties}>
        <div className="meeting-card-top"><div className="meeting-card-identity"><span className="meeting-card-icon"><FiUsers /></span><div><small>{meeting.project_name} · {meeting.project_kind}</small><h2>{meeting.title}</h2></div></div><button type="button" className="board-secondary" onClick={() => edit(meeting)}>수정</button></div>
        <div className="meeting-meta"><span><FiCalendar /> {meeting.meeting_date} {meeting.start_time}</span>{meeting.attendees && <span><FiUsers /> {meeting.attendees}</span>}{meeting.location && <span>{isUrl ? <a href={meeting.location} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}><FiExternalLink /> 미팅 링크</a> : meeting.location}</span>}</div>
        {(meeting.agenda || meeting.decisions) && <div className="meeting-notes">{meeting.agenda && <div><strong>안건</strong><p>{meeting.agenda}</p></div>}{meeting.decisions && <div><strong>결정사항</strong><p>{meeting.decisions}</p></div>}</div>}
        <div className="meeting-followups"><div className="meeting-followups-heading"><strong>후속 작업 <span>{meeting.tasks.length}</span></strong><button type="button" onClick={() => setAddingTo(addingTo === meeting.id ? null : meeting.id)}><FiPlus /> 작업 추가</button></div>
          {meeting.tasks.length > 0 && <div className="meeting-task-list">{meeting.tasks.map((task) => <Link key={task.id} href={`/admin/projects/${meeting.project_id}?task=${task.id}`} className={task.archived ? "is-archived" : ""}><span>{task.title}</span><small>{task.archived ? "보관됨" : task.status}{task.due_date ? ` · ${task.due_date}` : ""}</small></Link>)}</div>}
          {addingTo === meeting.id && <form className="meeting-task-form" onSubmit={(event) => void addFollowup(event, meeting)}><input name="title" autoFocus required maxLength={200} aria-label="후속 작업 제목" placeholder="결정된 다음 할 일" /><input name="due_date" type="date" aria-label="후속 작업 마감일" /><button type="submit" className="board-primary" disabled={saving}>추가</button></form>}
        </div>
      </article>;
    })}</div>}
    {draft && <div className="meeting-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDraft(null); }} onKeyDown={(event) => { if (event.key === "Escape") setDraft(null); }}><section role="dialog" aria-modal="true" aria-label={editingId ? "미팅 수정" : "미팅 등록"} className="meeting-editor"><div className="meeting-editor-heading"><div><h2>{editingId ? "미팅 수정" : "새 미팅"}</h2><p>길게 쓰지 않아도 괜찮아요. 결정사항만 남겨도 충분해요.</p></div><button type="button" onClick={() => setDraft(null)} aria-label="닫기"><FiX /></button></div>{error && <p className="meeting-editor-error" role="alert">{error}</p>}<form onSubmit={(event) => void save(event)} className="meeting-form">
      <div className="meeting-form-grid"><label>프로젝트<select required value={draft.project_id} disabled={embedded || (editingId !== null && meetings.find((meeting) => meeting.id === editingId)?.tasks.length !== 0)} onChange={(event) => setDraft({ ...draft, project_id: event.target.value })}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label>미팅 제목<input autoFocus required maxLength={160} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="킥오프 미팅" /></label><label>날짜<input type="date" required value={draft.meeting_date} onChange={(event) => setDraft({ ...draft, meeting_date: event.target.value })} /></label><label>시간<input type="time" required value={draft.start_time} onChange={(event) => setDraft({ ...draft, start_time: event.target.value })} /></label><label>참석자<input maxLength={500} value={draft.attendees} onChange={(event) => setDraft({ ...draft, attendees: event.target.value })} placeholder="홍길동, 김철수" /></label><label>장소 / 화상회의 링크<input maxLength={1000} value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder="회의실 또는 https://..." /></label><label className="meeting-form-wide">안건<textarea rows={3} maxLength={10000} value={draft.agenda} onChange={(event) => setDraft({ ...draft, agenda: event.target.value })} placeholder="논의할 내용" /></label><label className="meeting-form-wide">결정사항<textarea rows={5} maxLength={10000} value={draft.decisions} onChange={(event) => setDraft({ ...draft, decisions: event.target.value })} placeholder="결정한 내용과 다음 단계" /></label></div>
      <div className="meeting-editor-footer"><button type="button" className="board-secondary" onClick={() => setDraft(null)}>취소</button><button type="submit" className="board-primary" disabled={saving}>{saving ? "저장 중…" : "미팅 저장"}</button></div>
    </form></section></div>}
  </div>;
}
