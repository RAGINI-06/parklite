
import { motion } from "framer-motion";
import { ArrowUpRight, MapPin, CarFront } from "lucide-react";

export default function ParkingCard({ parking, index, onBook }) {
  return (
    <motion.article
      className="parking-card"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="card-art">
        <div className="card-art-grid" />

        <span className="parking-type">{parking.type}</span>

        <CarFront size={72} strokeWidth={1.2} />

        <span className="card-availability">
          <span className="live-dot" />
          {parking.available == null
            ? "Check availability"
            : `${parking.available} spots available`}
        </span>
      </div>

      <div className="card-content">
        <div className="card-title-row">
          <h3>{parking.name}</h3>
          <ArrowUpRight size={19} />
        </div>

        <p className="card-location">
          <MapPin size={15} />
          {parking.location}
        </p>

        <div className="card-divider" />

        <div className="card-bottom">
          <div className="price">
            <strong>₹{parking.price}</strong>
            <span>/ hour</span>
          </div>

          <button
            type="button"
            className="card-btn"
            onClick={() => onBook(parking)}
          >
            Book parking <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
