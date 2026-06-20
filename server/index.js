const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = (() => {
    if (process.env.VERCEL === '1') {
        const tempPath = path.join('/tmp', 'data.json');
        const templatePath = path.join(__dirname, 'data.json');
        if (!fs.existsSync(tempPath)) {
            try {
                if (fs.existsSync(templatePath)) {
                    fs.copyFileSync(templatePath, tempPath);
                } else {
                    fs.writeFileSync(tempPath, JSON.stringify({ movies: [], logs: [], lists: [], profile: {}, users: [] }, null, 2));
                }
            } catch (err) {
                console.error("Failed to copy database to /tmp:", err);
            }
        }
        return tempPath;
    }
    return path.join(__dirname, 'data.json');
})();

// Custom CORS middleware to avoid external npm dependency
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
app.use(express.json());

// Helper function to read/write JSON database
const backupCorruptDB = () => {
    try {
        if (fs.existsSync(DB_PATH)) {
            const backupPath = `${DB_PATH}.corrupt-${Date.now()}`;
            fs.copyFileSync(DB_PATH, backupPath);
            console.warn(`⚠️ Warning: Corrupted database backed up to ${backupPath}`);
        }
    } catch (backupErr) {
        console.error('Failed to create backup of corrupted database:', backupErr);
    }
};

const readDB = () => {
    try {
        if (!fs.existsSync(DB_PATH)) {
            seedDatabase();
        }
        let data = fs.readFileSync(DB_PATH, 'utf8');
        if (!data || data.trim() === '') {
            backupCorruptDB();
            seedDatabase();
            data = fs.readFileSync(DB_PATH, 'utf8');
        }
        const parsed = JSON.parse(data);
        if (!parsed.users) parsed.users = [];
        return parsed;
    } catch (err) {
        console.error('Error reading database (attempting auto-recovery by re-seeding):', err);
        try {
            backupCorruptDB();
            seedDatabase();
            const data = fs.readFileSync(DB_PATH, 'utf8');
            const parsed = JSON.parse(data);
            if (!parsed.users) parsed.users = [];
            return parsed;
        } catch (recoveryErr) {
            console.error('Critical: Failed to recover database:', recoveryErr);
            return { movies: [], logs: [], lists: [], profile: {}, users: [] };
        }
    }
};

const writeDB = (data) => {
    try {
        const tempPath = DB_PATH + '.tmp';
        fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
        fs.renameSync(tempPath, DB_PATH);
    } catch (err) {
        console.error('Error writing to database:', err);
    }
};

