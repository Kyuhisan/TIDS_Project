interface Movie {
  title: string
  director: string
  releaseDate: string
  runtime: string
  leadActors: string[]
  genre: string[]
  description: string
}

interface MovieCardProps {
  movie: Movie
  index: number
}

export default function MovieCard({ movie, index }: MovieCardProps) {
  return (
    <div className="movie-card">
      <div className="card-header">
        <div className="card-number">{index + 1}</div>
        <h3 className="card-title">{movie.title}</h3>
      </div>
      <div className="card-body">
        <div className="card-info">
          <span className="info-label">Director:</span>
          <span className="info-value">{movie.director}</span>
        </div>
        <div className="card-info">
          <span className="info-label">Release Date:</span>
          <span className="info-value">{movie.releaseDate}</span>
        </div>
        <div className="card-info">
          <span className="info-label">Runtime:</span>
          <span className="info-value">{movie.runtime}</span>
        </div>
        <div className="card-info">
          <span className="info-label">Genre:</span>
          <span className="info-value genre-tags">
            {movie.genre.map((g, i) => (
              <span key={i} className="genre-tag">{g}</span>
            ))}
          </span>
        </div>
        <div className="card-info">
          <span className="info-label">Lead Actors:</span>
          <span className="info-value">{movie.leadActors.join(', ')}</span>
        </div>
        <div className="card-description">
          <span className="info-label">Description:</span>
          <p>{movie.description}</p>
        </div>
      </div>
    </div>
  )
}
