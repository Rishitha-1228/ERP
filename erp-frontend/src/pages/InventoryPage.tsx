import { useEffect, useState } from "react";
import {
  fetchStockMovements,
  createStockMovement,
} from "../api/inventory";
import { fetchProducts } from "../api/products";
import { StockMovement, Product } from "../types";
import { StatusTag } from "../components/StatCard";

export function InventoryPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    productId: "",
    quantity: 1,
    movementType: "IN" as "IN" | "OUT" | "ADJUST",
    reason: "",
  });

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  async function load() {
    setLoading(true);

    try {
      const movementRes =
        await fetchStockMovements({
          page,
        });

      setMovements(movementRes.data);

      setTotalPages(
        movementRes.meta.totalPages || 1
      );

      const productRes =
        await fetchProducts({
          page: 1,
        });

      setProducts(productRes.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function openModal() {
    setForm({
      productId: "",
      quantity: 1,
      movementType: "IN",
      reason: "",
    });

    setError("");

    setModalOpen(true);
  }

  async function handleSave() {
    setError("");

    if (!form.productId) {
      setError("Please select a product.");
      return;
    }

    if (form.quantity <= 0) {
      setError(
        "Quantity should be greater than zero."
      );
      return;
    }

    if (!form.reason.trim()) {
      setError("Reason is required.");
      return;
    }

    setSaving(true);

    try {
      const result =
        await createStockMovement(form);

      setSuccessMessage(
        result.message ||
          "Stock movement recorded successfully."
      );

      setModalOpen(false);

      setPage(1);

      await load();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to record stock movement."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
  <div>
  <div className="page-header">
    <div>
      <div className="page-eyebrow">
        Stock Ledger
      </div>

      <div className="page-title">
        Inventory Movements
      </div>
    </div>

    <button
      className="btn btn-accent"
      onClick={openModal}
    >
      + Record Movement
    </button>
  </div>

  {successMessage && (
    <div
      style={{
        background: "#dcfce7",
        color: "#166534",
        padding: "12px 16px",
        borderRadius: 8,
        marginBottom: 16,
        fontWeight: 600,
      }}
    >
      {successMessage}
    </div>
  )}

  <div className="table-wrap">
    <table className="table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Movement</th>
          <th>Quantity</th>
          <th>Reason</th>
          <th>Created By</th>
          <th>Date</th>
        </tr>
      </thead>

      <tbody>
        {loading ? (
          <tr>
            <td
              colSpan={6}
              className="table-empty"
            >
              Loading inventory...
            </td>
          </tr>
        ) : movements.length === 0 ? (
          <tr>
            <td
              colSpan={6}
              className="table-empty"
            >
              No stock movements found.
            </td>
          </tr>
        ) : (
          movements.map((movement) => (
            <tr key={movement.id}>
              <td
                style={{
                  fontWeight: 600,
                }}
              >
                {movement.productName ||
                  movement.productId}
              </td>

              <td>
                <StatusTag
                  status={
                    movement.movementType
                  }
                />
              </td>

              <td className="mono">
                {movement.quantity}
              </td>

              <td>
                {movement.reason}
              </td>

              <td>
                {movement.createdByName ||
                  "—"}
              </td>

              <td className="mono">
                {new Date(
                  movement.createdAt
                ).toLocaleString()}
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
      onClick={() =>
        setPage((p) => p - 1)
      }
    >
      Prev
    </button>

    <span>
      Page {page} of {totalPages}
    </span>

    <button
      className="btn btn-secondary btn-sm"
      disabled={page >= totalPages}
      onClick={() =>
        setPage((p) => p + 1)
      }
    >
      Next
    </button>
  </div>
            {modalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Record Stock Movement</h2>

            <div className="form-group">
              <label className="form-label">
                Product
              </label>

              <select
                className="select"
                value={form.productId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    productId: e.target.value,
                  })
                }
              >
                <option value="">
                  Select Product...
                </option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name} ({product.sku})
                    {" — "}
                    Stock:
                    {" "}
                    {product.currentStock}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Movement Type
              </label>

              <select
                className="select"
                value={form.movementType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    movementType:
                      e.target.value as
                        | "IN"
                        | "OUT"
                        | "ADJUST",
                  })
                }
              >
                <option value="IN">
                  Stock IN
                </option>

                <option value="OUT">
                  Stock OUT
                </option>

                <option value="ADJUST">
                  Adjustment
                </option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Quantity
              </label>

              <input
                className="input"
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    quantity: Number(
                      e.target.value
                    ),
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Reason
              </label>

              <input
                className="input"
                placeholder="Enter reason..."
                value={form.reason}
                onChange={(e) =>
                  setForm({
                    ...form,
                    reason: e.target.value,
                  })
                }
              />
            </div>

            {error && (
              <div
                className="error-text"
                style={{
                  marginBottom: 12,
                }}
              >
                {error}
              </div>
            )}

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
                onClick={() =>
                  setModalOpen(false)
                }
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
                  : "Record Movement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}