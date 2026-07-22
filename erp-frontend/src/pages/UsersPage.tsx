import { useEffect, useState } from "react";
import { fetchUsers, createUser, resetUserPassword, deactivateUser } from "../api/users";
import { User, Role } from "../types";
import { StatusTag } from "../components/StatCard";

const EMPTY_FORM = { name: "", email: "", password: "", role: "SALES" as Role };

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetchUsers({ page });
      setUsers(res.data);
      setTotalPages(res.meta.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function handleCreate() {
    setError("");
    if (!form.name || !form.email || !form.password) {
      setError("Name, email, and password are required.");
      return;
    }
    setSaving(true);
    try {
      await createUser(form);
      setModalOpen(false);
      setForm(EMPTY_FORM);
      setPage(1);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create user.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword(id: string) {
    const newPassword = window.prompt("Enter a new password for this user:");
    if (!newPassword) return;
    await resetUserPassword(id, newPassword);
    alert("Password reset successfully.");
  }

  async function handleDeactivate(id: string) {
    if (!window.confirm("Deactivate this user? They will no longer be able to log in.")) return;
    await deactivateUser(id);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Access control</div>
          <div className="page-title">Users</div>
        </div>
        <button className="btn btn-accent" onClick={() => { setForm(EMPTY_FORM); setError(""); setModalOpen(true); }}>
          + Add user
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="table-empty">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="table-empty">No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td className="mono">{u.email}</td>
                  <td>{u.role}</td>
                  <td><StatusTag status={u.isActive === false ? "INACTIVE" : "ACTIVE"} /></td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleResetPassword(u.id)}>Reset password</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(u.id)}>Deactivate</button>
                  </td>
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

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add user</h2>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Temporary password</label>
              <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                <option value="ADMIN">Admin</option>
                <option value="SALES">Sales</option>
                <option value="WAREHOUSE">Warehouse</option>
                <option value="ACCOUNTS">Accounts</option>
              </select>
            </div>
            {error && <div className="error-text">{error}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={saving} onClick={handleCreate}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
