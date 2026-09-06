import express from 'express';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { server as wisp } from '@mercuryworkshop/wisp-js/server';

const here = dirname(fileURLToPath(import.meta.url));
const modules = join(here, 'node_modules');

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.use(express.static(join(here, 'public')));

app.use('/uv/', express.static(join(modules, '@titaniumnetwork-dev/ultraviolet/dist')));
app.use('/baremux/', express.static(join(modules, '@mercuryworkshop/bare-mux/dist')));
app.use('/epoxy/', express.static(join(modules, '@mercuryworkshop/epoxy-transport/dist')));
app.use('/epoxy-tls/', express.static(join(modules, '@mercuryworkshop/epoxy-tls/full')));

app.get('/go', (req, res) => {
  res.sendFile(join(here, 'public', 'go.html'));
});

const server = http.createServer(app);

server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/wisp/')) {
    wisp.routeRequest(req, socket, head);
  } else {
    socket.end();
  }
});

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`BiggyOS proxy listening on http://localhost:${port}`);
});
