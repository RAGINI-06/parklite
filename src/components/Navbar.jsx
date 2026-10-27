
import { useState } from "react";
import {
  CarFront,
  ArrowUpRight,
  Menu,
  X,
  ClipboardList,
} from "lucide-react";

export default function Navbar({
  authToken,
  logout,
  setAuthMode,
  setAuthError,
  setAuthSuccess,
  setAuthOpen,
  onMyBookings,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const openLogin = () => {
    setAuthMode("login");
    setAuthError("");
    setAuthSuccess("");
    setAuthOpen(true);
    closeMobileMenu();
  };

  const handleMyBookings = () => {
    closeMobileMenu();

    if (typeof onMyBookings === "function") {
      onMyBookings();
    } else {
      console.error(
        "My Bookings is not connected. Check the onMyBookings prop in App.jsx."
      );
    }
  };

  const handleAuthAction = () => {
    closeMobileMenu();

    if (authToken) {
      logout();
    } else {
      openLogin();
    }
  };

  return (
    <header className="navbar">
      <a
        className="brand"
        href="#home"
        onClick={closeMobileMenu}
      >
        <span className="brand-icon">
          <CarFront size={23} strokeWidth={2.5} />
          <span className="brand-dot" />
        </span>

        <span>
          Park<span className="yellow">Lite</span>
        </span>
      </a>

      <nav
        className={`nav-links ${
          mobileMenuOpen ? "mobile-open" : ""
        }`}
      >
        <a
          className="active"
          href="#home"
          onClick={closeMobileMenu}
        >
          Home
        </a>

        <a href="#parking" onClick={closeMobileMenu}>
          Find Parking
        </a>

        {authToken && (
          <button
  type="button"
  className="nav-bookings-link"
  onClick={() => {
    setMobileMenuOpen(false);
    onMyBookings?.();
  }}
>
            <ClipboardList size={16} />
            My Bookings
          </button>
        )}

        <a
          href="#how-it-works"
          onClick={closeMobileMenu}
        >
          How it works
        </a>

        {mobileMenuOpen && (
          <button
            type="button"
            className="nav-cta mobile-login"
            onClick={handleAuthAction}
          >
            {authToken ? "Log out" : "Log in"}
          </button>
        )}
      </nav>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <button
          type="button"
          className="nav-cta desktop-login"
          onClick={handleAuthAction}
          style={{ cursor: "pointer" }}
        >
          {authToken ? (
            "Log out"
          ) : (
            <>
              Log in <ArrowUpRight size={18} />
            </>
          )}
        </button>

        <button
          className="mobile-menu"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
          type="button"
          onClick={() =>
            setMobileMenuOpen((open) => !open)
          }
        >
          {mobileMenuOpen ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>
      </div>
    </header>
  );
}
