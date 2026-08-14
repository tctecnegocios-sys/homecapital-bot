#!/usr/bin/env node
/* Servidor estático local para o ERP Home Capital (PWA).
   Uso: node serve.js  ->  abre http://localhost:8080
   Sem dependências. Serve apenas a pasta do projeto, uso local/privado.
   Os dados reais NUNCA saem para a internet — isto roda só na sua máquina. */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || process.argv[2] || 8080;
const HOST = process.env.HOST || '127.0.0.1'; // só local por padrão

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (urlPath === '/') urlPath = '/index.html';

    // Impede path traversal: resolve dentro de ROOT
    const filePath = path.normalize(path.join(ROOT, urlPath));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403); return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404 — arquivo não encontrado: ' + urlPath);
      }
      const ext = path.extname(filePath).toLowerCase();
      const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
      // Service worker não pode ser cacheado agressivamente
      if (path.basename(filePath) === 'sw.js') headers['Cache-Control'] = 'no-cache';
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (e) {
    res.writeHead(500); res.end('Erro: ' + e.message);
  }
});

server.listen(PORT, HOST, () => {
  console.log('\n  ERP Home Capital rodando localmente');
  console.log('  ➜  http://localhost:' + PORT + '\n');
  console.log('  Abra no navegador e use "Instalar app" para virar aplicativo.');
  console.log('  Ctrl+C para encerrar.\n');
});
