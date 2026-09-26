"use client";
import { useEffect, useState } from "react";
import { api } from "./api";

export default function UndoTask() {
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const receive = (event: Event) => { setId((event as CustomEvent<string>).detail); setError(""); };
    window.addEventListener("admin:task-archived", receive);
    return () => window.removeEventListener("admin:task-archived", receive);
  }, []);
  if (!id) return null;
  return <div role="status" className="fixed bottom-5 left-4 right-4 z-50 flex flex-wrap items-center gap-3 rounded-xl bg-[#30303d] p-4 text-sm text-white shadow-lg sm:left-auto sm:w-auto">
    <span>{error || "작업을 보관했어요."}</span>
    <button disabled={busy} className="font-semibold text-violet-200" onClick={async () => {
      setBusy(true);
      try {
        await api(`/api/admin/trash/${id}/restore`, "POST", { entity: "task" });
        window.location.reload();
      } catch (e) { setError(e instanceof Error ? e.message : "복구 실패"); }
      finally { setBusy(false); }
    }}>실행 취소</button>
    <button aria-label="알림 닫기" onClick={() => setId("")}>닫기</button>
  </div>;
}
