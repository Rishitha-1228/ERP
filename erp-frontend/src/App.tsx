
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { Layout } from "./components/Layout";

import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CustomersPage } from "./pages/CustomersPage";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import { ProductsPage } from "./pages/ProductsPage";
import { InventoryPage } from "./pages/InventoryPage";
import { ChallansPage } from "./pages/ChallansPage";
import { NewChallanPage } from "./pages/NewChallanPage";
import { ChallanDetailPage } from "./pages/ChallanDetailPage";
import { UsersPage } from "./pages/UsersPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Dashboard - All Logged-in Users */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
          </Route>

          {/* Customers - ADMIN, SALES, ACCOUNTS */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["ADMIN", "SALES", "ACCOUNTS"]}
              />
            }
          >
            <Route element={<Layout />}>
              <Route path="/customers" element={<CustomersPage />} />
              <Route
                path="/customers/:id"
                element={<CustomerDetailPage />}
              />
            </Route>
          </Route>

          {/* Products - ADMIN, SALES, WAREHOUSE */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["ADMIN", "SALES", "WAREHOUSE"]}
              />
            }
          >
            <Route element={<Layout />}>
              <Route path="/products" element={<ProductsPage />} />
            </Route>
          </Route>

          {/* Inventory - ADMIN, WAREHOUSE */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["ADMIN", "WAREHOUSE"]}
              />
            }
          >
            <Route element={<Layout />}>
              <Route path="/inventory" element={<InventoryPage />} />
            </Route>
          </Route>

          {/* Challans - ADMIN, SALES, WAREHOUSE, ACCOUNTS */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "SALES",
                  "WAREHOUSE",
                  "ACCOUNTS",
                ]}
              />
            }
          >
            <Route element={<Layout />}>
              <Route path="/challans" element={<ChallansPage />} />
              <Route
                path="/challans/new"
                element={<NewChallanPage />}
              />
              <Route
                path="/challans/:id"
                element={<ChallanDetailPage />}
              />
            </Route>
          </Route>

          {/* Users - ADMIN Only */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]} />
            }
          >
            <Route element={<Layout />}>
              <Route path="/users" element={<UsersPage />} />
            </Route>
          </Route>

          {/* Default Redirect */}
          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}