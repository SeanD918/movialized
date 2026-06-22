const app = require('../server/index.js');

module.exports = (req, res) => {
    // Vercel Serverless Functions sometimes strip the directory path from the URL
    // This ensures Express routing (app.get('/api/...')) continues to work flawlessly
    if (!req.url.startsWith('/api')) {
        req.url = `/api${req.url === '/' ? '' : req.url}`;
    }
    return app(req, res);
};