// Seed database with initial rich movie collection
const seedDatabase = () => {
    const seedMovies = [
        {
            id: "inception",
            title: "Inception",
            director: "Christopher Nolan",
            cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page", "Tom Hardy"],
            year: 2010,
            runtime: 148,
            genres: ["Sci-Fi", "Action", "Thriller"],
            synopsis: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
            poster: "https://image.tmdb.org/t/p/w500/9gk7adHYeZCEhKjSRt32WD31568.jpg"
        },
        {
            id: "interstellar",
            title: "Interstellar",
            director: "Christopher Nolan",
            cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
            year: 2014,
            runtime: 169,
            genres: ["Sci-Fi", "Drama", "Adventure"],
            synopsis: "When Earth becomes uninhabitable, a team of explorers travels through a wormhole in space in an attempt to ensure humanity's survival.",
            poster: "https://image.tmdb.org/t/p/w500/gEU2QvHOmihvJv7VigwE4w2UpI.jpg"
        },
        {
            id: "the-dark-knight",
            title: "The Dark Knight",
            director: "Christopher Nolan",
            cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart", "Maggie Gyllenhaal"],
            year: 2008,
            runtime: 152,
            genres: ["Action", "Crime", "Drama"],
            synopsis: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
            poster: "https://image.tmdb.org/t/p/w500/qJ2tWw754Gvj67a2B3zTyRBrA24.jpg"
        },
        {
            id: "pulp-fiction",
            title: "Pulp Fiction",
            director: "Quentin Tarantino",
            cast: ["John Travolta", "Uma Thurman", "Samuel L. Jackson", "Bruce Willis"],
            year: 1994,
            runtime: 154,
            genres: ["Crime", "Drama"],
            synopsis: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
            poster: "https://image.tmdb.org/t/p/w500/d5iil4FJmye00uUi5cyN79goJe5.jpg"
        },
        {
            id: "the-shawshank-redemption",
            title: "The Shawshank Redemption",
            director: "Frank Darabont",
            cast: ["Tim Robbins", "Morgan Freeman", "Bob Gunton", "William Sadler"],
            year: 1994,
            runtime: 142,
            genres: ["Drama"],
            synopsis: "Over the course of several years, two convicts form a friendship, seeking consolation and, eventually, redemption through basic compassion.",
            poster: "https://image.tmdb.org/t/p/w500/9cqN002GmqKjK79pypmUzrV6JtC.jpg"
        },
        {
            id: "fight-club",
            title: "Fight Club",
            director: "David Fincher",
            cast: ["Brad Pitt", "Edward Norton", "Helena Bonham Carter", "Meat Loaf"],
            year: 1999,
            runtime: 139,
            genres: ["Drama", "Thriller"],
            synopsis: "An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into something much, much more.",
            poster: "https://image.tmdb.org/t/p/w500/pB8BM7rnZHsZ52hqgQL6go0yZCc.jpg"
        },
        {
            id: "the-matrix",
            title: "The Matrix",
            director: "Lana Wachowski",
            cast: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss", "Hugo Weaving"],
            year: 1999,
            runtime: 136,
            genres: ["Sci-Fi", "Action"],
            synopsis: "When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence.",
            poster: "https://image.tmdb.org/t/p/w500/f89U3wzqrjVnH50TYsyevfwgTMn.jpg"
        },
        {
            id: "spirited-away",
            title: "Spirited Away",
            director: "Hayao Miyazaki",
            cast: ["Rumi Hiiragi", "Miyu Irino", "Mari Natsuki", "Takashi Naito"],
            year: 2001,
            runtime: 125,
            genres: ["Animation", "Fantasy", "Family"],
            synopsis: "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.",
            poster: "https://image.tmdb.org/t/p/w500/393mh1e064FiyKs8mEN2kgXN9wt.jpg"
        },
        {
            id: "parasite",
            title: "Parasite",
            director: "Bong Joon Ho",
            cast: ["Song Kang-ho", "Lee Sun-kyun", "Cho Yeo-jeong", "Choi Woo-shik"],
            year: 2019,
            runtime: 132,
            genres: ["Thriller", "Drama", "Comedy"],
            synopsis: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
            poster: "https://image.tmdb.org/t/p/w500/7IiTT05EX2u6N6K1g2tJcczQI7Z.jpg"
        },
        {
            id: "whiplash",
            title: "Whiplash",
            director: "Damien Chazelle",
            cast: ["Miles Teller", "J.K. Simmons", "Paul Reiser", "Melissa Benoist"],
            year: 2014,
            runtime: 107,
            genres: ["Drama", "Music"],
            synopsis: "A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student's potential.",
            poster: "https://image.tmdb.org/t/p/w500/7fn624j5lh35n2n2t4hy2kvO6vV.jpg"
        },
        {
            id: "into-the-spider-verse",
            title: "Spider-Man: Into the Spider-Verse",
            director: "Bob Persichetti",
            cast: ["Shameik Moore", "Jake Johnson", "Hailee Steinfeld", "Mahershala Ali"],
            year: 2018,
            runtime: 117,
            genres: ["Animation", "Action", "Sci-Fi"],
            synopsis: "Teen Miles Morales becomes the Spider-Man of his universe and must join with five spider-powered individuals from other dimensions to stop a threat for all realities.",
            poster: "https://image.tmdb.org/t/p/w500/iiZZN643n6bg6ZD2iR1wN2Zg07q.jpg"
        },
        {
            id: "everything-everywhere",
            title: "Everything Everywhere All at Once",
            director: "Daniel Kwan",
            cast: ["Michelle Yeoh", "Stephanie Hsu", "Ke Huy Quan", "Jamie Lee Curtis"],
            year: 2022,
            runtime: 139,
            genres: ["Sci-Fi", "Comedy", "Action"],
            synopsis: "A middle-aged Chinese immigrant is swept up into an insane adventure in which she alone can save existence by exploring other universes and connecting with the lives she could have led.",
            poster: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sclfg2zZJZvHqhg0.jpg"
        },
        {
            id: "dune-part-two",
            title: "Dune: Part Two",
            director: "Denis Villeneuve",
            cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Austin Butler"],
            year: 2024,
            runtime: 166,
            genres: ["Sci-Fi", "Adventure"],
            synopsis: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
            poster: "https://image.tmdb.org/t/p/w500/czemb36gZ229292n38392ue5w2X.jpg"
        },
        {
            id: "across-the-spider-verse",
            title: "Spider-Man: Across the Spider-Verse",
            director: "Joaquim Dos Santos",
            cast: ["Shameik Moore", "Hailee Steinfeld", "Oscar Isaac", "Jake Johnson"],
            year: 2023,
            runtime: 140,
            genres: ["Animation", "Action", "Sci-Fi"],
            synopsis: "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence. When the heroes clash on how to handle a new threat, Miles must redefine what it means to be a hero.",
            poster: "https://image.tmdb.org/t/p/w500/8VtB7v9mCV1X61CF4m4jA0PsnUo.jpg"
        },
        {
            id: "gladiator",
            title: "Gladiator",
            director: "Ridley Scott",
            cast: ["Russell Crowe", "Joaquin Phoenix", "Connie Nielsen", "Oliver Reed"],
            year: 2000,
            runtime: 155,
            genres: ["Action", "Drama", "History"],
            synopsis: "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.",
            poster: "https://image.tmdb.org/t/p/w500/ty8hDCcc4gq52Bptmlm1bfz7n8c.jpg"
        },
        {
            id: "the-godfather",
            title: "The Godfather",
            director: "Francis Ford Coppola",
            cast: ["Marlon Brando", "Al Pacino", "James Caan", "Diane Keaton"],
            year: 1972,
            runtime: 175,
            genres: ["Crime", "Drama"],
            synopsis: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
            poster: "https://image.tmdb.org/t/p/w500/3bhkrj6UGV2pa6IKMBptwU2u6tc.jpg"
        },
        {
            id: "lord-of-the-rings-1",
            title: "The Lord of the Rings: The Fellowship of the Ring",
            director: "Peter Jackson",
            cast: ["Elijah Wood", "Ian McKellen", "Orlando Bloom", "Viggo Mortensen"],
            year: 2001,
            runtime: 178,
            genres: ["Fantasy", "Adventure", "Action"],
            synopsis: "A meek Hobbit from the Shire and eight companions set out on a journey to destroy the powerful One Ring and save Middle-earth from the Dark Lord Sauron.",
            poster: "https://image.tmdb.org/t/p/w500/6oom5QDNv285P5PFmMIkQIwEEAz.jpg"
        },
        {
            id: "empire-strikes-back",
            title: "Star Wars: Episode V - The Empire Strikes Back",
            director: "Irvin Kershner",
            cast: ["Mark Hamill", "Harrison Ford", "Carrie Fisher", "Billy Dee Williams"],
            year: 1980,
            runtime: 124,
            genres: ["Sci-Fi", "Adventure", "Action"],
            synopsis: "After the Rebels are brutally overpowered by the Empire on the ice planet Hoth, Luke Skywalker begins Jedi training with Yoda, while his friends are pursued by Darth Vader.",
            poster: "https://image.tmdb.org/t/p/w500/nBesb4j1df7G2365Z52gIv6Hgbz.jpg"
        },
        {
            id: "forrest-gump",
            title: "Forrest Gump",
            director: "Robert Zemeckis",
            cast: ["Tom Hanks", "Robin Wright", "Gary Sinise", "Sally Field"],
            year: 1994,
            runtime: 142,
            genres: ["Drama", "Romance"],
            synopsis: "The history of the United States from the 1950s to the 1970s unfolds from the perspective of an Alabama man with an IQ of 75, who yearns to be reunited with his childhood sweetheart.",
            poster: "https://image.tmdb.org/t/p/w500/arw2vEZvH6UYie96vG879ftR5G3.jpg"
        },
        {
            id: "se7en",
            title: "Se7en",
            director: "David Fincher",
            cast: ["Morgan Freeman", "Brad Pitt", "Kevin Spacey", "Gwyneth Paltrow"],
            year: 1995,
            runtime: 127,
            genres: ["Crime", "Thriller", "Drama"],
            synopsis: "Two detectives, a rookie and a veteran, hunt a serial killer who uses the seven deadly sins as his motives.",
            poster: "https://image.tmdb.org/t/p/w500/6yogwS6q7hBTH04yzwI6SQ14BhC.jpg"
        },
        {
            id: "silence-of-the-lambs",
            title: "The Silence of the Lambs",
            director: "Jonathan Demme",
            cast: ["Jodie Foster", "Anthony Hopkins", "Scott Glenn", "Ted Levine"],
            year: 1991,
            runtime: 118,
            genres: ["Thriller", "Crime", "Drama"],
            synopsis: "A young F.B.I. cadet must receive the help of an incarcerated and manipulative cannibal killer to help catch another serial killer, a madman who skins his victims.",
            poster: "https://image.tmdb.org/t/p/w500/uS1SkjV5rQIKx4q7nIQqH65G67y.jpg"
        },
        {
            id: "goodfellas",
            title: "Goodfellas",
            director: "Martin Scorsese",
            cast: ["Robert De Niro", "Ray Liotta", "Joe Pesci", "Lorraine Bracco"],
            year: 1990,
            runtime: 145,
            genres: ["Crime", "Drama"],
            synopsis: "The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen Hill and his mob partners Jimmy Conway and Tommy DeVito in the Italian-American crime syndicate.",
            poster: "https://image.tmdb.org/t/p/w500/aKuFiU8tClGW5w4QLPMj4O4WV0g.jpg"
        },
        {
            id: "saving-private-ryan",
            title: "Saving Private Ryan",
            director: "Steven Spielberg",
            cast: ["Tom Hanks", "Matt Damon", "Tom Sizemore", "Edward Burns"],
            year: 1998,
            runtime: 169,
            genres: ["Drama", "War", "Action"],
            synopsis: "Following the Normandy Landings, a group of U.S. soldiers go behind enemy lines to retrieve a paratrooper whose brothers have been killed in action.",
            poster: "https://image.tmdb.org/t/p/w500/uq41m461gW552E4YxVn197N86g5.jpg"
        },
        {
            id: "schindlers-list",
            title: "Schindler's List",
            director: "Steven Spielberg",
            cast: ["Liam Neeson", "Ben Kingsley", "Ralph Fiennes", "Caroline Goodall"],
            year: 1993,
            runtime: 195,
            genres: ["Drama", "History", "Biography"],
            synopsis: "In German-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce after witnessing their persecution by the Nazis.",
            poster: "https://image.tmdb.org/t/p/w500/sF1U4EUg0zKSRR42paT7F303h2t.jpg"
        },
        {
            id: "psycho",
            title: "Psycho",
            director: "Alfred Hitchcock",
            cast: ["Anthony Perkins", "Janet Leigh", "Vera Miles", "John Gavin"],
            year: 1960,
            runtime: 109,
            genres: ["Horror", "Thriller"],
            synopsis: "A Phoenix secretary embezzles $40,000 from her employer's client, goes on the run, and checks into a remote motel run by a young man under the domination of his mother.",
            poster: "https://image.tmdb.org/t/p/w500/81d8oyEFgj7i436m57tfdDIH26B.jpg"
        },
        {
            id: "the-truman-show",
            title: "The Truman Show",
            director: "Peter Weir",
            cast: ["Jim Carrey", "Laura Linney", "Ed Harris", "Noah Emmerich"],
            year: 1998,
            runtime: 103,
            genres: ["Drama", "Comedy", "Sci-Fi"],
            synopsis: "An insurance salesman discovers his whole life is actually a reality TV show.",
            poster: "https://image.tmdb.org/t/p/w500/ddZ368oSRox9e2r8J3jWnME9Z3o.jpg"
        },
        {
            id: "eternal-sunshine",
            title: "Eternal Sunshine of the Spotless Mind",
            director: "Michel Gondry",
            cast: ["Jim Carrey", "Kate Winslet", "Kirsten Dunst", "Mark Ruffalo"],
            year: 2004,
            runtime: 108,
            genres: ["Drama", "Romance", "Sci-Fi"],
            synopsis: "When their relationship turns sour, a young couple undergoes a medical procedure to have each other erased from their memories.",
            poster: "https://image.tmdb.org/t/p/w500/5ywCwIL7LI77O5U4p99n57l4Pev.jpg"
        },
        {
            id: "back-to-the-future",
            title: "Back to the Future",
            director: "Robert Zemeckis",
            cast: ["Michael J. Fox", "Christopher Lloyd", "Lea Thompson", "Crispin Glover"],
            year: 1985,
            runtime: 116,
            genres: ["Sci-Fi", "Comedy", "Adventure"],
            synopsis: "Marty McFly, a 17-year-old high school student, is accidentally sent thirty years into the past in a time-traveling DeLorean invented by his close friend, the eccentric scientist Doc Brown.",
            poster: "https://image.tmdb.org/t/p/w500/fNqz6fe2qw5HZnBvQY746guV5ph.jpg"
        },
        {
            id: "the-departed",
            title: "The Departed",
            director: "Martin Scorsese",
            cast: ["Leonardo DiCaprio", "Matt Damon", "Jack Nicholson", "Mark Wahlberg"],
            year: 2006,
            runtime: 151,
            genres: ["Crime", "Drama", "Thriller"],
            synopsis: "An undercover cop and a mole in the police attempt to identify each other while infiltrating an Irish gang in South Boston.",
            poster: "https://image.tmdb.org/t/p/w500/3as8d15Z57eG9n87Gz3m5tW2tI0.jpg"
        },
        {
            id: "the-prestige",
            title: "The Prestige",
            director: "Christopher Nolan",
            cast: ["Hugh Jackman", "Christian Bale", "Scarlett Johansson", "Michael Caine"],
            year: 2006,
            runtime: 130,
            genres: ["Drama", "Mystery", "Sci-Fi"],
            synopsis: "After a tragic accident, two stage magicians in 1890s London engage in a battle to create the ultimate illusion while sacrificing everything they have to outwit each other.",
            poster: "https://image.tmdb.org/t/p/w500/bdN3gmg4626yBh6WMcb6z51558w.jpg"
        },
        {
            id: "shutter-island",
            title: "Shutter Island",
            director: "Martin Scorsese",
            cast: ["Leonardo DiCaprio", "Mark Ruffalo", "Ben Kingsley", "Michelle Williams"],
            year: 2010,
            runtime: 138,
            genres: ["Mystery", "Thriller"],
            synopsis: "In 1954, a U.S. Marshal investigates the disappearance of a murderer who escaped from a hospital for the criminally insane.",
            poster: "https://image.tmdb.org/t/p/w500/kve201g5zwm68t1v4mR1I4IRZ6Y.jpg"
        },
        {
            id: "blade-runner-2049",
            title: "Blade Runner 2049",
            director: "Denis Villeneuve",
            cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas", "Robin Wright"],
            year: 2017,
            runtime: 164,
            genres: ["Sci-Fi", "Mystery", "Thriller"],
            synopsis: "A new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what's left of society into chaos. K's discovery leads him on a quest to find Rick Deckard, a former LAPD blade runner who has been missing for 30 years.",
            poster: "https://image.tmdb.org/t/p/w500/gGe540455B0x1lP4l45PeyLA4y4.jpg"
        },
        {
            id: "oppenheimer",
            title: "Oppenheimer",
            director: "Christopher Nolan",
            cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr."],
            year: 2023,
            runtime: 180,
            genres: ["Drama", "Biography", "History"],
            synopsis: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
            poster: "https://image.tmdb.org/t/p/w500/8Gxv2wSbsysLYlhuxNx76vSqTRY.jpg"
        },
        {
            id: "the-green-mile",
            title: "The Green Mile",
            director: "Frank Darabont",
            cast: ["Tom Hanks", "David Morse", "Michael Clarke Duncan", "Bonnie Hunt"],
            year: 1999,
            runtime: 189,
            genres: ["Drama", "Fantasy"],
            synopsis: "A death row supervisor at a Louisiana penitentiary during the Great Depression discovers that one of his inmates, a giant black man accused of child murder and rape, possesses a miraculous gift.",
            poster: "https://image.tmdb.org/t/p/w500/8HRug3C754162P2469490Pty7t6.jpg"
        },
        {
            id: "inglourious-basterds",
            title: "Inglourious Basterds",
            director: "Quentin Tarantino",
            cast: ["Brad Pitt", "Christoph Waltz", "Mélanie Laurent", "Eli Roth"],
            year: 2009,
            runtime: 153,
            genres: ["Action", "War", "Drama"],
            synopsis: "In Nazi-occupied France during World War II, a plan to assassinate Adolf Hitler by a group of Jewish U.S. soldiers coincides with a theatre owner's vengeful plans for the same.",
            poster: "https://image.tmdb.org/t/p/w500/7sfb7hvtjxrIYTR26576bh065ch.jpg"
        },
        {
            id: "django-unchained",
            title: "Django Unchained",
            director: "Quentin Tarantino",
            cast: ["Jamie Foxx", "Christoph Waltz", "Leonardo DiCaprio", "Kerry Washington"],
            year: 2012,
            runtime: 165,
            genres: ["Drama", "Western"],
            synopsis: "With the assistance of a German bounty-hunter, a freed slave sets out to rescue his wife from a brutal Mississippi plantation owner.",
            poster: "https://image.tmdb.org/t/p/w500/7oWYwz6H7SR5t7v7n55oUhqOIvi.jpg"
        },
        {
            id: "no-country-for-old-men",
            title: "No Country for Old Men",
            director: "Joel Coen",
            cast: ["Tommy Lee Jones", "Javier Bardem", "Josh Brolin", "Woody Harrelson"],
            year: 2007,
            runtime: 122,
            genres: ["Crime", "Thriller", "Drama"],
            synopsis: "A hunter stumbles upon a drug deal gone wrong and more than two million dollars in cash near the Rio Grande. His decision to take the money sparks a chain reaction of catastrophic violence.",
            poster: "https://image.tmdb.org/t/p/w500/8yOH7T5u9fv24b5Pj433Z4Gg1yE.jpg"
        },
        {
            id: "your-name",
            title: "Your Name",
            director: "Makoto Shinkai",
            cast: ["Ryunosuke Kamiki", "Mone Kamishiraishi", "Ryo Narita", "Aoi Yuki"],
            year: 2016,
            runtime: 106,
            genres: ["Animation", "Fantasy", "Romance"],
            synopsis: "Two strangers find themselves linked in a bizarre way. When a connection is formed, will distance be the only thing to keep them apart?",
            poster: "https://image.tmdb.org/t/p/w500/q71tjeZ457584rYjuwHpvRkR3x0.jpg"
        },
        {
            id: "alien",
            title: "Alien",
            director: "Ridley Scott",
            cast: ["Sigourney Weaver", "Tom Skerritt", "John Hurt", "Ian Holm"],
            year: 1979,
            runtime: 117,
            genres: ["Sci-Fi", "Horror"],
            synopsis: "The crew of a commercial spacecraft encounter a deadly lifeform after investigating an unknown transmission.",
            poster: "https://image.tmdb.org/t/p/w500/vfrQ06X3GUGvNu4Rh74a445n5Gt.jpg"
        },
        {
            id: "la-la-land",
            title: "La La Land",
            director: "Damien Chazelle",
            cast: ["Ryan Gosling", "Emma Stone", "Rosemarie DeWitt", "J.K. Simmons"],
            year: 2016,
            runtime: 128,
            genres: ["Romance", "Music", "Comedy"],
            synopsis: "While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.",
            poster: "https://image.tmdb.org/t/p/w500/uDO8zWDhfNsPkNyFI0hm3xxPk6g.jpg"
        },
        {
            id: "joker",
            title: "Joker",
            director: "Todd Phillips",
            cast: ["Joaquin Phoenix", "Robert De Niro", "Zazie Beetz", "Frances Conroy"],
            year: 2019,
            runtime: 122,
            genres: ["Crime", "Drama", "Thriller"],
            synopsis: "During the 1980s, a failed stand-up comedian goes mad and turns to a life of crime and chaos in Gotham City while becoming an infamous psychopathic vigilante figure.",
            poster: "https://image.tmdb.org/t/p/w500/udDclsnH3wFS6r7zA7alUPyN2aB.jpg"
        }
    ];

    const initialDB = {
        movies: seedMovies,
        logs: [
            // Pre-populate some watch logs to give the user immediate statistics
            {
                id: "log-1",
                movieId: "inception",
                date: "2026-06-01",
                rating: 4.5,
                review: "Incredible film. The score by Hans Zimmer still gives me chills. Mind-bending concept executed flawlessly by Christopher Nolan.",
                rewatch: false,
                watchTime: 148
            },
            {
                id: "log-2",
                movieId: "the-dark-knight",
                date: "2026-06-05",
                rating: 5.0,
                review: "Heath Ledger's performance is legendary. The gold standard for comic book movies.",
                rewatch: true,
                watchTime: 152
            },
            {
                id: "log-3",
                movieId: "spirited-away",
                date: "2026-06-10",
                rating: 5.0,
                review: "Masterpiece of animation. Miyazaki creates a world so rich and beautiful.",
                rewatch: false,
                watchTime: 125
            },
            {
                id: "log-4",
                movieId: "parasite",
                date: "2026-06-14",
                rating: 4.5,
                review: "Brilliant social satire that morphs into a thriller. Pitch perfect acting and cinematography.",
                rewatch: false,
                watchTime: 132
            },
            {
                id: "log-5",
                movieId: "whiplash",
                date: "2026-06-18",
                rating: 4.0,
                review: "So intense. The final scene is one of the best in cinema history.",
                rewatch: false,
                watchTime: 107
            }
        ],
        lists: [
            {
                id: "watchlist",
                name: "Watchlist",
                description: "Movies I plan to watch soon.",
                created: "2026-06-19",
                movieIds: ["interstellar", "everything-everywhere", "dune-part-two", "oppenheimer"]
            },
            {
                id: "list-nolan",
                name: "Nolan Favorites",
                description: "My favorite films by Christopher Nolan.",
                created: "2026-06-19",
                movieIds: ["inception", "the-dark-knight", "the-prestige"]
            }
        ],
        profile: {
            name: "Cinema Enthusiast",
            joinDate: "June 2026",
            bio: "Avid film lover. Tracking watch time, ratings, and thoughts. Favorite directors: Nolan, Fincher, Tarantino, Miyazaki."
        }
    };

    writeDB(initialDB);
};

