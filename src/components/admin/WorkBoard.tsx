"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiCheckSquare,
  FiCalendar,
  FiX,
  FiColumns,
} from "react-icons/fi";
import { TaskEditor, type Task } from "./AdminProject";
import CalendarView from "./CalendarView";
import type { Meeting } from "./MeetingsPage";
import { projectColor } from "@/lib/admin/project-colors";
import { matchesProjectKind, PROJECT_KINDS, PROJECT_KIND_LABELS, type ProjectKind } from "@/lib/admin/project-kinds";
import { api } from "@/components/admin/api";

type BoardTask = Task & { project_name: string };
type Project = { id: string; name: string; client: string; kind: ProjectKind; due_date: string | null };
type Invoice = { id: string; project_id: string; project_name: string; title: string; due_date: string | null; balance: number };
const columns = ["할 일", "진행 중", "확인 대기", "완료"];

const request = <T,>(url: string, body?: unknown) => api<T>(url, body === undefined ? "GET" : "POST", body);

export default function WorkBoard() {
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [view, setView] = useState<"board" | "calendar">("board");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [kind, setKind] = useState("");
  const [focus, setFocus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composer, setComposer] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [hoverLane, setHoverLane] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const mutation = useRef(false);
  const reload = useCallback(async () => {
    try {
      const [open, done, projectRows, invoiceRows, meetingRows] = await Promise.all([
        request<BoardTask[]>("/api/admin/tasks"),
        request<BoardTask[]>("/api/admin/tasks?status=완료"),
        request<Project[]>("/api/admin/projects"),
        request<Invoice[]>("/api/admin/payments"),
        request<Meeting[]>("/api/admin/meetings"),
      ]);
      setTasks([...open, ...done]);
      setProjects(projectRows);
      setInvoices(invoiceRows);
      setMeetings(meetingRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all([
      request<BoardTask[]>("/api/admin/tasks"),
      request<BoardTask[]>("/api/admin/tasks?status=완료"),
      request<Project[]>("/api/admin/projects"),
      request<Invoice[]>("/api/admin/payments"),
      request<Meeting[]>("/api/admin/meetings"),
    ])
      .then(([open, done, projectRows, invoiceRows, meetingRows]) => {
        if (!active) return;
        setTasks([...open, ...done]);
        setProjects(projectRows);
        setInvoices(invoiceRows);
        setMeetings(meetingRows);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "불러오기 실패");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Seoul",
  });
  const availableProjects = projects.filter((project) => matchesProjectKind(project.kind, kind));
  const availableProjectIds = new Set(availableProjects.map((project) => project.id));
  const visible = tasks.filter(
    (task) =>
      availableProjectIds.has(task.project_id) &&
      (!projectId || task.project_id === projectId) &&
      (!query ||
        `${task.title} ${task.project_name}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (focus === "all" ||
        (focus === "today" && task.due_date === today) ||
        (focus === "overdue" &&
          task.status !== "완료" &&
          !!task.due_date &&
          task.due_date < today) ||
        (focus === "priority" && task.priority === "높음")),
  );
  const selected = tasks.find((task) => task.id === selectedId);

  async function move(task: BoardTask, status: string, before?: BoardTask) {
    if (mutation.current || before?.id === task.id) return;
    mutation.current = true;
    setSaving(true);
    setError("");
    try {
      await request(`/api/admin/projects/${task.project_id}/order`, {
        taskId: task.id,
        status,
        beforeTaskId:
          before?.project_id === task.project_id ? before.id : undefined,
      });
      await reload();
      setNotice(`${task.title} → ${status}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "이동 실패");
    } finally {
      mutation.current = false;
      setSaving(false);
      setDragging(null);
      setHoverLane(null);
    }
  }

  async function addTask(
    event: React.FormEvent<HTMLFormElement>,
    status: string,
  ) {
    event.preventDefault();
    if (mutation.current) return false;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const targetProject = String(fields.get("project"));
    mutation.current = true;
    setSaving(true);
    setError("");
    try {
      await request(`/api/admin/projects/${targetProject}/tasks`, {
        title: fields.get("title"),
        status,
        priority: "보통",
        due_date: fields.get("due_date") || null,
      });
      form.reset();
      await reload();
      setNotice("작업을 추가했어요.");
      setComposer(null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "추가 실패");
      return false;
    } finally {
      mutation.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="workbench">
      <div className="workbench-heading">
        <div>
          <h1>
            내 작업 보드{" "}
            <span>{tasks.filter((task) => task.status !== "완료" && projects.some((project) => project.id === task.project_id && matchesProjectKind(project.kind, kind))).length}</span>
          </h1>
        </div>
        <Link href="/admin/projects?new=1" className="board-secondary">
          <FiPlus /> 프로젝트 만들기
        </Link>
      </div>
      <div className="workbench-toolbar">
        <div className="board-view-switch" aria-label="보기 방식">
          <button type="button" aria-pressed={view === "board"} onClick={() => setView("board")}><FiColumns /> 보드</button>
          <button type="button" aria-pressed={view === "calendar"} onClick={() => { setView("calendar"); setFocus("all"); }}><FiCalendar /> 캘린더</button>
        </div>
        <div className="project-kind-filter" aria-label="업무 유형 필터">
          {[["", "전체"], ...PROJECT_KINDS.map((projectKind) => [projectKind, PROJECT_KIND_LABELS[projectKind]])].map(([value, label]) => <button type="button" key={label} aria-pressed={kind === value} onClick={() => { setKind(value); setProjectId(""); }}>{label}</button>)}
        </div>
        <select
          aria-label="프로젝트 필터"
          value={projectId}
          onChange={(event) => setProjectId(event.target.value)}
        >
          <option value="">모든 프로젝트</option>
          {availableProjects.map((project) => (
            <option value={project.id} key={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        {view === "board" && <div className="board-filters" aria-label="작업 필터">
          {[
            ["all", "전체"],
            ["today", "오늘 마감"],
            ["overdue", "지연"],
            ["priority", "우선 작업"],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={focus === value}
              onClick={() => setFocus(value)}
            >
              {label}
            </button>
          ))}
        </div>}
        <label className="board-search">
          <FiSearch />
          <input
            aria-label="작업 검색"
            placeholder="작업 찾기…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      {error && (
        <div className="board-error" role="alert">
          {error}
          <button onClick={() => setError("")} aria-label="오류 닫기">
            <FiX />
          </button>
        </div>
      )}
      <p className="sr-only" role="status">
        {loading ? "작업 불러오는 중…" : saving ? "저장 중…" : notice}
      </p>
      {view === "calendar" ? <CalendarView
        tasks={visible}
        projects={availableProjects.filter((project) => !projectId || project.id === projectId)}
        invoices={invoices.filter((invoice) => availableProjectIds.has(invoice.project_id) && (!projectId || invoice.project_id === projectId))}
        meetings={meetings.filter((meeting) => availableProjectIds.has(meeting.project_id) && (!projectId || meeting.project_id === projectId))}
        today={today}
        loading={loading}
        saving={saving}
        onOpenTask={(id) => { setNotice(""); setSelectedId(id); }}
        onAddTask={addTask}
      /> : <div className="workbench-board" aria-busy={loading || saving}>
        {columns.map((column, index) => {
          const lane = visible
            .filter((task) => task.status === column)
            .sort(
              (a, b) =>
                a.project_id.localeCompare(b.project_id) ||
                a.position - b.position,
            );
          return (
            <section
              key={column}
              className={`workbench-lane lane-${index} ${hoverLane === column ? "is-over" : ""}`}
              onDragOver={(event) => {
                if (dragging && !saving) {
                  event.preventDefault();
                  setHoverLane(column);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                const task = tasks.find(
                  (item) => item.id === event.dataTransfer.getData("text/task"),
                );
                if (task) void move(task, column);
              }}
            >
              <header>
                <h2>
                  <span className="lane-dot" />
                  {column}
                  <span className="lane-count">{lane.length}</span>
                </h2>
                <button
                  disabled={!availableProjects.length || saving}
                  aria-label={`${column} 작업 추가`}
                  onClick={() => setComposer(column)}
                >
                  <FiPlus />
                </button>
              </header>
              <div className="lane-cards">
                {loading && <div className="board-skeleton" />}
                {lane.map((task) => (
                  <article
                    key={task.id}
                    className={`work-card ${dragging === task.id ? "is-dragging" : ""}`}
                    draggable={!saving}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/task", task.id);
                      event.dataTransfer.effectAllowed = "move";
                      setDragging(task.id);
                    }}
                    onDragEnd={() => {
                      setDragging(null);
                      setHoverLane(null);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      const moving = tasks.find(
                        (item) =>
                          item.id === event.dataTransfer.getData("text/task"),
                      );
                      if (moving) void move(moving, column, task);
                    }}
                  >
                    <button
                      className="work-card-open"
                      onClick={() => {
                        setNotice("");
                        setSelectedId(task.id);
                      }}
                    >
                      <span className="work-card-project" style={{ backgroundColor: projectColor(task.project_id).soft, color: projectColor(task.project_id).strong }}>
                        {task.project_name}
                      </span>
                      <span
                        className={`work-card-title ${column === "완료" ? "is-complete" : ""}`}
                      >
                        {task.title}
                      </span>
                      {task.description && (
                        <span className="work-card-description">
                          {task.description}
                        </span>
                      )}
                      <span className="work-card-meta">
                        {task.priority === "높음" && (
                          <span className="priority-tag">우선</span>
                        )}
                        {task.due_date && (
                          <span
                            className={
                              task.due_date < today && column !== "완료"
                                ? "date-late"
                                : ""
                            }
                          >
                            <FiCalendar />
                            {task.due_date.slice(5).replace("-", "/")}
                          </span>
                        )}
                        {!!task.checklist.length && (
                          <span>
                            <FiCheckSquare />
                            {task.checklist.filter((item) => item.done).length}/
                            {task.checklist.length}
                          </span>
                        )}
                      </span>
                    </button>
                    <select
                      className="card-status"
                      aria-label={`${task.title} 상태`}
                      value={task.status}
                      disabled={saving}
                      onChange={(event) => void move(task, event.target.value)}
                    >
                      {columns.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </article>
                ))}
                {!loading && !lane.length && composer !== column && (
                  <p className="lane-empty">
                    {query || focus !== "all"
                      ? "조건에 맞는 작업 없음"
                      : column === "완료"
                        ? "끝낸 작업은 여기에"
                        : "여기로 카드를 옮겨보세요"}
                  </p>
                )}
                {composer === column ? (
                  <form
                    className="board-composer"
                    onSubmit={(event) => void addTask(event, column)}
                  >
                    <input
                      autoFocus
                      name="title"
                      aria-label="새 작업 제목"
                      placeholder="어떤 일을 해야 하나요?"
                      required
                      maxLength={200}
                    />
                    <select
                      name="project"
                      aria-label="새 작업 프로젝트"
                      defaultValue={projectId || availableProjects[0]?.id}
                      required
                    >
                      {availableProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    <div>
                      <button className="board-primary" disabled={saving}>
                        추가
                      </button>
                      <button
                        type="button"
                        className="board-secondary"
                        onClick={() => setComposer(null)}
                      >
                        취소
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    className="lane-add"
                    disabled={!availableProjects.length || saving}
                    onClick={() => setComposer(column)}
                  >
                    <FiPlus /> 작업 추가
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>}
      {selected && (
        <TaskEditor
          key={selected.id}
          task={selected}
          close={() => setSelectedId(null)}
          refresh={reload}
          onError={setError}
          onToast={setNotice}
        />
      )}
    </div>
  );
}
