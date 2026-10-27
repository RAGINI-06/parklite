
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  MapPin,
  Search,
  ShieldCheck,
  Clock3,
  CarFront,
  Zap,
  LoaderCircle,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  X,
  ClipboardList,
  RefreshCw,
  Ban,
} from "lucide-react";

import Navbar from "./components/Navbar";
import StepCard from "./components/StepCard";
import ParkingCard from "./components/ParkingCard";
import BookingQRCode from "./components/BookingQRCode";
import AuthModal from "./components/AuthModal";
import { api } from "./api";
import "./index.css";

function getPayload(response) {
  if (response?.data != null) return response.data;
  return response;
}

function getLots(response) {
  const payload = getPayload(response);

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.parkingLots)) return payload.parkingLots;
  if (Array.isArray(payload?.parking_lots)) return payload.parking_lots;
  if (Array.isArray(payload?.lots)) return payload.lots;
  if (Array.isArray(payload?.rows)) return payload.rows;

  return [];
}

function getBooking(response) {
  const payload = getPayload(response);
  const booking = payload?.booking ?? payload;

  return {
    ...booking,
    qrCode:
      payload?.qrCode ??
      payload?.qr_code ??
      booking?.qrCode ??
      booking?.qr_code ??
      booking?.qrImage ??
      booking?.qr_image ??
      null,
  };
}

function formatDateTime(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString();
}

function mapParkingLots(lots) {
  return lots.map((lot) => ({
    ...lot,
    id: lot.id ?? lot.parkingLotId ?? lot.parking_lot_id,
    name: lot.name ?? lot.lot_name ?? lot.lotName ?? "Parking location",
    location:
      [lot.address, lot.city].filter(Boolean).join(", ") ||
      lot.location ||
      "Location not specified",
    price: Number(
      lot.hourlyRate ?? lot.hourly_rate ?? lot.rate ?? 0
    ),
    available:
      lot.availableSpots ??
      lot.available_spots ??
      lot.availableSpaces ??
      lot.available_spaces ??
      lot.available ??
      null,
    total: Number(
      lot.totalCapacity ?? lot.total_capacity ?? lot.capacity ?? 0
    ),
    type:
      lot.type ?? lot.parking_type ?? lot.parkingType ?? "Parking",
  }));
}

function toLocalDateTime(date) {
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 16);
}

function getBookingId(booking) {
  return booking.id ?? booking.bookingId ?? booking.booking_id;
}

function getBookingStatus(booking) {
  return String(
    booking.status ??
      booking.bookingStatus ??
      booking.booking_status ??
      "BOOKED"
  ).toUpperCase();
}

function getBookingQr(booking) {
  return (
    booking.qrCode ??
    booking.qr_code ??
    booking.qrImage ??
    booking.qr_image ??
    null
  );
}

function getBookingName(booking) {
  return (
    booking.parkingLotName ??
    booking.parking_lot_name ??
    booking.lotName ??
    booking.lot_name ??
    booking.parkingLot?.name ??
    booking.parking_lot?.name ??
    booking.name ??
    "Parking reservation"
  );
}

