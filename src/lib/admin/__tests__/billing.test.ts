import { describe, expect, it } from "vitest";
import { fitsInvoice, invoiceStatus, summarizeInvoices } from "@/lib/admin/billing";

describe("invoiceStatus", () => {
  it("누적 입금액에 따라 미입금·부분 입금·입금 완료를 구분한다", () => {
    expect(invoiceStatus(1000, 0)).toBe("미입금");
    expect(invoiceStatus(1000, 1)).toBe("부분 입금");
    expect(invoiceStatus(1000, 999)).toBe("부분 입금");
    expect(invoiceStatus(1000, 1000)).toBe("입금 완료");
  });
});

describe("summarizeInvoices", () => {
  const invoices = [
    { id: "a", amount: 1_000_000, due_date: "2026-09-01" },
    { id: "b", amount: "2000000", due_date: "2026-09-30" },
    { id: "c", amount: 500_000, due_date: null },
    { id: "d", amount: 300_000, due_date: "2026-09-01" },
  ];
  const payments = [
    { invoice_id: "a", amount: 400_000 },
    { invoice_id: "a", amount: "100000" },
    { invoice_id: "d", amount: 300_000 },
  ];
  const [a, b, c, d] = summarizeInvoices(invoices, payments, "2026-09-25");

  it("분할 입금을 합산해 잔액을 계산한다", () => {
    expect(a.paid_amount).toBe(500_000);
    expect(a.balance).toBe(500_000);
    expect(a.status).toBe("부분 입금");
    expect(a.payments).toHaveLength(2);
  });

  it("문자열 금액(BIGINT)도 숫자로 계산한다", () => {
    expect(b.amount).toBe(2_000_000);
    expect(b.balance).toBe(2_000_000);
  });

  it("예정일이 지나고 잔액이 남으면 연체", () => {
    expect(a.overdue).toBe(true);
    expect(b.overdue).toBe(false);
  });

  it("예정일이 없으면 미입금이어도 연체가 아니다", () => {
    expect(c.status).toBe("미입금");
    expect(c.overdue).toBe(false);
  });

  it("완납이면 예정일이 지나도 연체가 아니다", () => {
    expect(d.status).toBe("입금 완료");
    expect(d.overdue).toBe(false);
  });

  it("예정일 당일은 연체가 아니다", () => {
    const [today] = summarizeInvoices([{ id: "x", amount: 10, due_date: "2026-09-25" }], [], "2026-09-25");
    expect(today.overdue).toBe(false);
  });
});

describe("fitsInvoice", () => {
  it("청구액까지는 허용하고 초과 입금은 거부한다", () => {
    expect(fitsInvoice(1000, 400, 600)).toBe(true);
    expect(fitsInvoice(1000, 400, 601)).toBe(false);
  });
});
