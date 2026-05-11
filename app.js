// ============================================================
// MeteoLog – App (Router & Init)
// ============================================================
import { initAuth, loginEmail, registerEmail, loginAnonymous, logout, onUserChange, currentUser, getUserDisplayName, isGuest, resetPassword } from './auth.js';
import { signInWithGoogle, signInWithFacebook, socialAuthErrorMsg } from './auth-providers.js';
import { initDB, getLocations } from './db.js';
import { renderDashboard } from './dashboard.js';
import { renderLog }       from './log.js';
import { renderHistory }   from './history.js';
import { renderCharts }    from './charts.js';
import { renderLocations } from './locations.js';
import { showToast }       from './utils.js';
import { AppState, setActiveLocation } from './state.js';
import { showHelpModal, showInstallModal, showAboutModal, shareApp, initTheme, toggleTheme, showPrivacyModal, showDeleteAccountModal } from './ui-modals.js';

// ── Offline állapot figyelés ─────────────────────────────────
function initOfflineDetection() {
  const banner = document.getElementById('offline-banner');
  if (!banner) return;

  const update = () => {
    banner.style.display = navigator.onLine ? 'none' : 'block';
    // Header padding igazítása ha a banner látható
    const header = document.getElementById('app-header');
    if (header) {
      header.style.marginTop = navigator.onLine ? '0' : '32px';
    }
  };

  window.addEventListener('online',  () => {
    update();
    window.__showToast('✅ Kapcsolat helyreállt – adatok szinkronizálva!');
  });
  window.addEventListener('offline', () => {
    update();
    window.__showToast('📡 Offline mód – rögzítés később szinkronizál');
  });
  update(); // kezdeti állapot
}

// ── Window globálok (import-mentes view fájlok számára) ───────
window.__appState = AppState;
window.__navigate = (view) => navigate(view);
window.__setActiveLocation = (id) => {
  setActiveLocation(id);
  updateLocationChip();
};
window.__showToast = (msg, type) => {
  // inline showToast mivel a utils import is körkörös lehet
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast ${type || 'success'}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3100);
};

// Helyszín változás esemény (state.js dispatch-eli)
window.addEventListener('location-changed', () => {
  updateLocationChip();
});

// ── Wait for Firebase ────────────────────────────────────────
function showSplashError(msg) {
  const box = document.getElementById('splash-error');
  const txt = document.getElementById('splash-error-msg');
  if (box && txt) { txt.textContent = msg; box.style.display = 'block'; }
}

function initFirebase() {
  // Ha ?loc= paraméter van az URL-ben → publikus nézet
  const locParam = new URLSearchParams(window.location.search).get('loc');
  if (locParam) {
    import('./public-view.js').then(m => m.renderPublicView(locParam));
    hideSplash();
    return;
  }
  const { auth, db } = window.__firebase;
  initAuth(auth);
  initDB(db);
  boot();
}

if (window.__firebase) {
  initFirebase();
} else {
  window.addEventListener('firebase-ready', initFirebase);
}

function boot() {
  initTheme();
  initOfflineDetection();
  try {
    onUserChange(user => {
      if (user) {
        hideAuthModal();
        showApp();
        loadLocationChip();
      } else {
        showAuthModal();
      }
    });
  } catch(e) {
    showSplashError('boot() hiba: ' + e.message);
  }
}

// ── Auth UI ──────────────────────────────────────────────────
function showAuthModal() {
  document.getElementById('auth-modal').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  hideSplash();
}

function hideAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}

function showApp() {
  document.getElementById('app').classList.remove('hidden');
  hideSplash();
  navigate(AppState.activeView);
}

function hideSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;
  splash.classList.add('fade-out');
  setTimeout(() => splash?.remove(), 600);
}

