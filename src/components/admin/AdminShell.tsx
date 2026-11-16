"use client";

import Image from "next/image";
import { Great_Vibes, IBM_Plex_Sans_KR } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  FiBriefcase,
  FiCalendar,
  FiCheckSquare,
  FiCreditCard,
  FiSearch,
  FiExternalLink,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiMic,
  FiMoon,
  FiFileText,
  FiSettings,
  FiSun,
  FiTool,
  FiX,
} from "react-icons/fi";
import CommandPalette, { type Command } from "@/components/admin/CommandPalette";
import UndoTask from "@/components/admin/UndoTask";
import { projectColor } from "@/lib/admin/project-colors";
import { matchesProjectKind, PROJECT_KINDS, type ProjectKind } from "@/lib/admin/project-kinds";
import "./workspace.css";
import "./workspace-dark.css";
import "./redesign.css";

const links = [
  { href: "/admin", label: "홈", icon: FiGrid },
  { href: "/admin/projects", label: "프로젝트", icon: FiBriefcase },
  { href: "/admin/tasks", label: "작업", icon: FiCheckSquare },
  { href: "/admin/meetings", label: "일정", icon: FiCalendar },
  { href: "/admin/money", label: "정산", icon: FiCreditCard },
];

const MONEY_PATHS = ["/admin/money", "/admin/quotes", "/admin/payments"];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  if (href === "/admin/money") return MONEY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  return pathname === href || pathname.startsWith(`${href}/`);
}

const secondaryLinks = [
  { href: "/admin/reports", label: "주간 보고서", icon: FiFileText },
  { href: "/admin/tools", label: "업무 도구", icon: FiTool },
  { href: "/admin/settings", label: "설정", icon: FiSettings },
];

type WorkspaceTheme = "dark" | "light";
const THEME_KEY = "admin-theme";
const THEME_EVENT = "admin:theme-changed";

