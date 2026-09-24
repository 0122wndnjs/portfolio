"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi";
import { projectColor } from "@/lib/admin/project-colors";
import type { Task } from "./AdminProject";
import type { Meeting } from "./MeetingsPage";

type CalendarTask = Task & { project_name: string };
type CalendarProject = { id: string; name: string; client: string; due_date: string | null };
type CalendarInvoice = {
  id: string;
  project_id: string;
  project_name: string;
  title: string;
  due_date: string | null;
  balance: number;
};
type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  projectId: string;
  projectName: string;
  kind: "task" | "project" | "invoice" | "meeting";
  complete?: boolean;
};

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const monthLabel = (date: Date) => `${date.getUTCFullYear()}년 ${date.getUTCMonth() + 1}월`;

export default function CalendarView({
  tasks,
  projects,
  invoices,
  meetings,
  today,
  loading,
  saving,
  onOpenTask,
  onAddTask,
}: {
  tasks: CalendarTask[];
  projects: CalendarProject[];
  invoices: CalendarInvoice[];
  meetings: Meeting[];
  today: string;
  loading: boolean;
  saving: boolean;
  onOpenTask: (id: string) => void;
  onAddTask: (event: FormEvent<HTMLFormElement>, status: string) => Promise<boolean>;
}) {
  const [month, setMonth] = useState(() => new Date(`${today}T00:00:00Z`));
  const [selectedDay, setSelectedDay] = useState(today);
  const [showPayments, setShowPayments] = useState(true);
  const [adding, setAdding] = useState(false);

  const events: CalendarEvent[] = [
    ...tasks.filter((task) => task.due_date).map((task) => ({
      id: task.id,
      date: task.due_date!,
      title: task.title,
      projectId: task.project_id,
      projectName: task.project_name,
      kind: "task" as const,
      complete: task.status === "완료",
    })),
    ...projects.filter((project) => project.due_date).map((project) => ({
      id: project.id,
      date: project.due_date!,
      title: `${project.name} 마감`,
      projectId: project.id,
      projectName: project.name,
      kind: "project" as const,
    })),
    ...(showPayments ? invoices.filter((invoice) => invoice.due_date && invoice.balance > 0).map((invoice) => ({
      id: invoice.id,
      date: invoice.due_date!,
      title: invoice.title,
      projectId: invoice.project_id,
      projectName: invoice.project_name,
      kind: "invoice" as const,
    })) : []),
    ...meetings.map((meeting) => ({
      id: meeting.id,
      date: meeting.meeting_date,
      title: `${meeting.start_time} ${meeting.title}`,
      projectId: meeting.project_id,
      projectName: meeting.project_name,
      kind: "meeting" as const,
    })),
  ];
  const byDate = new Map<string, CalendarEvent[]>();
  for (const event of events) byDate.set(event.date, [...(byDate.get(event.date) || []), event]);

  const first = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1));
  const gridStart = new Date(first);
  gridStart.setUTCDate(1 - first.getUTCDay());
  const daysInGrid = Math.ceil((first.getUTCDay() + new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()) / 7) * 7;
  const days = Array.from({ length: daysInGrid }, (_, index) => {
    const date = new Date(gridStart);
    date.setUTCDate(gridStart.getUTCDate() + index);
    return dateKey(date);
  });
  const daily = byDate.get(selectedDay) || [];
  const changeMonth = (offset: number) => {
    const next = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + offset, 1));
    setMonth(next);
    setSelectedDay(dateKey(next));
    setAdding(false);
  };

  return (
    <div className="calendar-layout" aria-busy={loading || saving}>
      <section className="calendar-panel" aria-label="월간 일정">
        <header className="calendar-header">
          <div>
            <h2>{monthLabel(month)}</h2>
            <p>작업과 프로젝트 마감일을 한눈에 확인하세요.</p>
          </div>
          <div className="calendar-actions">
            <label className="calendar-payment-toggle">
              <input type="checkbox" checked={showPayments} onChange={(event) => setShowPayments(event.target.checked)} />
              입금 일정
            </label>
            <button type="button" onClick={() => { setMonth(new Date(`${today}T00:00:00Z`)); setSelectedDay(today); }} className="calendar-today">오늘</button>
            <button type="button" onClick={() => changeMonth(-1)} aria-label="이전 달"><FiChevronLeft /></button>
            <button type="button" onClick={() => changeMonth(1)} aria-label="다음 달"><FiChevronRight /></button>
          </div>
        </header>
        <div className="calendar-grid">
          {weekdays.map((day) => <span key={day} className="calendar-weekday">{day}</span>)}
          {days.map((day) => {
            const dayEvents = byDate.get(day) || [];
            const currentMonth = day.slice(0, 7) === dateKey(first).slice(0, 7);
            return (
              <button
                type="button"
                key={day}
                onClick={() => { setSelectedDay(day); setAdding(false); }}
                className={`calendar-day ${currentMonth ? "" : "is-outside"} ${selectedDay === day ? "is-selected" : ""}`}
                aria-label={`${day}, 일정 ${dayEvents.length}개`}
                aria-pressed={selectedDay === day}
              >
                <span className={`calendar-date ${today === day ? "is-today" : ""}`}>{Number(day.slice(-2))}</span>
                <span className="calendar-events">
                  {dayEvents.slice(0, 3).map((event) => (
                    <span key={`${event.kind}-${event.id}`} className={`calendar-event ${event.complete ? "is-complete" : ""}`} style={{ "--event-color": projectColor(event.projectId).solid, "--event-soft": projectColor(event.projectId).soft } as React.CSSProperties}>
                      <span className="calendar-event-dot" />{event.kind === "invoice" ? "입금 · " : event.kind === "project" ? "마감 · " : event.kind === "meeting" ? "미팅 · " : ""}{event.title}
                    </span>
                  ))}
                  {dayEvents.length > 3 && <span className="calendar-more">+{dayEvents.length - 3}개</span>}
                </span>
                <span className="calendar-mobile-dots" aria-hidden="true">{dayEvents.slice(0, 3).map((event) => <i key={`${event.kind}-${event.id}`} style={{ background: projectColor(event.projectId).solid }} />)}</span>
              </button>
            );
          })}
        </div>
      </section>
      <aside className="calendar-agenda" aria-label="선택한 날짜의 일정">
        <div className="calendar-agenda-header">
          <div><strong>{Number(selectedDay.slice(5, 7))}월 {Number(selectedDay.slice(8))}일</strong><span>{daily.length}개 일정</span></div>
          <button type="button" onClick={() => setAdding(!adding)} disabled={!projects.length} aria-label="이 날짜에 작업 추가"><FiPlus /></button>
        </div>
        {adding && <form className="calendar-add-form" onSubmit={(event) => { void onAddTask(event, "할 일").then((created) => { if (created) setAdding(false); }); }}>
          <input type="hidden" name="due_date" value={selectedDay} />
          <input autoFocus name="title" aria-label="작업 제목" placeholder="작업 제목" required maxLength={200} />
          <select name="project" aria-label="프로젝트" required>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select>
          <div><button type="submit" className="board-primary" disabled={saving}>추가</button><button type="button" className="board-secondary" onClick={() => setAdding(false)}>취소</button></div>
        </form>}
        <div className="calendar-agenda-list">
          {daily.map((event) => {
            const contents = <><span className="calendar-agenda-dot" style={{ background: projectColor(event.projectId).solid }} /><span><strong className={event.complete ? "is-complete" : ""}>{event.title}</strong><small>{event.projectName} · {event.kind === "task" ? "작업" : event.kind === "project" ? "프로젝트 마감" : event.kind === "meeting" ? "미팅" : "입금 예정"}</small></span></>;
            return event.kind === "task" ? <button type="button" key={`${event.kind}-${event.id}`} className="calendar-agenda-item" onClick={() => onOpenTask(event.id)}>{contents}</button> : <Link key={`${event.kind}-${event.id}`} className="calendar-agenda-item" href={event.kind === "invoice" ? `/admin/projects/${event.projectId}?tab=입금` : event.kind === "meeting" ? `/admin/meetings?project=${event.projectId}&meeting=${event.id}` : `/admin/projects/${event.projectId}`}>{contents}</Link>;
          })}
          {!loading && !daily.length && <p className="calendar-empty">이 날짜에는 등록된 일정이 없어요.<br />날짜를 선택해 작업을 추가할 수 있어요.</p>}
        </div>
      </aside>
    </div>
  );
}
