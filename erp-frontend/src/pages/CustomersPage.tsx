import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deactivateCustomer,
} from "../api/customers";
import { Customer } from "../types";
import { StatusTag } from "../components/StatCard";

const EMPTY_FORM = {
  name: "",
  mobile: "",
  email: "",
  businessName: "",
  gstNumber: "",
  customerType: "RETAIL" as Customer["customerType"],
  address: "",
  status: "LEAD" as Customer["status"],
  notes: "",
};

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);

  const [editing, setEditing] = useState<Customer | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [saving, setSaving] = useState(false);

  // NEW
  const [deleteCustomer, setDeleteCustomer] =
    useState<Customer | null>(null);

  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);

    try {
      const res = await fetchCustomers({
        page,
        search,
        status: status || undefined,
      });

      setCustomers(res.data);

      setTotalPages(res.meta.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  function openCreate() {
    setEditing(null);

    setForm(EMPTY_FORM);

    setModalOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);

    setForm({
      name: c.name,
      mobile: c.mobile,
      email: c.email || "",
      businessName: c.businessName || "",
      gstNumber: c.gstNumber || "",
      customerType: c.customerType,
      address: c.address || "",
      status: c.status,
      notes: c.notes || "",
    });

    setModalOpen(true);
  }

  function validateForm() {
    if (!form.name.trim()) {
      alert("Customer name is required.");
      return false;
    }

    if (!form.mobile.trim()) {
      alert("Mobile number is required.");
      return false;
    }

    if (!/^[0-9]{7,15}$/.test(form.mobile)) {
      alert("Enter valid mobile number.");
      return false;
    }

    if (
      form.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    ) {
      alert("Enter valid email.");
      return false;
    }

    return true;
  }

  async function handleSave() {
    if (!validateForm()) return;

    setSaving(true);

    try {
      if (editing) {
        await updateCustomer(editing.id, form);

        setMessage("Customer updated successfully.");
      } else {
        await createCustomer(form);

        setMessage("Customer created successfully.");
      }

      setModalOpen(false);

      setPage(1);

      load();
    } catch (err) {
      alert("Unable to save customer.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!deleteCustomer) return;

    try {
      await deactivateCustomer(deleteCustomer.id);

      setMessage("Customer deactivated successfully.");

      setDeleteCustomer(null);

      load();
    } catch {
      alert("Unable to deactivate customer.");
    }
  }

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  
return (
  <div>

    {message && (
      <div
        style={{
          background: "#16a34a",
          color: "white",
          padding: 12,
          borderRadius: 8,
          marginBottom: 15,
          fontWeight: 600,
        }}
      >
        {message}
      </div>
    )}

    <div className="page-header">
      <div>
        <div className="page-eyebrow">CRM</div>
        <div className="page-title">Customers</div>
      </div>

      <button
        className="btn btn-accent"
        onClick={openCreate}
      >
        + Add Customer
      </button>
    </div>

    <div className="toolbar">

      <input
        className="input"
        style={{ maxWidth: 260 }}
        placeholder="Search customer..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setPage(1);
            load();
          }
        }}
      />

      <select
        className="select"
        value={status}
        style={{ maxWidth: 180 }}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="">All Status</option>
        <option value="LEAD">Lead</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>

      <button
        className="btn btn-secondary btn-sm"
        onClick={() => {
          setPage(1);
          load();
        }}
      >
        Search
      </button>

    </div>

    <div className="table-wrap">

      <table className="table">

        <thead>

          <tr>

            <th>Name</th>

            <th>Mobile</th>

            <th>Business</th>

            <th>Type</th>

            <th>Status</th>

            <th style={{ width: 220 }}>Actions</th>

          </tr>

        </thead>

        <tbody>

          {loading ? (

            <tr>
              <td colSpan={6} className="table-empty">
                Loading...
              </td>
            </tr>

          ) : customers.length === 0 ? (

            <tr>
              <td colSpan={6} className="table-empty">
                No Customers Found
              </td>
            </tr>

          ) : (

            customers.map((c) => (

              <tr key={c.id}>

                <td>
                  <Link
                    to={`/customers/${c.id}`}
                    style={{ fontWeight: 600 }}
                  >
                    {c.name}
                  </Link>
                </td>

                <td>{c.mobile}</td>

                <td>{c.businessName || "-"}</td>

                <td>{c.customerType}</td>

                <td>
                  <StatusTag status={c.status} />
                </td>

                <td
                  style={{
                    display: "flex",
                    gap: 8,
                  }}
                >

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => openEdit(c)}
                  >
                    Edit
                  </button>

                  {c.status !== "INACTIVE" && (

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setDeleteCustomer(c)}
                    >
                      Deactivate
                    </button>

                  )}

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

    <div className="pagination">

      <button
        className="btn btn-secondary btn-sm"
        disabled={page <= 1}
        onClick={() => setPage((p) => p - 1)}
      >
        Prev
      </button>

      <span>

        Page {page} of {totalPages}

      </span>

      <button
        className="btn btn-secondary btn-sm"
        disabled={page >= totalPages}
        onClick={() => setPage((p) => p + 1)}
      >
        Next
      </button>

    </div>

    {deleteCustomer && (

      <div
        className="modal-backdrop"
        onClick={() => setDeleteCustomer(null)}
      >

        <div
          className="modal"
          onClick={(e) => e.stopPropagation()}
        >

          <h2>Deactivate Customer</h2>

          <p>

            Are you sure you want to deactivate

            <b> {deleteCustomer.name}</b>?

          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 20,
            }}
          >

            <button
              className="btn btn-secondary"
              onClick={() => setDeleteCustomer(null)}
            >
              Cancel
            </button>

            <button
              className="btn btn-danger"
              onClick={handleDeactivate}
            >
              Deactivate
            </button>

          </div>

        </div>

      </div>

    )}

{modalOpen && (
  <div
    className="modal-backdrop"
    onClick={() => setModalOpen(false)}
  >
    <div
      className="modal"
      onClick={(e) => e.stopPropagation()}
    >
      <h2>
        {editing ? "Edit Customer" : "Add Customer"}
      </h2>

      <div className="form-group">
        <label className="form-label">
          Name *
        </label>

        <input
          className="input"
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value,
            })
          }
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Mobile *
        </label>

        <input
          className="input"
          value={form.mobile}
          onChange={(e) =>
            setForm({
              ...form,
              mobile: e.target.value,
            })
          }
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Email
        </label>

        <input
          className="input"
          value={form.email}
          onChange={(e) =>
            setForm({
              ...form,
              email: e.target.value,
            })
          }
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Business Name
        </label>

        <input
          className="input"
          value={form.businessName}
          onChange={(e) =>
            setForm({
              ...form,
              businessName: e.target.value,
            })
          }
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          GST Number
        </label>

        <input
          className="input"
          value={form.gstNumber}
          onChange={(e) =>
            setForm({
              ...form,
              gstNumber: e.target.value,
            })
          }
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Customer Type
        </label>

        <select
          className="select"
          value={form.customerType}
          onChange={(e) =>
            setForm({
              ...form,
              customerType:
                e.target.value as Customer["customerType"],
            })
          }
        >
          <option value="RETAIL">
            Retail
          </option>

          <option value="WHOLESALE">
            Wholesale
          </option>

          <option value="DISTRIBUTOR">
            Distributor
          </option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">
          Status
        </label>

        <select
          className="select"
          value={form.status}
          onChange={(e) =>
            setForm({
              ...form,
              status:
                e.target.value as Customer["status"],
            })
          }
        >
          <option value="LEAD">
            Lead
          </option>

          <option value="ACTIVE">
            Active
          </option>

          <option value="INACTIVE">
            Inactive
          </option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">
          Address
        </label>

        <textarea
          rows={2}
          className="textarea"
          value={form.address}
          onChange={(e) =>
            setForm({
              ...form,
              address: e.target.value,
            })
          }
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Notes
        </label>

        <textarea
          rows={3}
          className="textarea"
          value={form.notes}
          onChange={(e) =>
            setForm({
              ...form,
              notes: e.target.value,
            })
          }
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 20,
        }}
      >
        <button
          className="btn btn-secondary"
          onClick={() => setModalOpen(false)}
        >
          Cancel
        </button>

        <button
          className="btn btn-primary"
          disabled={saving}
          onClick={handleSave}
        >
          {saving
            ? "Saving..."
            : editing
            ? "Update Customer"
            : "Add Customer"}
        </button>
      </div>
    </div>
  </div>
)}
  </div>
);
}