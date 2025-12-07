import { useState } from 'react'
import './App.css'
import MovieCard from './components/MovieCard'

const API_BASE_URL = 'http://localhost:8080/api/movies'
const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Animation']

interface Movie {
  title: string
  director: string
  releaseDate: string
  runtime: string
  leadActors: string[]
  genre: string[]
  description: string
}

interface MovieListResponse {
  movies: Movie[]
}

function App() {
  const [amount, setAmount] = useState(6)
  const [genre, setGenre] = useState('')
  const [range, setRange] = useState(6)
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState('')
  const [movies, setMovies] = useState<Movie[]>([])
  const [error, setError] = useState('')

  const handleSearch = async () => {
    setLoading(true)
    setError('')
    setMovies([])

    try {
      setCurrentStep('Fetching movie data from AI...')
      const searchRes = await fetch(
        `${API_BASE_URL}/search?amount=${amount}&genre=${genre}&range=${range}`
      )

      if (!searchRes.ok) {
          throw new Error('Failed to fetch movies')
      }
      const unstructured = await searchRes.text()

      setCurrentStep('Structuring data...')
      const structureRes = await fetch(`${API_BASE_URL}/structure`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: unstructured
      })

      if (!structureRes.ok) {
          throw new Error('Failed to structure data')
      }

      const structured: MovieListResponse = await structureRes.json()
      setMovies(structured.movies)
      setCurrentStep('')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setCurrentStep('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="form-section">
        <div className="form-row">
          <div className="form-group">
            <label>Genre:</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="form-select"
            >
              <option value="">Any Genre</option>
              {GENRES.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Amount of Movies:</label>
            <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 6)}
                className="form-input"
                min="1"
                max="20"
            />
          </div>

          <div className="form-group">
            <label>Time Range (months):</label>
            <input
              type="number"
              value={range}
              onChange={(e) => setRange(parseInt(e.target.value) || 6)}
              className="form-input"
              min="1"
              max="12"
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="search-button"
        >
          {loading ? (
            <span className="button-loading">
              <span className="spinner"></span>
              {currentStep}
            </span>
          ) : (
            'Search Movies'
          )}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {movies.length > 0 && (
        <div className="results-section">
          <h2>Found {movies.length} {movies.length === 1 ? 'movie' : 'movies'}</h2>
          <div className="cards-container">
            {movies.map((movie, index) => (
              <MovieCard key={index} movie={movie} index={index} />
            ))}
          </div>
        </div>
      )}

      {!loading && movies.length === 0 && !error && (
        <div className="empty-state">
          <p>No movies found. Try searching with different criteria.</p>
        </div>
      )}
    </div>
  )
}

export default App