// Auth form events
document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  document.querySelectorAll('.auth-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.auth-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
      document.getElementById('auth-login').classList.toggle('hidden', tab !== 'login');
      document.getElementById('auth-register').classList.toggle('hidden', tab !== 'register');
    });
  });

  document.getElementById('btn-forgot')?.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const err   = document.getElementById('auth-error');
    err.classList.add('hidden');

    if (!email) {
      err.textContent = 'Add meg az e-mail címed a jelszó visszaállításhoz.';
      err.classList.remove('hidden');
      return;
    }
    try {
      await resetPassword(email);
      err.style.background = 'rgba(0,229,176,0.1)';
      err.style.borderColor = 'var(--accent)';
      err.style.color = 'var(--accent)';
      err.textContent = '✅ Jelszó-visszaállító e-mail elküldve! Nézd meg a postaládádat.';
      err.classList.remove('hidden');
    } catch(e) {
      err.style.background = '';
      err.style.borderColor = '';
      err.style.color = '';
      err.textContent = authErrorMsg(e.code);
      err.classList.remove('hidden');
    }
  });

  document.getElementById('btn-login')?.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-password').value;
    const err   = document.getElementById('auth-error');
    err.classList.add('hidden');
    try {
      await loginEmail(email, pass);
    } catch(e) {
      err.textContent = authErrorMsg(e.code);
      err.classList.remove('hidden');
    }
  });

  document.getElementById('btn-register')?.addEventListener('click', async () => {
    const name  = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass  = document.getElementById('reg-password').value;
    const err   = document.getElementById('auth-error');
    err.classList.add('hidden');
    if (!name) { err.textContent = 'A becenév kötelező!'; err.classList.remove('hidden'); return; }
    try {
      await registerEmail(name, email, pass);
    } catch(e) {
      err.textContent = authErrorMsg(e.code);
      err.classList.remove('hidden');
    }
  });

  document.getElementById('btn-guest')?.addEventListener('click', async () => {
    try {
      await loginAnonymous();
    } catch(e) {
      document.getElementById('auth-error').textContent = 'Hiba: ' + e.message;
      document.getElementById('auth-error').classList.remove('hidden');
    }
  });

  // Social login gombok
  async function handleSocialLogin(fn) {
    const err = document.getElementById('auth-error');
    err.classList.add('hidden');
    try {
      await fn();
    } catch(e) {
      err.textContent = socialAuthErrorMsg(e.code) || e.message;
      err.classList.remove('hidden');
    }
  }

  document.getElementById('btn-google')?.addEventListener('click', () =>
    handleSocialLogin(signInWithGoogle));

  document.getElementById('btn-facebook')?.addEventListener('click', () =>
    handleSocialLogin(signInWithFacebook));


  // Header auth button
  document.getElementById('btn-header-auth')?.addEventListener('click', showAccountMenu);

  // Nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });

  // Location selector
  document.getElementById('location-selector')?.addEventListener('click', toggleLocationDropdown);
  document.getElementById('btn-add-location-quick')?.addEventListener('click', () => {
    closeLocationDropdown();
    navigate('locations');
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('#location-selector') && !e.target.closest('#location-dropdown')) {
      closeLocationDropdown();
    }
  });
});

function authErrorMsg(code) {
  const msgs = {
    'auth/user-not-found':    'Nem találtunk ilyen e-mail címet.',
    'auth/wrong-password':    'Hibás jelszó.',
    'auth/email-already-in-use': 'Ez az e-mail már regisztrált.',
    'auth/weak-password':     'Legalább 6 karakteres jelszó kell.',
    'auth/invalid-email':     'Érvénytelen e-mail cím.',
    'auth/too-many-requests': 'Túl sok próbálkozás. Próbáld újra később.',
  };
  return msgs[code] || 'Hiba: ' + code;
}

// ── Navigation ────────────────────────────────────────────────
export function navigate(view) {
  AppState.activeView = view;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));

  const main = document.getElementById('app-main');
  main.scrollTop = 0;

  switch(view) {
    case 'dashboard': renderDashboard(main); break;
    case 'log':       renderLog(main); break;
    case 'history':   renderHistory(main); break;
    case 'charts':    renderCharts(main); break;
    case 'locations': renderLocations(main); break;
  }
}

