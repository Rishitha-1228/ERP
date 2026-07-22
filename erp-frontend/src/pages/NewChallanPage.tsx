import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCustomers } from "../api/customers";
import { fetchProducts } from "../api/products";
import { createChallan } from "../api/challans";
import { Customer, Product } from "../types";

interface LineItem { productId: string; quantity: number; }

export function NewChallanPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ productId: "", quantity: 1 }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCustomers({ page: 1 }).then((res) => setCustomers(res.data));
    fetchProducts({ page: 1 }).then((res) => setProducts(res.data));
  }, []);

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function addRow() { setItems((prev) => [...prev, { productId: "", quantity: 1 }]); }
  function removeRow(index: number) { setItems((prev) => prev.filter((_, i) => i !== index)); }

  async function handleSubmit(status: "DRAFT" | "CONFIRMED") {
    setError("");
    if (!customerId) { setError("Please select a customer."); return; }
    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) { setError("Add at least one product line."); return; }

    setSaving(true);
    try {
      const challan = await createChallan({ customerId, status, items: validItems });
      navigate(`/challans/${challan.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create challan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Sales</div>
          <div className="page-title">New challan</div>
        </div>
      </div>

      <div className="detail-card">
        <div className="form-group">
          <label className="form-label">Customer</label>
          <select className="select" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Select a customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.mobile})</option>
            ))}
          </select>
        </div>

        <div className="section-title" style={{ marginTop: 18 }}>Products</div>
        {items.map((item, idx) => {
          const product = products.find((p) => p.id === item.productId);
          return (
            <div key={idx} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
              <select className="select" value={item.productId} onChange={(e) => updateItem(idx, { productId: e.target.value })}>
                <option value="">Select product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku}) — stock: {p.currentStock}</option>
                ))}
              </select>
              <input className="input mono" style={{ maxWidth: 100 }} type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} />
              {product && <span className="mono" style={{ fontSize: 12.5, color: "var(--ink-soft)", minWidth: 90 }}>₹{Number(product.unitPrice).toFixed(2)}</span>}
              <button className="btn btn-danger btn-sm" onClick={() => removeRow(idx)}>Remove</button>
            </div>
          );
        })}
        <button className="btn btn-secondary btn-sm" onClick={addRow}>+ Add product line</button>

        {error && <div className="error-text">{error}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button className="btn btn-secondary" disabled={saving} onClick={() => handleSubmit("DRAFT")}>Save as draft</button>
          <button className="btn btn-primary" disabled={saving} onClick={() => handleSubmit("CONFIRMED")}>Confirm &amp; reduce stock</button>
        </div>
      </div>
    </div>
  );
}
