
export default function StepCard({ number, title, description }) {
  return (
    <div className="step-card">
      <span className="step-number">{number}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