// Seed if db file doesn't exist
if (!fs.existsSync(DB_PATH)) {
    seedDatabase();
}

// REST API Endpoints

// Helper to hash passwords (simple salted Base64 to avoid external crypto deps)
const hashPassword = (password) => {
    const salt = "movialized_salt_2026";
    let hash = salt + password;
    return Buffer.from(hash).toString('base64');
};

// Signup Endpoint
app.post('/api/auth/signup', (req, res) => {
    const db = readDB();
    const { username, password, name, bio } = req.body;

    if (!username || !password || !name) {
        return res.status(400).json({ error: "Username, password, and name are required" });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (db.users && db.users.some(u => u.username === cleanUsername)) {
        return res.status(400).json({ error: "Username is already taken" });
    }

    const userId = `user-${Date.now()}`;
    const newUser = {
        id: userId,
        username: cleanUsername,
        password: hashPassword(password),
        profile: {
            name,
            bio: bio || "",
            joinDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        }
    };

    if (!db.users) db.users = [];
    db.users.push(newUser);

    // Automatically seed a default Watchlist custom list for this user
    if (!db.lists) db.lists = [];
    db.lists.push({
        id: `watchlist-${userId}`,
        userId,
        name: "Watchlist",
        description: "Movies I plan to watch soon.",
        created: new Date().toISOString().split('T')[0],
        movieIds: ["inception", "interstellar", "the-dark-knight"]
    });

    writeDB(db);

    res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        profile: newUser.profile
    });
});

