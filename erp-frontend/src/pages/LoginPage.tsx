import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roles = [
  {
    id: "admin",
    name: "Admin",
    description: "Full visibility across users, stock and sales.",
  },
  {
    id: "sales",
    name: "Sales",
    description: "Manage customers and raise sales challans.",
  },
  {
    id: "warehouse",
    name: "Warehouse",
    description: "Track stock levels and dispatch confirmed orders.",
  },
  {
    id: "accounts",
    name: "Accounts",
    description: "Manage payments, invoices and financial reports.",
  },
];

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState("admin");
  const [activeTab, setActiveTab] =
    useState<"login" | "register">("login");

  /* Login */

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* Register */

  const [fullName, setFullName] = useState("");
  const [registerEmail, setRegisterEmail] =
    useState("");
  const [registerPassword, setRegisterPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [registerRole, setRegisterRole] =
    useState("SALES");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [submitting, setSubmitting] =
    useState(false);

  /* LOGIN FUNCTION */

  async function handleSubmit(e: FormEvent) {
  e.preventDefault();

  setSubmitting(true);
  setError("");
  setSuccess("");

  try {
    const role = selectedRole.toUpperCase();

    console.log("Selected Role:", role);
    console.log("Selected Role:", selectedRole);
console.log("Role Sent:", selectedRole.toUpperCase());

    await login(
      email,
      password,
      role
    );

    navigate("/dashboard");
  } catch (err: any) {
    setError(
      err?.response?.data?.message ??
        "Invalid email or password."
    );
  } finally {
    setSubmitting(false);
  }
}
   

  /* REGISTER FUNCTION */

  async function handleRegister(e: FormEvent) {
    e.preventDefault();

    setSubmitting(true);
    setError("");
    setSuccess("");

    if (registerPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    try {
      await register(
        fullName,
        registerEmail,
        registerPassword,
        registerRole
      );

      setSuccess(
        "Account created successfully. Please sign in."
      );

      setFullName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setConfirmPassword("");

      setRegisterRole("SALES");

      setActiveTab("login");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Unable to create account."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">

  

           {/* LEFT PANEL */}

      <div className="login-brand">
        <h1 className="login-brand__mark">VertexERP</h1>

        <p className="login-brand__tagline">
          Operations portal for wholesale & distribution customers,
          inventory and sales challans in one place.
        </p>

        {roles.map((role) => (
          <div
            key={role.id}
            className={`login-brand__role ${
              selectedRole === role.id ? "active" : ""
            }`}
            onClick={() => setSelectedRole(role.id)}
          >
            <div className="login-brand__role-name">
              {role.name}
            </div>

            <div className="login-brand__role-desc">
              {role.description}
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT PANEL */}

      <div className="login-panel">
        <div className="login-card">

          <div className="login-tabs">
            <button
              type="button"
              className={activeTab === "login" ? "active" : ""}
              onClick={() => {
                setActiveTab("login");
                setError("");
                setSuccess("");
              }}
            >
              Sign In
            </button>

            <button
              type="button"
              className={activeTab === "register" ? "active" : ""}
              onClick={() => {
                setActiveTab("register");
                setError("");
                setSuccess("");
              }}
            >
              Create Account
            </button>
          </div>

          {/* LOGIN */}

          {activeTab === "login" ? (
            <>
              <h1>Welcome Back</h1>

              <p>
                Signing in as{" "}
                <strong>
                  {roles.find(
                    (r) => r.id === selectedRole
                  )?.name}
                </strong>
              </p>

              <form onSubmit={handleSubmit}>

                <div className="form-group">
                  <label>Email Address</label>

                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>

                  <input
                    className="input"
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    required
                  />
                </div>

                {error && (
                  <div className="error-text">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="success-text">
                    {success}
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting
                    ? "Signing In..."
                    : "Sign In"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1>Create Account</h1>

              <form onSubmit={handleRegister}>

                <div className="form-group">
                  <label>Full Name</label>

                  <input
                    className="input"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>

                  <input
                    className="input"
                    type="email"
                    value={registerEmail}
                    onChange={(e) =>
                      setRegisterEmail(
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>

                  <input
                    className="input"
                    type="password"
                    value={registerPassword}
                    onChange={(e) =>
                      setRegisterPassword(
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>

                  <input
                    className="input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>

                  <select
                    className="input"
                    value={registerRole}
                    onChange={(e) =>
                      setRegisterRole(
                        e.target.value
                      )
                    }
                  >
                    <option value="SALES">
                      Sales
                    </option>

                    <option value="WAREHOUSE">
                      Warehouse
                    </option>

                    <option value="ACCOUNTS">
                      Accounts
                    </option>
                  </select>
                </div>

                {error && (
                  <div className="error-text">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="success-text">
                    {success}
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting
                    ? "Creating..."
                    : "Create Account"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}