function App() {
  const [location, setLocation] = useState("");
  const [parkingLocations, setParkingLocations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loadingParking, setLoadingParking] = useState(true);
  const [apiError, setApiError] = useState("");

  const [authToken, setAuthToken] = useState(
    () => localStorage.getItem("parklite_token") || ""
  );
  const [authMode, setAuthMode] = useState("login");
  const [authOpen, setAuthOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authForm, setAuthForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  // My Bookings state
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  // Booking modal state
  const [selectedParking, setSelectedParking] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [bookingResult, setBookingResult] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    vehicle_number: "",
    start_time: "",
    end_time: "",
  });

  // Load parking locations when the app opens.
  useEffect(() => {
    let cancelled = false;

    async function loadParking() {
      setLoadingParking(true);
      setApiError("");

      try {
        const response = await api.getParkingLots();
        const mappedLots = mapParkingLots(getLots(response));

        if (!cancelled) {
          setParkingLocations(mappedLots);
          setFiltered(mappedLots);
        }
      } catch (error) {
        if (!cancelled) {
          setApiError(
            error.message ||
              "Could not connect to the parking server. Check that your backend is running."
          );
        }
      } finally {
        if (!cancelled) setLoadingParking(false);
      }
    }

    loadParking();

    return () => {
      cancelled = true;
    };
  }, []);

  function searchParking(event) {
    event.preventDefault();

    const query = location.trim().toLowerCase();

    setFiltered(
      parkingLocations.filter((parking) =>
        `${parking.name} ${parking.location} ${parking.type}`
          .toLowerCase()
          .includes(query)
      )
    );

    document.getElementById("parking")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  function openBooking(parking) {
    setSelectedParking(parking);
    setBookingError("");
    setBookingSuccess("");
    setBookingResult(null);

    const startDate = new Date(Date.now() + 5 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    setBookingForm({
      vehicle_number: "",
      start_time: toLocalDateTime(startDate),
      end_time: toLocalDateTime(endDate),
    });

    if (!authToken) {
      setAuthMode("login");
      setAuthError("");
      setAuthSuccess("");
      setAuthOpen(true);
    }
  }

  // Register or log in.
  async function submitAuth(event) {
    event.preventDefault();

    setAuthLoading(true);
    setAuthError("");
    setAuthSuccess("");

    try {
      const credentials = {
        email: authForm.email.trim(),
        password: authForm.password,
      };

      let response;

      if (authMode === "register") {
        response = await api.register({
          fullName: authForm.fullName.trim(),
          ...credentials,
        });
      } else {
        response = await api.login(credentials);
      }

      const payload = getPayload(response);
      const token =
        payload?.token ??
        payload?.accessToken ??
        payload?.access_token ??
        payload?.data?.token ??
        response?.token;

      if (token) {
        localStorage.setItem("parklite_token", token);
        setAuthToken(token);
        setAuthOpen(false);
        setAuthError("");
        setAuthSuccess("");
        setAuthForm({
          fullName: "",
          email: "",
          password: "",
        });
      } else if (authMode === "register") {
        setAuthMode("login");
        setAuthSuccess(
          "Account created. Please log in with your new account."
        );
        setAuthForm({
          fullName: "",
          email: authForm.email,
          password: "",
        });
      } else {
        throw new Error(
          "Login response did not include a token. Check your backend response format."
        );
      }
    } catch (error) {
      setAuthError(error.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("parklite_token");
    setAuthToken("");
    setBookingSuccess("");
    setBookingResult(null);
    setShowMyBookings(false);
    setMyBookings([]);
    setAuthOpen(false);
  }

  // Load the current user's bookings.
  async function loadMyBookings() {
    const token = localStorage.getItem("parklite_token");

    if (!token) {
      setAuthMode("login");
      setAuthError("");
      setAuthSuccess("Please log in to view your bookings.");
      setAuthOpen(true);
      setShowMyBookings(false);
      return;
    }

    setBookingsLoading(true);
    setBookingsError("");
    setShowMyBookings(true);

    try {
      const response = await api.getMyBookings(token);
      const payload = getPayload(response);

      const bookings = Array.isArray(payload)
        ? payload
        : payload?.bookings ??
          payload?.rows ??
          payload?.data?.bookings ??
          [];

      if (!Array.isArray(bookings)) {
        throw new Error(
          "The bookings API returned an unexpected response format."
        );
      }

      setMyBookings(bookings);
    } catch (error) {
      setBookingsError(
        error.message || "Could not load your bookings."
      );
    } finally {
      setBookingsLoading(false);
    }
  }

  // Refresh parking locations after a booking change.
  async function refreshParkingLots() {
    try {
      const response = await api.getParkingLots();
      const lots = mapParkingLots(getLots(response));

      setParkingLocations(lots);

      const query = location.trim().toLowerCase();

      setFiltered(
        lots.filter((parking) =>
          `${parking.name} ${parking.location} ${parking.type}`
            .toLowerCase()
            .includes(query)
        )
      );
    } catch (error) {
      console.error("Could not refresh parking locations:", error);
    }
  }

  async function handleCancelBooking(bookingId) {
    if (bookingId == null) return;

    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    setCancellingId(bookingId);
    setBookingsError("");

    try {
      const token = localStorage.getItem("parklite_token");

      if (!token) throw new Error("Please log in again.");

      await api.cancelBooking(bookingId, token);
      await loadMyBookings();
      await refreshParkingLots();
    } catch (error) {
      setBookingsError(
        error.message || "Could not cancel this booking."
      );
    } finally {
      setCancellingId(null);
    }
  }

  function returnHome() {
    setShowMyBookings(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Check availability for the next hour using the dedicated API endpoint.
  async function handleCheckAvailability(parking) {
    const parkingLotId = Number(parking.id);

    if (!Number.isInteger(parkingLotId) || parkingLotId <= 0) {
      window.alert(
        "Invalid parking lot ID. Please refresh the parking page."
      );
      return;
    }

    const start = new Date(Date.now() + 5 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    try {
      if (typeof api.checkAvailability !== "function") {
        throw new Error(
          "The availability API method is missing. Add checkAvailability() to src/api.js."
        );
      }

      const response = await api.checkAvailability(
        parkingLotId,
        start.toISOString(),
        end.toISOString()
      );

      const payload = getPayload(response);
      const result =
        payload?.availability ??
        payload?.data?.availability ??
        payload;

      const available =
        result?.availableSpaces ??
        result?.available_spaces ??
        result?.availableSpots ??
        result?.available_spots ??
        result?.available;

      if (available == null || Number.isNaN(Number(available))) {
        console.error("Unexpected availability response:", response);
        window.alert(
          "The server responded, but the available-spots count was missing. Check the browser console."
        );
        return;
      }

      window.alert(
        `${result?.name ?? parking.name}\n\n` +
          `Available spots: ${available}\n` +
          `Total capacity: ${
            result?.totalCapacity ??
            result?.total_capacity ??
            parking.total ??
            "Unknown"
          }\n` +
          `Time checked: ${formatDateTime(start)} – ${formatDateTime(end)}`
      );

      // Refresh the parking list to update the displayed counts.
      await refreshParkingLots();
    } catch (error) {
      window.alert(
        error.message || "Could not check parking availability."
      );
    }
  }

  // Submit a new parking booking.
  async function submitBooking(event) {
    event.preventDefault();

    setBookingError("");
    setBookingSuccess("");
    setBookingResult(null);

    const token = localStorage.getItem("parklite_token");

    if (!token) {
      setAuthToken("");
      setAuthMode("login");
      setAuthError("");
      setAuthSuccess("");
      setAuthOpen(true);
      setBookingError("Please log in before making a booking.");
      return;
    }

    if (!selectedParking) {
      setBookingError("Please select a parking location.");
      return;
    }

    const rawLotId =
      selectedParking.id ??
      selectedParking.parkingLotId ??
      selectedParking.parking_lot_id;

    const parkingLotId = Number(rawLotId);

    if (
      rawLotId == null ||
      rawLotId === "" ||
      !Number.isInteger(parkingLotId) ||
      parkingLotId <= 0
    ) {
      setBookingError(
        "A valid parking lot ID is missing. Refresh the parking list and select a location again."
      );
      return;
    }

    const vehicleNumber = bookingForm.vehicle_number.trim().toUpperCase();

    if (!/^[A-Z0-9 -]{4,20}$/.test(vehicleNumber)) {
      setBookingError(
        "Enter a valid vehicle number using 4–20 letters, numbers, spaces or hyphens."
      );
      return;
    }

    const startDate = new Date(bookingForm.start_time);
    const endDate = new Date(bookingForm.end_time);

    if (
      !bookingForm.start_time ||
      !bookingForm.end_time ||
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate <= new Date() ||
      endDate <= startDate
    ) {
      setBookingError(
        "Choose a future start time and an end time later than the start time."
      );
      return;
    }

    const bookingPayload = {
      parkingLotId,
      vehicleNumber,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    };

    setBookingLoading(true);

    try {
      const response = await api.createBooking(bookingPayload, token);
      const booking = getBooking(response);

      setBookingResult(booking);
      setBookingSuccess("Your parking booking was created successfully.");

      await refreshParkingLots();
    } catch (error) {
      const message = error.message || "Could not create the booking.";

      if (
        message.toLowerCase().includes("token") ||
        message.includes("401")
      ) {
        localStorage.removeItem("parklite_token");
        setAuthToken("");
      }

      setBookingError(message);
    } finally {
      setBookingLoading(false);
    }
  }

  function closeBooking() {
    setSelectedParking(null);
    setBookingError("");
    setBookingSuccess("");
    setBookingResult(null);
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <Navbar
        authToken={authToken}
        logout={logout}
        setAuthMode={setAuthMode}
        setAuthError={setAuthError}
        setAuthSuccess={setAuthSuccess}
        setAuthOpen={setAuthOpen}
        onMyBookings={loadMyBookings}
      />

      <main>
        {showMyBookings ? (
          <section
            className="parking-section"
            style={{ minHeight: "65vh", paddingTop: 60 }}
          >
            <div className="section-heading">
              <div>
                <span className="eyebrow">YOUR PARKING ACTIVITY</span>
                <h2>
                  My <span className="yellow">Bookings.</span>
                </h2>
                <p>
                  View your reservations and manage your parking plans.
                </p>
              </div>

              <button
                type="button"
                className="secondary-btn"
                onClick={loadMyBookings}
                disabled={bookingsLoading}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            {bookingsError && (
              <div className="empty-state" role="alert">
                <AlertCircle size={28} />
                <h3>Unable to load bookings</h3>
                <p>{bookingsError}</p>
              </div>
            )}

            {bookingsLoading ? (
              <div className="empty-state" role="status">
                <LoaderCircle size={28} className="spin-icon" />
                <h3>Loading your bookings...</h3>
              </div>
            ) : myBookings.length === 0 && !bookingsError ? (
              <div className="empty-state">
                <ClipboardList size={32} />
                <h3>No bookings yet</h3>
                <p>Your parking reservations will appear here.</p>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => {
                    setShowMyBookings(false);
                    document.getElementById("parking")?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                >
                  Find parking <ArrowUpRight size={18} />
                </button>
              </div>
            ) : (
              !bookingsLoading && (
                <div className="parking-grid">
                  {myBookings.map((booking, index) => {
                    const bookingId = getBookingId(booking);
                    const status = getBookingStatus(booking);
                    const qrCode = getBookingQr(booking);

                    return (
                      <motion.article
                        key={bookingId ?? index}
                        className="parking-card"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="parking-card-content">
                          <span className="eyebrow">
                            BOOKING #{bookingId ?? "—"}
                          </span>

                          <h3>{getBookingName(booking)}</h3>

                          <p>
                            <CarFront size={16} />{" "}
                            {booking.vehicleNumber ??
                              booking.vehicle_number ??
                              "Vehicle not specified"}
                          </p>

                          <p>
                            <MapPin size={16} />{" "}
                            {booking.address ??
                              booking.parkingAddress ??
                              booking.parking_address ??
                              booking.location ??
                              "Location details unavailable"}
                          </p>

                          <p>
                            <CalendarClock size={16} /> Start:{" "}
                            {formatDateTime(
                              booking.startTime ?? booking.start_time
                            )}
                          </p>

                          <p>
                            <Clock3 size={16} /> End:{" "}
                            {formatDateTime(
                              booking.endTime ?? booking.end_time
                            )}
                          </p>

                          <p>
                            Status: <strong>{status}</strong>
                          </p>

                          {(booking.bookingReference ??
                            booking.booking_reference) && (
                            <p>
                              Reference:{" "}
                              <strong>
                                {booking.bookingReference ??
                                  booking.booking_reference}
                              </strong>
                            </p>
                          )}

                          {qrCode ? (
                            <div style={{ marginTop: 16 }}>
                              <p>
                                Show this QR code to the guard at entry and
                                exit.
                              </p>
                              <img
                                src={qrCode}
                                alt="Parking booking QR code"
                                style={{
                                  width: 180,
                                  maxWidth: "100%",
                                  background: "#fff",
                                  padding: 8,
                                  borderRadius: 10,
                                }}
                              />
                            </div>
                          ) : (
                            <p style={{ fontSize: 13, opacity: 0.75 }}>
                              QR code is not available in the booking response.
                            </p>
                          )}

                          {["BOOKED", "CONFIRMED", "PENDING"].includes(
                            status
                          ) && (
                            <button
                              type="button"
                              className="secondary-btn"
                              style={{ marginTop: 16 }}
                              disabled={
                                cancellingId === bookingId ||
                                bookingId == null
                              }
                              onClick={() =>
                                handleCancelBooking(bookingId)
                              }
                            >
                              <Ban size={16} />
                              {cancellingId === bookingId
                                ? "Cancelling..."
                                : "Cancel booking"}
                            </button>
                          )}
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              )
            )}

            <button
              type="button"
              className="secondary-btn"
              style={{ marginTop: 24 }}
              onClick={returnHome}
            >
              <ArrowUpRight
                size={16}
                style={{ transform: "rotate(180deg)" }}
              />
              Back to home
            </button>
          </section>
        ) : (
          <>
            {/* HOME HERO */}
            <section className="hero" id="home">
              <motion.div
                className="hero-copy"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="eyebrow">
                  <span className="live-dot" />
                  SMART PARKING. LESS STRESS.
                </div>

                <h1>
                  Your parking.
                  <br />
                  <span className="hero-highlight">Your time.</span>
                  <br />
                  Your way.
                </h1>

                <p className="hero-description">
                  Find a spot before you arrive. Compare prices, check
                  availability and reserve parking without the last-minute
                  hunt.
                </p>

                <div className="hero-actions">
                  <a className="primary-btn" href="#parking">
                    Find my parking <ArrowUpRight size={19} />
                  </a>
                  <a className="secondary-btn" href="#how-it-works">
                    How it works
                  </a>
                </div>

                <div className="hero-trust">
                  <div className="trust-item">
                    <ShieldCheck size={19} />
                    <span>Secure bookings</span>
                  </div>
                  <div className="trust-item">
                    <Clock3 size={19} />
                    <span>Save your time</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="hero-visual"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
              >
                <div className="visual-top">
                  <span className="visual-label">PARKING OVERVIEW</span>
                  <span className="live-status">
                    <span className="live-dot" /> LIVE PREVIEW
                  </span>
                </div>

                <div className="parking-art">
                  <div className="art-grid" />

                  <div className="parking-lines">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div className="parking-slot" key={i}>
                        <span className="slot-number">P{i + 1}</span>
                        <CarFront
                          className={`slot-car ${
                            i === 2 ? "featured-car" : ""
                          }`}
                          size={i === 2 ? 38 : 31}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="map-pin pin-one">
                    <MapPin size={16} /> Available
                  </div>
                  <div className="map-pin pin-two">
                    <MapPin size={16} /> Your destination
                  </div>

                  <div className="art-caption">
                    <span className="caption-icon">
                      <Zap size={17} />
                    </span>
                    <div>
                      <strong>Park smarter.</strong>
                      <p>Spend less time searching.</p>
                    </div>
                  </div>
                </div>

                <div className="visual-stats">
                  <div>
                    <span className="stat-label">Availability</span>
                    <strong>
                      {loadingParking
                        ? "Loading locations..."
                        : apiError
                          ? "Connection needed"
                          : `${parkingLocations.length} locations loaded`}
                    </strong>
                  </div>

                  <div className="stat-right">
                    <span className="availability-bars">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="stat-label">Find your spot</span>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* SEARCH */}
            <section className="search-section">
              <form className="search-bar" onSubmit={searchParking}>
                <div className="search-field">
                  <MapPin size={22} />
                  <div className="search-input-wrap">
                    <label htmlFor="location">WHERE ARE YOU GOING?</label>
                    <input
                      id="location"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      placeholder="Search parking or area..."
                    />
                  </div>
                </div>

                <button type="submit" className="search-btn">
                  <Search size={19} /> Find parking
                </button>
              </form>

              <p className="search-hint">
                Search by parking name, address or city
              </p>
            </section>

            {/* PARKING LIST */}
            <section className="parking-section" id="parking">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">YOUR NEXT PARKING SPOT</span>
                  <h2>
                    Parking, <span className="yellow">simplified.</span>
                  </h2>
                  <p>
                    Parking locations loaded from the ParkLite backend.
                  </p>
                </div>

                <span className="results-count">
                  {filtered.length} locations
                </span>
              </div>

              {loadingParking && (
                <div className="empty-state" role="status">
                  <LoaderCircle size={28} className="spin-icon" />
                  <h3>Loading parking locations...</h3>
                  <p>Connecting to your parking server.</p>
                </div>
              )}

              {!loadingParking && apiError && (
                <div className="empty-state" role="alert">
                  <AlertCircle size={28} />
                  <h3>Could not load parking locations</h3>
                  <p>{apiError}</p>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => window.location.reload()}
                  >
                    Try again
                  </button>
                </div>
              )}

              {!loadingParking && !apiError && (
                <>
                  <div className="parking-grid">
                    {filtered.map((parking, index) => (
                      <ParkingCard
                        key={parking.id ?? parking.name}
                        parking={parking}
                        index={index}
                        onBook={openBooking}
                        onCheckAvailability={handleCheckAvailability}
                      />
                    ))}
                  </div>

                  {filtered.length === 0 && (
                    <div className="empty-state">
                      <Search size={28} />
                      <h3>No matching parking locations</h3>
                      <p>Try another location or parking name.</p>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => {
                          setLocation("");
                          setFiltered(parkingLocations);
                        }}
                      >
                        Show all locations
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* HOW IT WORKS */}
            <section className="how-section" id="how-it-works">
              <span className="eyebrow">THREE STEPS. ZERO HASSLE.</span>

              <h2>
                From search to <span className="yellow">parked.</span>
              </h2>

              <div className="steps-grid">
                {[
                  [
                    "01",
                    "Find a spot",
                    "Search parking locations and compare availability.",
                  ],
                  [
                    "02",
                    "Reserve your space",
                    "Choose your duration and review the estimated cost.",
                  ],
                  [
                    "03",
                    "Arrive and park",
                    "Show your booking QR code to the parking guard.",
                  ],
                ].map(([number, title, description]) => (
                  <StepCard
                    key={number}
                    number={number}
                    title={title}
                    description={description}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <a
          className="brand"
          href="#home"
          onClick={() => setShowMyBookings(false)}
        >
          <span className="brand-icon">
            <CarFront size={21} />
          </span>
          <span>
            Park<span className="yellow">Lite</span>
          </span>
        </a>

        <p>Built for a smarter parking experience.</p>
        <span className="footer-copy">© 2026 ParkLite</span>
      </footer>

      <AuthModal
        authMode={authMode}
        setAuthMode={setAuthMode}
        authOpen={authOpen}
        setAuthOpen={setAuthOpen}
        authLoading={authLoading}
        authError={authError}
        authSuccess={authSuccess}
        authForm={authForm}
        setAuthForm={setAuthForm}
        submitAuth={submitAuth}
      />

      {/* BOOKING MODAL */}
      {selectedParking && (
        <div
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeBooking();
          }}
          style={overlayStyle}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-title"
            style={modalStyle}
          >
            <button
              type="button"
              aria-label="Close booking"
              onClick={closeBooking}
              style={closeButtonStyle}
            >
              <X size={20} />
            </button>

            {!bookingSuccess ? (
              <>
                <div style={modalIconStyle}>
                  <CalendarClock size={24} />
                </div>

                <h2 id="booking-title" style={{ margin: "0 0 8px" }}>
                  Reserve your spot
                </h2>

                <p style={{ color: "#697267", marginTop: 0, fontSize: 14 }}>
                  {selectedParking.name}
                </p>

                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "#697267",
                  }}
                >
                  <MapPin size={15} />
                  {selectedParking.location}
                </p>

                {!authToken && (
                  <p style={errorBoxStyle}>
                    Please log in to continue with your booking.
                    <button
                      type="button"
                      style={{ ...textButtonStyle, marginLeft: 5 }}
                      onClick={() => {
                        setAuthMode("login");
                        setAuthError("");
                        setAuthSuccess("");
                        setAuthOpen(true);
                      }}
                    >
                      Log in
                    </button>
                  </p>
                )}

                {bookingError && (
                  <p style={errorBoxStyle} role="alert">
                    {bookingError}
                  </p>
                )}

                <form
                  onSubmit={submitBooking}
                  style={{ display: "grid", gap: 14, marginTop: 18 }}
                >
                  <label style={labelStyle}>
                    Vehicle number
                    <input
                      required
                      style={inputStyle}
                      value={bookingForm.vehicle_number}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          vehicle_number: event.target.value.toUpperCase(),
                        })
                      }
                      placeholder="e.g. UP32AB1234"
                    />
                  </label>

                  <label style={labelStyle}>
                    Start time
                    <input
                      required
                      type="datetime-local"
                      style={inputStyle}
                      min={toLocalDateTime(new Date())}
                      value={bookingForm.start_time}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          start_time: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label style={labelStyle}>
                    End time
                    <input
                      required
                      type="datetime-local"
                      style={inputStyle}
                      min={bookingForm.start_time || undefined}
                      value={bookingForm.end_time}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          end_time: event.target.value,
                        })
                      }
                    />
                  </label>

                  <div
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      background: "#f4f7ef",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: 14, color: "#697267" }}>
                      Hourly rate
                    </span>
                    <strong style={{ fontSize: 18 }}>
                      ₹{selectedParking.price}/hour
                    </strong>
                  </div>

                  <button
                    type="submit"
                    disabled={bookingLoading || !authToken}
                    style={{
                      ...primaryStyle,
                      opacity: bookingLoading || !authToken ? 0.65 : 1,
                    }}
                  >
                    {bookingLoading
                      ? "Creating booking..."
                      : "Confirm booking"}
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: "center" }}>
                <CheckCircle2
                  size={44}
                  color="#4b8c32"
                  style={{ marginBottom: 10 }}
                />

                <h2 id="booking-title">Booking confirmed!</h2>

                <p style={{ color: "#697267", fontSize: 14 }}>
                  {bookingSuccess}
                </p>

                <BookingQRCode
                  qrCode={bookingResult?.qrCode ?? bookingResult?.qr_code}
                  qrToken={
                    bookingResult?.qrToken ??
                    bookingResult?.qr_token
                  }
                  bookingReference={
                    bookingResult?.bookingReference ??
                    bookingResult?.booking_reference
                  }
                />

                {(bookingResult?.startTime ??
                  bookingResult?.start_time) && (
                  <p style={{ fontSize: 13, color: "#697267" }}>
                    Start:{" "}
                    {formatDateTime(
                      bookingResult.startTime ?? bookingResult.start_time
                    )}
                  </p>
                )}

                {(bookingResult?.endTime ??
                  bookingResult?.end_time) && (
                  <p style={{ fontSize: 13, color: "#697267" }}>
                    End:{" "}
                    {formatDateTime(
                      bookingResult.endTime ?? bookingResult.end_time
                    )}
                  </p>
                )}

                <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
                  <button
                    type="button"
                    style={primaryStyle}
                    onClick={() => {
                      closeBooking();
                      loadMyBookings();
                    }}
                  >
                    <ClipboardList
                      size={17}
                      style={{
                        display: "inline",
                        verticalAlign: "middle",
                        marginRight: 8,
                      }}
                    />
                    View my bookings
                  </button>

                  <button
                    type="button"
                    style={{ ...primaryStyle, background: "#f1f4ee" }}
                    onClick={closeBooking}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
  cursor: "pointer",
  fontSize: "14px",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
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

const textButtonStyle = {
  border: "none",
  padding: 0,
  background: "transparent",
  color: "#426a25",
  fontWeight: 700,
  cursor: "pointer",
};

export default App;
