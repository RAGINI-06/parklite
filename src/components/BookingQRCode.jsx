
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function BookingQRCode({
  qrCode,
  qrToken,
  bookingReference,
}) {
  const [generatedQR, setGeneratedQR] = useState("");
  const [qrError, setQrError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function generateQR() {
      setGeneratedQR("");
      setQrError("");

      if (
        typeof qrCode === "string" &&
        /^(data:image\/|https:\/\/)/.test(qrCode)
      ) {
        setGeneratedQR(qrCode);
        return;
      }

      if (typeof qrToken !== "string" || !qrToken.trim()) {
        setQrError("The backend has not provided a booking QR token yet.");
        return;
      }

      try {
        const image = await QRCode.toDataURL(qrToken, {
          width: 240,
          margin: 2,
          errorCorrectionLevel: "M",
        });

        if (!cancelled) {
          setGeneratedQR(image);
        }
      } catch (error) {
        console.error("QR generation failed:", error);

        if (!cancelled) {
          setQrError("Could not generate the booking QR code.");
        }
      }
    }

    generateQR();

    return () => {
      cancelled = true;
    };
  }, [qrCode, qrToken]);

  return (
    <section className="booking-qr-card">
      <div className="booking-qr-header">
        <div>
          <h3>Your Parking QR Code</h3>
          <p>Show this code to your parking guard.</p>
        </div>
        {generatedQR && (
          <span className="qr-status">Ready to scan</span>
        )}
      </div>

      {generatedQR ? (
        <div className="booking-qr-image">
          <img
            src={generatedQR}
            alt={`Parking QR code for booking ${bookingReference || ""}`}
          />
        </div>
      ) : (
        <p className="qr-empty">
          {qrError || "Generating QR code..."}
        </p>
      )}

      {bookingReference && (
        <p className="booking-qr-reference">
          Booking reference: <strong>{bookingReference}</strong>
        </p>
      )}

      <p className="booking-qr-instructions">
        Keep this code available on your phone. Present it at entry
        and exit. The backend must validate the token before approving
        either action.
      </p>
    </section>
  );
}
