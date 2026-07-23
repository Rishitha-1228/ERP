import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchChallanById, confirmChallan, cancelChallan } from "../api/challans";
import { StatusTag } from "../components/StatCard";
import { Challan } from "../types";

export function ChallanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      setChallan(await fetchChallanById(id));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleConfirm() {
    if (!id) return;
    setError(""); setActionLoading(true);
    try { await confirmChallan(id); load(); }
    catch (err: any) { setError(err?.response?.data?.message || "Failed to confirm challan."); }
    finally { setActionLoading(false); }
  }

  async function handleCancel() {
    if (!id) return;
    setError(""); setActionLoading(true);
    try { await cancelChallan(id); load(); }
    catch (err: any) { setError(err?.response?.data?.message || "Failed to cancel challan."); }
    finally { setActionLoading(false); }
  }

  async function handleDownloadPdf() {
    if (!id || !challan) return;
    setError("");
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`http://localhost:5000/api/challans/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setError("Failed to download PDF.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `challan-${challan.challanNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download PDF.");
    }
  }

  if (loading) return <p>Loading...</p>;
  if (!challan) return <p>Challan not found.</p>;

  return (
    <div>
      <Link className="back-link" to="/challans">&larr; Back to challans</Link>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Sales challan</div>
          <div className="manifest-tag" style={{ marginTop: 4 }}>
            <span className="manifest-tag__label mono">{challan.challanNumber}</span>
          </div>
        </div>
        <StatusTag status={challan.status} />
      </div>

      <div className="detail-card">
        <div className="detail-row"><dt>Customer</dt><dd>{challan.customerName} ({challan.customerMobile})</dd></div>
        <div className="detail-row"><dt>Created by</dt><dd>{challan.createdByName || "—"}</dd></div>
        <div className="detail-row"><dt>Created</dt><dd className="mono">{new Date(challan.createdAt).toLocaleString()}</dd></div>
        <div className="detail-row"><dt>Total quantity</dt><dd className="mono">{challan.totalQuantity}</dd></div>
      </div>

      <div className="section-title">Line items</div>
      <div className="table-wrap" style={{ marginBottom: 22 }}>
        <table className="table">
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Unit price (at time of sale)</th><th>Quantity</th></tr>
          </thead>
          <tbody>
            {challan.items.map((item, i) => (
              <tr key={item.id || i}>
                <td>{item.productName}</td>
                <td className="mono">{item.productSku}</td>
                <td className="mono">₹{Number(item.unitPrice).toFixed(2)}</td>
                <td className="mono">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <div className="error-text">{error}</div>}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn" disabled={actionLoading} onClick={handleDownloadPdf}>
          Download PDF
        </button>

        {challan.status === "DRAFT" && (
          <>
            <button className="btn btn-primary" disabled={actionLoading} onClick={handleConfirm}>Confirm (reduce stock)</button>
            <button className="btn btn-danger" disabled={actionLoading} onClick={handleCancel}>Cancel challan</button>
          </>
        )}
        {challan.status === "CONFIRMED" && (
          <button className="btn btn-danger" disabled={actionLoading} onClick={handleCancel}>Cancel &amp; restore stock</button>
        )}
      </div>
    </div>
  );
}