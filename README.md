# Astra Remote

> A beautiful mobile web remote for the [Astra](https://github.com/Boof2015/astra) music player.

Control your desktop music library from your phone. Real-time playback state, album art, transport controls — all in a sleek, responsive web UI that matches Astra's aesthetic.

<p align="center">
  <img src="https://img.shields.io/badge/license-GPL--3.0-blue?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js" alt="Node">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square" alt="Platform">
</p>

## ✨ Features

- **Real-time playback** — live track info, album art, and progress via Server-Sent Events
- **Transport controls** — play, pause, next, previous, and favorite toggle
- **Auto-connect** — saves your config and reconnects on next visit
- **Dynamic theming** — accent color matches Astra's visualizer line color
- **Responsive design** — works on phones, tablets, and desktops
- **One-tap disconnect** — quick logout from the header to switch connections
- **Standalone binary** — no Node.js required, just double-click and go

## 🚀 Quick Start

### Option A: Standalone Binary (No Dependencies)

1. Download `astra-remote.exe` from the [Releases](https://github.com/fredystar200/astra-remote/releases) page
2. Double-click to run — it starts immediately
3. Skip to **[Connect from Your Phone](#3-connect-from-your-phone)**

### Option B: From Source
You will need [NodeJS](https://nodejs.org)
```bash
git clone https://github.com/YOUR_USERNAME/astra-remote.git
cd astra-remote
npm install
npm start
```

### 1. Enable the API in Astra

1. Open Astra → **Settings** → **Integrations** → **Local API**
2. Toggle **Local Integration API** on
3. Toggle **External Playback Controls** on
4. Note the **Endpoint URL** (default: `http://127.0.0.1:38401`) and **API Key**

### 2. Start the Bridge Server

If using the standalone binary, it's already running. If using `npm start`, the server runs on port **38402**.

### 3. Connect from Your Phone

1. Find your PC's local IP address:
   - **Windows:** `ipconfig` → look for IPv4 (e.g. `192.168.1.x`)
   - **macOS/Linux:** `ip addr` or `ifconfig`

2. Open Safari/Chrome on your phone and navigate to:
   ```
   http://<your-pc-ip>:38402
   ```

3. Enter the Astra API URL and API key, then tap **Connect**

4. Your config is saved automatically — next time just open the URL and it reconnects.

## 🔒 Firewall Note

On first launch, Windows Firewall may prompt you to allow network access. **Allow it** so your phone can reach the server.

If no prompt appears and you can't connect from your phone, manually add an inbound rule for port `38402` (TCP) in Windows Defender Firewall.

## 📱 Usage

### Player Screen

| Control | Action |
|---------|--------|
| ▶️ Play / ⏸ Pause | Toggle playback |
| ⏮ Previous | Skip to previous track |
| ⏭ Next | Skip to next track |
| ♡ Favorite | Toggle favorite for current track |
| ↩ Logout | Disconnect and return to setup |
| ⚙️ Settings | Change API URL or key |

### Settings Screen

- Update the **Astra API URL** if you changed the port in Astra
- Update the **API Key** if you regenerated it
- Tap **Save & Reconnect** to apply changes
- Tap **Disconnect** to clear saved credentials

### Connection Status

- 🟢 **Green pulse** — connected and receiving live updates
- 🔴 **Red dot** — disconnected (Astra may be closed or API disabled)

## 🏗 Project Structure

```
astra-remote/
├── public/
│   ├── index.html      # Web UI
│   ├── style.css       # Styles (glassmorphism, responsive)
│   └── app.js          # Frontend logic (SSE, controls)
├── server.js           # Express bridge server (proxy + static)
├── package.json
├── .gitignore
└── astra-config.json   # Saved config (auto-generated, gitignored)
```

## 📦 Building the Standalone Binary

Requires Node.js and npm installed for the build step only.

```bash
npm install
npm run build        # All platforms
npm run build:win    # Windows only
npm run build:mac    # macOS only
npm run build:linux  # Linux only
```

Binaries output to the `dist/` folder.

## ⚙️ Configuration

### Custom Port

**Standalone binary:**
```bash
# Windows (PowerShell)
$env:PORT = "8080"; .\astra-remote.exe

# Linux/macOS
PORT=8080 ./astra-remote
```

**From source:**
```bash
# Linux/macOS
PORT=8080 npm start

# Windows (PowerShell)
$env:PORT = "8080"; npm start
```

### Saved Config

Credentials are stored in `astra-config.json` next to the binary or project root. This file is gitignored. Deleting it resets the connection state.

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Server | Node.js + Express |
| Packaging | pkg (standalone binary) |
| Real-time | Server-Sent Events (SSE) |
| Frontend | Vanilla JS + CSS |
| Proxy | Express reverse proxy to Astra API |

## 📋 Requirements

- **Astra** 0.5+ with Local API enabled
- Same Wi-Fi network between PC and phone
- **Node.js 18+** only if running from source or building the binary

## 🔗 Related

- [Astra Music Player](https://github.com/Boof2015/astra) — the desktop player this remote controls
- [Astra API Docs](https://github.com/Boof2015/astra/wiki/Astra-API) — full API reference

## 📄 License

[GPL-3.0](LICENSE)
