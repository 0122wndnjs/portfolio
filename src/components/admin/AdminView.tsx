"use client";

import Link from "next/link";
import PaymentRow from "@/components/admin/PaymentRow";
import PaymentAmountFields from "@/components/admin/PaymentAmountFields";
import { projectColor } from "@/lib/admin/project-colors";
import { PROJECT_KINDS, PROJECT_KIND_LABELS, type ProjectKind } from "@/lib/admin/project-kinds";
import { useCallback, useEffect, useState } from "react";
import {
  FiArrowDownRight,
  FiArrowUpRight,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiClock,
  FiPlus,
  FiSearch,
  FiTrendingUp,
} from "react-icons/fi";
import { api } from "@/components/admin/api";
import SettingsView from "@/components/admin/SettingsView";
import { Button, Field, PageTitle, Toast, dateLabel } from "@/components/admin/ui";

type Project = {
  next_action: string;
  waiting_reason: string;
  next_check_date: string | null;
  id: string;
  kind: ProjectKind;
  name: string;
  client: string;
  status: string;
  due_date: string | null;
  contract_amount: number | null;
  task_count: number;
  done_count: number;
  updated_at: string;
  description: string;
};
type Task = {
  id: string;
  project_id: string;
  project_name: string;
  project_status: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  waiting_since: string | null;
  checklist: Array<{ id: string; text: string; done: boolean }>;
};
type Invoice = {
  id: string;
  project_id: string;
  project_name: string;
  title: string;
  amount: number;
  paid_amount: number;
  withholding_amount: number;
  net_received_amount: number;
  balance: number;
  due_date: string | null;
  status: string;
  overdue: boolean;
  payments: Array<{
    id: string;
    amount: number;
    withholding_amount: number;
    paid_at: string;
    memo: string;
  }>;
};
type Dashboard = {
  project_count: number;
  overdue_tasks: number;
  waiting_tasks: Task[];
  due_tasks: Task[];
  unpaid_total: number;
  upcoming_invoices: Invoice[];
  overdue_invoices: Invoice[];
};
type Section = "dashboard" | "projects" | "tasks" | "payments" | "settings";
const won = (value: number) =>
  new Intl.NumberFormat("ko-KR").format(value) + "원";
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
const badge: Record<string, string> = {
  "진행 중": "bg-blue-700 text-white",
  "준비 중": "bg-violet-700 text-white",
  보류: "bg-amber-600 text-white",
  완료: "bg-emerald-700 text-white",
  취소: "bg-gray-600 text-white",
  "확인 대기": "bg-orange-600 text-white",
  지연: "bg-red-700 text-white",
  "할 일": "bg-gray-600 text-white",
};

