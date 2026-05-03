const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');

function getExecutableDir() {
  if (process.pkg) {
    return path.dirname(process.execPath);
  }
  return __dirname;
}

const EXEC_DIR = getExecutableDir();
const CONFIG_FILE = path.join(EXEC_DIR, 'astra-config.json');
const PUBLIC_DIR = process.pkg ? path.join(__dirname, 'public') : path.join(__dirname, 'public');

function loadConfig() {
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return { astraUrl: '', astraToken: '' };
  }
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config), 'utf8');
}

global.astraConfig = loadConfig();

const app = express();
const PORT = process.env.PORT || 38402;

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

app.post('/api/config', (req, res) => {
  const { astraUrl, astraToken } = req.body;
  global.astraConfig = { astraUrl, astraToken };
  saveConfig(global.astraConfig);
  res.json({ ok: true });
});

app.get('/api/config', (req, res) => {
  res.json(global.astraConfig || { astraUrl: '', astraToken: '' });
});

app.delete('/api/config', (req, res) => {
  global.astraConfig = { astraUrl: '', astraToken: '' };
  saveConfig(global.astraConfig);
  res.json({ ok: true });
});

app.get('/api/proxy/v1/events', (req, res) => {
  if (!global.astraConfig?.astraUrl || !global.astraConfig?.astraToken) {
    return res.status(401).json({ error: 'Not configured' });
  }

  const targetUrl = `${global.astraConfig.astraUrl.replace(/\/$/, '')}/v1/events`;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const httpReq = http.request(targetUrl, {
    headers: {
      'Authorization': `Bearer ${global.astraConfig.astraToken}`,
    },
  }, (httpRes) => {
    httpRes.on('data', (chunk) => res.write(chunk));
    httpRes.on('end', () => res.end());
  });

  httpReq.on('error', (err) => {
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  });

  req.on('close', () => httpReq.destroy());
  httpReq.end();
});

app.all('/api/proxy/*', async (req, res) => {
  if (!global.astraConfig?.astraUrl || !global.astraConfig?.astraToken) {
    return res.status(401).json({ error: 'Not configured' });
  }

  const targetPath = req.path.replace('/api/proxy', '');
  const targetUrl = `${global.astraConfig.astraUrl.replace(/\/$/, '')}${targetPath}`;

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${global.astraConfig.astraToken}`,
        'Content-Type': 'application/json',
      },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('image')) {
      const buffer = await response.arrayBuffer();
      res.set('Content-Type', contentType);
      res.send(Buffer.from(buffer));
      return;
    }

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach Astra', details: err.message });
  }
});

const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║       Astra Remote v1.0              ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log(`  Running on port ${PORT}`);
  console.log(`  Access from your phone: http://<your-pc-ip>:${PORT}`);
  console.log('');
});
