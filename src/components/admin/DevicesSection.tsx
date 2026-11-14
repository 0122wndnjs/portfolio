"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/components/admin/api";
import { Button } from "@/components/admin/ui";

type Device = { id: string; name: string; created_at: string; last_used_at: string | null; expires_at: string };

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

/** JKOS 맥 앱 연결: 6자리 코드 발급, 연결된 기기 목록·해제. */
export default function DevicesSection({ onError, onToast }: { onError: (m: string) => void; onToast: (m: string) => void }) {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [pair, setPair] = useState<{ code: string; expires_at: string } | null>(null);
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () => api<{ devices: Device[] }>("/api/admin/devices").then((r) => setDevices(r.devices)).catch(() => setDevices(null)),
    [],
  );
  useEffect(() => { load(); }, [load]);

  // 코드가 떠 있는 동안 남은 시간을 세고, 연결되면 목록을 갱신한다.
  useEffect(() => {
    if (!pair) return;
    const until = new Date(pair.expires_at).getTime();
    const before = devices?.length ?? 0;
    const tick = setInterval(() => {
      const remain = Math.max(0, Math.round((until - Date.now()) / 1000));
      setLeft(remain);
      if (remain === 0) setPair(null);
    }, 1000);
    const poll = setInterval(async () => {
      const r = await api<{ devices: Device[] }>("/api/admin/devices").catch(() => null);
      if (r && r.devices.length > before) {
        setDevices(r.devices);
        setPair(null);
        onToast(`${r.devices[0]?.name ?? "기기"} 연결됐어요.`);
      }
    }, 3000);
    return () => { clearInterval(tick); clearInterval(poll); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair]);

  async function start() {
    setBusy(true);
    try {
      const next = await api<{ code: string; expires_at: string }>("/api/admin/devices/pair", "POST");
      setLeft(Math.max(0, Math.round((new Date(next.expires_at).getTime() - Date.now()) / 1000)));
      setPair(next);
    } catch (e) {
      onError(e instanceof Error ? e.message : "코드를 만들지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(d: Device) {
    if (!confirm(`${d.name} 연결을 해제할까요? 그 기기의 JKOS는 바로 로그아웃돼요.`)) return;
    try {
      await api(`/api/admin/devices/${d.id}`, "DELETE");
      await load();
      onToast("연결을 해제했어요.");
    } catch (e) {
      onError(e instanceof Error ? e.message : "해제하지 못했어요.");
    }
  }

  return (
    <section className="rounded-2xl border border-black/[0.055] bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 id="settings-devices" className="text-sm font-semibold">JKOS 기기</h2>
          <p className="mt-1 text-xs text-[#767676]">맥 앱 JKOS가 작업실 데이터를 쓰도록 연결해요.</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${devices?.length ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
          {devices?.length ? `${devices.length}대 연결` : "연결 안 됨"}
        </span>
      </div>

      {pair ? (
        <div className="mt-5 rounded-xl bg-[#f7f7f9] p-4 text-center">
          <p className="text-xs text-[#777783]">JKOS 앱에 이 코드를 입력하세요</p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-[0.35em]">{pair.code}</p>
          <p className="mt-2 text-xs text-[#999]">{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")} 남음 · 한 번만 쓸 수 있어요</p>
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-[#f7f7f9] p-3 text-xs leading-5 text-[#777783]">
          연결 코드는 5분 동안 유효해요. 기기 토큰으로는 패스키·복구 코드·백업 복원·기기 연결 같은 보안 작업을 할 수 없어요. 90일 동안 안 쓰면 자동으로 만료돼요.
        </p>
      )}

      {devices && devices.length > 0 && (
        <ul className="mt-3 divide-y divide-black/[0.05] text-xs">
          {devices.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p className="font-medium text-[#222]">{d.name}</p>
                <p className="mt-0.5 text-[#999]">연결 {fmt(d.created_at)} · 마지막 사용 {fmt(d.last_used_at)}</p>
              </div>
              <Button kind="quiet" onClick={() => revoke(d)}>해제</Button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {pair ? (
          <Button kind="quiet" onClick={() => setPair(null)}>닫기</Button>
        ) : (
          <Button disabled={busy} onClick={start}>JKOS 연결 코드 만들기</Button>
        )}
      </div>
    </section>
  );
}
