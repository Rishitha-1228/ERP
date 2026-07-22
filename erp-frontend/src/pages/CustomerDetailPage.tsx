import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchCustomerById, addFollowUpNote } from "../api/customers";
import { StatusTag } from "../components/StatCard";
import { Customer } from "../types";

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  if (loading) return <p>Loading...</p>;
  if (!customer) return <p>Customer not found.</p>;

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
        </dl>
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
