import "./MovieCard.css";

export default function MovieCard({ movie, posterPath, title, subtitle, actions, onClick }) {
  const name = title ?? movie?.title;
  const poster = posterPath ?? movie?.poster_path;
  const id = movie?.id ?? movie?.movieId;

  return (
    <div
      className="movie-card"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      <div className="movie-card-poster">
        {poster ? (
          <img src={poster} alt={name} loading="lazy" />
        ) : (
          <div className="movie-card-placeholder">No poster</div>
        )}
        {subtitle && <span className="movie-card-subtitle">{subtitle}</span>}
      </div>
      <div className="movie-card-info">
        <h3 className="movie-card-title">{name}</h3>
        {movie?.release_date && (
          <span className="movie-card-year">
            {new Date(movie.release_date).getFullYear()}
          </span>
        )}
        {movie?.vote_average != null && (
          <span className="movie-card-rating">★ {movie.vote_average.toFixed(1)}</span>
        )}
        {actions && <div className="movie-card-actions">{actions}</div>}
      </div>
    </div>
  );
}