// Login Endpoint
app.post('/api/auth/login', (req, res) => {
    const db = readDB();
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = db.users && db.users.find(u => u.username === cleanUsername);

    if (!user || user.password !== hashPassword(password)) {
        return res.status(400).json({ error: "Invalid username or password" });
    }

    res.json({
        id: user.id,
        username: user.username,
        profile: user.profile
    });
});


// 1. Get all movies (supports title search & filters)
app.get('/api/movies', (req, res) => {
    const db = readDB();
    let result = [...db.movies];
    const { search, genre, year, sort } = req.query;

    if (search) {
        const query = search.toLowerCase();
        result = result.filter(m => 
            m.title.toLowerCase().includes(query) || 
            m.director.toLowerCase().includes(query) ||
            m.cast.some(c => c.toLowerCase().includes(query))
        );
    }

    if (genre) {
        result = result.filter(m => m.genres.includes(genre));
    }

    if (year) {
        result = result.filter(m => m.year === parseInt(year));
    }

    if (sort) {
        if (sort === 'title') {
            result.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sort === 'year-desc') {
            result.sort((a, b) => b.year - a.year);
        } else if (sort === 'year-asc') {
            result.sort((a, b) => a.year - b.year);
        } else if (sort === 'runtime') {
            result.sort((a, b) => b.runtime - a.runtime);
        }
    }

    res.json(result);
});

