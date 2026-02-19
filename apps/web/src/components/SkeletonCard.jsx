export default function SkeletonCard({ width = 160, height = 240 }) {
  return (
    <div className="skeleton-card" style={{ width, height }}>
      <div className="skeleton-poster" />
      <div className="skeleton-line short" />
      <div className="skeleton-line" />
    </div>
  );
}
