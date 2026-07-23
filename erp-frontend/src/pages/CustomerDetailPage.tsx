import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchCustomerById, addFollowUpNote, addPayment } from "../api/customers";
import { StatusTag } from "../components/StatCard";
import { Customer } from "../types";

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      setCustomer(await fetchCustomerById(id));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAddNote() {
    if (!id || !note.trim()) return;
    setSaving(true);
    try {
      await addFollowUpNote(id, note);
      setNote("");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPayment() {
    if (!id) return;
    setPaymentError("");

    const amountNum = Number(paymentAmount);
    if (!paymentAmount || amountNum <= 0) {
      setPaymentError("Enter a valid payment amount.");
      return;
    }

    setSavingPayment(true);
    try {
      await addPayment(id, { amount: amountNum, note: paymentNote || undefined });
      setPaymentAmount("");
      setPaymentNote("");
      load();
    } catch (err: any) {
      setPaymentError(err?.response?.data?.message || "Failed to record payment.");
    } finally {
      setSavingPayment(false);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (!customer) return <p>Customer not found.</p>;

  const outstanding = customer.outstandingBalance ?? 0;

  return (
    <div>
      <Link className="back-link" to="/customers">&larr; Back to customers</Link>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Customer</div>
          <div className="page-title">{customer.name}</div>
        </div>
        <StatusTag status={customer.status} />
      </div>

      <div className="detail-card">
        <dl>
          <div className="detail-row"><dt>Mobile</dt><dd className="mono">{customer.mobile}</dd></div>
          <div className="detail-row"><dt>Email</dt><dd>{customer.email || "—"}</dd></div>
          <div className="detail-row"><dt>Business</dt><dd>{customer.businessName || "—"}</dd></div>
          <div className="detail-row"><dt>GST number</dt><dd className="mono">{customer.gstNumber || "—"}</dd></div>
          <div className="detail-row"><dt>Type</dt><dd>{customer.customerType}</dd></div>
          <div className="detail-row"><dt>Address</dt><dd>{customer.address || "—"}</dd></div>
          <div className="detail-row"><dt>Follow-up date</dt><dd className="mono">{customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : "—"}</dd></div>
        </dl>
      </div>

      <div className="section-title">Account Summary</div>
      <div className="detail-card" style={{ marginBottom: 22 }}>
        <dl>
          <div className="detail-row"><dt>Total Billed</dt><dd className="mono">₹{(customer.totalBilled ?? 0).toFixed(2)}</dd></div>
          <div className="detail-row"><dt>Total Paid</dt><dd className="mono">₹{(customer.totalPaid ?? 0).toFixed(2)}</dd></div>
          <div className="detail-row">
            <dt>Outstanding Balance</dt>
            <dd className="mono" style={{ fontWeight: 700, color: outstanding > 0 ? "#dc2626" : "#16a34a" }}>
              ₹{outstanding.toFixed(2)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="section-title">Record Payment</div>
      <div className="toolbar" style={{ marginBottom: 8 }}>
        <input
          className="input"
          style={{ maxWidth: 160 }}
          type="number"
          min="0"
          step="0.01"
          placeholder="Amount"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
        />
        <input
          className="input"
          placeholder="Note (optional)"
          value={paymentNote}
          onChange={(e) => setPaymentNote(e.target.value)}
        />
        <button className="btn btn-primary btn-sm" disabled={savingPayment} onClick={handleAddPayment}>
          {savingPayment ? "Saving..." : "Record Payment"}
        </button>
      </div>
      {paymentError && <div className="error-text" style={{ marginBottom: 16 }}>{paymentError}</div>}

      <div className="table-wrap" style={{ marginBottom: 22 }}>
        <table className="table">
          <thead>
            <tr><th>Amount</th><th>Note</th><th>Recorded By</th><th>Date</th></tr>
          </thead>
          <tbody>
            {(!customer.payments || customer.payments.length === 0) ? (
              <tr><td colSpan={4} className="table-empty">No payments recorded yet.</td></tr>
            ) : (
              customer.payments.map((p) => (
                <tr key={p.id}>
                  <td className="mono">₹{p.amount.toFixed(2)}</td>
                  <td>{p.note || "—"}</td>
                  <td>{p.createdByName || "—"}</td>
                  <td className="mono">{new Date(p.paymentDate).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="section-title">Follow-up notes</div>
      <div className="toolbar">
        <input
          className="input"
          placeholder="Add a follow-up note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleAddNote}>Add note</button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Note</th><th>By</th><th>Date</th></tr>
          </thead>
          <tbody>
            {(!customer.followUpNotes || customer.followUpNotes.length === 0) ? (
              <tr><td colSpan={3} className="table-empty">No follow-up notes yet.</td></tr>
            ) : (
              customer.followUpNotes.map((n) => (
                <tr key={n.id}>
                  <td>{n.note}</td>
                  <td>{n.createdByName || "—"}</td>
                  <td className="mono">{new Date(n.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}