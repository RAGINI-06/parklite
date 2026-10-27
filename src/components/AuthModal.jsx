
import { LogIn, UserPlus, X } from "lucide-react";

export default function AuthModal({
  authMode,
  setAuthMode,
  authOpen,
  setAuthOpen,
  authLoading,
  authError,
  authSuccess,
  authForm,
  setAuthForm,
  submitAuth,
}) {
  if (!authOpen) return null;

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #d9ded8",
    borderRadius: "10px",
    fontSize: "14px",
    background: "#fff",
    color: "#202820",
    boxSizing: "border-box",
  };

  const primaryStyle = {
    width: "100%",
    padding: "13px 16px",
    border: "none",
    borderRadius: "10px",
    background: "#c9f36b",
    color: "#172015",
    fontWeight: 700,
    cursor: authLoading ? "wait" : "pointer",
    fontSize: "14px",
  };
const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 2000,
    background: "rgba(13, 20, 13, 0.62)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    overflowY: "auto",
  };

  const modalStyle = {
    position: "relative",
    width: "100%",
    maxWidth: 440,
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fff",
    color: "#202820",
    borderRadius: 18,
    padding: 26,
    boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
    boxSizing: "border-box",
  };

  const closeButtonStyle = {
    position: "absolute",
    top: 14,
    right: 14,
    display: "grid",
    placeItems: "center",
    width: 36,
    height: 36,
    border: "none",
    borderRadius: 9,
    background: "#f1f4ee",
    cursor: "pointer",
    color: "#202820",
  };

  const modalIconStyle = {
    width: 48,
    height: 48,
    borderRadius: 13,
    background: "#eff8df",
    color: "#426a25",
    display: "grid",
    placeItems: "center",
    marginBottom: 18,
  };

  const labelStyle = {
    display: "grid",
    gap: 7,
    fontSize: 13,
    fontWeight: 600,
    color: "#344034",
  };

  const errorBoxStyle = {
    background: "#fff1ef",
    color: "#a33428",
    padding: 12,
    borderRadius: 9,
    fontSize: 13,
    lineHeight: 1.5,
  };

  const successBoxStyle = {
    background: "#eff8df",
    color: "#426a25",
    padding: 12,
    borderRadius: 9,
    fontSize: 13,
    lineHeight: 1.5,
  };

  const textButtonStyle = {
    border: "none",
    padding: 0,
    background: "transparent",
    color: "#426a25",
    fontWeight: 700,
    cursor: "pointer",
  };

  return (
    <div
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          setAuthOpen(false);
        }
      }}
      style={overlayStyle}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        style={modalStyle}
      >
        <button
          type="button"
          aria-label="Close login"
          onClick={() => setAuthOpen(false)}
          style={closeButtonStyle}
        >
          <X size={20} />
        </button>

        <div style={modalIconStyle}>
          {authMode === "login" ? (
            <LogIn size={24} />
          ) : (
            <UserPlus size={24} />
          )}
        </div>

        <h2 id="auth-title" style={{ margin: "0 0 8px" }}>
          {authMode === "login" ? "Welcome back" : "Create your account"}
        </h2>

        <p style={{ color: "#697267", marginTop: 0, fontSize: 14 }}>
          {authMode === "login"
            ? "Log in to reserve your parking spot."
            : "Register to start booking with ParkLite."}
        </p>

        {authError && (
          <p style={errorBoxStyle} role="alert">
            {authError}
          </p>
        )}

        {authSuccess && (
          <p style={successBoxStyle} role="status">
            {authSuccess}
          </p>
        )}

        <form
          onSubmit={submitAuth}
          style={{ display: "grid", gap: 14, marginTop: 20 }}
        >
          {authMode === "register" && (
            <label style={labelStyle}>
              Full name
              <input
                required
                autoComplete="name"
                style={inputStyle}
                value={authForm.fullName}
                onChange={(event) =>
                  setAuthForm({
                    ...authForm,
                    fullName: event.target.value,
                  })
                }
                placeholder="Your full name"
              />
            </label>
          )}

          <label style={labelStyle}>
            Email address
            <input
              required
              type="email"
              autoComplete="email"
              style={inputStyle}
              value={authForm.email}
              onChange={(event) =>
                setAuthForm({ ...authForm, email: event.target.value })
              }
              placeholder="you@example.com"
            />
          </label>

          <label style={labelStyle}>
            Password
            <input
              required
              type="password"
              minLength={6}
              autoComplete={
                authMode === "login" ? "current-password" : "new-password"
              }
              style={inputStyle}
              value={authForm.password}
              onChange={(event) =>
                setAuthForm({
                  ...authForm,
                  password: event.target.value,
                })
              }
              placeholder="Enter your password"
            />
          </label>

          <button
            type="submit"
            disabled={authLoading}
            style={{
              ...primaryStyle,
              opacity: authLoading ? 0.7 : 1,
            }}
          >
            {authLoading
              ? "Please wait..."
              : authMode === "login"
                ? "Log in"
                : "Create account"}
          </button>
        </form>

        <p
          style={{
            fontSize: 14,
            textAlign: "center",
            color: "#697267",
            marginBottom: 0,
          }}
        >
          {authMode === "login"
            ? "New to ParkLite? "
            : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === "login" ? "register" : "login");
            }}
            style={textButtonStyle}
          >
            {authMode === "login" ? "Create an account" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