// 2. Add a new custom movie
app.post('/api/movies', (req, res) => {
    const db = readDB();
    const { title, director, cast, year, runtime, genres, synopsis, poster } = req.body;

    if (!title || !director || !year || !runtime) {
        return res.status(400).json({ error: "Missing required movie fields: title, director, year, runtime" });
    }

    // Generate clean ID from title
    let baseId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let finalId = baseId || `movie-${Date.now()}`;
    
    // Ensure unique ID
    let counter = 1;
    while (db.movies.some(m => m.id === finalId)) {
        finalId = `${baseId}-${counter}`;
        counter++;
    }

    const newMovie = {
        id: finalId,
        title,
        director,
        cast: Array.isArray(cast) ? cast : cast ? cast.split(',').map(c => c.trim()) : [],
        year: parseInt(year),
        runtime: parseInt(runtime),
        genres: Array.isArray(genres) ? genres : genres ? genres.split(',').map(g => g.trim()) : [],
        synopsis: synopsis || "",
        poster: poster || ""
    };

    db.movies.unshift(newMovie);
    writeDB(db);
    res.status(201).json(newMovie);
});

// 2b. Bulk import movies from TMDB API
app.post('/api/movies/import-tmdb', async (req, res) => {
    const db = readDB();
    const { apiKey, titles } = req.body;

    if (!apiKey) {
        return res.status(400).json({ error: "TMDB API key (apiKey) is required in request body" });
    }

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
            const lib = url.startsWith('https') ? require('https') : require('http');
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

    let movieTitles = [];
    if (Array.isArray(titles)) {
        movieTitles = titles;
    } else if (typeof titles === 'string' && titles.trim()) {
        movieTitles = [titles.trim()];
    } else {
        try {
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
                movieTitles = allTitles;
            }
        } catch (err) {
            console.error("Failed to fetch top rated movies from TMDB:", err.message);
        }

        if (movieTitles.length === 0) {
            movieTitles = [
                "The Godfather: Part II",
                "12 Angry Men",
                "The Good, the Bad and the Ugly",
                "The Lord of the Rings: The Return of the King",
                "The Lord of the Rings: The Two Towers",
                "Star Wars: Episode IV - A New Hope",
                "One Flew Over the Cuckoo's Nest",
                "Seven Samurai",
                "City of God",
                "Leon: The Professional",
                "The Lion King",
                "Terminator 2: Judgment Day",
                "American History X",
                "The Pianist",
                "Spirited Away"
            ];
        }
    }

    const imported = [];
    const updated = [];
    const duplicates = [];
    const failed = [];

    // Process title imports sequentially to avoid rate limiting and ensure deterministic ID updates
    for (const title of movieTitles) {
        try {
            // Step 1: Search for the movie to get the TMDB ID
            const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}`;
            const searchData = await fetchURL(searchUrl);

            if (!searchData.results || searchData.results.length === 0) {
                failed.push({ title, error: "Movie not found on TMDB" });
                continue;
            }

            const bestMatch = searchData.results[0];
            const tmdbId = bestMatch.id;

            // Step 2: Fetch detailed movie information including credits
            const detailsUrl = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&append_to_response=credits`;
            const data = await fetchURL(detailsUrl);

            const tmdbTitle = data.title || title;
            
            // Check if title or ID already exists in the database
            const cleanTitle = tmdbTitle.trim();
            const baseId = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const finalId = baseId || `movie-${Date.now()}`;

            const existingIndex = db.movies.findIndex(m => 
                m.id === finalId || 
                m.title.toLowerCase().trim() === cleanTitle.toLowerCase()
            );

            // Parse year
            const year = data.release_date ? parseInt(data.release_date.substring(0, 4)) : new Date().getFullYear();

            // Parse runtime
            const runtime = parseInt(data.runtime) || 120;

            // Parse genres
            const genres = data.genres ? data.genres.map(g => g.name) : [];

            // Parse cast
            const cast = data.credits && data.credits.cast 
                ? data.credits.cast.slice(0, 4).map(c => c.name) 
                : [];

            // Parse director
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
                // Update existing record in-place to refresh with clean TMDB metadata and posters
                db.movies[existingIndex] = {
                    ...db.movies[existingIndex],
                    ...updatedMovie
                };
                updated.push(cleanTitle);
            } else {
                // Unique ID verification loop
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
            }
        } catch (err) {
            failed.push({ title, error: err.message });
        }
    }

    if (imported.length > 0 || updated.length > 0) {
        writeDB(db);
    }

    res.json({
        success: true,
        summary: {
            importedCount: imported.length,
            updatedCount: updated.length,
            duplicatesCount: duplicates.length,
            failedCount: failed.length
        },
        imported,
        updated,
        duplicates,
        failed
    });
});


