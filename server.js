const http = require('http');
const fs = require('fs');
const path = require('path');
const apiHandler = require('./api/mcf');
const missionLiveHandler = require('./api/mission-live');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);

const MIME = {
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.webp':'image/webp',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.svg':'image/svg+xml; charset=utf-8',
  '.ico':'image/x-icon'
};

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = err.code === 'ENOENT' ? 404 : 500;
      res.end(err.code === 'ENOENT' ? 'Not found' : 'Internal server error');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    if (filePath.includes(path.sep + 'assets' + path.sep)) {
      res.setHeader('Cache-Control', 'public, max-age=300');
    }
    res.end(data);
  });
}

function adaptApi(handler, req, res, url) {
  req.query = Object.fromEntries(url.searchParams.entries());
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (value) => {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(value));
  };
  return handler(req, res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');

    if (url.pathname === '/api/mcf') {
      await adaptApi(apiHandler, req, res, url);
      return;
    }

    if (url.pathname === '/api/mission-live') {
      await adaptApi(missionLiveHandler, req, res, url);
      return;
    }

    let rel = url.pathname;
    if (rel === '/') rel = '/index.html';
    if (/^\/concept-[1-4]$/.test(rel)) rel += '.html';

    const decoded = decodeURIComponent(rel);
    const filePath = path.resolve(ROOT, '.' + decoded);
    if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    sendFile(res, filePath);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.statusCode = 500;
    if (!res.writableEnded) res.end('Internal server error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`MCF Cockpit listening on 0.0.0.0:${PORT}`);
});
