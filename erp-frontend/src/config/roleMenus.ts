import { Role } from "../types";

export interface MenuItem {
  code: string; // module code, shown like an ERP transaction code
  label: string;
  path: string;
}

// Single source of truth for what each role sees in the sidebar.
export const ROLE_MENUS: Record<Role, MenuItem[]> = {
  ADMIN: [
    { code: "DSH", label: "Dashboard", path: "/dashboard" },
    { code: "CRM", label: "Customers", path: "/customers" },
    { code: "PRD", label: "Products", path: "/products" },
    { code: "INV", label: "Inventory", path: "/inventory" },
    { code: "SLS", label: "Challans", path: "/challans" },
    { code: "USR", label: "Users", path: "/users" },
  ],
  SALES: [
    { code: "DSH", label: "Dashboard", path: "/dashboard" },
    { code: "CRM", label: "Customers", path: "/customers" },
    { code: "SLS", label: "Challans", path: "/challans" },
  ],
  WAREHOUSE: [
    { code: "DSH", label: "Dashboard", path: "/dashboard" },
    { code: "PRD", label: "Products", path: "/products" },
    { code: "INV", label: "Inventory", path: "/inventory" },
    { code: "SLS", label: "Challans", path: "/challans" },
  ],
  ACCOUNTS: [
    { code: "DSH", label: "Dashboard", path: "/dashboard" },
    { code: "SLS", label: "Challans", path: "/challans" },
  ],
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  SALES: "Sales",
  WAREHOUSE: "Warehouse",
  ACCOUNTS: "Accounts",
};
