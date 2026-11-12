"use client";

import AiUsageHome from "./AiUsageHome";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { FiColumns, FiPlus } from "react-icons/fi";
import { api } from "@/components/admin/api";
import type { Task } from "./AdminProject";
import type { Meeting } from "./MeetingsPage";

type HomeTask = Task & { project_name: string; updated_at?: string };
type Project = { id: string; name: string; status: string };
type Invoice = { id: string; project_id: string; project_name: string; title: string; due_date: string | null; balance: number };
type Focus = "board" | "today" | "week" | "waiting";
const LANES = [
  { status: "할 일", color: "#9ca3af" },
  { status: "진행 중", color: "#3b82f6" },
  { status: "확인 대기", color: "#d97706" },
];

const won = (value: number) => new Intl.NumberFormat("ko-KR").format(value) + "원";
const seoulToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
const addDays = (date: string, days: number) => {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
};
const weekday = ["일", "월", "화", "수", "목", "금", "토"];

function dueLabel(due: string | null, today: string) {
  if (!due) return { text: "—", tone: "" };
  if (due < today) return { text: due === addDays(today, -1) ? "어제" : due.slice(5).replace("-", "/"), tone: "is-danger" };
  if (due === today) return { text: "오늘", tone: "is-today" };
  if (due === addDays(today, 1)) return { text: "내일", tone: "" };
  if (due <= addDays(today, 6)) return { text: weekday[new Date(`${due}T00:00:00Z`).getUTCDay()], tone: "" };
  return { text: due.slice(5).replace("-", "/"), tone: "" };
}

async function load() {
  const [tasks, projects, invoices, meetings] = await Promise.all([
    api<HomeTask[]>("/api/admin/tasks"),
    api<Project[]>("/api/admin/projects"),
    api<Invoice[]>("/api/admin/payments"),
    api<Meeting[]>("/api/admin/meetings"),
  ]);
  return { tasks, projects, invoices, meetings };
}

