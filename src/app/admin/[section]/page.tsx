import { notFound } from "next/navigation";
import { FiCalendar, FiColumns, FiList } from "react-icons/fi";
import AdminView from "@/components/admin/AdminView";
import QuotesPage from "@/components/admin/QuotesPage";
import PaymentsView from "@/components/admin/PaymentsView";
import MoneyOverview from "@/components/admin/MoneyOverview";
import MeetingsPage from "@/components/admin/MeetingsPage";
import TasksList from "@/components/admin/TasksList";
import ScheduleView from "@/components/admin/ScheduleView";
import WorkBoard from "@/components/admin/WorkBoard";
import WorkspaceTools, { type ToolsTab } from "@/components/admin/WorkspaceTools";
import ViewSwitch from "@/components/admin/ViewSwitch";
import { isProjectKind } from "@/lib/admin/project-kinds";

const sections = ["projects", "tasks", "meetings", "money", "quotes", "payments", "settings", "tools"];

type Query = { new?: string; project?: string; kind?: string; meeting?: string; quote?: string; view?: string; tab?: string };

function HubBar({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rd-hub-bar">
      <h1>{title}</h1>
      {children}
    </div>
  );
}

export default async function AdminSection({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Query>;
}) {
  const [{ section }, query] = await Promise.all([params, searchParams]);
  if (!sections.includes(section)) notFound();
  if (section === "tools") {
    const tab: ToolsTab = query.tab === "search" || query.tab === "trash" || query.tab === "export" ? query.tab : "report";
    return (
      <div className="rd-hub-page">
        <HubBar title="업무 도구">
          <ViewSwitch
            label="업무 도구"
            current={tab}
            options={[
              { value: "report", label: "주간 보고", href: "/admin/tools" },
              { value: "search", label: "통합 검색", href: "/admin/tools?tab=search" },
              { value: "trash", label: "휴지통·복구", href: "/admin/tools?tab=trash" },
              { value: "export", label: "백업", href: "/admin/tools?tab=export" },
            ]}
          />
        </HubBar>
        <WorkspaceTools key={tab} tab={tab} />
      </div>
    );
  }

  if (section === "tasks") {
    const view = query.view === "board" || query.view === "calendar" ? query.view : "list";
    return (
      <div className="rd-hub-page">
        <HubBar title="작업">
          <ViewSwitch
            label="작업 보기 방식"
            current={view}
            options={[
              { value: "list", label: "리스트", href: "/admin/tasks", icon: <FiList aria-hidden="true" /> },
              { value: "board", label: "보드", href: "/admin/tasks?view=board", icon: <FiColumns aria-hidden="true" /> },
              { value: "calendar", label: "캘린더", href: "/admin/tasks?view=calendar", icon: <FiCalendar aria-hidden="true" /> },
            ]}
          />
        </HubBar>
        {view === "list" ? <TasksList /> : view === "board" ? <WorkBoard key="board" initialView="board" title="작업 보드" /> : <ScheduleView mode="month" />}
      </div>
    );
  }

  if (section === "meetings") {
    const view = query.view === "month" ? "month" : query.view === "list" || query.meeting ? "list" : "week";
    return (
      <div className="rd-hub-page">
        <HubBar title="일정">
          <ViewSwitch
            label="일정 보기 방식"
            current={view}
            options={[
              { value: "week", label: "주", href: "/admin/meetings", icon: <FiCalendar aria-hidden="true" /> },
              { value: "month", label: "월", href: "/admin/meetings?view=month", icon: <FiCalendar aria-hidden="true" /> },
              { value: "list", label: "미팅 목록", href: "/admin/meetings?view=list", icon: <FiList aria-hidden="true" /> },
            ]}
          />
        </HubBar>
        {view !== "list" ? (
          <ScheduleView key={view} mode={view} />
        ) : (
          <MeetingsPage key={`${query.project || "all"}:${query.meeting || "list"}`} initialProjectId={query.project || ""} initialMeetingId={query.meeting || ""} />
        )}
      </div>
    );
  }

  if (section === "money" || section === "quotes" || section === "payments") {
    const tab =
      section === "payments" || query.tab === "payments"
        ? "payments"
        : section === "quotes" || query.tab === "quotes" || query.quote
          ? "quotes"
          : "overview";
    return (
      <div className="rd-hub-page">
        <HubBar title="정산">
          <ViewSwitch
            label="정산 화면"
            current={tab}
            options={[
              { value: "overview", label: "한눈에", href: "/admin/money" },
              { value: "quotes", label: "견적서", href: "/admin/money?tab=quotes" },
              { value: "payments", label: "입금", href: "/admin/money?tab=payments" },
            ]}
          />
        </HubBar>
        {tab === "overview" ? (
          <MoneyOverview />
        ) : tab === "payments" ? (
          <PaymentsView />
        ) : (
          <QuotesPage key={`${query.project || "all"}:${query.quote || "list"}`} initialProjectId={query.project || ""} initialQuoteId={query.quote || ""} />
        )}
      </div>
    );
  }

  return (
    <AdminView
      key={section === "projects" ? `${query.kind || "all"}:${query.new || "list"}` : section}
      section={section as "projects" | "settings"}
      initialCreateProject={section === "projects" && query.new === "1"}
      initialProjectKind={query.kind && isProjectKind(query.kind) ? query.kind : ""}
    />
  );
}
