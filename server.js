const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  let urlPath = req.url;
  
  // Remove query string
  if (urlPath.includes('?')) {
    urlPath = urlPath.split('?')[0];
  }
  
  // Decode URL and normalize
  urlPath = decodeURIComponent(urlPath);
  
  // Default to index.html for root
  if (urlPath === '/') {
    urlPath = '/index.html';
  }
  
  // Remove leading slash for path.join and prevent path traversal
  let relativePath = urlPath.replace(/^\/+/, '');
  relativePath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  
  let fullPath = path.join(__dirname, relativePath);
  
  // Security: ensure path is within project directory
  if (!fullPath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  fs.stat(fullPath, (statErr, stats) => {
    // If it's a directory without trailing slash, redirect to add slash
    if (!statErr && stats.isDirectory() && !urlPath.endsWith('/')) {
      res.writeHead(301, { 'Location': urlPath + '/' });
      res.end();
      return;
    }
    
    // If it's a directory with trailing slash, serve index.html
    if (!statErr && stats.isDirectory()) {
      fullPath = path.join(fullPath, 'index.html');
    }
    
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = mimeTypes[ext] || 'text/html';
    
    fs.readFile(fullPath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404);
          res.end('File not found');
        } else {
          res.writeHead(500);
          res.end('Server error');
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
