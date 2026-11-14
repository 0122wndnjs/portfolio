import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/lib/admin/webauthn", () => ({ relyingParty: async () => ({ rpID: "joowonkim.me", origin: "https://joowonkim.me" }) }));

const get = vi.fn();
const run = vi.fn();
vi.mock("@/lib/admin/db", () => ({ db: { prepare: () => ({ get, run, all: vi.fn() }) } }));

let auth: typeof import("../auth");
beforeAll(async () => { auth = await import("../auth"); });
beforeEach(() => { get.mockReset(); run.mockReset(); });

const req = (authorization?: string) => new Request("https://joowonkim.me/api/admin/x", { headers: authorization ? { authorization } : {} });
const future = () => new Date(Date.now() + 86_400_000).toISOString();

describe("authenticateDevice", () => {
  it("returns undefined without a header so cookie auth runs", async () => {
    expect(await auth.authenticateDevice(req())).toBeUndefined();
    expect(get).not.toHaveBeenCalled();
  });

  it("rejects malformed or non-JKOS bearer tokens without hitting the DB", async () => {
    expect(await auth.authenticateDevice(req("Basic abc"))).toBeNull();
    expect(await auth.authenticateDevice(req("Bearer something"))).toBeNull();
    expect(get).not.toHaveBeenCalled();
  });

  it("rejects unknown, revoked or expired tokens", async () => {
    get.mockResolvedValueOnce(undefined);
    expect(await auth.authenticateDevice(req("Bearer jkos_x"))).toBeNull();
    get.mockResolvedValueOnce({ id: "d", name: "Mac", last_used_at: null, expires_at: "2000-01-01T00:00:00.000Z" });
    expect(await auth.authenticateDevice(req("Bearer jkos_x"))).toBeNull();
  });

  it("accepts a valid token and slides expiry only when stale", async () => {
    get.mockResolvedValueOnce({ id: "d1", name: "Mac", last_used_at: new Date().toISOString(), expires_at: future() });
    expect(await auth.authenticateDevice(req("Bearer jkos_ok"))).toEqual({ id: "d1", name: "Mac" });
    expect(run).not.toHaveBeenCalled();
    get.mockResolvedValueOnce({ id: "d1", name: "Mac", last_used_at: "2026-01-01T00:00:00.000Z", expires_at: future() });
    await auth.authenticateDevice(req("Bearer jkos_ok"));
    expect(run).toHaveBeenCalledTimes(1);
  });
});

describe("requireRecentAuth", () => {
  it("always blocks device tokens", async () => {
    await expect(auth.runWithAuth({ kind: "device", deviceId: "d1" }, () => auth.requireRecentAuth())).rejects.toMatchObject({ status: 403, code: "device_forbidden" });
    expect(get).not.toHaveBeenCalled();
  });

  it("still lets a session through when no passkey exists", async () => {
    get.mockResolvedValueOnce({ count: 0 });
    await expect(auth.runWithAuth({ kind: "session" }, () => auth.requireRecentAuth())).resolves.toBeUndefined();
  });
});
