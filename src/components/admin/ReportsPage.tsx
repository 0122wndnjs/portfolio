"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

type Project = { id: string; name: string; kind: string; status: string; updated_at: string; weekly_report: boolean; report_name: string; report_title: string; repo_full_name: string; repo_branch: string };
type Report = { id: string; project_id: string; project_name: string; week_start: string; name: string; status: string; error: string | null; updated_at: string };

const STATUS: Record<string, string> = { generating: "만드는 중", review: "검토 대기", confirmed: "확정", failed: "실패" };

export default function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const fetchAll = () => Promise.all([api<Project[]>("/api/admin/projects?status=전체"), api<Report[]>("/api/admin/reports")]);
  const apply = useCallback(([p, r]: [Project[], Report[]]) => {
    setProjects(p.filter((x) => (x.kind === "외주" || x.kind === "개인") && ["준비 중", "진행 중", "보류"].includes(x.status)));
    setReports(r);
  }, []);
  const load = () => fetchAll().then(apply);
  useEffect(() => { fetchAll().then(apply).catch((e) => setMessage(e.message)); }, [apply]);

  async function save(p: Project, patch: Partial<Project>) {
    setMessage("");
    try {
      await api(`/api/admin/projects/${p.id}`, "PATCH", { ...patch, expected_updated_at: p.updated_at });
      await load();
    } catch (e) { setMessage((e as Error).message); await load(); }
  }

  async function generate(projectId: string) {
    setBusy(projectId); setMessage("레포와 작업 기록을 분석하고 있어요. 1~2분 걸려요.");
    try {
      const r = await api<{ id: string }>("/api/admin/reports/generate", "POST", { project_id: projectId });
      window.location.href = `/admin/reports/${r.id}`;
    } catch (e) { setMessage((e as Error).message); await load(); }
    finally { setBusy(""); }
  }

  return (
    <div className="reports">
      <header className="reports-head">
        <h1>주간 보고서</h1>
        <p>매주 월요일 00:00에 보고서를 켠 프로젝트의 지난주 보고서를 만들어요. 고객 전달은 검토·확정 후 직접 해 주세요.</p>
      </header>
      {message && <p className="reports-msg" role="status">{message}</p>}

      <section>
        <h2>프로젝트 설정 <small>외주·개인</small></h2>
        <div className="reports-table">
          <table>
            <thead><tr><th>보고서</th><th>프로젝트</th><th>짧은 이름</th><th>보고서 프로젝트명</th><th>레포 (owner/repo)</th><th>브랜치</th><th /></tr></thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id + p.updated_at}>
                  <td><input type="checkbox" aria-label={`${p.name} 보고서 생성`} checked={!!p.weekly_report} onChange={(e) => save(p, { weekly_report: e.target.checked })} /></td>
                  <td>{p.name}</td>
                  <td><input defaultValue={p.report_name} placeholder="팅클리닉" onBlur={(e) => e.target.value !== p.report_name && save(p, { report_name: e.target.value.trim() })} /></td>
                  <td><input defaultValue={p.report_title} placeholder="TING CLINIC 시스템 고도화" onBlur={(e) => e.target.value !== p.report_title && save(p, { report_title: e.target.value.trim() })} /></td>
                  <td><input defaultValue={p.repo_full_name} placeholder="owner/repo" onBlur={(e) => e.target.value !== p.repo_full_name && save(p, { repo_full_name: e.target.value.trim() })} /></td>
                  <td><input defaultValue={p.repo_branch || "main"} onBlur={(e) => e.target.value !== p.repo_branch && save(p, { repo_branch: e.target.value.trim() || "main" })} style={{ width: 90 }} /></td>
                  <td><button type="button" disabled={!!busy} onClick={() => generate(p.id)}>{busy === p.id ? "만드는 중…" : "지난주 만들기"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>보고서</h2>
        {!reports.length && <p className="reports-empty">아직 만든 보고서가 없어요.</p>}
        <ul className="reports-list">
          {reports.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/reports/${r.id}`}>{r.name}</Link>
              <span className={`reports-status s-${r.status}`}>{STATUS[r.status] ?? r.status}</span>
              {r.error && <small title={r.error}>{r.error.slice(0, 80)}</small>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
