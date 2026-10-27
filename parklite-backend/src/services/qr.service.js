
const QRCode = require("qrcode");
const crypto = require("crypto");

/**
 * Generates a unique, unpredictable QR token.
 * The token identifies a booking but contains no personal information.
 */
function generateQRToken() {
  return crypto.randomBytes(32).toString("hex");
}

async function generateBookingQR(token) {
  const payload = JSON.stringify({
    type: "PARKLITE_BOOKING",
    token,
  });

  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 300,
  });
}

module.exports = {
  generateQRToken,
  generateBookingQR,
};
