"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/components/admin/api";
import type { Meeting } from "./MeetingsPage";
import AiUsageCard from "./AiUsageCard";
import { shortDate, won } from "./redesign-utils";

type Invoice = { amount: number; paid_amount: number; balance: number };

export default function ProjectAside({
  projectId,
  isClient,
  contractAmount,
  invoices,
  onOpenPayments,
  aiFolder,
  onAiFolderSaved,
}: {
  projectId: string;
  isClient: boolean;
  contractAmount: number | null;
  invoices: Invoice[];
  onOpenPayments: () => void;
  aiFolder: string;
  onAiFolderSaved: (folder: string, updatedAt: string) => void;
}) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  useEffect(() => {
    let active = true;
    api<Meeting[]>(`/api/admin/meetings?project=${encodeURIComponent(projectId)}`)
      .then((rows) => active && setMeetings(rows))
      .catch(() => active && setMeetings([]));
    return () => {
      active = false;
    };
  }, [projectId]);

  const billed = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paid = invoices.reduce((sum, invoice) => sum + invoice.paid_amount, 0);
  const remaining = invoices.reduce((sum, invoice) => sum + invoice.balance, 0);
  const base = contractAmount || billed;
  const recent = [...meetings]
    .sort((a, b) => `${b.meeting_date}${b.start_time}`.localeCompare(`${a.meeting_date}${a.start_time}`))
    .slice(0, 3);

  return (
    <aside className="rd-side">
      {isClient && (
        <section className="rd-card rd-card-pad">
          <h2>정산 요약</h2>
          <div className="rd-line"><span>계약</span><span>{contractAmount ? won(contractAmount) : "미등록"}</span></div>
          <div className="rd-line"><span>입금</span><span>{won(paid)}</span></div>
          <span className="rd-progress rd-progress-lg"><span style={{ width: `${base ? Math.min(100, (100 * paid) / base) : 0}%` }} /></span>
          <div className="rd-line rd-line-strong"><span>남은 금액</span><b>{won(remaining)}</b></div>
          <button type="button" className="rd-more rd-link-btn" onClick={onOpenPayments}>견적·입금 보기 →</button>
        </section>
      )}
      <AiUsageCard projectId={projectId} folder={aiFolder} onSaved={onAiFolderSaved} />
      <section className="rd-card rd-card-pad">
        <h2>최근 미팅</h2>
        {recent.map((meeting) => (
          <Link key={meeting.id} href={`/admin/meetings?view=list&meeting=${meeting.id}`} className="rd-recent">
            <span className="rd-eyebrow">{shortDate(meeting.meeting_date)}</span>
            <span>{meeting.title}</span>
            {meeting.decisions && <small>{meeting.decisions.split("\n")[0]}</small>}
          </Link>
        ))}
        {recent.length === 0 && <p className="rd-eyebrow">아직 미팅 기록이 없어요.</p>}
      </section>
    </aside>
  );
}