// 3. Delete movie from database
app.delete('/api/movies/:id', (req, res) => {
    const db = readDB();
    const movieIndex = db.movies.findIndex(m => m.id === req.params.id);

    if (movieIndex === -1) {
        return res.status(404).json({ error: "Movie not found" });
    }

    // Remove from movies
    db.movies.splice(movieIndex, 1);
    
    // Clean up logs associated with this movie
    db.logs = db.logs.filter(l => l.movieId !== req.params.id);

    // Clean up lists containing this movie
    db.lists.forEach(list => {
        list.movieIds = list.movieIds.filter(id => id !== req.params.id);
    });

    writeDB(db);
    res.json({ message: "Movie deleted successfully" });
});

// 4. Get Diary Logs (chronological watch history)
app.get('/api/diary', (req, res) => {
    const db = readDB();
    const userId = req.headers['x-user-id'] || 'guest';
    const userLogs = db.logs.filter(l => (l.userId || 'guest') === userId);
    
    // Attach movie details to each log
    const enrichedLogs = userLogs.map(log => {
        const movie = db.movies.find(m => m.id === log.movieId) || {
            title: "Unknown Movie",
            poster: "",
            genres: [],
            runtime: log.watchTime || 120
        };
        return { ...log, movie };
    });

    // Sort by date descending (most recent first), then by log ID descending for tie-breaker
    enrichedLogs.sort((a, b) => new Date(b.date) - new Date(a.date) || b.id.localeCompare(a.id));
    res.json(enrichedLogs);
});

