"use client";

import Link from "next/link";
import PaymentRow from "@/components/admin/PaymentRow";
import { projectColor } from "@/lib/admin/project-colors";
import { PROJECT_KINDS, PROJECT_KIND_LABELS, type ProjectKind } from "@/lib/admin/project-kinds";
import { PROJECT_TEMPLATES } from "@/lib/admin/templates";
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
  balance: number;
  due_date: string | null;
  status: string;
  overdue: boolean;
  payments: Array<{
    id: string;
    amount: number;
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
    [projectKind, setProjectKind] = useState(initialProjectKind),
    [newProjectKind, setNewProjectKind] = useState<ProjectKind>(initialProjectKind || "외주"),
    [taskPriority, setTaskPriority] = useState(""),
    [taskProject, setTaskProject] = useState(""),
    [includeClosedProjects, setIncludeClosedProjects] = useState(false),
    [showForm, setShowForm] = useState(initialCreateProject),
    [showInvoiceForm, setShowInvoiceForm] = useState(false),
    [paymentFilter, setPaymentFilter] = useState("받을 금액"),
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
            `/api/admin/projects?q=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}&kind=${encodeURIComponent(projectKind)}`,
          ),
        );
      if (section === "tasks") {
        const params = new URLSearchParams({
          status,
          priority: taskPriority,
          project: taskProject,
          includeClosed: String(includeClosedProjects),
        });
        const [taskRows, activeProjects, completedProjects, cancelledProjects] =
          await Promise.all([
            api<Task[]>(`/api/admin/tasks?${params}`),
            api<Project[]>("/api/admin/projects"),
            api<Project[]>("/api/admin/projects?status=완료"),
            api<Project[]>("/api/admin/projects?status=취소"),
          ]);
        setTasks(taskRows);
        setProjects([
          ...activeProjects,
          ...completedProjects,
          ...cancelledProjects,
        ]);
      }
      if (section === "payments") {
        const [rows, activeProjects, completedProjects] = await Promise.all([
          api<Invoice[]>("/api/admin/payments"),
          api<Project[]>("/api/admin/projects"),
          api<Project[]>("/api/admin/projects?status=완료"),
        ]);
        setInvoices(rows);
        setProjects([...activeProjects, ...completedProjects]);
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
    projectKind,
    taskPriority,
    taskProject,
    includeClosedProjects,
  ]);
  useEffect(() => {
    // 검색어 입력 중 매 글자마다 요청하지 않도록 짧게 모아서 불러온다.
    const timer = setTimeout(() => void load(), 150);
    return () => clearTimeout(timer);
  }, [load]);
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
  const savePayment = async (invoice: Invoice, form: HTMLFormElement) => {
    const fd = new FormData(form);
    try {
      await api(
        `/api/admin/invoices/${invoice.id}/payments`,
        "POST",
        Object.fromEntries(fd.entries()),
      );
      flash("입금 기록했어요.");
      void load();
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
            <label className="text-xs text-[#71717f]">
              시작 템플릿
              <select name="template_id" className="mt-1.5 block w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm">
                <option value="">빈 프로젝트</option>
                {PROJECT_TEMPLATES.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.tasks.length}개 작업</option>)}
              </select>
            </label>
            <Field name="client" label={newProjectKind === "외주" ? "고객명" : "팀 / 조직"} required />
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
        <div className="admin-toolbar mb-4 flex flex-wrap gap-2">
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
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-black/[0.07] bg-white px-3 text-xs"
          >
            <option value="">진행 중 · 준비 중 · 보류</option>
            {["준비 중", "진행 중", "보류", "완료", "취소"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        {projects.length ? (
          <div className="project-shelf">
            {projects.map((project) => {
              const progress = project.task_count
                ? Math.round(
                    (100 * (Number(project.done_count) || 0)) /
                      Number(project.task_count),
                  )
                : 0;
              return (
                <Link
                  href={`/admin/projects/${project.id}`}
                  key={project.id}
                  className="project-tile"
                  style={{
                    "--project-solid": projectColor(project.id).solid,
                    "--project-soft": projectColor(project.id).soft,
                    "--project-strong": projectColor(project.id).strong,
                  } as React.CSSProperties}
                >
                  <div className="project-tile-top">
                    <div className="project-tile-identity">
                      <span className="project-tile-mark" aria-hidden="true">{project.name.trim().charAt(0)}</span>
                      <div className="min-w-0">
                        <h2 className="truncate">{project.name}</h2>
                        <p className="truncate">{project.client}</p>
                      </div>
                    </div>
                    <div className="project-tile-badges"><span className={`project-kind-badge ${project.kind !== "외주" ? "is-company" : ""}`}>{PROJECT_KIND_LABELS[project.kind]}</span><StatusBadge value={project.status} /></div>
                  </div>
                  <div className="project-tile-progress">
                    {project.next_action && <p className="mb-2 text-xs text-[#5035ba]">다음 · {project.next_action}</p>}
                    {project.waiting_reason && <p className="mb-2 text-xs text-amber-700">대기 · {project.waiting_reason}</p>}
                    {project.next_check_date && <p className={`mb-2 text-xs font-semibold ${project.next_check_date <= today() ? "text-red-700" : "text-blue-700"}`}>{project.next_check_date <= today() ? "확인 필요" : "다음 확인"} · {project.next_check_date}</p>}
                    <div className="flex items-center justify-between gap-3">
                      <span>작업 진행</span>
                      <span>
                        {project.done_count || 0} / {project.task_count || 0}{" "}
                        완료
                      </span>
                    </div>
                    <div className="project-progress-track">
                      <span style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="project-tile-foot">
                    <span>
                      <FiCalendar /> {dateLabel(project.due_date)}
                    </span>
                    {project.kind === "외주" && <span>
                      {project.contract_amount
                        ? won(project.contract_amount)
                        : "금액 미등록"}
                    </span>}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <Empty
            title="프로젝트가 아직 없어요"
            detail="첫 프로젝트를 등록하면 작업 보드와 입금 일정을 함께 관리할 수 있어요."
          />
        )}
        {toast && <Toast text={toast} />}
      </>
    );

  if (section === "tasks")
    return (
      <>
        <PageTitle eyebrow="TASKS" title="작업" />
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
        <div className="admin-toolbar mb-4 flex flex-wrap gap-2">
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
          <label className="task-closed-toggle">
            <input
              type="checkbox"
              checked={includeClosedProjects}
              onChange={(event) =>
                setIncludeClosedProjects(event.target.checked)
              }
            />
            완료 프로젝트 포함
          </label>
        </div>
        {alert}
        {tasks.length && visibleTasks.length ? (
          <div className="task-groups">
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
                      <article key={task.id} className="task-item">
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
        ) : tasks.length ? (
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
            const visibleInvoices =
              paymentFilter === "받을 금액"
                ? receiving
                : paymentFilter === "입금 완료"
                  ? received
                  : invoices;
            const openBalance = receiving.reduce(
              (sum, invoice) => sum + invoice.balance,
              0,
            );
            const receivedTotal = invoices.reduce(
              (sum, invoice) => sum + invoice.paid_amount,
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
                    <span>받은 금액</span>
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
                  <span>{visibleInvoices.length}건</span>
                </div>
                <div className="invoice-list">
                  {visibleInvoices.map((invoice) => (
                    <article key={invoice.id} className="invoice-item">
                      <div className="invoice-item-main">
                        <div className="min-w-0">
                          <Link
                            href={`/admin/projects/${invoice.project_id}`}
                            className="invoice-project"
                          >
                            {invoice.project_name}
                          </Link>
                          <h2>{invoice.title}</h2>
                          <span className="invoice-due">
                            입금 예정 {dateLabel(invoice.due_date)}
                          </span>
                        </div>
                        <div className="invoice-totals">
                          <strong>
                            {invoice.balance > 0
                              ? won(invoice.balance)
                              : "입금 완료"}
                          </strong>
                          <span>
                            {won(invoice.paid_amount)} / {won(invoice.amount)}
                          </span>
                        </div>
                      </div>
                      <div className="invoice-progress">
                        <span
                          style={{
                            width: `${Math.min(100, (100 * invoice.paid_amount) / invoice.amount)}%`,
                          }}
                        />
                      </div>
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
                          <details className="record-payment">
                            <summary>
                              <FiPlus /> 입금 기록
                            </summary>
                            <form
                              onSubmit={(event) => {
                                event.preventDefault();
                                void savePayment(invoice, event.currentTarget);
                              }}
                            >
                              <label>
                                입금액
                                <input
                                  name="amount"
                                  type="number"
                                  min={1}
                                  max={invoice.balance}
                                  step={1}
                                  required
                                  placeholder={`${new Intl.NumberFormat("ko-KR").format(invoice.balance)}원 이하`}
                                />
                              </label>
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
                          </details>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
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
