/**
 * The DeskFlow lifebuoy mark as an SVG, used as a soft watermark.
 * Colour comes from `currentColor`; the four gaps in the ring use --brand-gap (set it to the surface colour behind it).
 */
export default function BrandMark({ className = '' }) {
  return (
    <svg viewBox="-10 -10 120 120" aria-hidden="true" className={className} fill="none">
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="18" />
      {[45, 135, 225, 315].map((deg) => (
        <line key={deg} x1="50" y1="14" x2="50" y2="-6" stroke="var(--brand-gap, #4f46e5)" strokeWidth="13" transform={`rotate(${deg} 50 50)`} />
      ))}
    </svg>
  );
}
