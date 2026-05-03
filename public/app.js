const state = {
  connected: false,
  nowPlaying: null,
  progressInterval: null,
  eventSource: null,
  lastUpdateAt: 0,
};

const $ = (sel) => document.querySelector(sel);

const screens = {
  setup: $('#setup-screen'),
  player: $('#player-screen'),
  settings: $('#settings-screen'),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  screens[name].classList.remove('hidden');
}

function togglePassword() {
  const input = $('#astra-token');
  input.type = input.type === 'password' ? 'text' : 'password';
}

function toggleSettingsPassword() {
  const input = $('#settings-token');
  input.type = input.type === 'password' ? 'text' : 'password';
}

window.togglePassword = togglePassword;
window.toggleSettingsPassword = toggleSettingsPassword;

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateUI(data) {
  if (!data || !data.currentTrack) {
    $('#track-title').textContent = 'No track playing';
    $('#track-artist').textContent = '';
    $('#track-album').textContent = '';
    $('#artwork').classList.remove('visible');
    $('#queue-length').textContent = '--';
    return;
  }

  const track = data.currentTrack;
  $('#track-title').textContent = track.title || 'Unknown Title';
  $('#track-artist').textContent = track.artist || 'Unknown Artist';
  $('#track-album').textContent = track.album || '';

  if (track.artworkUrl) {
    const artUrl = track.artworkUrl.replace(/http:\/\/[^\/]+/, '');
    $('#artwork').src = `/api/proxy${artUrl}`;
    $('#artwork').classList.add('visible');
  } else {
    $('#artwork').classList.remove('visible');
  }

  if (data.queueLength) {
    $('#queue-length').textContent = data.queueLength;
  }

  updateProgress(data);
  updatePlayButton(data.playbackState);
  updateFavorite(track.isFavorite);

  if (data.visualizerLineColor) {
    document.documentElement.style.setProperty('--accent', data.visualizerLineColor);
  }

  state.nowPlaying = data;
  state.lastUpdateAt = Date.now();
}

function updateProgress(data) {
  if (!data || !data.duration) {
    $('#progress-fill').style.width = '0%';
    $('#current-time').textContent = '0:00';
    $('#duration').textContent = '0:00';
    return;
  }

  const pct = (data.currentTime / data.duration) * 100;
  $('#progress-fill').style.width = `${Math.min(pct, 100)}%`;
  $('#current-time').textContent = formatTime(data.currentTime);
  $('#duration').textContent = formatTime(data.duration);
}

function updatePlayButton(playbackState) {
  const isPlaying = playbackState === 'playing';
  $('#play-icon').classList.toggle('hidden', isPlaying);
  $('#pause-icon').classList.toggle('hidden', !isPlaying);
}

function updateFavorite(isFav) {
  $('#favorite-btn').classList.toggle('active', isFav);
  $('#fav-icon').classList.toggle('hidden', isFav);
  $('#fav-filled').classList.toggle('hidden', !isFav);
}

function startProgressTimer() {
  if (state.progressInterval) clearInterval(state.progressInterval);
  state.progressInterval = setInterval(() => {
    if (state.nowPlaying && state.nowPlaying.playbackState === 'playing') {
      const elapsed = (Date.now() - state.lastUpdateAt) / 1000;
      state.nowPlaying.currentTime += elapsed;
      state.lastUpdateAt = Date.now();
      updateProgress(state.nowPlaying);
    }
  }, 250);
}

async function sendControl(command) {
  try {
    const res = await fetch('/api/proxy/v1/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error('Control failed:', err);
    }
  } catch (err) {
    console.error('Control error:', err);
  }
}

function connectSSE() {
  if (state.eventSource) {
    state.eventSource.close();
  }

  state.eventSource = new EventSource('/api/proxy/v1/events');

  state.eventSource.addEventListener('now-playing', (e) => {
    try {
      const data = JSON.parse(e.data);
      updateUI(data);
      state.connected = true;
      updateConnectionStatus();
    } catch (err) {
      console.error('SSE parse error:', err);
    }
  });

  state.eventSource.onopen = () => {
    state.connected = true;
    updateConnectionStatus();
    startProgressTimer();
  };

  state.eventSource.onerror = () => {
    state.connected = false;
    updateConnectionStatus();
  };
}

function updateConnectionStatus() {
  const dot = $('#pulse-dot');
  const text = $('#status-text');
  if (state.connected) {
    dot.className = 'pulse-dot connected';
    text.textContent = 'Connected';
  } else {
    dot.className = 'pulse-dot disconnected';
    text.textContent = 'Disconnected';
  }
}

async function saveConfig(url, token) {
  const res = await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ astraUrl: url, astraToken: token }),
  });
  return res.ok;
}

async function loadConfig() {
  const res = await fetch('/api/config');
  return res.json();
}

$('#setup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = $('#astra-url').value.trim();
  const token = $('#astra-token').value.trim();

  if (!url || !token) return;

  const btn = $('#setup-form button[type="submit"]');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Connecting...';

  const saved = await saveConfig(url, token);
  if (saved) {
    showScreen('player');
    connectSSE();
  }

  btn.disabled = false;
  btn.querySelector('span').textContent = 'Connect';
});

$('#settings-btn').addEventListener('click', async () => {
  const config = await loadConfig();
  $('#settings-url').value = config.astraUrl || '';
  $('#settings-token').value = config.astraToken || '';
  showScreen('settings');
});

$('#back-btn').addEventListener('click', () => {
  showScreen('player');
});

$('#settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = $('#settings-url').value.trim();
  const token = $('#settings-token').value.trim();

  if (!url || !token) return;

  const btn = $('#settings-form button[type="submit"]');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Saving...';

  await saveConfig(url, token);
  connectSSE();

  btn.disabled = false;
  btn.querySelector('span').textContent = 'Save & Reconnect';
  showScreen('player');
});

$('#disconnect-btn').addEventListener('click', doDisconnect);

$('#logout-btn').addEventListener('click', doDisconnect);

async function doDisconnect() {
  if (state.eventSource) state.eventSource.close();
  await fetch('/api/config', { method: 'DELETE' });
  $('#astra-url').value = '';
  $('#astra-token').value = '';
  showScreen('setup');
}

$('#play-btn').addEventListener('click', () => {
  sendControl(state.nowPlaying?.playbackState === 'playing' ? 'pause' : 'play');
});

$('#prev-btn').addEventListener('click', () => sendControl('previous'));
$('#next-btn').addEventListener('click', () => sendControl('next'));

$('#favorite-btn').addEventListener('click', () => sendControl('toggle-favorite'));

(async () => {
  const config = await loadConfig();
  if (config.astraUrl && config.astraToken) {
    $('#astra-url').value = config.astraUrl;
    $('#astra-token').value = config.astraToken;
    showScreen('player');
    connectSSE();
  } else {
    showScreen('setup');
  }
})();
