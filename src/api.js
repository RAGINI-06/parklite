
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

async function request(path, options = {}) {
  const { token, headers, ...fetchOptions } = options;

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers: {
        ...(fetchOptions.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch (error) {
    console.error("ParkLite network error:", error);

    throw new Error(
      `Cannot reach backend at ${API_BASE_URL}. Check the backend port and CORS settings.`
    );
  }

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      message: text || "The server returned an invalid response.",
    };
  }

  console.log(`ParkLite API: ${path}`, response.status, data);

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        `Backend returned HTTP ${response.status}`
    );
  }

  return data;
}

export const api = {
  getParkingLots() {
    return request("/parking-lots");
  },
  
checkAvailability(parkingLotId, startTime, endTime) {
  const params = new URLSearchParams({
    startTime,
    endTime,
  });

  return request(
    `/parking-lots/${parkingLotId}/availability?${params.toString()}`
  );
},


  register(user) {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(user),
    });
  },


  login(credentials) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  createBooking(booking, token) {
    return request("/bookings", {
      method: "POST",
      token,
      body: JSON.stringify(booking),
    });
  },
  getMyBookings(token) {
  return request("/bookings/my", {
    method: "GET",
    token,
  });
},

cancelBooking(bookingId, token) {
  return request(`/bookings/${bookingId}/cancel`, {
    method: "PATCH",
    token,
  });
},
};

export { API_BASE_URL }
