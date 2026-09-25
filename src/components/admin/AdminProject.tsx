"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PaymentRow from "@/components/admin/PaymentRow";
import MeetingsPage from "@/components/admin/MeetingsPage";
import { projectColor } from "@/lib/admin/project-colors";
import { isInternalProjectKind, PROJECT_KIND_LABELS, type ProjectKind } from "@/lib/admin/project-kinds";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckSquare,
  FiExternalLink,
  FiMoreHorizontal,
  FiPlus,
  FiX,
} from "react-icons/fi";
import { api } from "@/components/admin/api";

type Checklist = Array<{ id: string; text: string; done: boolean }>;
export type Task = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  position: number;
  checklist: Checklist;
  links: Array<{ name: string; url: string }>;
  waiting_since: string | null;
  completed_at: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};
type Invoice = {
  id: string;
  project_id: string;
  title: string;
  amount: number;
  paid_amount: number;
  balance: number;
  due_date: string | null;
  memo: string;
  status: string;
  payments: Array<{
    id: string;
    amount: number;
    paid_at: string;
    memo: string;
  }>;
};
type Project = {
  id: string;
  kind: ProjectKind;
  name: string;
  client: string;
  description: string;
  contact: string;
  email: string;
  status: string;
  start_date: string | null;
  due_date: string | null;
  contract_amount: number | null;
  memo: string;
  links: Array<{ name: string; url: string }>;
  updated_at: string;
  tasks: Task[];
  invoices: Invoice[];
};
const columns = ["할 일", "진행 중", "확인 대기", "완료"];
const won = (n: number) => new Intl.NumberFormat("ko-KR").format(n) + "원";
const dateLabel = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("ko-KR", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
    : "마감 없음";
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
function Input({
  name,
  label,
  type = "text",
  value,
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  value?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-[11px] font-medium text-[#777783]">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={value}
        required={required}
        className="mt-1.5 block w-full rounded-xl border border-black/[0.09] bg-white px-3 py-2.5 text-xs text-[#333341] outline-none focus:border-[#6853d7]"
      />
    </label>
  );
}

export default function AdminProject({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const taskFromQuery = searchParams.get("task");
  const tabFromQuery = searchParams.get("tab");
  const [project, setProject] = useState<Project | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [tab, setTab] = useState(tabFromQuery === "입금" ? "입금" : "보드"),
    [newTask, setNewTask] = useState(false),
    [newTaskStatus, setNewTaskStatus] = useState("할 일"),
    [newInvoice, setNewInvoice] = useState(false),
    [selected, setSelected] = useState<Task | null>(null),
    [toast, setToast] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await api<Project>(`/api/admin/projects/${projectId}`);
      setProject(loaded);
      if (isInternalProjectKind(loaded.kind) && tabFromQuery === "입금") setTab("보드");
      if (taskFromQuery) {
        const selectedTask = loaded.tasks.find(
          (task) => task.id === taskFromQuery,
        );
        if (selectedTask) setSelected(selectedTask);
      }
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "프로젝트를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, taskFromQuery, tabFromQuery]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  const flash = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(""), 2200);
  };
  async function moveTask(task: Task, status: string, beforeTaskId?: string) {
    const old = project;
    if (!old) return;
    if (beforeTaskId === task.id) return;
    if (
      status === "완료" &&
      task.checklist.some((item) => !item.done) &&
      !window.confirm(
        "아직 완료하지 않은 체크리스트가 있습니다. 작업을 완료할까요?",
      )
    )
      return;
    const timestamp = new Date().toISOString();
    const destination = old.tasks
      .filter(
        (item) =>
          !item.archived && item.status === status && item.id !== task.id,
      )
      .sort((a, b) => a.position - b.position);
    const insertion = beforeTaskId
      ? destination.findIndex((item) => item.id === beforeTaskId)
      : destination.length;
    destination.splice(insertion < 0 ? destination.length : insertion, 0, task);
    const newPositions = new Map(
      destination.map((item, index) => [item.id, index]),
    );
    const oldLane = old.tasks
      .filter(
        (item) =>
          !item.archived && item.status === task.status && item.id !== task.id,
      )
      .sort((a, b) => a.position - b.position);
    const oldPositions = new Map(
      oldLane.map((item, index) => [item.id, index]),
    );
    const movedTask = {
      ...task,
      status,
      waiting_since:
        status === "확인 대기"
          ? task.status === "확인 대기"
            ? task.waiting_since
            : timestamp
          : null,
      completed_at:
        status === "완료"
          ? task.status === "완료"
            ? task.completed_at
            : timestamp
          : null,
    };
    setProject({
      ...old,
      tasks: old.tasks.map((item) => {
        if (item.id === task.id)
          return { ...movedTask, position: newPositions.get(task.id) ?? 0 };
        if (item.status === status && newPositions.has(item.id))
          return { ...item, position: newPositions.get(item.id)! };
        if (
          task.status !== status &&
          item.status === task.status &&
          oldPositions.has(item.id)
        )
          return { ...item, position: oldPositions.get(item.id)! };
        return item;
      }),
    });
    try {
      await api(`/api/admin/projects/${old.id}/order`, "POST", {
        taskId: task.id,
        status,
        ...(beforeTaskId ? { beforeTaskId } : {}),
      });
      await load();
    } catch (e) {
      setProject(old);
      setError(e instanceof Error ? e.message : "상태 변경 실패");
    }
  }
  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    try {
      await api(
        `/api/admin/projects/${projectId}/tasks`,
        "POST",
        Object.fromEntries(fd.entries()),
      );
      setNewTask(false);
      flash("작업 추가했어요.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "추가 실패");
    }
  }
  async function createInvoice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    try {
      await api(
        `/api/admin/projects/${projectId}/invoices`,
        "POST",
        Object.fromEntries(fd.entries()),
      );
      setNewInvoice(false);
      flash("청구 일정 추가했어요.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "추가 실패");
    }
  }
  async function payment(
    invoice: Invoice,
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    try {
      await api(
        `/api/admin/invoices/${invoice.id}/payments`,
        "POST",
        Object.fromEntries(fd.entries()),
      );
      flash("입금 기록했어요.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "입금 저장 실패");
    }
  }
  if (loading)
    return (
      <div className="animate-pulse">
        <div className="h-4 w-24 rounded bg-black/5" />
        <div className="mt-4 h-9 w-72 rounded bg-black/5" />
        <div className="mt-8 h-72 rounded-2xl bg-white" />
      </div>
    );
  if (!project)
    return (
      <div>
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-2 text-xs text-[#777783]"
        >
          <FiArrowLeft /> 프로젝트 목록
        </Link>
        <p className="mt-8 text-sm">{error || "프로젝트가 없습니다."}</p>
      </div>
    );
  const done = project.tasks.filter(
      (task) => task.status === "완료" && !task.archived,
    ).length,
    openTasks = project.tasks.filter(
      (task) => task.status !== "완료" && !task.archived,
    ).length,
    unpaid = project.invoices.reduce(
      (sum, invoice) => sum + invoice.balance,
      0,
    );
  const errorBox = error && (
    <div
      role="alert"
      className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700"
    >
      {error}
      <button onClick={() => setError("")} className="float-right">
        닫기
      </button>
    </div>
  );
  return (
    <>
      <Link
        href="/admin/projects"
        className="mb-3 inline-flex items-center gap-2 text-xs font-medium text-[#8b8b98] hover:text-[#5035ba]"
      >
        <FiArrowLeft /> 프로젝트 목록
      </Link>
      {errorBox}
      <div className="project-workspace-header flex flex-wrap items-start justify-between gap-4" style={{
        "--project-solid": projectColor(project.id).solid,
        "--project-soft": projectColor(project.id).soft,
      } as React.CSSProperties}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="project-identity-dot" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#767676]">
              {PROJECT_KIND_LABELS[project.kind]} · {project.client}
            </p>
            <span className="h-1 w-1 rounded-full bg-gray-300" />
            <select
              value={project.status}
              onChange={async (e) => {
                const status = e.target.value;
                setProject({ ...project, status });
                try {
                  const result = await api<{ updated_at: string }>(`/api/admin/projects/${project.id}`, "PATCH", {
                    status,
                  });
                  // 이후 개요 저장 시 수정 충돌로 오인하지 않도록 새 버전을 반영한다.
                  setProject((current) => current && { ...current, status, updated_at: result.updated_at });
                  window.dispatchEvent(new Event("admin:projects-changed"));
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "상태 저장 실패",
                  );
                }
              }}
              className="rounded-full border-0 bg-[#f0edff] px-2.5 py-1 text-[10px] font-semibold text-[#5035ba] outline-none"
            >
              {["준비 중", "진행 중", "보류", "완료", "취소"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            {project.name}
          </h1>
          <p
            className="mt-1 max-w-2xl truncate text-xs leading-5 text-[#606060]"
            title={project.description}
          >
            {project.description}
          </p>
        </div>
        <div className="flex gap-2">
          {project.kind === "외주" && <Link
            href={`/admin/quotes?project=${project.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold"
          >
            견적서
          </Link>}
          <button
            onClick={() => {
              setNewTaskStatus("할 일");
              setNewTask(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6853d7] px-4 py-2.5 text-xs font-semibold text-white"
          >
            <FiPlus /> 작업 추가
          </button>
          {project.kind === "외주" && <button
            onClick={() => setTab("입금")}
            className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold"
          >
            입금 일정
          </button>}
        </div>
      </div>
      <div
        className={`workspace-metrics mt-3 grid grid-cols-2 ${project.kind === "외주" ? "lg:grid-cols-4" : "lg:grid-cols-2"} ${tab === "보드" ? "project-board-summary" : ""}`}
      >
        <Stat
          label="작업 진행"
          value={`${done} / ${done + openTasks}`}
          sub="완료된 작업"
        />
        <Stat
          label="마감일"
          value={dateLabel(project.due_date)}
          sub={
            project.due_date && project.due_date < today()
              ? "마감일 지남"
              : "프로젝트 마감"
          }
        />
        {project.kind === "외주" && <Stat
          label="계약 금액"
          value={
            project.contract_amount ? won(project.contract_amount) : "미등록"
          }
          sub="계약 기준 금액"
        />}
        {project.kind === "외주" && <Stat label="미입금" value={won(unpaid)} sub="청구 항목 잔액" />}
      </div>
      <div className="mt-3 flex gap-1 overflow-x-auto border-b border-black/[0.07]">
        {(isInternalProjectKind(project.kind) ? ["보드", "개요", "미팅", "링크·메모"] : ["보드", "개요", "미팅", "입금", "링크·메모"]).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-semibold ${tab === item ? "border-[#6853d7] text-[#5035ba]" : "border-transparent text-[#9999a4] hover:text-[#555565]"}`}
          >
            {item}
          </button>
        ))}
      </div>
      {tab === "보드" && (
        <section className="mt-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-[#737382]">
                카드를 옮기거나 상태 메뉴를 사용하세요.
              </p>
            </div>
            <span className="text-[11px] text-[#9b9ba7]">
              {openTasks}개 진행 중
            </span>
          </div>
          <div className="project-kanban grid grid-flow-col auto-cols-[minmax(270px,1fr)] items-start gap-3 overflow-x-auto pb-3 lg:auto-cols-auto lg:grid-flow-row lg:grid-cols-4">
            {columns.map((column) => {
              const lane = project.tasks
                .filter((task) => task.status === column && !task.archived)
                .sort((a, b) => a.position - b.position);
              return (
                <div
                  key={column}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const taskId = e.dataTransfer.getData("text/task");
                    const task = project.tasks.find(
                      (item) => item.id === taskId,
                    );
                    if (task) void moveTask(task, column);
                  }}
                  className="min-h-[260px] rounded-lg border border-black/[0.04] bg-[#f7f8fc] p-2"
                >
                  <div className="flex items-center justify-between px-1 pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${column === "완료" ? "bg-emerald-500" : column === "확인 대기" ? "bg-orange-400" : column === "진행 중" ? "bg-blue-500" : "bg-gray-400"}`}
                      />
                      <span className="text-xs font-semibold">{column}</span>
                      <span className="text-[10px] text-[#767676]">
                        {lane.length}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setNewTaskStatus(column);
                        setNewTask(true);
                      }}
                      aria-label={`${column} 작업 추가`}
                      className="rounded-lg p-1.5 text-[#93939e] hover:bg-white"
                    >
                      <FiPlus />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {lane.map((task) => (
                      <article
                        key={task.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/task", task.id);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const draggedId = e.dataTransfer.getData("text/task");
                          const dragged = project.tasks.find(
                            (item) => item.id === draggedId,
                          );
                          if (dragged) void moveTask(dragged, column, task.id);
                        }}
                        onClick={() => setSelected(task)}
                        className="cursor-pointer rounded-xl border border-black/[0.045] bg-white p-3.5 shadow-[0_2px_7px_rgba(30,30,50,0.025)] hover:border-[#d7d5f8]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-base font-semibold leading-6">
                            {task.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(task);
                            }}
                            aria-label="작업 상세"
                            className="shrink-0 text-[#aaaab3]"
                          >
                            <FiMoreHorizontal />
                          </button>
                        </div>
                        {task.description && (
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#767676]">
                            {task.description}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {task.due_date && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[9px] ${task.due_date < today() && column !== "완료" ? "bg-red-50 text-red-600" : "bg-[#f5f5f8] text-[#777783]"}`}
                            >
                              <FiCalendar />
                              {dateLabel(task.due_date)}
                            </span>
                          )}
                          <span className="rounded-md bg-[#f5f5f8] px-1.5 py-1 text-[9px] text-[#777783]">
                            우선순위 {task.priority}
                          </span>
                          {task.checklist.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[9px] text-[#858591]">
                              <FiCheckSquare />
                              {
                                task.checklist.filter((item) => item.done)
                                  .length
                              }
                              /{task.checklist.length}
                            </span>
                          )}
                        </div>
                        {column === "확인 대기" && task.waiting_since && (
                          <p className="mt-2 text-[9px] text-orange-600">
                            {Math.max(
                              0,
                              Math.floor(
                                (Date.now() -
                                  new Date(task.waiting_since).getTime()) /
                                  86400000,
                              ),
                            )}
                            일째 기다리는 중
                          </p>
                        )}
                        <div
                          className="mt-3 border-t border-black/[0.05] pt-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={column}
                            onChange={(e) =>
                              void moveTask(task, e.target.value)
                            }
                            className="w-full bg-transparent text-[10px] text-[#858591] outline-none"
                          >
                            {columns.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </article>
                    ))}
                  </div>
                  {lane.length === 0 && (
                    <button
                      onClick={() => setNewTask(true)}
                      className="flex w-full items-center justify-center rounded-xl border border-dashed border-black/10 py-7 text-[10px] text-[#767676] hover:bg-white/60"
                    >
                      작업 추가
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
      {tab === "개요" && (
        <ProjectOverview
          project={project}
          onSave={async (body) => {
            try {
              await api(`/api/admin/projects/${project.id}`, "PATCH", { ...body, expected_updated_at: project.updated_at });
              window.dispatchEvent(new Event("admin:projects-changed"));
              flash("프로젝트 정보 저장했어요.");
              await load();
            } catch (e) {
              setError(e instanceof Error ? e.message : "저장 실패");
            }
          }}
        />
      )}
      {tab === "미팅" && <MeetingsPage key={project.id} initialProjectId={project.id} embedded />}
      {tab === "입금" && project.kind === "외주" && (
        <section className="mt-5">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-sm font-semibold">청구 및 입금</h2>
              <p className="mt-1 text-[11px] text-[#767676]">
                청구 항목별로 나눠 기록합니다.
              </p>
            </div>
            <button
              onClick={() => setNewInvoice(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold"
            >
              <FiPlus /> 청구 추가
            </button>
          </div>
          {newInvoice && (
            <form
              onSubmit={createInvoice}
              className="mb-4 grid gap-3 rounded-2xl border border-[#efb8ba] bg-white p-4 sm:grid-cols-4"
            >
              <Input name="title" label="항목명" required />
              <Input name="amount" label="금액 (원)" type="number" required />
              <Input name="due_date" label="입금 예정일" type="date" />
              <Input name="memo" label="메모" />
              <div className="sm:col-span-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewInvoice(false)}
                  className="rounded-lg px-3 py-2 text-xs"
                >
                  취소
                </button>
                <button className="rounded-lg bg-[#303030] px-4 py-2 text-xs font-semibold text-white">
                  청구 저장
                </button>
              </div>
            </form>
          )}
          {project.invoices.length ? (
            <div className="space-y-3">
              {project.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="rounded-2xl border border-black/[0.055] bg-white p-5"
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">{invoice.title}</h3>
                      <p className="mt-1 text-[11px] text-[#9999a5]">
                        예정 {dateLabel(invoice.due_date)} · 청구{" "}
                        {won(invoice.amount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {won(invoice.balance)} 남음
                      </p>
                      <p className="mt-1 text-[10px] text-[#8b8b98]">
                        {invoice.status}
                      </p>
                    </div>
                  </div>
                  {invoice.payments.map((payment) => (
                    <PaymentRow
                      key={payment.id}
                      payment={payment}
                      onChanged={load}
                      onError={setError}
                    />
                  ))}
                  {invoice.balance > 0 && (
                    <form
                      onSubmit={(e) => void payment(invoice, e)}
                      className="mt-4 grid gap-2 border-t border-black/[0.05] pt-4 sm:grid-cols-4"
                    >
                      <Input
                        name="amount"
                        label="이번 입금액"
                        type="number"
                        required
                      />
                      <Input
                        name="paid_at"
                        label="입금일"
                        type="date"
                        value={today()}
                      />
                      <Input name="memo" label="메모" />
                      <div className="flex items-end">
                        <button className="w-full rounded-xl bg-[#303030] px-4 py-2.5 text-xs font-semibold text-white">
                          입금 기록
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-black/10 py-12 text-center text-xs text-[#767676]">
              등록한 청구 항목이 없습니다.
            </div>
          )}
        </section>
      )}
      {tab === "링크·메모" && (
        <ProjectLinks
          project={project}
          onSave={async (body) => {
            try {
              await api(`/api/admin/projects/${project.id}`, "PATCH", { ...body, expected_updated_at: project.updated_at });
              flash("저장했어요.");
              await load();
            } catch (e) {
              setError(e instanceof Error ? e.message : "저장 실패");
            }
          }}
        />
      )}
      {newTask && (
        <Modal title="새 작업" close={() => setNewTask(false)}>
          <form onSubmit={createTask} className="space-y-3">
            <Input name="title" label="작업 제목" required />
            <label className="block text-[11px] font-medium text-[#777783]">
              설명
              <textarea
                name="description"
                rows={3}
                className="mt-1.5 block w-full rounded-xl border border-black/[0.09] px-3 py-2.5 text-xs outline-none focus:border-[#6853d7]"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-[11px] font-medium text-[#777783]">
                상태
                <select
                  name="status"
                  defaultValue={newTaskStatus}
                  className="mt-1.5 block w-full rounded-xl border border-black/[0.09] bg-white px-3 py-2.5 text-xs"
                >
                  {columns.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-medium text-[#777783]">
                우선순위
                <select
                  name="priority"
                  className="mt-1.5 block w-full rounded-xl border border-black/[0.09] bg-white px-3 py-2.5 text-xs"
                >
                  <option>보통</option>
                  <option>높음</option>
                  <option>낮음</option>
                </select>
              </label>
            </div>
            <Input name="due_date" label="마감일" type="date" />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewTask(false)}
                className="rounded-xl px-4 py-2.5 text-xs"
              >
                취소
              </button>
              <button className="rounded-xl bg-[#303030] px-4 py-2.5 text-xs font-semibold text-white">
                작업 만들기
              </button>
            </div>
          </form>
        </Modal>
      )}
      {selected && (
        <TaskEditor
          task={
            project.tasks.find((item) => item.id === selected.id) || selected
          }
          close={() => setSelected(null)}
          refresh={load}
          onError={setError}
          onToast={flash}
        />
      )}
      {toast && (
        <div className="fixed bottom-5 right-5 rounded-xl bg-[#24243b] px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.055] bg-white p-4 sm:p-5">
      <p className="text-[10px] text-[#92929f]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="sr-only">{sub}</p>
    </div>
  );
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="workspace-drawer"
      aria-label={title}
      onCancel={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        onClick={(e) => e.stopPropagation()}
        className="min-h-full p-5 sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            onClick={close}
            aria-label="상세 닫기"
            className="rounded-lg p-2 text-[#777783]"
          >
            <FiX />
          </button>
        </div>
        {children}
      </section>
    </dialog>
  );
}

export function TaskEditor({
  task,
  close,
  refresh,
  onError,
  onToast,
}: {
  task: Task;
  close: () => void;
  refresh: () => Promise<void>;
  onError: (v: string) => void;
  onToast: (v: string) => void;
}) {
  const [checkText, setCheckText] = useState("");
  async function update(body: Record<string, unknown>) {
    try {
      await api(`/api/admin/tasks/${task.id}`, "PATCH", { ...body, expected_updated_at: task.updated_at });
      await refresh();
      onToast("작업 업데이트했어요.");
    } catch (e) {
      onError(e instanceof Error ? e.message : "작업 수정 실패");
    }
  }
  async function checklist(
    action: "add" | "toggle" | "delete",
    item?: { id: string; text: string; done: boolean },
  ) {
    try {
      if (action === "add") {
        await api(`/api/admin/tasks/${task.id}/checklist`, "POST", {
          text: checkText,
        });
        setCheckText("");
      } else
        await api(`/api/admin/tasks/${task.id}/checklist`, "PATCH", {
          action,
          id: item?.id,
        });
      await refresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : "체크리스트 저장 실패");
    }
  }
  return (
    <Modal title="작업 상세" close={close}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          void update(Object.fromEntries(fd.entries()));
        }}
        className="space-y-4"
      >
        <Input name="title" label="작업 제목" value={task.title} required />
        <label className="block text-[11px] font-medium text-[#777783]">
          설명
          <textarea
            name="description"
            defaultValue={task.description}
            rows={4}
            className="mt-1.5 block w-full rounded-xl border border-black/[0.09] px-3 py-2.5 text-xs outline-none focus:border-[#6853d7]"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[11px] font-medium text-[#777783]">
            상태
            <select
              name="status"
              defaultValue={task.status}
              className="mt-1.5 block w-full rounded-xl border border-black/[0.09] bg-white px-3 py-2.5 text-xs"
            >
              {columns.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-medium text-[#777783]">
            우선순위
            <select
              name="priority"
              defaultValue={task.priority}
              className="mt-1.5 block w-full rounded-xl border border-black/[0.09] bg-white px-3 py-2.5 text-xs"
            >
              {["낮음", "보통", "높음"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        <Input
          name="due_date"
          label="마감일"
          type="date"
          value={task.due_date || ""}
        />
        <div>
          <p className="mb-2 text-[11px] font-semibold text-[#777783]">
            체크리스트
          </p>
          <div className="space-y-1">
            {task.checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#f7f7f9]"
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => void checklist("toggle", item)}
                />
                <span
                  className={`flex-1 text-xs ${item.done ? "text-[#767676] line-through" : "text-[#4e4e5c]"}`}
                >
                  {item.text}
                </span>
                <button
                  type="button"
                  onClick={() => void checklist("delete", item)}
                  className="px-1 text-[10px] text-[#a5a5af]"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={checkText}
              onChange={(e) => setCheckText(e.target.value)}
              placeholder="체크할 항목 추가"
              className="min-w-0 flex-1 rounded-lg border border-black/10 px-3 py-2 text-xs outline-none"
            />
            <button
              type="button"
              onClick={() => void checklist("add")}
              className="rounded-lg border border-black/10 px-3 text-xs"
            >
              추가
            </button>
          </div>
        </div>
        <div className="flex justify-between border-t border-black/[0.05] pt-4">
          <button
            type="button"
            onClick={async () => {
              await api(`/api/admin/tasks/${task.id}`, "DELETE");
              onToast("작업 보관했어요.");
              await refresh();
              close();
            }}
            className="text-xs text-red-600"
          >
            작업 보관
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={close}
              className="rounded-xl px-3 py-2 text-xs"
            >
              닫기
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#303030] px-4 py-2 text-xs font-semibold text-white"
            >
              저장
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function ProjectOverview({
  project,
  onSave,
}: {
  project: Project;
  onSave: (v: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onSave(
          Object.fromEntries(new FormData(e.currentTarget).entries()),
        );
      }}
      className="mt-5 grid gap-4 rounded-2xl border border-black/[0.055] bg-white p-5 sm:grid-cols-2"
    >
      <Input name="name" label="프로젝트명" value={project.name} required />
      <Input name="client" label={isInternalProjectKind(project.kind) ? "팀 / 조직" : "고객명"} value={project.client} required />
      <Input name="contact" label="연락처" value={project.contact} />
      <Input name="email" label="이메일" value={project.email} />
      <Input
        name="start_date"
        label="시작일"
        type="date"
        value={project.start_date || ""}
      />
      <Input
        name="due_date"
        label="마감일"
        type="date"
        value={project.due_date || ""}
      />
      {project.kind === "외주" && <Input
        name="contract_amount"
        label="계약 금액 (원)"
        type="number"
        value={project.contract_amount ? String(project.contract_amount) : ""}
      />}
      <label className="text-[11px] font-medium text-[#777783]">
        설명
        <textarea
          name="description"
          defaultValue={project.description}
          rows={3}
          className="mt-1.5 block w-full rounded-xl border border-black/[0.09] px-3 py-2.5 text-xs"
        />
      </label>
      <div className="sm:col-span-2 flex justify-end">
        <button className="rounded-xl bg-[#303030] px-4 py-2.5 text-xs font-semibold text-white">
          프로젝트 정보 저장
        </button>
      </div>
    </form>
  );
}
function ProjectLinks({
  project,
  onSave,
}: {
  project: Project;
  onSave: (v: Record<string, unknown>) => Promise<void>;
}) {
  const [memo, setMemo] = useState(project.memo),
    [links, setLinks] = useState(project.links || []),
    [name, setName] = useState(""),
    [url, setUrl] = useState("");
  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-black/[0.055] bg-white p-5">
        <h2 className="text-sm font-semibold">프로젝트 링크</h2>
        <div className="mt-3 space-y-2">
          {links.map((link, index) => (
            <div
              key={`${link.url}-${index}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f7f9] px-3 py-3"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 truncate text-xs font-medium text-[#5035ba]"
              >
                {link.name || link.url}
                <FiExternalLink className="ml-1 inline" />
              </a>
              <button
                onClick={() => setLinks(links.filter((_, i) => i !== index))}
                className="text-[10px] text-red-600"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name && url) {
              setLinks([...links, { name, url }]);
              setName("");
              setUrl("");
            }
          }}
          className="mt-4 grid gap-2"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="링크 이름"
            className="rounded-xl border border-black/10 px-3 py-2 text-xs"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            type="url"
            className="rounded-xl border border-black/10 px-3 py-2 text-xs"
          />
          <button className="rounded-xl border border-black/10 py-2 text-xs">
            링크 추가
          </button>
        </form>
      </section>
      <section className="rounded-2xl border border-black/[0.055] bg-white p-5">
        <h2 className="text-sm font-semibold">메모</h2>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={10}
          placeholder="계약, 회의, 참고할 내용을 적어두세요."
          className="mt-4 w-full resize-y rounded-xl border border-black/[0.09] px-3 py-3 text-xs leading-5 outline-none focus:border-[#6853d7]"
        />
        <button
          onClick={() => void onSave({ memo, links })}
          className="mt-3 w-full rounded-xl bg-[#303030] py-2.5 text-xs font-semibold text-white"
        >
          저장
        </button>
      </section>
    </div>
  );
}
