export type InvoiceStatus = "미입금" | "부분 입금" | "입금 완료";

type InvoiceRow = { id: unknown; amount: unknown; due_date: unknown } & Record<string, unknown>;
type PaymentRow = { invoice_id: unknown; amount: unknown } & Record<string, unknown>;

export function invoiceStatus(amount: number, paid: number): InvoiceStatus {
  if (paid === 0) return "미입금";
  return paid < amount ? "부분 입금" : "입금 완료";
}

/** 청구 항목별 누적 입금액·잔액·상태·연체 여부를 계산한다. today는 서울 기준 YYYY-MM-DD. */
export function summarizeInvoices<I extends InvoiceRow, P extends PaymentRow>(
  invoices: I[],
  payments: P[],
  today: string,
) {
  const byInvoice = new Map<unknown, P[]>();
  for (const payment of payments) {
    const list = byInvoice.get(payment.invoice_id);
    if (list) list.push(payment);
    else byInvoice.set(payment.invoice_id, [payment]);
  }
  return invoices.map((invoice) => {
    const items = byInvoice.get(invoice.id) ?? [];
    const amount = Number(invoice.amount);
    const paid = items.reduce((sum, payment) => sum + Number(payment.amount), 0);
    return {
      ...invoice,
      amount,
      paid_amount: paid,
      balance: amount - paid,
      status: invoiceStatus(amount, paid),
      overdue: amount > paid && !!invoice.due_date && String(invoice.due_date) < today,
      payments: items,
    };
  });
}

/** 입금 추가·수정 후 누적 입금액이 청구액을 넘지 않는지 확인한다. */
export const fitsInvoice = (invoiceAmount: number, otherPaid: number, amount: number) =>
  otherPaid + amount <= invoiceAmount;
