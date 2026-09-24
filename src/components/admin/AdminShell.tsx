"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  FiBriefcase,
  FiCheckSquare,
  FiCreditCard,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiUsers,
  FiFileText,
  FiSettings,
  FiX,
} from "react-icons/fi";
import RecoveryManager from "@/components/admin/RecoveryManager";
import { projectColor } from "@/lib/admin/project-colors";
import "./workspace.css";

const links = [
  { href: "/admin", label: "내 작업 보드", icon: FiGrid },
  { href: "/admin/projects", label: "프로젝트", icon: FiBriefcase },
  { href: "/admin/tasks", label: "작업", icon: FiCheckSquare },
  { href: "/admin/meetings", label: "미팅", icon: FiUsers },
  { href: "/admin/quotes", label: "견적서", icon: FiFileText },
  { href: "/admin/payments", label: "입금", icon: FiCreditCard },
  { href: "/admin/settings", label: "설정", icon: FiSettings },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<
    Array<{ id: string; name: string; status: string; kind: "외주" | "회사" }>
  >([]);
  const [projectError, setProjectError] = useState(false);
  useEffect(() => {
    let active = true;
    async function refreshProjects() {
      try {
        const response = await fetch("/api/admin/projects");
        if (!response.ok) throw new Error("projects");
        const rows = await response.json();
        if (active) {
          setProjects(rows);
          setProjectError(false);
        }
      } catch {
        if (active) setProjectError(true);
      }
    }
    void refreshProjects();
    window.addEventListener("focus", refreshProjects);
    window.addEventListener("admin:projects-changed", refreshProjects);
    return () => {
      active = false;
      window.removeEventListener("focus", refreshProjects);
      window.removeEventListener("admin:projects-changed", refreshProjects);
    };
  }, []);
  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/admin";
  }
  return (
    <div className="admin-workspace min-h-screen bg-[#f5f5fa] text-[#30303d]">
      {open && (
        <button
          aria-label="메뉴 닫기"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
        />
      )}
      <aside
        className={`workspace-sidebar fixed inset-y-0 left-0 z-40 flex w-[224px] flex-col bg-white px-3 py-4 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-2 pb-5 pt-1">
          <Link
            href="/admin"
            className="flex items-center gap-3"
            onClick={() => setOpen(false)}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6853d7] text-sm font-bold text-white">
              JK
            </span>
            <span>
              <span className="block text-base font-semibold tracking-tight">
                내 작업실
              </span>
            </span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="p-2 text-[#777] lg:hidden"
          >
            <FiX />
          </button>
        </div>
        <nav className="space-y-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/admin"
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-[#6853d7] text-white" : "text-[#606070] hover:bg-[#f0edff] hover:text-[#5035ba]"}`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>
        {(["외주", "회사"] as const).map((kind) => <div className="sidebar-projects" key={kind}>
          <div className="sidebar-section-label">
            <span>{kind === "회사" ? "회사 업무" : "외주 프로젝트"}</span>
            <Link href={`/admin/projects?kind=${encodeURIComponent(kind)}&new=1`} aria-label={`${kind} 프로젝트 만들기`} onClick={() => setOpen(false)}>+</Link>
          </div>
          {projects.filter((project) => project.kind === kind).map((project) => (
            <Link
              key={project.id}
              href={`/admin/projects/${project.id}`}
              onClick={() => setOpen(false)}
              aria-current={
                pathname === `/admin/projects/${project.id}`
                  ? "page"
                  : undefined
              }
            >
              <span
                className={`project-dot ${project.status === "보류" ? "is-paused" : ""}`}
                style={project.status === "보류" ? undefined : { backgroundColor: projectColor(project.id).solid }}
              />
              <span className="truncate">{project.name}</span>
            </Link>
          ))}
          {!projects.some((project) => project.kind === kind) && (
            <p>
              {projectError
                ? "목록을 불러오지 못했어요."
                : kind === "회사" ? "회사 프로젝트를 추가해보세요." : "프로젝트를 만들면 여기에 표시돼요."}
            </p>
          )}
        </div>)}
        <button
          onClick={logout}
          className="mt-auto flex items-center gap-3 rounded-lg px-3 py-3 text-left text-[13px] font-medium text-[#777783] hover:bg-white"
        >
          <FiLogOut size={16} /> 로그아웃
        </button>
      </aside>
      <div className="workspace-content min-h-screen lg:pl-[244px]">
        <main className="workspace-main p-3 lg:p-0 lg:pt-3">
          {children}
          {pathname === "/admin/settings" && <RecoveryManager />}
        </main>
      </div>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="메뉴 열기"
          className="workspace-mobile-menu fixed bottom-5 right-5 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-[#6853d7] text-white shadow-lg lg:hidden"
        >
          <FiMenu size={20} />
        </button>
      )}
    </div>
  );
}
