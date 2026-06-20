const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables if available
const envPath = path.join(__dirname, '.env');
let apiKey = '1ea28bd7b0047d98bbdf2838e766a84b'; // fallback
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/TMDB_API_KEY\s*=\s*([^\r\n]+)/);
  if (match && match[1]) {
    apiKey = match[1].trim();
  }
}

const moviesToFetch = [
  { title: "Inception", year: 2010, oldUrl: "https://image.tmdb.org/t/p/w500/9gk7adHYeZCEhKjSRt32WD31568.jpg" },
  { title: "Interstellar", year: 2014, oldUrl: "https://image.tmdb.org/t/p/w500/gEU2QvHOmihvJv7VigwE4w2UpI.jpg" },
  { title: "The Dark Knight", year: 2008, oldUrl: "https://image.tmdb.org/t/p/w500/qJ2tWw754Gvj67a2B3zTyRBrA24.jpg" },
  { title: "Pulp Fiction", year: 1994, oldUrl: "https://image.tmdb.org/t/p/w500/d5iil4FJmye00uUi5cyN79goJe5.jpg" },
  { title: "The Shawshank Redemption", year: 1994, oldUrl: "https://image.tmdb.org/t/p/w500/9cqN002GmqKjK79pypmUzrV6JtC.jpg" },
  { title: "Fight Club", year: 1999, oldUrl: "https://image.tmdb.org/t/p/w500/pB8BM7rnZHsZ52hqgQL6go0yZCc.jpg" },
  { title: "The Matrix", year: 1999, oldUrl: "https://image.tmdb.org/t/p/w500/f89U3wzqrjVnH50TYsyevfwgTMn.jpg" },
  { title: "Spirited Away", year: 2001, oldUrl: "https://image.tmdb.org/t/p/w500/393mh1e064FiyKs8mEN2kgXN9wt.jpg" },
  { title: "Parasite", year: 2019, oldUrl: "https://image.tmdb.org/t/p/w500/7IiTT05EX2u6N6K1g2tJcczQI7Z.jpg" },
  { title: "Whiplash", year: 2014, oldUrl: "https://image.tmdb.org/t/p/w500/7fn624j5lh35n2n2t4hy2kvO6vV.jpg" },
  { title: "Spider-Man: Into the Spider-Verse", year: 2018, oldUrl: "https://image.tmdb.org/t/p/w500/iiZZN643n6bg6ZD2iR1wN2Zg07q.jpg" },
  { title: "Everything Everywhere All at Once", year: 2022, oldUrl: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sclfg2zZJZvHqhg0.jpg" },
  { title: "Dune: Part Two", year: 2024, oldUrl: "https://image.tmdb.org/t/p/w500/czemb36gZ229292n38392ue5w2X.jpg" },
  { title: "Spider-Man: Across the Spider-Verse", year: 2023, oldUrl: "https://image.tmdb.org/t/p/w500/8VtB7v9mCV1X61CF4m4jA0PsnUo.jpg" },
  { title: "Gladiator", year: 2000, oldUrl: "https://image.tmdb.org/t/p/w500/ty8hDCcc4gq52Bptmlm1bfz7n8c.jpg" },
  { title: "The Godfather", year: 1972, oldUrl: "https://image.tmdb.org/t/p/w500/3bhkrj6UGV2pa6IKMBptwU2u6tc.jpg" },
  { title: "The Lord of the Rings: The Fellowship of the Ring", year: 2001, oldUrl: "https://image.tmdb.org/t/p/w500/6oom5QDNv285P5PFmMIkQIwEEAz.jpg" },
  { title: "Star Wars: Episode V - The Empire Strikes Back", year: 1980, oldUrl: "https://image.tmdb.org/t/p/w500/nBesb4j1df7G2365Z52gIv6Hgbz.jpg" },
  { title: "Forrest Gump", year: 1994, oldUrl: "https://image.tmdb.org/t/p/w500/arw2vEZvH6UYie96vG879ftR5G3.jpg" },
  { title: "Se7en", year: 1995, oldUrl: "https://image.tmdb.org/t/p/w500/6yogwS6q7hBTH04yzwI6SQ14BhC.jpg" },
  { title: "The Silence of the Lambs", year: 1991, oldUrl: "https://image.tmdb.org/t/p/w500/uS1SkjV5rQIKx4q7nIQqH65G67y.jpg" },
  { title: "Goodfellas", year: 1990, oldUrl: "https://image.tmdb.org/t/p/w500/aKuFiU8tClGW5w4QLPMj4O4WV0g.jpg" },
  { title: "Saving Private Ryan", year: 1998, oldUrl: "https://image.tmdb.org/t/p/w500/uq41m461gW552E4YxVn197N86g5.jpg" },
  { title: "Schindler's List", year: 1993, oldUrl: "https://image.tmdb.org/t/p/w500/sF1U4EUg0zKSRR42paT7F303h2t.jpg" },
  { title: "Psycho", year: 1960, oldUrl: "https://image.tmdb.org/t/p/w500/81d8oyEFgj7i436m57tfdDIH26B.jpg" },
  { title: "The Truman Show", year: 1998, oldUrl: "https://image.tmdb.org/t/p/w500/ddZ368oSRox9e2r8J3jWnME9Z3o.jpg" },
  { title: "Eternal Sunshine of the Spotless Mind", year: 2004, oldUrl: "https://image.tmdb.org/t/p/w500/5ywCwIL7LI77O5U4p99n57l4Pev.jpg" },
  { title: "Back to the Future", year: 1985, oldUrl: "https://image.tmdb.org/t/p/w500/fNqz6fe2qw5HZnBvQY746guV5ph.jpg" },
  { title: "The Departed", year: 2006, oldUrl: "https://image.tmdb.org/t/p/w500/3as8d15Z57eG9n87Gz3m5tW2tI0.jpg" },
  { title: "The Prestige", year: 2006, oldUrl: "https://image.tmdb.org/t/p/w500/bdN3gmg4626yBh6WMcb6z51558w.jpg" },
  { title: "Shutter Island", year: 2010, oldUrl: "https://image.tmdb.org/t/p/w500/kve201g5zwm68t1v4mR1I4IRZ6Y.jpg" },
  { title: "Blade Runner 2049", year: 2017, oldUrl: "https://image.tmdb.org/t/p/w500/gGe540455B0x1lP4l45PeyLA4y4.jpg" },
  { title: "Oppenheimer", year: 2023, oldUrl: "https://image.tmdb.org/t/p/w500/8Gxv2wSbsysLYlhuxNx76vSqTRY.jpg" },
  { title: "The Green Mile", year: 1999, oldUrl: "https://image.tmdb.org/t/p/w500/8HRug3C754162P2469490Pty7t6.jpg" },
  { title: "Inglourious Basterds", year: 2009, oldUrl: "https://image.tmdb.org/t/p/w500/7sfb7hvtjxrIYTR26576bh065ch.jpg" },
  { title: "Django Unchained", year: 2012, oldUrl: "https://image.tmdb.org/t/p/w500/7oWYwz6H7SR5t7v7n55oUhqOIvi.jpg" },
  { title: "No Country for Old Men", year: 2007, oldUrl: "https://image.tmdb.org/t/p/w500/8yOH7T5u9fv24b5Pj433Z4Gg1yE.jpg" },
  { title: "Your Name", year: 2016, oldUrl: "https://image.tmdb.org/t/p/w500/q71tjeZ457584rYjuwHpvRkR3x0.jpg" },
  { title: "Alien", year: 1979, oldUrl: "https://image.tmdb.org/t/p/w500/vfrQ06X3GUGvNu4Rh74a445n5Gt.jpg" },
  { title: "La La Land", year: 2016, oldUrl: "https://image.tmdb.org/t/p/w500/uDO8zWDhfNsPkNyFI0hm3xxPk6g.jpg" },
  { title: "Joker", year: 2019, oldUrl: "https://image.tmdb.org/t/p/w500/udDclsnH3wFS6r7zA7alUPyN2aB.jpg" }
];

const fetchJson = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`Status ${res.statusCode}`));
        } else {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        }
      });
    }).on('error', reject);
  });
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  console.log("Starting local movie poster correction...");
  console.log(`Using TMDB API key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);

  const serverIndexJsPath = path.join(__dirname, 'index.js');
  const serverDataJsonPath = path.join(__dirname, 'data.json');

  let indexJsContent = fs.readFileSync(serverIndexJsPath, 'utf8');
  let dataJsonContent = fs.readFileSync(serverDataJsonPath, 'utf8');
  let dataJson = JSON.parse(dataJsonContent);

  let updatedCount = 0;

  for (const item of moviesToFetch) {
    try {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(item.title)}&primary_release_year=${item.year}`;
      const searchRes = await fetchJson(url);
      
      if (searchRes.results && searchRes.results.length > 0) {
        const bestMatch = searchRes.results[0];
        if (bestMatch.poster_path) {
          const newUrl = `https://image.tmdb.org/t/p/w500${bestMatch.poster_path}`;
          
          // Replace in server/index.js
          if (indexJsContent.includes(item.oldUrl)) {
            indexJsContent = indexJsContent.replace(new RegExp(escapeRegExp(item.oldUrl), 'g'), newUrl);
          }

          // Replace in server/data.json
          let replacedInData = false;
          if (dataJson.movies) {
            dataJson.movies.forEach(m => {
              if (m.poster === item.oldUrl) {
                m.poster = newUrl;
                replacedInData = true;
              }
            });
          }
          if (dataJson.logs) {
            dataJson.logs.forEach(log => {
              if (log.movie && log.movie.poster === item.oldUrl) {
                log.movie.poster = newUrl;
                replacedInData = true;
              }
            });
          }
          if (dataJson.lists) {
            dataJson.lists.forEach(list => {
              if (list.movies) {
                list.movies.forEach(m => {
                  if (m.poster === item.oldUrl) {
                    m.poster = newUrl;
                    replacedInData = true;
                  }
                });
              }
            });
          }

          console.log(`✅ Corrected "${item.title}": ${bestMatch.poster_path}`);
          updatedCount++;
        } else {
          console.warn(`⚠️ No poster_path for "${item.title}"`);
        }
      } else {
        console.warn(`❌ No results found for "${item.title}"`);
      }
      await sleep(100); // 100ms sleep to respect TMDB rate limit limits
    } catch (err) {
      console.error(`❌ Error updating "${item.title}":`, err.message);
    }
  }

  if (updatedCount > 0) {
    fs.writeFileSync(serverIndexJsPath, indexJsContent, 'utf8');
    fs.writeFileSync(serverDataJsonPath, JSON.stringify(dataJson, null, 2), 'utf8');
    console.log(`\n🎉 Success! Successfully updated ${updatedCount} movie poster URLs in:`);
    console.log(`- server/index.js`);
    console.log(`- server/data.json`);
  } else {
    console.log("\nNo poster URLs were updated.");
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

run();
