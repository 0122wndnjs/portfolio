"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiExternalLink, FiPlus, FiX } from "react-icons/fi";
import { api } from "@/components/admin/api";
import type { Meeting } from "./MeetingsPage";
import { addDays, mondayOf, seoulToday, shortDate, WEEKDAYS, weekdayOf, won } from "./redesign-utils";

type Task = { id: string; project_id: string; project_name: string; title: string; status: string; due_date: string | null; completed_at?: string | null };
type Invoice = { id: string; project_id: string; project_name: string; title: string; due_date: string | null; balance: number };
type Event = {
  id: string; date: string; kind: "meeting" | "task" | "money"; label: string; time?: string;
  href: string; meeting?: Meeting; done?: boolean; sub?: string;
};

const MEET_HOME_URL = "https://meet.google.com/";

export default function ScheduleView({ mode }: { mode: "week" | "month" }) {
  const today = seoulToday();
  const [anchor, setAnchor] = useState(today);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      api<Meeting[]>("/api/admin/meetings"),
      api<Task[]>("/api/admin/tasks"),
      api<Task[]>("/api/admin/tasks?status=%EC%99%84%EB%A3%8C&includeClosed=true"),
      api<Invoice[]>("/api/admin/payments"),
    ])
      .then(([meetingRows, openRows, doneRows, invoiceRows]) => {
        if (!active) return;
        setMeetings(meetingRows);
        setTasks([...openRows, ...doneRows]);
        setInvoices(invoiceRows);
      })
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : "불러오기 실패"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const byDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    const push = (event: Event) => map.set(event.date, [...(map.get(event.date) || []), event]);
    meetings.forEach((meeting) =>
      push({ id: `m-${meeting.id}`, date: meeting.meeting_date, kind: "meeting", time: meeting.start_time.slice(0, 5), label: meeting.title, href: `/admin/meetings?view=list&meeting=${meeting.id}`, meeting }),
    );
    tasks
      .map((task) => ({ task, date: task.status === "완료" && task.completed_at ? new Date(task.completed_at).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }) : task.due_date }))
      .filter((item): item is { task: Task; date: string } => !!item.date)
      .forEach(({ task, date }) => push({ id: `t-${task.id}`, date, kind: "task", done: task.status === "완료", sub: task.project_name, label: task.title, href: `/admin/projects/${task.project_id}?task=${task.id}` }));
    invoices
      .filter((invoice) => invoice.due_date && invoice.balance > 0)
      .forEach((invoice) => push({ id: `i-${invoice.id}`, date: invoice.due_date!, kind: "money", sub: invoice.project_name, label: `${invoice.project_name} ${invoice.title} · ${won(invoice.balance)}`, href: `/admin/projects/${invoice.project_id}?tab=입금` }));
    const rank = (e: Event) => (e.kind === "meeting" ? 0 : e.done ? 2 : 1);
    map.forEach((events) => events.sort((a, b) => rank(a) - rank(b) || (a.time || "").localeCompare(b.time || "")));
    return map;
  }, [meetings, tasks, invoices]);

  const monthStart = `${anchor.slice(0, 7)}-01`;
  const gridStart = mode === "week" ? mondayOf(anchor) : mondayOf(monthStart);
  const days = Array.from({ length: mode === "week" ? 7 : 42 }, (_, i) => addDays(gridStart, i));
  const title =
    mode === "week"
      ? `${shortDate(days[0])} – ${shortDate(days[6])}`
      : `${anchor.slice(0, 4)}년 ${Number(anchor.slice(5, 7))}월`;

  function shift(direction: 1 | -1) {
    if (mode === "week") setAnchor(addDays(anchor, 7 * direction));
    else {
      const d = new Date(`${monthStart}T00:00:00Z`);
      d.setUTCMonth(d.getUTCMonth() + direction);
      setAnchor(d.toISOString().slice(0, 10));
    }
  }

  const selected = meetings.find((meeting) => meeting.id === selectedId);
  const upcoming = meetings
    .filter((meeting) => meeting.meeting_date >= today)
    .sort((a, b) => `${a.meeting_date}${a.start_time}`.localeCompare(`${b.meeting_date}${b.start_time}`))
    .slice(0, 5);

  return (
    <div className="rd-page">
      <div className="rd-cal-toolbar">
        <div className="rd-actions">
          <button type="button" className="rd-btn rd-icon-btn" aria-label={mode === "week" ? "이전 주" : "이전 달"} onClick={() => shift(-1)}><FiChevronLeft /></button>
          <button type="button" className="rd-btn rd-icon-btn" aria-label={mode === "week" ? "다음 주" : "다음 달"} onClick={() => shift(1)}><FiChevronRight /></button>
          <button type="button" className="rd-btn" onClick={() => setAnchor(today)}>오늘</button>
          <strong className="rd-cal-title">{title}</strong>
        </div>
        <Link href="/admin/meetings?view=list" className="rd-btn is-primary"><FiPlus /> 미팅</Link>
      </div>
      {error && <p role="alert" className="rd-error">{error}</p>}
      <div className="rd-cal-layout">
        <section className={`rd-card rd-cal ${mode === "week" ? "is-week" : "is-month"}`} aria-busy={loading}>
          <div className="rd-cal-head">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => <span key={d}>{WEEKDAYS[d]}</span>)}
          </div>
          <div className="rd-cal-grid">
            {days.map((date) => {
              const events = byDate.get(date) || [];
              const outside = mode === "month" && date.slice(0, 7) !== anchor.slice(0, 7);
              const weekend = weekdayOf(date) % 6 === 0;
              const limit = mode === "week" ? 12 : 3;
              return (
                <div key={date} role="button" tabIndex={0} aria-label={`${date} 일정 보기`} onClick={() => { setSelectedDate(date); setSelectedId(null); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedDate(date); setSelectedId(null); } }} className={`rd-cal-cell ${date === today ? "is-today" : ""} ${outside ? "is-outside" : ""} ${weekend ? "is-weekend" : ""} ${selectedDate === date && !selectedId ? "is-selected" : ""}`}>
                  <span className="rd-cal-day">{mode === "week" ? `${WEEKDAYS[weekdayOf(date)]} ${Number(date.slice(8))}` : Number(date.slice(8))}{date === today && " · 오늘"}</span>
                  {events.slice(0, limit).map((event) =>
                    event.kind === "meeting" ? (
                      <button key={event.id} type="button" className="rd-ev is-meeting" aria-pressed={selectedId === event.meeting!.id} onClick={(e) => { e.stopPropagation(); setSelectedId(event.meeting!.id); }}>
                        <b>{event.time}</b> {event.label}
                      </button>
                    ) : (
                      <span key={event.id} className={`rd-ev ${event.kind === "money" ? "is-money" : "is-task"}${event.done ? " is-done" : ""}`}>
                        {event.kind === "money" ? "입금 · " : event.done ? "✓ " : ""}{event.label}
                      </span>
                    ),
                  )}
                  {events.length > limit && <span className="rd-ev-more">+{events.length - limit}개 더</span>}
                </div>
              );
            })}
          </div>
          <div className="rd-cal-legend"><span className="is-meeting">미팅</span><span className="is-task">작업 마감</span><span className="is-task is-done">완료</span><span className="is-money">입금 기한</span></div>
        </section>

        <aside className="rd-card rd-card-pad rd-cal-side" aria-label="일정 상세">
          {selected ? (
            <>
              <div className="rd-side-head">
                <span className="rd-eyebrow">{shortDate(selected.meeting_date)} ({WEEKDAYS[weekdayOf(selected.meeting_date)]}) {selected.start_time.slice(0, 5)}</span>
                <button type="button" className="rd-icon-plain" aria-label="닫기" onClick={() => setSelectedId(null)}><FiX /></button>
              </div>
              <h2 className="rd-side-title">{selected.title}</h2>
              <p className="rd-eyebrow">{selected.project_name}{selected.location ? ` · ${selected.location}` : ""}{selected.attendees ? ` · ${selected.attendees}` : ""}</p>
              <div className="rd-actions">
                <a href={MEET_HOME_URL} target="_blank" rel="noopener noreferrer" className="rd-btn is-primary">Meet 열기 <FiExternalLink aria-hidden="true" /></a>
                <Link href={`/admin/meetings?view=list&meeting=${selected.id}`} className="rd-btn">회의록 편집</Link>
              </div>
              {selected.agenda && <div className="rd-note"><h3>안건</h3><p>{selected.agenda}</p></div>}
              {selected.decisions && <div className="rd-note"><h3>결정 사항</h3><p>{selected.decisions}</p></div>}
              {selected.tasks.length > 0 && (
                <div className="rd-note">
                  <h3>후속 작업</h3>
                  {selected.tasks.map((task) => <p key={task.id}>{task.status === "완료" ? "✓ " : "• "}{task.title}</p>)}
                </div>
              )}
            </>
          ) : selectedDate ? (
            <>
              <div className="rd-side-head">
                <span className="rd-eyebrow">{selectedDate === today ? "오늘" : `${WEEKDAYS[weekdayOf(selectedDate)]}요일`}</span>
                <button type="button" className="rd-icon-plain" aria-label="닫기" onClick={() => setSelectedDate(null)}><FiX /></button>
              </div>
              <h2 className="rd-side-title">{Number(selectedDate.slice(5, 7))}월 {Number(selectedDate.slice(8))}일</h2>
              {(() => {
                const events = byDate.get(selectedDate) || [];
                const ms = events.filter((e) => e.kind === "meeting");
                const ts = events.filter((e) => e.kind === "task");
                const mo = events.filter((e) => e.kind === "money");
                const done = ts.filter((e) => e.done).length;
                return (
                  <>
                    {events.length === 0 && <p className="rd-eyebrow">이 날은 일정이 없어요.</p>}
                    {ms.length > 0 && (
                      <div className="rd-note"><h3>미팅 {ms.length}</h3>
                        {ms.map((e) => (
                          <button key={e.id} type="button" className="rd-event rd-event-btn" onClick={() => setSelectedId(e.meeting!.id)}>
                            <time>{e.time}</time><span><span>{e.label}</span><small>{e.meeting!.project_name}</small></span>
                          </button>
                        ))}
                      </div>
                    )}
                    {ts.length > 0 && (
                      <div className="rd-note"><h3>작업 {ts.length}{done ? ` · 완료 ${done}` : ""}</h3>
                        {ts.map((e) => (
                          <Link key={e.id} href={e.href} className={`rd-day-item${e.done ? " is-done" : ""}`}>
                            <span aria-hidden="true">{e.done ? "✓" : "○"}</span><span><span>{e.label}</span><small>{e.sub}</small></span>
                          </Link>
                        ))}
                      </div>
                    )}
                    {mo.length > 0 && (
                      <div className="rd-note"><h3>입금 기한 {mo.length}</h3>
                        {mo.map((e) => (
                          <Link key={e.id} href={e.href} className="rd-day-item"><span aria-hidden="true">₩</span><span><span>{e.label}</span></span></Link>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          ) : (
            <>
              <h2 className="rd-side-title">다가오는 미팅</h2>
              {upcoming.map((meeting) => (
                <button key={meeting.id} type="button" className="rd-event rd-event-btn" onClick={() => setSelectedId(meeting.id)}>
                  <time>{meeting.meeting_date === today ? meeting.start_time.slice(0, 5) : shortDate(meeting.meeting_date)}</time>
                  <span><span>{meeting.title}</span><small>{meeting.project_name}</small></span>
                </button>
              ))}
              {!loading && upcoming.length === 0 && <p className="rd-eyebrow">예정된 미팅이 없어요.</p>}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
