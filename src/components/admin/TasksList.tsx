"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { FiPlus, FiSearch } from "react-icons/fi";
import { api } from "@/components/admin/api";
import { TaskEditor, type Task } from "./AdminProject";
import { addDays, dueLabel, seoulToday } from "./redesign-utils";

type ListTask = Task & { project_name: string; updated_at?: string };
type Project = { id: string; name: string; status: string };

const STATUSES = ["", "할 일", "진행 중", "확인 대기"];

async function load() {
  const [tasks, projects] = await Promise.all([
    api<ListTask[]>("/api/admin/tasks"),
    api<Project[]>("/api/admin/projects"),
  ]);
  return { tasks, projects };
}

export default function TasksList() {
  const [tasks, setTasks] = useState<ListTask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const today = seoulToday();

  const reload = useCallback(async () => {
    try {
      const data = await load();
      setTasks(data.tasks);
      setProjects(data.projects);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    }
  }, []);
  useEffect(() => {
    let active = true;
    load()
      .then((data) => {
        if (!active) return;
        setTasks(data.tasks);
        setProjects(data.projects);
      })
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : "불러오기 실패"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = tasks
      .filter((task) => task.status !== "완료")
      .filter((task) => !projectId || task.project_id === projectId)
      .filter((task) => !status || task.status === status)
      .filter((task) => !q || `${task.title} ${task.project_name}`.toLowerCase().includes(q))
      .sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"));
    const weekEnd = addDays(today, 6);
    return [
      { name: "기한 지남", tone: "is-danger", rows: rows.filter((t) => t.due_date && t.due_date < today) },
      { name: "오늘", tone: "is-today", rows: rows.filter((t) => t.due_date === today) },
      { name: "이번 주", tone: "", rows: rows.filter((t) => t.due_date && t.due_date > today && t.due_date <= weekEnd) },
      { name: "나중에", tone: "", rows: rows.filter((t) => (t.due_date && t.due_date > weekEnd) || !t.due_date) },
    ].filter((group) => group.rows.length);
  }, [tasks, query, projectId, status, today]);

  const selected = tasks.find((task) => task.id === selectedId);

  async function complete(task: ListTask) {
    if (saving) return;
    setSaving(true);
    try {
      await api(`/api/admin/tasks/${task.id}`, "PATCH", { status: "완료", expected_updated_at: task.updated_at });
      setNotice(`완료 · ${task.title}`);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "완료 처리 실패");
    } finally {
      setSaving(false);
    }
  }

  async function quickAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const title = String(fields.get("title") || "").trim();
    const target = String(fields.get("project") || projectId || "");
    if (!title || !target || saving) return;
    setSaving(true);
    try {
      await api(`/api/admin/projects/${target}/tasks`, "POST", {
        title,
        status: "할 일",
        priority: "보통",
        due_date: fields.get("due_date") || null,
      });
      form.reset();
      setNotice("작업을 추가했어요.");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "추가 실패");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rd-page">
      <form className="rd-addbar" onSubmit={quickAdd}>
        <FiPlus aria-hidden="true" />
        <input name="title" type="text" placeholder="새 작업 입력 후 Enter" aria-label="새 작업" autoComplete="off" />
        <select name="project" aria-label="프로젝트" defaultValue="" required>
          <option value="" disabled>프로젝트</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <input name="due_date" type="date" aria-label="마감일" />
      </form>
      <div className="rd-filters">
        <label className="rd-search">
          <FiSearch aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="작업·프로젝트 검색" aria-label="작업 검색" />
        </label>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label="프로젝트 필터">
          <option value="">프로젝트: 전체</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="상태 필터">
          {STATUSES.map((value) => <option key={value || "all"} value={value}>{value ? `상태: ${value}` : "상태: 전체"}</option>)}
        </select>
      </div>
      {error && <p role="alert" className="rd-error">{error}</p>}
      {notice && <p className="rd-eyebrow" aria-live="polite">{notice}</p>}
      <section className="rd-card">
        {groups.map((group) => (
          <div key={group.name}>
            <div className={`rd-group-head ${group.tone}`}>{group.name} · {group.rows.length}</div>
            {group.rows.map((task) => {
              const due = dueLabel(task.due_date, today);
              return (
                <div className={`rd-row ${selectedId === task.id ? "is-selected" : ""}`} key={task.id}>
                  <input type="checkbox" aria-label={`${task.title} 완료`} disabled={saving} onChange={() => void complete(task)} />
                  <button type="button" className="rd-row-title rd-row-button" onClick={() => setSelectedId(task.id)}>
                    {task.title}
                  </button>
                  {task.priority === "높음" && <span className="rd-chip is-hot">우선</span>}
                  <span className="rd-chip rd-chip-muted">{task.status}</span>
                  <span className="rd-chip">{task.project_name}</span>
                  <span className={`rd-due ${due.tone}`}>{due.text}</span>
                </div>
              );
            })}
          </div>
        ))}
        {loading && <div className="rd-empty">불러오는 중…</div>}
        {!loading && groups.length === 0 && <div className="rd-empty">조건에 맞는 작업이 없어요.</div>}
      </section>
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