export default function HomeToday() {
  const [tasks, setTasks] = useState<HomeTask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [focus, setFocus] = useState<Focus>("board");
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overLane, setOverLane] = useState<string | null>(null);
  const today = seoulToday();
  const weekEnd = addDays(today, 6);

  const apply = useCallback((data: Awaited<ReturnType<typeof load>>) => {
    setTasks(data.tasks);
    setProjects(data.projects);
    setInvoices(data.invoices);
    setMeetings(data.meetings);
    setError("");
  }, []);
  const reload = useCallback(async () => {
    try {
      apply(await load());
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    }
  }, [apply]);
  useEffect(() => {
    let active = true;
    load()
      .then((data) => active && apply(data))
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : "불러오기 실패"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [apply]);

  const open = useMemo(() => tasks.filter((task) => task.status !== "완료"), [tasks]);
  const overdue = open.filter((task) => task.due_date && task.due_date < today);
  const dueWeek = open.filter((task) => task.due_date && task.due_date >= today && task.due_date <= weekEnd);
  const unpaid = invoices.filter((invoice) => invoice.balance > 0);
  const unpaidTotal = unpaid.reduce((sum, invoice) => sum + invoice.balance, 0);
  const lateInvoices = unpaid.filter((invoice) => invoice.due_date && invoice.due_date < today);
  const activeProjects = projects.filter((project) => project.status === "진행 중").length;
  const todayMeetings = meetings
    .filter((meeting) => meeting.meeting_date === today)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  const nextMeetings = todayMeetings.length
    ? todayMeetings
    : meetings
        .filter((meeting) => meeting.meeting_date > today)
        .sort((a, b) => `${a.meeting_date}${a.start_time}`.localeCompare(`${b.meeting_date}${b.start_time}`))
        .slice(0, 2);
  const byDue = (a: HomeTask, b: HomeTask) => (a.due_date || "9999").localeCompare(b.due_date || "9999");
  const list = (
    focus === "today"
      ? open.filter((task) => task.due_date && task.due_date <= today)
      : focus === "week"
        ? open.filter((task) => task.due_date && task.due_date <= weekEnd)
        : open.filter((task) => task.status === "확인 대기")
  ).sort(byDue);
  const todayCount = open.filter((task) => task.due_date && task.due_date <= today).length;
  const dateText = new Date(`${today}T00:00:00Z`).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long", timeZone: "UTC" });

  const complete = (task: HomeTask) => moveTo(task, "완료");

  async function moveTo(task: HomeTask, status: string) {
    if (saving || task.status === status) return;
    setSaving(true);
    try {
      await api(`/api/admin/tasks/${task.id}`, "PATCH", { status, expected_updated_at: task.updated_at });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "상태 변경 실패");
    } finally {
      setSaving(false);
    }
  }

  async function quickAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const title = String(fields.get("title") || "").trim();
    const projectId = String(fields.get("project") || "");
    if (!title || !projectId || saving) return;
    setSaving(true);
    try {
      await api(`/api/admin/projects/${projectId}/tasks`, "POST", {
        title,
        status: "할 일",
        priority: "보통",
        due_date: fields.get("due_date") || today,
      });
      form.reset();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "추가 실패");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rd-page">
      <div className="rd-head">
        <div>
          <div className="rd-eyebrow">{dateText}</div>
          <h1>
            {loading ? "불러오는 중…" : `오늘 할 일 ${todayCount}개 · 미팅 ${todayMeetings.length}개`}
          </h1>
        </div>
        <div className="rd-actions">
          <Link href="/admin/meetings" className="rd-btn"><FiPlus /> 미팅</Link>
          <Link href="/admin/tasks?view=board" className="rd-btn"><FiColumns /> 보드</Link>
        </div>
      </div>
      {error && <p role="alert" className="rd-error">{error}</p>}

      <div className="rd-stats">
        <Link href="/admin/tasks" className="rd-stat"><span>기한 지남</span><strong className={overdue.length ? "is-danger" : ""}>{overdue.length}</strong></Link>
        <Link href="/admin/tasks" className="rd-stat"><span>이번 주 마감</span><strong>{dueWeek.length}</strong></Link>
        <Link href="/admin/money" className="rd-stat"><span>미수금</span><strong className={unpaidTotal ? "is-warn" : ""}>{won(unpaidTotal)}</strong></Link>
        <Link href="/admin/projects" className="rd-stat"><span>진행 중 프로젝트</span><strong>{activeProjects}</strong></Link>
      </div>

      <div className="rd-split">
        <section className="rd-card" aria-label="할 일">
          <div className="rd-tabs">
            {([["board", "보드"], ["today", "오늘"], ["week", "이번 주"], ["waiting", "확인 대기"]] as const).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={focus === value} onClick={() => setFocus(value)}>{label}</button>
            ))}
          </div>
          <form className="rd-quick" onSubmit={quickAdd}>
            <FiPlus aria-hidden="true" />
            <input type="text" name="title" placeholder="작업 입력 후 Enter" aria-label="새 작업" autoComplete="off" />
            <select name="project" aria-label="프로젝트" defaultValue="" required>
              <option value="" disabled>프로젝트</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            <input type="date" name="due_date" aria-label="마감일" defaultValue={today} />
          </form>
          {focus === "board" ? (
            <div className="rd-board">
              {LANES.map((lane) => {
                const laneTasks = open.filter((task) => task.status === lane.status).sort(byDue);
                return (
                  <section
                    className={`rd-lane${overLane === lane.status ? " is-drop" : ""}`}
                    key={lane.status}
                    aria-label={lane.status}
                    onDragOver={(e) => { if (dragId) { e.preventDefault(); setOverLane(lane.status); } }}
                    onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverLane(null); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const task = open.find((t) => t.id === dragId);
                      setDragId(null);
                      setOverLane(null);
                      if (task) void moveTo(task, lane.status);
                    }}
                  >
                    <header>
                      <span style={{ color: "inherit", fontWeight: 600 }}><i className="rd-lane-dot" style={{ background: lane.color }} aria-hidden="true" />{lane.status}</span>
                      <span>{laneTasks.length}</span>
                    </header>
                    {laneTasks.slice(0, 12).map((task) => {
                      const due = dueLabel(task.due_date, today);
                      return (
                        <Link
                          key={task.id}
                          href={`/admin/projects/${task.project_id}?task=${task.id}`}
                          className={`rd-task-card${dragId === task.id ? " is-dragging" : ""}`}
                          draggable={!saving}
                          onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", task.id); setDragId(task.id); }}
                          onDragEnd={() => { setDragId(null); setOverLane(null); }}
                        >
                          <span>{task.title}</span>
                          <div>
                            <span className="rd-chip">{task.project_name}</span>
                            <span className={`rd-due ${due.tone}`}>{due.text}</span>
                          </div>
                        </Link>
                      );
                    })}
                    {laneTasks.length > 12 && <Link href="/admin/tasks?view=board" className="rd-more">+{laneTasks.length - 12}개 더 보기</Link>}
                    {!loading && laneTasks.length === 0 && <div className="rd-empty">비어 있어요</div>}
                  </section>
                );
              })}
            </div>
          ) : list.map((task) => {
            const due = dueLabel(task.due_date, today);
            return (
              <div className="rd-row" key={task.id}>
                <input type="checkbox" aria-label={`${task.title} 완료`} disabled={saving} onChange={() => void complete(task)} />
                <Link href={`/admin/projects/${task.project_id}?task=${task.id}`} className="rd-row-title">{task.title}</Link>
                <span className="rd-chip">{task.project_name}</span>
                <span className={`rd-due ${due.tone}`}>{due.text}</span>
              </div>
            );
          })}
          {focus !== "board" && !loading && list.length === 0 && <div className="rd-empty">비어 있어요. 위에서 바로 추가할 수 있어요.</div>}
        </section>

        <aside className="rd-side">
          <section className="rd-card rd-card-pad">
            <h2>{todayMeetings.length ? "오늘 일정" : "다가오는 일정"}</h2>
            {nextMeetings.map((meeting) => (
              <Link key={meeting.id} href={`/admin/meetings?meeting=${meeting.id}`} className="rd-event">
                <time>{meeting.meeting_date === today ? meeting.start_time.slice(0, 5) : meeting.meeting_date.slice(5).replace("-", "/")}</time>
                <div>
                  <div>{meeting.title}</div>
                  <small>{meeting.project_name}{meeting.location ? ` · ${meeting.location}` : ""}</small>
                </div>
              </Link>
            ))}
            {!loading && nextMeetings.length === 0 && <div className="rd-eyebrow">예정된 미팅이 없어요.</div>}
            <Link href="/admin/meetings?view=month" className="rd-more">월간 일정 →</Link>
          </section>
          <section className="rd-card rd-card-pad">
            <h2>정산 확인 필요</h2>
            {unpaid
              .sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"))
              .slice(0, 4)
              .map((invoice) => (
                <Link key={invoice.id} href={`/admin/projects/${invoice.project_id}?tab=입금`} className="rd-line">
                  <span>{invoice.project_name} · {invoice.title}</span>
                  <b className={invoice.due_date && invoice.due_date < today ? "is-danger" : ""}>{won(invoice.balance)}</b>
                </Link>
              ))}
            {!loading && unpaid.length === 0 && <div className="rd-eyebrow">미수금이 없어요.</div>}
            {lateInvoices.length > 0 && <div className="rd-eyebrow" style={{ marginTop: 8 }}>기한 지난 청구 {lateInvoices.length}건</div>}
            <Link href="/admin/money" className="rd-more">정산 화면으로 →</Link>
          </section>
          <AiUsageHome />
        </aside>
      </div>
    </div>
  );
}