function readTheme(): WorkspaceTheme {
  try {
    return window.localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function subscribeTheme(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// Meet 홈. "오프라인 회의록" 버튼을 바로 누르는 공식 링크는 없어 홈을 연다.
const MEET_HOME_URL = "https://meet.google.com/";

const signatureFont = Great_Vibes({ weight: "400", subsets: ["latin"], display: "swap" });
const uiFont = IBM_Plex_Sans_KR({ weight: ["400", "500", "600", "700"], subsets: ["latin"], display: "swap", preload: false, variable: "--font-admin-ui" });

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<
    Array<{ id: string; name: string; status: string; kind: ProjectKind }>
  >([]);
  const [projectError, setProjectError] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "dark" as WorkspaceTheme);
  function toggleTheme() {
    try {
      window.localStorage.setItem(THEME_KEY, theme === "dark" ? "light" : "dark");
    } catch {}
    window.dispatchEvent(new Event(THEME_EVENT));
  }
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
  const commands: Command[] = [
    ...[...links, ...secondaryLinks].map((link) => ({ id: link.href, label: link.label, hint: "이동", href: link.href })),
    { id: "board", label: "작업 보드", hint: "보기", href: "/admin/tasks?view=board" },
    { id: "month", label: "월간 일정", hint: "보기", href: "/admin/meetings?view=month" },
    { id: "quotes", label: "견적서", hint: "정산", href: "/admin/money?tab=quotes" },
    { id: "payments", label: "입금", hint: "정산", href: "/admin/money?tab=payments" },
    { id: "new-project", label: "새 프로젝트 만들기", hint: "만들기", href: "/admin/projects?new=1" },
    { id: "report", label: "주간 보고 만들기", hint: "도구", href: "/admin/tools" },
    { id: "trash", label: "휴지통·복구", hint: "도구", href: "/admin/tools?tab=trash" },
    { id: "backup", label: "백업·내보내기", hint: "도구", href: "/admin/tools?tab=export" },
    ...projects.map((project) => ({ id: `p-${project.id}`, label: project.name, hint: `${project.kind} 프로젝트`, href: `/admin/projects/${project.id}` })),
  ];
  const tabs = [
    { href: "/admin", label: "홈", icon: FiGrid },
    { href: "/admin/tasks", label: "작업", icon: FiCheckSquare },
    { href: "/admin/meetings", label: "일정", icon: FiCalendar },
    { href: "/admin/money", label: "정산", icon: FiCreditCard },
  ];
  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/admin";
  }
  return (
    <div data-theme={theme} className={`${uiFont.variable} admin-workspace min-h-screen bg-[#f5f5fa] text-[#30303d]`}>
      <UndoTask />
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
            <Image
              src="/apple-icon.png"
              alt=""
              width={40}
              height={40}
              className="sidebar-brand-mark"
            />
            <span className={`${signatureFont.className} sidebar-signature`}>
              Joowon Kim
            </span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="p-2 text-[#777] lg:hidden"
          >
            <FiX />
          </button>
        </div>
        <button type="button" className="rd-cmdk-trigger" onClick={() => { setOpen(false); setPaletteOpen(true); }}>
          <span className="flex items-center gap-2"><FiSearch size={14} aria-hidden="true" /> 검색·이동</span>
          <kbd>⌘K</kbd>
        </button>
        <nav className="space-y-1">
          {[...links, ...secondaryLinks].map(({ href, label, icon: Icon }) => {
            const divider = href === secondaryLinks[0].href;
            const active = isActive(pathname, href);
            return (
              <div key={href}>
              {divider && <div className="sidebar-nav-divider" aria-hidden="true" />}
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-[#6853d7] text-white" : "text-[#606070] hover:bg-[#f0edff] hover:text-[#5035ba]"}`}
              >
                <Icon size={17} />
                {label}
              </Link>
              </div>
            );
          })}
          <a
            href={MEET_HOME_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Google Meet을 새 탭으로 엽니다. 상단의 '오프라인 회의록'을 눌러 시작하세요."
            className="hidden min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#606070] transition hover:bg-[#f0edff] hover:text-[#5035ba] lg:flex"
          >
            <FiMic size={17} />
            오프라인 회의록
            <FiExternalLink size={13} className="ml-auto opacity-60" aria-hidden="true" />
            <span className="sr-only">(새 탭에서 열림)</span>
          </a>
        </nav>
        <div className="sidebar-project-list">
          {PROJECT_KINDS.map((kind) => <div className="sidebar-projects" key={kind}>
            <div className="sidebar-section-label">
              <span>{kind === "회사" ? "회사 업무" : kind === "개인" ? "개인 프로젝트" : "외주 프로젝트"}</span>
              <Link href={`/admin/projects?kind=${encodeURIComponent(kind)}&new=1`} aria-label={`${kind} 프로젝트 만들기`} onClick={() => setOpen(false)}>+</Link>
            </div>
            {projects.filter((project) => matchesProjectKind(project.kind, kind)).map((project) => (
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
            {!projects.some((project) => matchesProjectKind(project.kind, kind)) && (
              <p>
                {projectError
                  ? "목록을 불러오지 못했어요."
                  : kind === "회사" ? "회사 프로젝트를 추가해보세요." : "프로젝트를 만들면 여기에 표시돼요."}
              </p>
            )}
          </div>)}
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="theme-toggle mt-auto"
          aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
        >
          {theme === "dark" ? <FiSun size={16} /> : <FiMoon size={16} />}
          {theme === "dark" ? "라이트 모드" : "다크 모드"}
        </button>
        <button
          onClick={logout}
          className=" flex items-center gap-3 rounded-lg px-3 py-3 text-left text-[13px] font-medium text-[#777783] hover:bg-white"
        >
          <FiLogOut size={16} /> 로그아웃
        </button>
      </aside>
      <div className="workspace-content min-h-screen lg:pl-[244px]">
        <main className="workspace-main p-3 lg:p-0 lg:pt-3">
          {children}
        </main>
      </div>
      <nav className="rd-tabbar" aria-label="하단 메뉴">
        {tabs.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={isActive(pathname, href) ? "page" : undefined}>
            <Icon size={20} aria-hidden="true" />
            {label}
          </Link>
        ))}
        <button type="button" onClick={() => setOpen(true)} aria-label="메뉴 열기">
          <FiMenu size={20} aria-hidden="true" />
          더보기
        </button>
      </nav>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
    </div>
  );
}