// ── Location Dropdown ─────────────────────────────────────────
async function loadLocationChip() {
  updateLocationChip();
}

async function updateLocationChip() {
  const nameEl = document.getElementById('active-location-name');
  if (!nameEl) return;
  if (!AppState.activeLocationId) {
    nameEl.textContent = 'Válassz...';
    return;
  }
  try {
    const locs = await getLocations();
    const active = locs.find(l => l.id === AppState.activeLocationId);
    if (active) {
      nameEl.textContent = (active.icon || '📍') + ' ' + active.name;
    } else {
      nameEl.textContent = 'Válassz...';
      setActiveLocation(null);
    }
  } catch(e) {
    nameEl.textContent = '...';
  }
}

async function toggleLocationDropdown() {
  const dd = document.getElementById('location-dropdown');
  if (!dd.classList.contains('hidden')) {
    closeLocationDropdown(); return;
  }
  try {
    const locs = await getLocations();
    const list = document.getElementById('location-list');
    list.innerHTML = locs.map(l => `
      <div class="dropdown-item ${l.id === AppState.activeLocationId ? 'active' : ''}" data-id="${l.id}">
        <span>${l.icon || '📍'}</span> <span>${l.name}</span>
      </div>`).join('');
    list.querySelectorAll('.dropdown-item').forEach(el => {
      el.addEventListener('click', () => {
        setActiveLocation(el.dataset.id);
        closeLocationDropdown();
        navigate(AppState.activeView);
      });
    });
    dd.classList.remove('hidden');
  } catch(e) {}
}

function closeLocationDropdown() {
  document.getElementById('location-dropdown')?.classList.add('hidden');
}

