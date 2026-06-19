const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load environment variables
require('dotenv').config();

const DB_PATH = path.join(__dirname, 'data.json');
const apiKey = process.env.TMDB_API_KEY;

const movieTitles = [

];

// Helper to fetch from URL using native fetch (or fallback to https/http)
const fetchURL = async (url) => {
    if (typeof fetch === 'function') {
        const res = await fetch(url);
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`HTTP status ${res.status} - ${text.trim()}`);
        }
        return await res.json();
    }
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        lib.get(url, (res) => {
            res.setEncoding('utf8');
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    return reject(new Error(`HTTP status ${res.statusCode} - ${body.trim()}`));
                }
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(new Error("Invalid JSON response"));
                }
            });
        }).on('error', reject);
    });
};

const run = async () => {
    console.log("Starting bulk database expansion using TMDB API...");

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_')) {
        console.error("❌ Error: TMDB_API_KEY is not defined. Please create a server/.env file and set TMDB_API_KEY.");
        process.exit(1);
    }

    // Check if database exists, if not initialize it
    if (!fs.existsSync(DB_PATH)) {
        console.log("Database file data.json not found. Initializing empty database structure...");
        fs.writeFileSync(DB_PATH, JSON.stringify({ movies: [], logs: [], lists: [], profile: {} }, null, 2), 'utf8');
    }

    let db;
    try {
        db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch (e) {
        console.error("Error reading data.json:", e);
        try {
            if (fs.existsSync(DB_PATH)) {
                const backupPath = `${DB_PATH}.corrupt-${Date.now()}`;
                fs.copyFileSync(DB_PATH, backupPath);
                console.warn(`⚠️ Warning: Corrupted database backed up to ${backupPath}`);
            }
        } catch (backupErr) {
            console.error('Failed to create backup of corrupted database:', backupErr);
        }
        db = { movies: [], logs: [], lists: [], profile: {} };
    }

    if (!db.movies) db.movies = [];

    // Dynamically fetch top rated and trending movies from TMDB if possible
    let targetTitles = [...movieTitles];
    try {
        console.log("Fetching top rated movies list from TMDB API (Pages 1-25)...");
        const allTitles = [];
        for (let page = 1; page <= 25; page++) {
            const topRatedUrl = `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&page=${page}`;
            const topRatedData = await fetchURL(topRatedUrl);
            if (topRatedData.results && topRatedData.results.length > 0) {
                topRatedData.results.forEach(m => {
                    if (m.title && !allTitles.includes(m.title)) {
                        allTitles.push(m.title);
                    }
                });
            }
        }
        
        console.log("Fetching trending movies list from TMDB API (Pages 1-10)...");
        for (let page = 1; page <= 10; page++) {
            const trendingUrl = `https://api.themoviedb.org/3/trending/movie/day?api_key=${apiKey}&page=${page}`;
            const trendingData = await fetchURL(trendingUrl);
            if (trendingData.results && trendingData.results.length > 0) {
                trendingData.results.forEach(m => {
                    if (m.title && !allTitles.includes(m.title)) {
                        allTitles.push(m.title);
                    }
                });
            }
        }
        
        if (allTitles.length > 0) {
            targetTitles = allTitles;
            console.log(`Successfully retrieved ${targetTitles.length} dynamic titles from TMDB lists.`);
        }
    } catch (err) {
        console.warn(`⚠️ Warning: Failed to fetch top rated movies from TMDB, falling back to static title list. Error: ${err.message}`);
    }

    const imported = [];
    const updated = [];
    const duplicates = [];
    const failed = [];

    for (const title of targetTitles) {
        try {
            console.log(`Searching: "${title}"...`);
            // Step 1: Search movie on TMDB
            const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}`;
            const searchData = await fetchURL(searchUrl);

            if (!searchData.results || searchData.results.length === 0) {
                failed.push({ title, error: "Movie not found on TMDB" });
                console.log(`❌ Failed: ${title} (Movie not found on TMDB)`);
                continue;
            }

            const bestMatch = searchData.results[0];
            const tmdbId = bestMatch.id;

            // Step 2: Fetch detailed movie information including credits
            const detailsUrl = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&append_to_response=credits`;
            const data = await fetchURL(detailsUrl);

            const tmdbTitle = data.title || title;
            const cleanTitle = tmdbTitle.trim();
            const baseId = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const finalId = baseId || `movie - ${Date.now()} `;

            const existingIndex = db.movies.findIndex(m =>
                m.id === finalId ||
                m.title.toLowerCase().trim() === cleanTitle.toLowerCase()
            );

            const year = data.release_date ? parseInt(data.release_date.substring(0, 4)) : new Date().getFullYear();
            const runtime = parseInt(data.runtime) || 120;
            const genres = data.genres ? data.genres.map(g => g.name) : [];
            const cast = data.credits && data.credits.cast
                ? data.credits.cast.slice(0, 4).map(c => c.name)
                : [];

            let director = 'Unknown';
            if (data.credits && data.credits.crew) {
                const directorObj = data.credits.crew.find(c => c.job === 'Director');
                if (directorObj) director = directorObj.name;
            }

            const updatedMovie = {
                title: cleanTitle,
                director,
                cast,
                year,
                runtime,
                genres,
                synopsis: data.overview || '',
                poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : ''
            };

            if (existingIndex !== -1) {
                // Update existing record with latest TMDB information
                db.movies[existingIndex] = {
                    ...db.movies[existingIndex],
                    ...updatedMovie
                };
                updated.push(cleanTitle);
                console.log(`🔄 Updated: ${cleanTitle} (with clean TMDB details)`);
            } else {
                let uniqueId = finalId;
                let counter = 1;
                while (db.movies.some(m => m.id === uniqueId)) {
                    uniqueId = `${finalId}-${counter}`;
                    counter++;
                }

                const newMovie = {
                    id: uniqueId,
                    ...updatedMovie
                };

                db.movies.unshift(newMovie);
                imported.push(cleanTitle);
                console.log(`✅ Imported: ${cleanTitle}`);
            }
        } catch (err) {
            failed.push({ title, error: err.message });
            console.log(`❌ Error: ${title} (${err.message})`);
        }
    }

    if (imported.length > 0 || updated.length > 0) {
        const tempPath = DB_PATH + '.tmp';
        fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), 'utf8');
        fs.renameSync(tempPath, DB_PATH);
        console.log(`\n🎉 Database successfully updated!`);
    } else {
        console.log(`\nNo new movies were added or updated.`);
    }

    console.log(`Summary: Imported: ${imported.length}, Updated: ${updated.length}, Duplicates: ${duplicates.length}, Failed: ${failed.length}`);
};

run();
