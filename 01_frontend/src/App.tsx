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

// NOVO: Search mode type
type SearchMode = 'rest' | 'pipe'

function App() {
    const [amount, setAmount] = useState(6)
    const [genre, setGenre] = useState('')
    const [range, setRange] = useState(6)
    const [loading, setLoading] = useState(false)
    const [currentStep, setCurrentStep] = useState('')
    const [movies, setMovies] = useState<Movie[]>([])
    const [error, setError] = useState('')
    const [searchMode, setSearchMode] = useState<SearchMode>('rest')  // NOVO
    const [workerStatus, setWorkerStatus] = useState<'unknown' | 'available' | 'unavailable'>('unknown')  // NOVO

    // NOVO: Check worker health
    const checkWorkerHealth = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/health-pipe`)
            if (response.ok) {
                setWorkerStatus('available')
                return true
            } else {
                setWorkerStatus('unavailable')
                return false
            }
        } catch (err) {
            setWorkerStatus('unavailable')
            return false
        }
    }

    // ORIGINAL: REST API search
    const handleSearchREST = async () => {
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

    // NOVO: Named Pipe search
    const handleSearchPipe = async () => {
        setLoading(true)
        setError('')
        setMovies([])

        try {
            setCurrentStep('Checking worker availability...')
            const isHealthy = await checkWorkerHealth()

            if (!isHealthy) {
                throw new Error('Worker process is not available. Please start the worker first.')
            }

            setCurrentStep('Fetching movies via Named Pipe...')
            const response = await fetch(
                `${API_BASE_URL}/search-pipe?amount=${amount}&genre=${genre}&range=${range}`
            )

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || 'Failed to fetch movies via pipe')
            }

            const data: MovieListResponse = await response.json()
            setMovies(data.movies)
            setCurrentStep('')

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
            setCurrentStep('')
        } finally {
            setLoading(false)
        }
    }

    // NOVO: Unified handler
    const handleSearch = () => {
        if (searchMode === 'pipe') {
            handleSearchPipe()
        } else {
            handleSearchREST()
        }
    }

    return (
        <div className="container">
            <div className="form-section">
                {/* NOVO: Mode selector */}
                <div className="mode-selector">
                    <label>Search Mode:</label>
                    <div className="mode-buttons">
                        <button
                            className={`mode-button ${searchMode === 'rest' ? 'active' : ''}`}
                            onClick={() => setSearchMode('rest')}
                        >
                            HTTP/REST (Gemini API)
                        </button>
                        <button
                            className={`mode-button ${searchMode === 'pipe' ? 'active' : ''}`}
                            onClick={() => setSearchMode('pipe')}
                        >
                            Named Pipe (Worker)
                        </button>
                    </div>
                    {searchMode === 'pipe' && (
                        <div className={`worker-status ${workerStatus}`}>
                            Worker Status: {workerStatus === 'available' ? '✓ Available' :
                            workerStatus === 'unavailable' ? '✗ Unavailable' :
                                '? Unknown'}
                            {workerStatus !== 'available' && (
                                <button onClick={checkWorkerHealth} className="check-button">
                                    Check
                                </button>
                            )}
                        </div>
                    )}
                </div>

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
                        `Search Movies (${searchMode === 'pipe' ? 'via Pipe' : 'via REST'})`
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