// ── Account Menu ──────────────────────────────────────────────
function showAccountMenu() {
  const existing = document.querySelector('.account-popup');
  if (existing) { existing.remove(); return; }

  const popup = document.createElement('div');
  popup.className = 'account-popup';
  const name  = getUserDisplayName();
  const guest = isGuest();
  const isDark = localStorage.getItem('meteolog_theme') !== 'light';

  popup.innerHTML = `
    <style>
    .account-popup {
      position: fixed;
      top: calc(var(--header-h) + env(safe-area-inset-top, 0px) + 8px);
      right: 12px; left: 12px;
      background: var(--bg-card);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      z-index: 300;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      animation: slide-down 0.2s ease;
      overflow: hidden;
    }
    .ap-header {
      display: flex; align-items: center; gap: 12px;
      padding: 16px; border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }
    .ap-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: var(--accent-dim); border: 2px solid var(--accent);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
    }
    .ap-name  { font-weight: 600; font-size: 15px; }
    .ap-sub   { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
    .ap-group { padding: 8px; border-bottom: 1px solid var(--border); }
    .ap-group:last-child { border-bottom: none; }
    .ap-row {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 8px; border-radius: var(--radius-sm);
      color: var(--text-primary); font-size: 14px;
      cursor: pointer; transition: background 0.15s;
      background: none; border: none; width: 100%; text-align: left;
      font-family: var(--font-body);
    }
    .ap-row:hover { background: var(--bg-input); }
    .ap-row-icon { font-size: 17px; width: 24px; text-align: center; flex-shrink: 0; }
    .ap-row-label { flex: 1; }
    .ap-row-badge {
      font-size: 11px; background: var(--accent-dim); color: var(--accent);
      padding: 2px 8px; border-radius: 10px; font-weight: 600;
    }
    .ap-danger { color: var(--red) !important; }
    </style>

    <!-- Fejléc -->
    <div class="ap-header">
      <div class="ap-avatar">${guest ? '👤' : '🌤️'}</div>
      <div>
        <div class="ap-name">${name}</div>
        <div class="ap-sub">${guest ? 'Vendég fiók' : 'Regisztrált felhasználó'}</div>
      </div>
    </div>

    <!-- Csoport 1: Gyors műveletek -->
    <div class="ap-group">
      ${guest ? '<button class="ap-row" id="ap-register"><span class="ap-row-icon">📧</span><span class="ap-row-label">Regisztráció</span><span class="ap-row-badge">Új</span></button>' : ''}
      <button class="ap-row" id="ap-theme">
        <span class="ap-row-icon">${isDark ? '☀️' : '🌙'}</span>
        <span class="ap-row-label">${isDark ? 'Világos téma' : 'Sötét téma'}</span>
      </button>
      <button class="ap-row" id="ap-share">
        <span class="ap-row-icon">📣</span>
        <span class="ap-row-label">App megosztása</span>
      </button>
    </div>

    <!-- Csoport 2: Segítség -->
    <div class="ap-group">
      <button class="ap-row" id="ap-help">
        <span class="ap-row-icon">📖</span>
        <span class="ap-row-label">Használati útmutató</span>
      </button>
      <button class="ap-row" id="ap-install">
        <span class="ap-row-icon">📱</span>
        <span class="ap-row-label">Telepítési útmutató</span>
      </button>
      <button class="ap-row" id="ap-feedback">
        <span class="ap-row-icon">⭐</span>
        <span class="ap-row-label">Visszajelzés küldése</span>
      </button>
    </div>

    <!-- Csoport 3: Infó -->
    <div class="ap-group">
      <button class="ap-row" id="ap-about">
        <span class="ap-row-icon">ℹ️</span>
        <span class="ap-row-label">Az appról</span>
      </button>
      <button class="ap-row" id="ap-privacy">
        <span class="ap-row-icon">🔒</span>
        <span class="ap-row-label">Adatvédelmi nyilatkozat</span>
      </button>
    </div>

    <!-- Csoport 4: Fiók -->
    <div class="ap-group">
      ${!guest ? '<button class="ap-row ap-danger" id="ap-delete-account"><span class="ap-row-icon">🗑️</span><span class="ap-row-label">Fiók törlése</span></button>' : ''}
      <button class="ap-row ap-danger" id="ap-logout">
        <span class="ap-row-icon">🚪</span>
        <span class="ap-row-label">Kijelentkezés</span>
      </button>
    </div>`;

  document.body.appendChild(popup);

  popup.querySelector('#ap-logout')?.addEventListener('click', async () => {
    popup.remove();
    await logout();
  });

  popup.querySelector('#ap-theme')?.addEventListener('click', () => {
    popup.remove();
    toggleTheme();
  });

  popup.querySelector('#ap-feedback')?.addEventListener('click', () => {
    popup.remove();
    window.open('https://github.com/gaben8808/meteolog/issues/new', '_blank');
  });

  popup.querySelector('#ap-share')?.addEventListener('click', () => {
    popup.remove();
    shareApp();
  });

  popup.querySelector('#ap-delete-account')?.addEventListener('click', () => {
    popup.remove();
    showDeleteAccountModal();
  });

  popup.querySelector('#ap-privacy')?.addEventListener('click', () => {
    popup.remove();
    showPrivacyModal();
  });

  popup.querySelector('#ap-about')?.addEventListener('click', () => {
    popup.remove();
    showAboutModal();
  });

  popup.querySelector('#ap-help')?.addEventListener('click', () => {
    popup.remove();
    showHelpModal();
  });

  popup.querySelector('#ap-install')?.addEventListener('click', () => {
    popup.remove();
    showInstallModal();
  });

  popup.querySelector('#ap-register')?.addEventListener('click', () => {
    popup.remove();
    document.getElementById('auth-modal').classList.remove('hidden');
    document.querySelector('[data-tab="register"]')?.click();
  });

  setTimeout(() => document.addEventListener('click', function handler(e) {
    if (!popup.contains(e.target) && e.target !== document.getElementById('btn-header-auth')) {
      popup.remove();
      document.removeEventListener('click', handler);
    }
  }), 50);
}

