import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchChallans } from "../api/challans";
import { Challan } from "../types";
import { StatusTag } from "../components/StatCard";

export function ChallansPage() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetchChallans({ page, status: status || undefined });
      setChallans(res.data);
      setTotalPages(res.meta.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Sales</div>
          <div className="page-title">Challans</div>
        </div>
        <Link to="/challans/new"><button className="btn btn-accent">+ New challan</button></Link>
      </div>

      <div className="toolbar">
        <select className="select" style={{ maxWidth: 200 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Challan #</th><th>Customer</th><th>Total qty</th><th>Status</th><th>Created</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="table-empty">Loading challans...</td></tr>
            ) : challans.length === 0 ? (
              <tr><td colSpan={5} className="table-empty">No challans found.</td></tr>
            ) : (
              challans.map((c) => (
                <tr key={c.id}>
                  <td><Link to={`/challans/${c.id}`} className="mono" style={{ fontWeight: 600 }}>{c.challanNumber}</Link></td>
                  <td>{c.customerName}</td>
                  <td className="mono">{c.totalQuantity}</td>
                  <td><StatusTag status={c.status} /></td>
                  <td className="mono">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
