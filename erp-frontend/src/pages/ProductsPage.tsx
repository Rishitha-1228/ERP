import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deactivateProduct,
  transferProductWarehouse,
  fetchWarehouses,
} from "../api/products";
import { Product } from "../types";

const EMPTY_FORM = {
  name: "",
  sku: "",
  category: "",
  warehouse: "",
  unitPrice: 0,
  currentStock: 0,
  minStockAlert: 0,
};

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  // Transfer modal state
  const [transferProduct, setTransferProduct] = useState<Product | null>(null);
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [transferWarehouse, setTransferWarehouse] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferSaving, setTransferSaving] = useState(false);
  const [transferError, setTransferError] = useState("");

  async function load() {
    setLoading(true);

    try {
      const res = await fetchProducts({
        page,
        search,
      });

      setProducts(res.data);
      setTotalPages(res.meta.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);

    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category || "",
      warehouse: product.warehouse || "",
      unitPrice: Number(product.unitPrice),
      currentStock: product.currentStock,
      minStockAlert: product.minStockAlert,
    });

    setModalOpen(true);
  }

  async function openTransfer(product: Product) {
    setTransferProduct(product);
    setTransferWarehouse("");
    setTransferReason("");
    setTransferError("");

    try {
      const list = await fetchWarehouses();
      setWarehouses(list);
    } catch {
      setWarehouses([]);
    }
  }

  async function handleTransfer() {
    if (!transferProduct) return;
    setTransferError("");

    if (!transferWarehouse.trim()) {
      setTransferError("Select or enter a destination warehouse.");
      return;
    }

    setTransferSaving(true);

    try {
      await transferProductWarehouse(transferProduct.id, {
        warehouse: transferWarehouse,
        reason: transferReason || undefined,
      });

      setSuccessMessage(
        `✅ Product transferred to ${transferWarehouse} successfully.`
      );

      setTransferProduct(null);
      await load();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err: any) {
      setTransferError(
        err?.response?.data?.message || "Failed to transfer product."
      );
    } finally {
      setTransferSaving(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      alert("Product name is required.");
      return;
    }

    if (!editing && !form.sku.trim()) {
      alert("SKU is required.");
      return;
    }

    if (form.unitPrice < 0) {
      alert("Unit price cannot be negative.");
      return;
    }

    if (form.currentStock < 0) {
      alert("Opening stock cannot be negative.");
      return;
    }

    if (form.minStockAlert < 0) {
      alert("Minimum stock alert cannot be negative.");
      return;
    }

    setSaving(true);

    try {
      if (editing) {
        await updateProduct(editing.id, form);

        setSuccessMessage("✅ Product updated successfully.");
      } else {
        await createProduct(form);

        setSuccessMessage("✅ Product created successfully.");
      }

      setModalOpen(false);
      setPage(1);

      await load();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(product: Product) {
    const ok = window.confirm(
      `Deactivate "${product.name}"?`
    );

    if (!ok) return;

    await deactivateProduct(product.id);

    setSuccessMessage("✅ Product deactivated successfully.");

    await load();

    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  }

  return (

 
   <div>
  <div className="page-header">
    <div>
      <div className="page-eyebrow">Catalogue</div>
      <div className="page-title">Products</div>
    </div>

    <button
      className="btn btn-accent"
      onClick={openCreate}
    >
      + Add Product
    </button>
  </div>

  {successMessage && (
    <div
      style={{
        marginBottom: 16,
        padding: "12px 16px",
        background: "#dcfce7",
        color: "#166534",
        borderRadius: 8,
        fontWeight: 600,
      }}
    >
      {successMessage}
    </div>
  )}

  <div className="toolbar">
    <input
      className="input"
      style={{ maxWidth: 260 }}
      placeholder="Search by name or SKU..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          setPage(1);
          load();
        }
      }}
    />

    <button
      className="btn btn-secondary btn-sm"
      onClick={() => {
        setPage(1);
        load();
      }}
    >
      Search
    </button>

    <Link
      to="/inventory"
      style={{ marginLeft: "auto" }}
    >
      <button className="btn btn-secondary btn-sm">
        View Stock Movements →
      </button>
    </Link>
  </div>

  <div className="table-wrap">
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>SKU</th>
          <th>Category</th>
          <th>Price</th>
          <th>Stock</th>
          <th>Warehouse</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {loading ? (
          <tr>
            <td
              colSpan={7}
              className="table-empty"
            >
              Loading products...
            </td>
          </tr>
        ) : products.length === 0 ? (
          <tr>
            <td
              colSpan={7}
              className="table-empty"
            >
              No products found.
            </td>
          </tr>
        ) : (
          products.map((product) => {
            const lowStock =
              product.currentStock <=
              product.minStockAlert;

            return (
              <tr key={product.id}>
                <td style={{ fontWeight: 600 }}>
                  {product.name}
                </td>

                <td className="mono">
                  {product.sku}
                </td>

                <td>
                  {product.category || "—"}
                </td>

                <td className="mono">
                  ₹
                  {Number(
                    product.unitPrice
                  ).toFixed(2)}
                </td>

                <td>
                  <span className="mono">
                    {product.currentStock}
                  </span>

                  {" "}

                  {lowStock && (
                    <span className="tag tag-low">
                      LOW
                    </span>
                  )}
                </td>

                <td>
                  {product.warehouse || "—"}
                </td>

                <td
                  style={{
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      openEdit(product)
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      openTransfer(product)
                    }
                  >
                    Transfer
                  </button>

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() =>
                      handleDeactivate(product)
                    }
                  >
                    Deactivate
                  </button>
                </td>
              </tr>
            );
          })
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
            <h2>
              {editing
                ? "Edit Product"
                : "Add Product"}
            </h2>

            <div className="form-group">
              <label className="form-label">
                Product Name
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
                SKU
              </label>

              <input
                className="input"
                value={form.sku}
                disabled={!!editing}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sku: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Category
              </label>

              <input
                className="input"
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Warehouse
              </label>

              <input
                className="input"
                value={form.warehouse}
                onChange={(e) =>
                  setForm({
                    ...form,
                    warehouse: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Unit Price
              </label>

              <input
                className="input"
                type="number"
                value={form.unitPrice}
                onChange={(e) =>
                  setForm({
                    ...form,
                    unitPrice: Number(e.target.value),
                  })
                }
              />
            </div>

            {!editing && (
              <div className="form-group">
                <label className="form-label">
                  Opening Stock
                </label>

                <input
                  className="input"
                  type="number"
                  value={form.currentStock}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      currentStock: Number(
                        e.target.value
                      ),
                    })
                  }
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Minimum Stock Alert
              </label>

              <input
                className="input"
                type="number"
                value={form.minStockAlert}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minStockAlert: Number(
                      e.target.value
                    ),
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
                  : editing
                  ? "Update Product"
                  : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {transferProduct && (
        <div
          className="modal-backdrop"
          onClick={() => setTransferProduct(null)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Transfer Warehouse</h2>

            <p style={{ marginBottom: 16 }}>
              Moving <b>{transferProduct.name}</b> from{" "}
              <b>{transferProduct.warehouse || "Unassigned"}</b> to a new
              warehouse.
            </p>

            <div className="form-group">
              <label className="form-label">Destination Warehouse</label>

              <input
                className="input"
                list="warehouse-options"
                placeholder="Select or type a warehouse..."
                value={transferWarehouse}
                onChange={(e) => setTransferWarehouse(e.target.value)}
              />
              <datalist id="warehouse-options">
                {warehouses.map((w) => (
                  <option key={w} value={w} />
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label className="form-label">Reason (optional)</label>

              <input
                className="input"
                placeholder="e.g. Rebalancing stock across locations"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
              />
            </div>

            {transferError && (
              <div className="error-text" style={{ marginBottom: 12 }}>
                {transferError}
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
                onClick={() => setTransferProduct(null)}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                disabled={transferSaving}
                onClick={handleTransfer}
              >
                {transferSaving ? "Transferring..." : "Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}