// 5. Log a watch session
app.post('/api/diary', (req, res) => {
    const db = readDB();
    const userId = req.headers['x-user-id'] || 'guest';
    const { movieId, date, rating, review, rewatch, watchTime } = req.body;

    if (!movieId || !date) {
        return res.status(400).json({ error: "Movie ID and Date are required" });
    }

    const movie = db.movies.find(m => m.id === movieId);
    if (!movie) {
        return res.status(404).json({ error: "Movie not found" });
    }

    const newLog = {
        id: `log-${Date.now()}`,
        userId,
        movieId,
        date,
        rating: rating !== undefined ? parseFloat(rating) : 0,
        review: review || "",
        rewatch: !!rewatch,
        watchTime: watchTime !== undefined ? parseInt(watchTime) : movie.runtime
    };

    db.logs.push(newLog);
    writeDB(db);
    res.status(201).json({ ...newLog, movie });
});

// 6. Edit a diary log
app.put('/api/diary/:id', (req, res) => {
    const db = readDB();
    const userId = req.headers['x-user-id'] || 'guest';
    const logIndex = db.logs.findIndex(l => l.id === req.params.id);

    if (logIndex === -1) {
        return res.status(404).json({ error: "Log not found" });
    }

    if (db.logs[logIndex].userId && db.logs[logIndex].userId !== userId) {
        return res.status(403).json({ error: "You do not own this diary log" });
    }

    const { date, rating, review, rewatch, watchTime } = req.body;

    if (date) db.logs[logIndex].date = date;
    if (rating !== undefined) db.logs[logIndex].rating = parseFloat(rating);
    if (review !== undefined) db.logs[logIndex].review = review;
    if (rewatch !== undefined) db.logs[logIndex].rewatch = !!rewatch;
    if (watchTime !== undefined) db.logs[logIndex].watchTime = parseInt(watchTime);

    writeDB(db);
    
    // Send back enriched log
    const updatedLog = db.logs[logIndex];
    const movie = db.movies.find(m => m.id === updatedLog.movieId) || { title: "Unknown Movie" };
    res.json({ ...updatedLog, movie });
});

// 7. Delete a diary log
app.delete('/api/diary/:id', (req, res) => {
    const db = readDB();
    const userId = req.headers['x-user-id'] || 'guest';
    const logIndex = db.logs.findIndex(l => l.id === req.params.id);

    if (logIndex === -1) {
        return res.status(404).json({ error: "Log not found" });
    }

    if (db.logs[logIndex].userId && db.logs[logIndex].userId !== userId) {
        return res.status(403).json({ error: "You do not own this diary log" });
    }

    db.logs.splice(logIndex, 1);
    writeDB(db);
    res.json({ message: "Watch log deleted successfully" });
});

// 8. Get lists (watchlist & custom lists)
app.get('/api/lists', (req, res) => {
    const db = readDB();
    const userId = req.headers['x-user-id'] || 'guest';
    const userLists = db.lists.filter(l => (l.userId || 'guest') === userId);

    // Enrich lists with full movie metadata
    const enrichedLists = userLists.map(list => {
        const movies = list.movieIds
            .map(id => db.movies.find(m => m.id === id))
            .filter(Boolean);
        return { ...list, movies };
    });
    res.json(enrichedLists);
});

// 9. Create a custom list
app.post('/api/lists', (req, res) => {
    const db = readDB();
    const userId = req.headers['x-user-id'] || 'guest';
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: "List name is required" });
    }

    const newList = {
        id: `list-${Date.now()}`,
        userId,
        name,
        description: description || "",
        created: new Date().toISOString().split('T')[0],
        movieIds: []
    };

    db.lists.push(newList);
    writeDB(db);
    res.status(201).json({ ...newList, movies: [] });
});