function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 px-6 py-12 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0edff] text-[#6853d7]">
        <FiCheck />
      </div>
      <p className="mt-4 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-[#92929f]">{detail}</p>
    </div>
  );
}
function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${badge[value] || "bg-gray-100 text-gray-600"}`}
    >
      {value}
    </span>
  );
}

export default function AdminView({
  section,
  initialCreateProject = false,
  initialProjectKind = "",
}: {
  section: Section;
  initialCreateProject?: boolean;
  initialProjectKind?: ProjectKind | "";
}) {
  const [loading, setLoading] = useState(true),
    [initialized, setInitialized] = useState(false),
    [error, setError] = useState(""),
    [data, setData] = useState<Dashboard | null>(null),
    [projects, setProjects] = useState<Project[]>([]),
    [tasks, setTasks] = useState<Task[]>([]),
    [invoices, setInvoices] = useState<Invoice[]>([]),
    [query, setQuery] = useState(""),
    [taskQuery, setTaskQuery] = useState(""),
    [status, setStatus] = useState(""),
    [projectStatus, setProjectStatus] = useState("전체"),
    [projectKind, setProjectKind] = useState(initialProjectKind),
    [newProjectKind, setNewProjectKind] = useState<ProjectKind>(initialProjectKind || "외주"),
    [taskPriority, setTaskPriority] = useState(""),
    [taskProject, setTaskProject] = useState(""),
    [includeClosedProjects, setIncludeClosedProjects] = useState(false),
    [showForm, setShowForm] = useState(initialCreateProject),
    [showTaskForm, setShowTaskForm] = useState(false),
    [taskRefreshToken, setTaskRefreshToken] = useState(0),
    [showInvoiceForm, setShowInvoiceForm] = useState(false),
    [paymentFilter, setPaymentFilter] = useState("받을 금액"),
    [paymentQuery, setPaymentQuery] = useState(""),
    [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null),
    [saving, setSaving] = useState(false),
    [toast, setToast] = useState(""),
    [renderedAt] = useState(() => Date.now());
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (section === "dashboard")
        setData(await api<Dashboard>("/api/admin/dashboard"));
      if (section === "projects")
        setProjects(
          await api<Project[]>(
            `/api/admin/projects?q=${encodeURIComponent(query)}&status=${encodeURIComponent(projectStatus)}&kind=${encodeURIComponent(projectKind)}`,
          ),
        );
      if (section === "tasks") {
        const params = new URLSearchParams({
          status,
          priority: taskPriority,
          project: taskProject,
          includeClosed: String(includeClosedProjects),
        });
        const [taskRows, projectRows] =
          await Promise.all([
            api<Task[]>(`/api/admin/tasks?${params}`),
            api<Project[]>("/api/admin/projects?status=전체"),
          ]);
        setTasks(taskRows);
        setProjects(projectRows);
      }
      if (section === "payments") {
        const [rows, projectRows] = await Promise.all([
          api<Invoice[]>("/api/admin/payments"),
          api<Project[]>("/api/admin/projects?status=전체"),
        ]);
        setInvoices(rows);
        setProjects(projectRows.filter((project) => project.kind === "외주" && project.status !== "취소"));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오지 못했습니다.");
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [
    section,
    query,
    status,
    projectStatus,
    projectKind,
    taskPriority,
    taskProject,
    includeClosedProjects,
  ]);
  useEffect(() => {
    // 검색어 입력 중 매 글자마다 요청하지 않도록 짧게 모아서 불러온다.
    const timer = setTimeout(() => void load(), 150);
    return () => clearTimeout(timer);
  }, [load, taskRefreshToken]);
  const flash = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };
  const saveProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const fd = new FormData(event.currentTarget);
    try {
      await api(
        "/api/admin/projects",
        "POST",
        Object.fromEntries(fd.entries()),
      );
      setShowForm(false);
      setProjectKind(newProjectKind);
      window.history.replaceState(null, "", `/admin/projects?kind=${encodeURIComponent(newProjectKind)}`);
      window.dispatchEvent(new Event("admin:projects-changed"));
      flash("프로젝트 만들었어요.");
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };
  const saveTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const projectId = String(values.project || "");
    if (!projectId) return;
    setSaving(true);
    setError("");
    try {
      await api(`/api/admin/projects/${projectId}/tasks`, "POST", {
        title: String(values.title || "").trim(),
        due_date: String(values.due_date || ""),
      });
      setShowTaskForm(false);
      setStatus("할 일");
      setTaskProject(projectId);
      setTaskPriority("");
      setTaskQuery("");
      setTaskRefreshToken((value) => value + 1);
      flash("작업을 추가했어요.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "작업을 추가하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };
  const savePayment = async (invoice: Invoice, form: HTMLFormElement) => {
    const fd = new FormData(form);
    try {
      await api(
        `/api/admin/invoices/${invoice.id}/payments`,
        "POST",
        Object.fromEntries(fd.entries()),
      );
      form.reset();
      flash("입금 기록했어요.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    }
  };
  const saveInvoice = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    const projectId = String(values.project);
    setSaving(true);
    try {
      await api(`/api/admin/projects/${projectId}/invoices`, "POST", values);
      form.reset();
      setShowInvoiceForm(false);
      flash("청구 항목을 추가했어요.");
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "청구 항목을 추가하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading && !initialized)
    return (
      <div className="space-y-5">
        <div className="h-7 w-48 animate-pulse rounded bg-black/[0.06]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((n) => (
            <div key={n} className="h-28 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      </div>
    );
  const alert = error && (
    <div
      role="alert"
      className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {error}
      <button onClick={() => setError("")} className="float-right">
        닫기
      </button>
    </div>
  );
  const visibleTasks = tasks.filter(
    (task) =>
      (status ? task.status === status : task.status !== "완료") &&
      `${task.title} ${task.project_name}`
        .toLocaleLowerCase()
        .includes(taskQuery.toLocaleLowerCase()),
  );
  const taskBuckets = [
    {
      title: "오늘",
      rows: visibleTasks.filter((task) => task.due_date === today()),
    },
    {
      title: "지난 일정",
      rows: visibleTasks.filter(
        (task) => !!task.due_date && task.due_date < today(),
      ),
    },
    {
      title: "다가오는 일정",
      rows: visibleTasks.filter(
        (task) => !!task.due_date && task.due_date > today(),
      ),
    },
    { title: "날짜 미정", rows: visibleTasks.filter((task) => !task.due_date) },
  ];
  const projectGroups = Array.from(new Set([
    "진행 중", "준비 중", "보류", "완료", "취소",
    ...projects.map((project) => project.status),
  ]))
    .map((status) => ({ status, rows: projects.filter((project) => project.status === status) }))
    .filter((group) => group.rows.length > 0);
  const activeTaskProjects = projects.filter((project) =>
    ["준비 중", "진행 중", "보류"].includes(project.status),
  );
  const taskExtraFilterCount = Number(Boolean(taskPriority)) + Number(includeClosedProjects);

  if (section === "dashboard" && data) {
    const cards = [
      {
        name: "진행 프로젝트",
        value: data.project_count,
        sub: "준비 중 · 진행 중",
        icon: <FiTrendingUp />,
        tint: "bg-violet-50 text-violet-600",
      },
      {
        name: "지연된 작업",
        value: data.overdue_tasks,
        sub: "마감일이 지난 미완료 작업",
        icon: <FiClock />,
        tint: "bg-red-50 text-red-600",
      },
      {
        name: "고객 확인 대기",
        value: data.waiting_tasks.length,
        sub: "답변을 기다리는 작업",
        icon: <FiArrowDownRight />,
        tint: "bg-orange-50 text-orange-600",
      },
      {
        name: "받을 금액",
        value: won(data.unpaid_total),
        sub: "등록한 청구 기준 미입금",
        icon: <FiArrowUpRight />,
        tint: "bg-emerald-50 text-emerald-600",
      },
    ];
    return (
      <>
        <PageTitle
          eyebrow="OVERVIEW"
          title="오늘 작업실"
          description="프로젝트와 다음 할 일을 확인하세요."
          action={
            <Button onClick={() => window.location.assign("/admin/projects")}>
              <FiPlus /> 프로젝트 추가
            </Button>
          }
        />
        {alert}
        <div className="workspace-metrics grid grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.name}
              className="rounded-2xl border border-black/[0.055] bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#858592]">
                  {card.name}
                </span>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl ${card.tint}`}
                >
                  {card.icon}
                </span>
              </div>
              <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
                {card.value}
              </p>
              <p className="sr-only">{card.sub}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <section className="rounded-2xl border border-black/[0.055] bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">가까운 마감</h2>
                <p className="mt-1 text-xs text-[#9999a5]">
                  오늘과 7일 안에 마감하는 작업
                </p>
              </div>
              <Link
                href="/admin/tasks"
                className="text-xs font-semibold text-[#5035ba]"
              >
                전체 작업 ↗
              </Link>
            </div>
            {data.due_tasks.length ? (
              data.due_tasks.slice(0, 7).map((task) => (
                <Link
                  href={`/admin/projects/${task.project_id}?task=${task.id}`}
                  key={task.id}
                  className="flex items-center justify-between gap-3 border-t border-black/[0.045] py-3.5 first:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">
                      {task.title}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-[#9a9aa5]">
                      {task.project_name}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`text-[11px] ${task.due_date && task.due_date < today() ? "text-red-600" : "text-[#838390]"}`}
                    >
                      {dateLabel(task.due_date)}
                    </span>
                    <StatusBadge value={task.status} />
                  </div>
                </Link>
              ))
            ) : (
              <p className="py-8 text-center text-xs text-[#9999a5]">
                가까운 마감 작업이 없어요.
              </p>
            )}
          </section>
          <div className="space-y-5">
            <section className="rounded-2xl border border-black/[0.055] bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">고객 확인 대기</h2>
                  <p className="mt-1 text-xs text-[#9999a5]">
                    응답을 기다리는 작업
                  </p>
                </div>
                <span className="rounded-lg bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-600">
                  {data.waiting_tasks.length}
                </span>
              </div>
              {data.waiting_tasks.length ? (
                data.waiting_tasks.slice(0, 4).map((task) => (
                  <Link
                    href={`/admin/projects/${task.project_id}?task=${task.id}`}
                    key={task.id}
                    className="block border-t border-black/[0.045] py-3 first:border-0"
                  >
                    <p className="text-xs font-medium">{task.title}</p>
                    <p className="mt-1 text-[10px] text-[#9a9aa5]">
                      {task.project_name} ·{" "}
                      {task.waiting_since
                        ? `${Math.max(0, Math.floor((renderedAt - new Date(task.waiting_since).getTime()) / 86400000))}일째`
                        : "방금 시작"}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="py-5 text-center text-xs text-[#9999a5]">
                  기다리는 답변이 없어요.
                </p>
              )}
            </section>
            <section className="rounded-2xl border border-black/[0.055] bg-white p-5 sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">입금 예정 · 연체</h2>
                <Link
                  href="/admin/payments"
                  className="text-xs font-semibold text-[#5035ba]"
                >
                  입금 관리 ↗
                </Link>
              </div>
              {[...data.overdue_invoices, ...data.upcoming_invoices]
                .slice(0, 4)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-3 border-t border-black/[0.045] py-3 first:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">
                        {item.project_name} · {item.title}
                      </p>
                      <p className="mt-1 text-[10px] text-[#9999a5]">
                        {item.overdue ? "연체" : dateLabel(item.due_date)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold">
                      {won(item.balance)}
                    </span>
                  </div>
                ))}
              {!data.overdue_invoices.length &&
                !data.upcoming_invoices.length && (
                  <p className="py-5 text-center text-xs text-[#9999a5]">
                    가까운 입금 일정이 없어요.
                  </p>
                )}
            </section>
          </div>
        </div>
        {toast && (
          <div className="fixed bottom-5 right-5 rounded-xl bg-[#24243b] px-4 py-3 text-sm text-white shadow-lg">
            {toast}
          </div>
        )}
      </>
    );
  }

  if (section === "projects")
    return (
      <>
        <header className="admin-section-heading">
          <PageTitle
            eyebrow="CLIENT WORK"
            title="프로젝트"
            description="고객과 진행 상황을 프로젝트별로 관리하세요."
            action={
              <Button onClick={() => setShowForm(!showForm)}>
                <FiPlus /> 새 프로젝트
              </Button>
            }
          />
        </header>
        <div className="admin-toolbar admin-section-controls project-index-toolbar flex flex-wrap gap-2">
          <div className="project-kind-filter" aria-label="업무 유형 필터">
            {[["", "전체"], ...PROJECT_KINDS.map((kind) => [kind, PROJECT_KIND_LABELS[kind]])].map(([value, label]) => <button type="button" key={label} aria-pressed={projectKind === value} onClick={() => { setProjectKind(value as ProjectKind | ""); if (value) setNewProjectKind(value as ProjectKind); }}>{label}</button>)}
          </div>
          <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-black/[0.07] bg-white px-3">
            <FiSearch className="text-[#a0a0ac]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="프로젝트 또는 고객 검색"
              className="w-full bg-transparent py-2.5 text-xs outline-none"
            />
          </label>
          <select
            aria-label="프로젝트 상태 필터"
            value={projectStatus}
            onChange={(e) => setProjectStatus(e.target.value)}
            className="rounded-xl border border-black/[0.07] bg-white px-3 text-xs"
          >
            <option value="전체">전체 상태</option>
            <option value="">진행 중 · 준비 중 · 보류</option>
            {["준비 중", "진행 중", "보류", "완료", "취소"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        {alert}
        {showForm && (
          <form
            onSubmit={saveProject}
            className="mb-5 grid gap-3 rounded-2xl border border-[#efb8ba] bg-white p-5 sm:grid-cols-2"
          >
            <label className="text-xs text-[#71717f]">
              업무 유형
              <select name="kind" value={newProjectKind} onChange={(event) => setNewProjectKind(event.target.value as ProjectKind)} className="mt-1.5 block w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm">
                {PROJECT_KINDS.map((kind) => <option value={kind} key={kind}>{PROJECT_KIND_LABELS[kind]}</option>)}
              </select>
            </label>
            <Field name="name" label="프로젝트명" required />
            {newProjectKind !== "개인" && <Field name="client" label={newProjectKind === "외주" ? "고객명" : "팀 / 조직"} required />}
            <Field name="due_date" label="마감일" type="date" />
            {newProjectKind === "외주" && <Field
              name="contract_amount"
              label="계약 금액 (원)"
              type="number"
            />}
            <label className="text-xs text-[#71717f]">
              초기 상태
              <select
                name="status"
                className="mt-1.5 block w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm"
              >
                <option>준비 중</option>
                <option>진행 중</option>
                <option>보류</option>
              </select>
            </label>
            <div className="flex items-end justify-end gap-2">
              <Button kind="light" onClick={() => setShowForm(false)}>
                취소
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "저장 중…" : "만들기"}
              </Button>
            </div>
          </form>
        )}
        {projects.length ? (
          <div className="project-index">
            {projectGroups.map(({ status: groupStatus, rows }) => (
              <section className="project-index-group" data-status={groupStatus} key={groupStatus} aria-label={`${groupStatus} 프로젝트 ${rows.length}개`}>
                <header className="project-index-group-heading">
                  <span className="project-index-status-dot" aria-hidden="true" />
                  <h2>{groupStatus}</h2>
                  <span className="project-index-count">{rows.length}</span>
                </header>
                <div className="project-index-list">
                  {rows.map((project) => {
                    const taskCount = Number(project.task_count) || 0;
                    const doneCount = Number(project.done_count) || 0;
                    const progress = taskCount ? Math.round((100 * doneCount) / taskCount) : 0;
                    return (
                      <Link
                        href={`/admin/projects/${project.id}`}
                        key={project.id}
                        className="project-index-row"
                        style={{ "--project-solid": projectColor(project.id).solid } as React.CSSProperties}
                      >
                        <div className="project-index-identity">
                          <span className="project-index-color" aria-hidden="true" />
                          <div className="project-index-name">
                            <strong title={project.name}>{project.name}</strong>
                            <span title={project.kind === "개인" ? "개인 프로젝트" : project.client}>{project.kind === "개인" ? "개인 프로젝트" : project.client}</span>
                          </div>
                          <span className={`project-kind-badge ${project.kind === "회사" || project.kind === "회사 마케팅" ? "is-company" : project.kind === "개인" ? "is-personal" : ""}`}>{PROJECT_KIND_LABELS[project.kind]}</span>
                        </div>
                        <div className="project-index-focus">
                          <strong className={project.next_action ? "" : "is-empty"} title={project.next_action || undefined}>
                            {project.next_action ? `다음 · ${project.next_action}` : "다음 할 일 미입력"}
                          </strong>
                          {(project.waiting_reason || project.next_check_date) && (
                            <span className="project-index-signals">
                              {project.waiting_reason && <span className="is-waiting" title={project.waiting_reason}>대기 · {project.waiting_reason}</span>}
                              {project.next_check_date && <span className={project.next_check_date <= today() ? "is-check-due" : "is-check"}>{project.next_check_date <= today() ? "확인 필요" : "다음 확인"} · {project.next_check_date}</span>}
                            </span>
                          )}
                        </div>
                        <div className="project-index-progress" aria-label={`작업 ${doneCount}개 완료, 전체 ${taskCount}개`}>
                          <span>{taskCount ? `${doneCount} / ${taskCount} 완료` : "작업 없음"}</span>
                          <span className="project-progress-track" aria-hidden="true"><span style={{ width: `${progress}%` }} /></span>
                        </div>
                        <div className="project-index-date">
                          <span><FiCalendar aria-hidden="true" /> {project.due_date ? dateLabel(project.due_date) : "마감 미정"}</span>
                          {project.kind === "외주" && <small>{project.contract_amount ? won(project.contract_amount) : "금액 미등록"}</small>}
                        </div>
                        <FiArrowUpRight className="project-index-open" aria-hidden="true" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <Empty
            title={query || projectKind || projectStatus !== "전체" ? "조건에 맞는 프로젝트가 없어요" : "프로젝트가 아직 없어요"}
            detail={query || projectKind || projectStatus !== "전체" ? "검색어 또는 필터를 바꿔보세요." : "첫 프로젝트를 등록하면 작업 보드와 입금 일정을 함께 관리할 수 있어요."}
          />
        )}
        {toast && <Toast text={toast} />}
      </>
    );

  if (section === "tasks")
    return (
      <>
        <header className="admin-section-heading">
          <PageTitle
            eyebrow="TASKS"
            title="작업"
            action={<Button onClick={() => setShowTaskForm((open) => !open)} disabled={!activeTaskProjects.length}><FiPlus /> 새 작업</Button>}
          />
        </header>
        <div className="admin-section-controls admin-task-controls">
          <div className="task-status-filter" aria-label="작업 상태">
            {["", "할 일", "진행 중", "확인 대기", "완료"].map((item) => (
              <button
                key={item || "all"}
                onClick={() => setStatus(item)}
                aria-pressed={status === item}
              >
                {item || "진행할 작업"}
              </button>
            ))}
          </div>
          <div className="admin-toolbar task-toolbar flex flex-wrap gap-2">
            <label className="task-search">
              <FiSearch />
              <input
                aria-label="작업 검색"
                value={taskQuery}
                onChange={(event) => setTaskQuery(event.target.value)}
                placeholder="작업이나 프로젝트 검색"
              />
            </label>
            <select
              value={taskProject}
              onChange={(event) => setTaskProject(event.target.value)}
              aria-label="프로젝트 필터"
            >
              <option value="">모든 프로젝트</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <details className="task-more-filters">
              <summary>상세 필터{taskExtraFilterCount > 0 && ` · ${taskExtraFilterCount}`} <FiChevronDown aria-hidden="true" /></summary>
              <div className="task-more-panel">
                <label>
                  우선순위
                  <select
                    value={taskPriority}
                    onChange={(event) => setTaskPriority(event.target.value)}
                    aria-label="우선순위 필터"
                  >
                    <option value="">모든 우선순위</option>
                    {["높음", "보통", "낮음"].map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                </label>
                <label className="task-closed-toggle">
                  <input
                    type="checkbox"
                    checked={includeClosedProjects}
                    onChange={(event) => setIncludeClosedProjects(event.target.checked)}
                  />
                  완료 프로젝트 포함
                </label>
              </div>
            </details>
          </div>
        </div>
        {showTaskForm && (
          <form className="task-quick-form" onSubmit={saveTask}>
            <label>
              프로젝트
              <select name="project" required defaultValue={activeTaskProjects.some((project) => project.id === taskProject) ? taskProject : ""}>
                <option value="" disabled>프로젝트 선택</option>
                {activeTaskProjects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}
              </select>
            </label>
            <label className="task-quick-title">
              작업 제목
              <input name="title" required maxLength={200} placeholder="해야 할 일을 적어주세요" autoFocus />
            </label>
            <label>
              마감일 (선택)
              <input name="due_date" type="date" />
            </label>
            <div className="task-quick-actions">
              <Button kind="light" onClick={() => setShowTaskForm(false)}>취소</Button>
              <Button type="submit" disabled={saving}>{saving ? "추가 중…" : "추가"}</Button>
            </div>
          </form>
        )}
        {alert}
        {tasks.length && visibleTasks.length ? (
          <div className="task-groups task-work-queue">
            {taskBuckets
              .filter((bucket) => bucket.rows.length > 0)
              .map((bucket) => (
                <section className={`task-group ${bucket.title === "지난 일정" ? "is-overdue" : bucket.title === "오늘" ? "is-today" : bucket.title === "다가오는 일정" ? "is-upcoming" : ""}`} key={bucket.title}>
                  <header>
                    <h2>{bucket.title}</h2>
                    <span>{bucket.rows.length}</span>
                  </header>
                  <div className="task-group-rows">
                    {bucket.rows.map((task) => (
                      <article key={task.id} className="task-item" style={{ "--project-solid": projectColor(task.project_id).solid } as React.CSSProperties}>
                        <div className="task-item-main">
                          <Link
                            href={`/admin/projects/${task.project_id}?task=${task.id}`}
                            className="task-item-title"
                          >
                            {task.title}
                          </Link>
                          <Link
                            href={`/admin/projects/${task.project_id}`}
                            className="task-item-project"
                          >
                            {task.project_name}
                          </Link>
                        </div>
                        <div className="task-item-meta">
                          {task.due_date && (
                            <span className="task-item-date">
                              <FiCalendar />
                              {dateLabel(task.due_date)}
                            </span>
                          )}
                          {task.priority === "높음" && (
                            <span className="task-priority">우선</span>
                          )}
                          {!!task.checklist.length && (
                            <span className="task-checks">
                              <FiCheck />
                              {task.checklist.filter((x) => x.done).length}/
                              {task.checklist.length}
                            </span>
                          )}
                        </div>
                        <select
                          aria-label={`${task.title} 상태`}
                          value={task.status}
                          onChange={async (event) => {
                            const nextStatus = event.target.value;
                            try {
                              await api(
                                `/api/admin/tasks/${task.id}`,
                                "PATCH",
                                { status: nextStatus },
                              );
                              setTasks((rows) =>
                                rows.map((row) =>
                                  row.id === task.id
                                    ? { ...row, status: nextStatus }
                                    : row,
                                ),
                              );
                            } catch (err) {
                              setError(
                                err instanceof Error
                                  ? err.message
                                  : "수정 실패",
                              );
                            }
                          }}
                        >
                          <option>할 일</option>
                          <option>진행 중</option>
                          <option>확인 대기</option>
                          <option>완료</option>
                        </select>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
          </div>
        ) : tasks.length || taskProject || taskPriority || status || taskQuery || includeClosedProjects ? (
          <Empty
            title="조건에 맞는 작업이 없어요"
            detail="검색어와 필터를 바꿔보세요."
          />
        ) : (
          <Empty
            title="작업이 아직 없어요"
            detail="프로젝트 보드에서 해야 할 일을 추가하면 여기에 모여요."
          />
        )}
      </>
    );

  if (section === "payments")
    return (
      <>
        <header className="admin-section-heading admin-section-heading-standalone">
          <PageTitle
            eyebrow="PAYMENTS"
            title="입금"
            action={
              <Button
                onClick={() => setShowInvoiceForm((open) => !open)}
                disabled={!projects.length}
              >
                <FiPlus />
                청구 추가
              </Button>
            }
          />
        </header>
        {alert}
        {showInvoiceForm && (
          <form onSubmit={saveInvoice} className="invoice-create-form">
            <label>
              프로젝트
              <select name="project" required defaultValue="">
                <option value="" disabled>
                  프로젝트 선택
                </option>
                {projects.map((project) => (
                  <option value={project.id} key={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              청구 항목
              <input
                name="title"
                required
                maxLength={100}
                placeholder="예: 착수금"
              />
            </label>
            <label>
              청구 금액
              <input
                name="amount"
                required
                type="number"
                min={1}
                step={1}
                placeholder="원"
              />
            </label>
            <label>
              입금 예정일
              <input name="due_date" type="date" />
            </label>
            <div>
              <Button type="submit" disabled={saving}>
                {saving ? "저장 중…" : "청구 추가"}
              </Button>
              <Button kind="light" onClick={() => setShowInvoiceForm(false)}>
                취소
              </Button>
            </div>
          </form>
        )}
        {invoices.length ? (
          (() => {
            const receiving = invoices.filter((invoice) => invoice.balance > 0);
            const received = invoices.filter((invoice) => invoice.balance <= 0);
            const statusInvoices =
              paymentFilter === "받을 금액"
                ? receiving
                : paymentFilter === "입금 완료"
                  ? received
                  : invoices;
            const visibleInvoices = statusInvoices
              .filter((invoice) => `${invoice.project_name} ${invoice.title}`.toLocaleLowerCase().includes(paymentQuery.toLocaleLowerCase()))
              .sort((a, b) => paymentFilter === "전체" ? Number(a.balance <= 0) - Number(b.balance <= 0) : 0);
            const openBalance = receiving.reduce(
              (sum, invoice) => sum + invoice.balance,
              0,
            );
            const receivedTotal = invoices.reduce(
              (sum, invoice) => sum + invoice.net_received_amount,
              0,
            );
            return (
              <>
                <div className="payment-overview">
                  <div>
                    <span>받을 금액</span>
                    <strong>{won(openBalance)}</strong>
                  </div>
                  <div>
                    <span>미완료 청구</span>
                    <strong>{receiving.length}건</strong>
                  </div>
                  <div>
                    <span>실수령액</span>
                    <strong>{won(receivedTotal)}</strong>
                  </div>
                </div>
                <div className="payment-list-heading">
                  <div className="payment-filters">
                    {["받을 금액", "입금 완료", "전체"].map((filter) => (
                      <button
                        key={filter}
                        aria-pressed={paymentFilter === filter}
                        onClick={() => setPaymentFilter(filter)}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                  <label className="payment-search"><FiSearch aria-hidden="true" /><input value={paymentQuery} onChange={(event) => setPaymentQuery(event.target.value)} placeholder="프로젝트·청구 항목 검색" aria-label="입금 항목 검색" /></label>
                  <span>{visibleInvoices.length}건</span>
                </div>
                {visibleInvoices.length ? <div className="invoice-list">
                  {visibleInvoices.map((invoice) => (
                    <article key={invoice.id} className="invoice-item" id={`invoice-${invoice.id}`}>
                      <div className="invoice-item-main">
                        <div className="invoice-item-identity">
                          <Link
                            href={`/admin/projects/${invoice.project_id}`}
                            className="invoice-project"
                          >
                            {invoice.project_name}
                          </Link>
                          <h2>{invoice.title}</h2>
                        </div>
                        <div className="invoice-item-date"><span>입금 예정 {invoice.due_date ? dateLabel(invoice.due_date) : "미정"}</span><small>청구 {won(invoice.amount)}</small></div>
                        <div className="invoice-totals">
                          <span>{invoice.balance > 0 ? "남은 금액" : "정산 상태"}</span>
                          <strong>
                            {invoice.balance > 0
                              ? won(invoice.balance)
                              : "입금 완료"}
                          </strong>
                        </div>
                        <button type="button" className="invoice-item-toggle" aria-expanded={expandedInvoiceId === invoice.id} aria-controls={expandedInvoiceId === invoice.id ? `invoice-detail-${invoice.id}` : undefined} onClick={() => setExpandedInvoiceId(expandedInvoiceId === invoice.id ? null : invoice.id)}>{invoice.balance > 0 ? "입금 기록" : "내역 보기"}<FiChevronDown aria-hidden="true" /></button>
                      </div>
                      {expandedInvoiceId === invoice.id && <div className="invoice-item-expanded" id={`invoice-detail-${invoice.id}`}>
                        <div className="invoice-expanded-summary">
                          <span>청구 처리 <strong>{won(invoice.paid_amount)} / {won(invoice.amount)}</strong></span>
                          <span>실수령 <strong>{won(invoice.net_received_amount)}</strong></span>
                          {invoice.withholding_amount > 0 && <span>공제 <strong>{won(invoice.withholding_amount)}</strong></span>}
                        </div>
                        <div className="invoice-progress"><span style={{ width: `${Math.min(100, (100 * invoice.paid_amount) / invoice.amount)}%` }} /></div>
                        <div className="invoice-disclosures">
                        {!!invoice.payments.length && (
                          <details>
                            <summary>
                              <FiChevronDown /> 입금 내역{" "}
                              {invoice.payments.length}건
                            </summary>
                            <div className="invoice-history">
                              {invoice.payments.map((payment) => (
                                <PaymentRow
                                  key={payment.id}
                                  payment={payment}
                                  onChanged={load}
                                  onError={setError}
                                />
                              ))}
                            </div>
                          </details>
                        )}
                        {invoice.balance > 0 && (
                          <div className="record-payment">
                            <strong>입금 기록</strong>
                            <form
                              onSubmit={(event) => {
                                event.preventDefault();
                                void savePayment(invoice, event.currentTarget);
                              }}
                            >
                              <PaymentAmountFields key={`${invoice.id}:${invoice.paid_amount}`} max={invoice.balance} />
                              <label>
                                입금일
                                <input
                                  name="paid_at"
                                  type="date"
                                  defaultValue={today()}
                                  required
                                />
                              </label>
                              <label className="payment-memo">
                                메모
                                <input name="memo" placeholder="선택 입력" />
                              </label>
                              <Button type="submit">
                                <FiPlus />
                                기록 저장
                              </Button>
                            </form>
                          </div>
                        )}
                        </div>
                      </div>
                    }
                    </article>
                  ))}
                </div> : <div className="payment-filter-empty">{paymentQuery ? "검색 결과가 없어요." : paymentFilter === "입금 완료" ? "완료된 입금이 없어요." : "받을 금액이 없어요."}</div>}
              </>
            );
          })()
        ) : (
          <Empty
            title="입금 항목이 없습니다"
            detail="청구 항목을 추가하면 입금 내역과 남은 금액을 기록할 수 있어요."
          />
        )}
      </>
    );

  return <SettingsView onError={setError} alert={alert} />;
}
