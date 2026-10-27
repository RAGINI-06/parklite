
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CarFront,
  Clock3,
  ShieldCheck,
} from "lucide-react";

export default function Hero({ onFindParking, onRegister }) {
  return (
    
    <section className="hero-section" id="home">
      <div className="hero-grid-bg" />
      <div className="hero-glow hero-glow-one" />
      <div className="hero-glow hero-glow-two" />

      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="live-dot" />
            SMART PARKING, MADE SIMPLE
          </div>

          <h1 className="hero-title">
            Your parking spot.
            <br />
            <span>One tap away.</span>
          </h1>

          <p className="hero-description">
            Skip the endless search for parking. Discover available
            spaces, book ahead, and get on with your day — without
            the parking stress.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="hero-primary-btn"
              onClick={onFindParking}
            >
              Find parking
              <ArrowUpRight size={18} />
            </button>

            <button
              type="button"
              className="hero-secondary-btn"
              onClick={onRegister}
            >
              Create an account
              <ArrowRight size={17} />
            </button>
          </div>

          <div className="hero-trust">
            <ShieldCheck size={19} />
            <span>Simple booking. Clear pricing. Easy access.</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-parking-card">
            <div className="hero-card-top">
              <div>
                <span className="hero-card-label">
                  A BETTER WAY TO PARK
                </span>
                <h2>Arrive. Park. Go.</h2>
              </div>

              <div className="hero-card-icon">
                <CarFront size={25} />
              </div>
            </div>

            <div className="hero-parking-scene">
              <div className="scene-grid" />

              <div className="parking-bay bay-one">
                <span>P</span>
              </div>
              <div className="parking-bay bay-two">
                <span>P</span>
              </div>
              <div className="parking-bay bay-three">
                <span>P</span>
              </div>

              <div className="hero-car">
                <CarFront size={104} strokeWidth={1.15} />
              </div>

              <div className="scene-road-line" />
            </div>

            <div className="hero-card-bottom">
              <div className="hero-card-status">
                <span className="live-dot" />
                <span>Find your next spot</span>
              </div>

              <button
                type="button"
                className="hero-card-arrow"
                onClick={onFindParking}
                aria-label="Explore parking"
              >
                <ArrowUpRight size={20} />
              </button>
            </div>
          </div>

          <div className="hero-floating-note hero-floating-top">
            <div className="floating-note-icon">
              <Clock3 size={19} />
            </div>
            <div>
              <strong>Book ahead</strong>
              <span>Plan before you arrive</span>
            </div>
          </div>

          <div className="hero-floating-note hero-floating-bottom">
            <div className="floating-note-icon">
              <ShieldCheck size={19} />
            </div>
            <div>
              <strong>QR verification</strong>
              <span>Easy booking verification</span>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="hero-scroll"
        onClick={onFindParking}
      >
        Explore parking
        <ArrowDown size={15} />
      </button>
    </section>
  );
}
