"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { FiDownload, FiPlus } from "react-icons/fi";
import { api } from "@/components/admin/api";
import { Button, Field, PageTitle, Toast, dateLabel } from "@/components/admin/ui";

export default function SettingsView({
  onError,
  alert,
}: {
  onError: (message: string) => void;
  alert: ReactNode;
}) {
  const [settings, setSettings] = useState<{
    passkeys: Array<{
      id: string;
      device_name: string;
      created_at: string;
      last_used_at: string | null;
    }>;
    telegram_connected: boolean;
    telegram_username: string;
    telegram_link: string | null;
    preferences: {
      notifications: boolean;
      overdueDays: number;
      digestTime: string;
      deadlineAlerts: boolean;
      paymentAlerts: boolean;
    };
    logs: Array<{
      id: string;
      message: string;
      sent_at: string;
      result: string;
    }>;
  } | null>(null);
  const [busy, setBusy] = useState(false),
    [toast, setToast] = useState("");
  const refresh = useCallback(async () => {
    try {
      setSettings(await api("/api/admin/settings"));
    } catch (e) {
      onError(e instanceof Error ? e.message : "설정을 불러오지 못했습니다.");
    }
  }, [onError]);
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [refresh]);
  const flash = (value: string) => {
    setToast(value);
    setTimeout(() => setToast(""), 2500);
  };
  async function exportData() {
    setBusy(true);
    try {
      const data = await api("/api/admin/export");
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `workspace-${new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" })}.json`;
      link.click();
      URL.revokeObjectURL(url);
      flash("데이터를 내려받았어요.");
    } catch (e) {
      onError(e instanceof Error ? e.message : "내보내기 실패");
    } finally {
      setBusy(false);
    }
  }
  async function addPasskey() {
    setBusy(true);
    try {
      const challenge = await api<{
        options: Parameters<typeof startRegistration>[0]["optionsJSON"];
        challengeId: string;
      }>("/api/admin/auth/register/options", "POST", {});
      const response = await startRegistration({
        optionsJSON: challenge.options,
      });
      await api("/api/admin/auth/register/verify", "POST", {
        response,
        challengeId: challenge.challengeId,
        deviceName: "추가 패스키",
      });
      flash("패스키 추가했어요.");
      await refresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : "패스키 등록 실패");
    } finally {
      setBusy(false);
    }
  }
  async function connect() {
    setBusy(true);
    try {
      const result = await api<{ url: string }>(
        "/api/admin/settings/connect-telegram",
        "POST",
        {},
      );
      window.open(result.url, "_blank", "noopener,noreferrer");
      flash("텔레그램에서 시작 버튼을 눌러 연결하세요.");
    } catch (e) {
      onError(e instanceof Error ? e.message : "연결 준비 실패");
    } finally {
      setBusy(false);
    }
  }
  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    try {
      await api("/api/admin/settings", "POST", {
        preferences: {
          notifications: fd.get("notifications") === "on",
          deadlineAlerts: fd.get("deadlineAlerts") === "on",
          paymentAlerts: fd.get("paymentAlerts") === "on",
          overdueDays: fd.get("overdueDays"),
          digestTime: fd.get("digestTime"),
        },
      });
      flash("알림 설정 저장했어요.");
    } catch (e) {
      onError(e instanceof Error ? e.message : "저장 실패");
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="PREFERENCES"
        title="설정"
        description="로그인 수단과 텔레그램 알림을 관리하세요."
      />
      {alert}
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-black/[0.055] bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold">패스키</h2>
              <p className="mt-1 text-xs text-[#767676]">
                지문, 얼굴 또는 기기 잠금으로 로그인
              </p>
            </div>
            <Button kind="light" onClick={addPasskey} disabled={busy}>
              <FiPlus /> 패스키 추가
            </Button>
          </div>
          <div className="mt-5 space-y-2">
            {settings?.passkeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-[#f7f7f9] px-3 py-3"
              >
                <div>
                  <p className="text-xs font-medium">{key.device_name}</p>
                  <p className="mt-1 text-[10px] text-[#9999a5]">
                    등록 {dateLabel(key.created_at)}
                    {key.last_used_at
                      ? ` · 최근 사용 ${dateLabel(key.last_used_at)}`
                      : ""}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm("이 패스키를 삭제할까요?")) return;
                    try {
                      await api("/api/admin/settings/passkeys", "PATCH", {
                        id: key.id,
                      });
                      await refresh();
                    } catch (e) {
                      onError(e instanceof Error ? e.message : "삭제 실패");
                    }
                  }}
                  className="px-2 py-1 text-[10px] text-red-600"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-black/[0.05] pt-4">
            <p className="text-xs font-medium">세션</p>
            <button
              onClick={async () => {
                try {
                  await api("/api/admin/settings/sessions", "DELETE");
                  flash("다른 기기 세션을 로그아웃했어요.");
                } catch (e) {
                  onError(e instanceof Error ? e.message : "요청 실패");
                }
              }}
              className="mt-2 text-xs text-[#6862ce]"
            >
              다른 모든 기기에서 로그아웃
            </button>
          </div>
        </section>
        <section className="rounded-2xl border border-black/[0.055] bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold">텔레그램</h2>
              <p className="mt-1 text-xs text-[#767676]">
                작업 마감과 입금 알림을 받으세요.
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${settings?.telegram_connected ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
            >
              {settings?.telegram_connected ? "연결됨" : "연결 안 됨"}
            </span>
          </div>
          <p className="mt-5 rounded-xl bg-[#f7f7f9] p-3 text-xs leading-5 text-[#777783]">
            {settings?.telegram_connected
              ? "개인 채팅으로 알림을 받고 있습니다."
              : settings?.telegram_username
                ? `@${settings.telegram_username} 봇을 열어 연결하세요. 연결 코드는 10분 후 만료됩니다.`
                : "서버에 Telegram Bot Token과 사용자 이름을 설정해야 연결할 수 있습니다."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {settings?.telegram_connected ? (
              <>
                <Button
                  kind="light"
                  onClick={async () => {
                    try {
                      await api(
                        "/api/admin/settings/test-telegram",
                        "POST",
                        {},
                      );
                      flash("테스트 알림 보냈어요.");
                    } catch (e) {
                      onError(e instanceof Error ? e.message : "전송 실패");
                    }
                  }}
                >
                  테스트 알림
                </Button>
                <Button
                  kind="quiet"
                  onClick={async () => {
                    if (!confirm("텔레그램 연결을 해제할까요?")) return;
                    try {
                      await api("/api/admin/settings/telegram", "DELETE");
                      await refresh();
                    } catch (e) {
                      onError(e instanceof Error ? e.message : "연결 해제 실패");
                    }
                  }}
                >
                  연결 해제
                </Button>
              </>
            ) : (
              <Button
                onClick={connect}
                disabled={busy || !settings?.telegram_username}
              >
                텔레그램 연결 ↗
              </Button>
            )}
          </div>
          {settings?.logs.length ? (
            <div className="mt-5 border-t border-black/[0.05] pt-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold text-[#777783]">
                  최근 알림
                </p>
                {settings.logs.some((log) => log.result === "failed") && (
                  <button
                    onClick={async () => {
                      try {
                        const result = await api<{ sent: number }>(
                          "/api/admin/settings/retry-notifications",
                          "POST",
                          {},
                        );
                        flash(`실패 알림 ${result.sent}건 다시 보냈어요.`);
                        await refresh();
                      } catch (e) {
                        onError(e instanceof Error ? e.message : "재시도 실패");
                      }
                    }}
                    className="text-[10px] font-semibold text-[#625bd5]"
                  >
                    실패 알림 재시도
                  </button>
                )}
              </div>
              {settings.logs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="flex justify-between gap-3 py-1.5 text-[10px]"
                >
                  <span className="truncate text-[#888894]">{log.message}</span>
                  <span
                    className={
                      log.result === "sent"
                        ? "text-emerald-600"
                        : "text-red-600"
                    }
                  >
                    {log.result === "sent" ? "전송" : "실패"}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>
      <section className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/[0.055] bg-white p-5 sm:p-6">
        <div>
          <h2 className="text-sm font-semibold">데이터 백업</h2>
          <p className="mt-1 text-xs text-[#767676]">
            프로젝트·작업·입금·견적·미팅 전체를 JSON으로 내려받습니다. 패스키와 세션 정보는
            포함하지 않습니다. 고객 정보가 들어 있으니 안전한 곳에 보관하세요.
          </p>
        </div>
        <Button kind="light" onClick={exportData} disabled={busy}>
          <FiDownload /> 내보내기
        </Button>
      </section>
      <form
        onSubmit={savePreferences}
        className="mt-5 rounded-2xl border border-black/[0.055] bg-white p-5 sm:p-6"
      >
        <h2 className="text-sm font-semibold">알림 설정</h2>
        <p className="mt-1 text-xs text-[#767676]">
          매일 오전 9시대(한국 시간)에 자동으로 확인해 알림과 요약을 보냅니다.
          외부 cron을 15분마다 연결하면 설정한 요약 시각 이후에 보냅니다.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex items-center gap-2 text-xs">
            <input
              name="notifications"
              type="checkbox"
              defaultChecked={settings?.preferences.notifications}
            />
            <span>알림 전체 사용</span>
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              name="deadlineAlerts"
              type="checkbox"
              defaultChecked={settings?.preferences.deadlineAlerts}
            />
            <span>작업 마감 알림</span>
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              name="paymentAlerts"
              type="checkbox"
              defaultChecked={settings?.preferences.paymentAlerts}
            />
            <span>입금 알림</span>
          </label>
          <Field
            name="overdueDays"
            label="확인 대기 알림 기준 (일)"
            type="number"
            min={1}
            max={30}
            value={String(settings?.preferences.overdueDays || 3)}
          />
          <Field
            name="digestTime"
            label="일일 요약 시간"
            type="time"
            value={settings?.preferences.digestTime || "09:00"}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit">설정 저장</Button>
        </div>
      </form>
      {toast && <Toast text={toast} />}
    </>
  );
}
