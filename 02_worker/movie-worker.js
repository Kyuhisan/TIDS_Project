const net = require('net');

const PIPE_NAME = '\\\\.\\pipe\\tids_movie_worker';
const SAMPLE_MOVIES = {
    'Action': [
        {
            title: "Thunderstrike",
            director: "Michael Bay",
            releaseDate: "15.03.2025",
            runtime: "2 hours 15 minutes",
            leadActors: ["Tom Cruise", "Scarlett Johansson"],
            genre: ["Action", "Thriller"],
            description: "An elite soldier must stop a terrorist organization from launching a global attack."
        },
        {
            title: "Velocity",
            director: "James Cameron",
            releaseDate: "22.04.2025",
            runtime: "2 hours 30 minutes",
            leadActors: ["Dwayne Johnson", "Gal Gadot"],
            genre: ["Action", "Sci-Fi"],
            description: "In a dystopian future, street racers compete in deadly tournaments for survival."
        },
        {
            title: "Dark Phoenix Rising",
            director: "Christopher Nolan",
            releaseDate: "05.05.2025",
            runtime: "2 hours 40 minutes",
            leadActors: ["Christian Bale", "Emily Blunt"],
            genre: ["Action", "Drama"],
            description: "A vigilante rises from the shadows to protect the city from organized crime."
        }
    ],
    'Comedy': [
        {
            title: "Laugh Out Loud",
            director: "Judd Apatow",
            releaseDate: "10.05.2025",
            runtime: "1 hour 45 minutes",
            leadActors: ["Kevin Hart", "Amy Schumer"],
            genre: ["Comedy"],
            description: "Two unlikely friends open a comedy club and face hilarious challenges."
        },
        {
            title: "The Funny Business",
            director: "Adam McKay",
            releaseDate: "20.06.2025",
            runtime: "1 hour 55 minutes",
            leadActors: ["Will Ferrell", "Tina Fey"],
            genre: ["Comedy"],
            description: "A failing business gets an unexpected boost from a viral marketing campaign."
        }
    ],
    'Sci-Fi': [
        {
            title: "Quantum Paradox",
            director: "Denis Villeneuve",
            releaseDate: "18.06.2025",
            runtime: "2 hours 45 minutes",
            leadActors: ["Matthew McConaughey", "Anne Hathaway"],
            genre: ["Sci-Fi", "Drama"],
            description: "Scientists discover a way to communicate with parallel universes."
        },
        {
            title: "Stellar Horizon",
            director: "Ridley Scott",
            releaseDate: "12.07.2025",
            runtime: "2 hours 20 minutes",
            leadActors: ["Ryan Gosling", "Jessica Chastain"],
            genre: ["Sci-Fi", "Thriller"],
            description: "A deep space mission encounters an unknown alien intelligence."
        }
    ],
    'Drama': [
        {
            title: "Echoes of Tomorrow",
            director: "Damien Chazelle",
            releaseDate: "15.08.2025",
            runtime: "2 hours 10 minutes",
            leadActors: ["Emma Stone", "Oscar Isaac"],
            genre: ["Drama"],
            description: "A musician struggles to find meaning in life after a devastating loss."
        }
    ]
};

function generateMovies(amount, genre) {
    const movies = genre && SAMPLE_MOVIES[genre] ? [...SAMPLE_MOVIES[genre]] : Object.values(SAMPLE_MOVIES).flat();
    return movies.sort(() => 0.5 - Math.random()).slice(0, amount);
}

function processRequest(data) {
    try {
        const { action, amount, genre } = JSON.parse(data);

        if (action === 'search') {
            return JSON.stringify({ movies: generateMovies(amount || 5, genre || '') });
        }
        if (action === 'health') {
            return JSON.stringify({ status: 'ok' });
        }
        return JSON.stringify({ error: 'Unknown action' });
    } catch (error) {
        return JSON.stringify({ error: error.message });
    }
}

const server = net.createServer((stream) => {
    let buffer = '';

    stream.on('data', (data) => {
        buffer += data.toString();
        const messages = buffer.split('\n');
        buffer = messages.pop() || '';

        messages.forEach(message => {
            if (message.trim()) {
                const response = processRequest(message);
                const responseBuffer = Buffer.from(response, 'utf8');
                stream.write(responseBuffer.length + '\n');
                stream.write(responseBuffer);
            }
        });
    });
    stream.on('error', (err) => console.error('[ERROR]', err.message));
});

server.on('error', (err) => {
    console.error('[ERROR]', err.message);
    setTimeout(() => server.listen(PIPE_NAME), 2000);
});

server.listen(PIPE_NAME, () => console.log('[WORKER] Listening on', PIPE_NAME));

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));