// 10. Add a movie to a list / Toggle movie in watchlist
app.post('/api/lists/:id/movies', (req, res) => {
    const db = readDB();
    const userId = req.headers['x-user-id'] || 'guest';
    const { movieId } = req.body;
    
    const listIndex = db.lists.findIndex(l => l.id === req.params.id);
    if (listIndex === -1) {
        return res.status(404).json({ error: "List not found" });
    }

    const list = db.lists[listIndex];
    if (list.userId && list.userId !== userId) {
        return res.status(403).json({ error: "You do not own this list" });
    }

    if (!db.movies.some(m => m.id === movieId)) {
        return res.status(404).json({ error: "Movie not found" });
    }

    if (!list.movieIds.includes(movieId)) {
        list.movieIds.push(movieId);
        writeDB(db);
    }

    const enrichedMovies = list.movieIds
        .map(id => db.movies.find(m => m.id === id))
        .filter(Boolean);

    res.json({ ...list, movies: enrichedMovies });
});

// 11. Remove a movie from a list
app.delete('/api/lists/:id/movies/:movieId', (req, res) => {
    const db = readDB();
    const userId = req.headers['x-user-id'] || 'guest';
    
    const listIndex = db.lists.findIndex(l => l.id === req.params.id);
    if (listIndex === -1) {
        return res.status(404).json({ error: "List not found" });
    }

    const list = db.lists[listIndex];
    if (list.userId && list.userId !== userId) {
        return res.status(403).json({ error: "You do not own this list" });
    }

    list.movieIds = list.movieIds.filter(id => id !== req.params.movieId);
    writeDB(db);

    const enrichedMovies = list.movieIds
        .map(id => db.movies.find(m => m.id === id))
        .filter(Boolean);

    res.json({ ...list, movies: enrichedMovies });
});

// 12. Get watch stats & analytics
app.get('/api/stats', (req, res) => {
    const db = readDB();
    const userId = req.headers['x-user-id'] || 'guest';
    const logs = db.logs.filter(l => (l.userId || 'guest') === userId);
    const movies = db.movies;

    // Calculate core statistics
    const totalWatched = logs.length;
    const rewatches = logs.filter(l => l.rewatch).length;
    
    // Unique movies watched
    const uniqueMovieIds = new Set(logs.map(l => l.movieId));
    const uniqueWatchedCount = uniqueMovieIds.size;
    
    // Total minutes watched
    const totalMinutes = logs.reduce((acc, curr) => acc + (curr.watchTime || 0), 0);

    // Average rating
    const ratedLogs = logs.filter(l => l.rating > 0);
    const averageRating = ratedLogs.length > 0 
        ? parseFloat((ratedLogs.reduce((acc, curr) => acc + curr.rating, 0) / ratedLogs.length).toFixed(2))
        : 0;

    // Genre distribution (count matching genres from logged movies)
    const genreCounts = {};
    logs.forEach(log => {
        const movie = movies.find(m => m.id === log.movieId);
        if (movie && movie.genres) {
            movie.genres.forEach(genre => {
                genreCounts[genre] = (genreCounts[genre] || 0) + 1;
            });
        }
    });
    
    const genresData = Object.entries(genreCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Rating distribution (0.5 to 5.0, in intervals of 0.5)
    const ratingBins = {
        "0.5": 0, "1.0": 0, "1.5": 0, "2.0": 0, "2.5": 0,
        "3.0": 0, "3.5": 0, "4.0": 0, "4.5": 0, "5.0": 0
    };
    logs.forEach(log => {
        if (log.rating > 0) {
            const formatted = log.rating.toFixed(1);
            if (ratingBins[formatted] !== undefined) {
                ratingBins[formatted]++;
            }
        }
    });
    const ratingDistribution = Object.entries(ratingBins).map(([stars, count]) => ({
        stars: parseFloat(stars),
        count
    }));

    // Watch history timeline (group logs by year-month)
    const monthlyWatches = {};
    logs.forEach(log => {
        if (log.date) {
            // YYYY-MM
            const month = log.date.substring(0, 7);
            monthlyWatches[month] = (monthlyWatches[month] || 0) + 1;
        }
    });

    // Get last 6 active months, sorted chronologically
    const timelineData = Object.entries(monthlyWatches)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6);

    // Top Directors watched
    const directorCounts = {};
    logs.forEach(log => {
        const movie = movies.find(m => m.id === log.movieId);
        if (movie && movie.director) {
            directorCounts[movie.director] = (directorCounts[movie.director] || 0) + 1;
        }
    });
    const topDirectors = Object.entries(directorCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Get user profile details
    const user = db.users && db.users.find(u => u.id === userId);
    const profile = user ? user.profile : (db.profile || { name: "Guest User", bio: "", joinDate: "June 2026" });

    res.json({
        profile,
        summary: {
            totalWatched,
            rewatches,
            uniqueWatchedCount,
            totalMinutes,
            averageRating
        },
        charts: {
            genresData,
            ratingDistribution,
            timelineData,
            topDirectors
        }
    });
});

// Update profile details
app.put('/api/profile', (req, res) => {
    const db = readDB();
    const userId = req.headers['x-user-id'] || 'guest';
    const { name, bio } = req.body;

    const userIndex = db.users ? db.users.findIndex(u => u.id === userId) : -1;
    if (userIndex !== -1) {
        if (name) db.users[userIndex].profile.name = name;
        if (bio !== undefined) db.users[userIndex].profile.bio = bio;
        writeDB(db);
        return res.json(db.users[userIndex].profile);
    } else {
        if (!db.profile) db.profile = {};
        if (name) db.profile.name = name;
        if (bio !== undefined) db.profile.bio = bio;
        writeDB(db);
        return res.json(db.profile);
    }
});

// Default server status route
app.get('/', (req, res) => {
    res.json({ status: "running", api: "/api", app: "Movialized Movie Platform" });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;