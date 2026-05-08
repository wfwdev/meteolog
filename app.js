// ============================================================
// MeteoLog – App (Router & Init)
// ============================================================
import { initAuth, loginEmail, registerEmail, loginAnonymous, logout, onUserChange, currentUser, getUserDisplayName, isGuest } from './auth.js';
import { signInWithGoogle, signInWithFacebook, socialAuthErrorMsg } from './auth-providers.js';
import { initDB, getLocations } from './db.js';
import { renderDashboard } from './dashboard.js';
import { renderLog }       from './log.js';
import { renderHistory }   from './history.js';
import { renderCharts }    from './charts.js';
import { renderLocations } from './locations.js';
import { showToast }       from './utils.js';
import { AppState, setActiveLocation } from './state.js';

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
  const name = getUserDisplayName();
  const guest = isGuest();

  popup.innerHTML = `
    <style>
    .account-popup {
      position: fixed; top: calc(var(--header-h) + 8px); right: 12px;
      background: var(--bg-card); border: 1px solid var(--border-light);
      border-radius: var(--radius); padding: 16px; min-width: 200px; z-index: 300;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      animation: slide-down 0.2s ease;
    }
    .ap-name { font-weight: 600; margin-bottom: 4px; }
    .ap-sub  { font-size: 12px; color: var(--text-muted); margin-bottom: 14px; }
    .ap-btn  { display: block; width: 100%; padding: 10px; background: var(--bg-input); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); font-size: 14px; cursor: pointer; text-align: left; margin-bottom: 8px; transition: background 0.15s; }
    .ap-btn:hover { background: var(--bg-card-hover); }
    </style>
    <div class="ap-name">${name}</div>
    <div class="ap-sub">${guest ? '👤 Vendég fiók' : '✉️ Regisztrált felhasználó'}</div>
    ${guest ? `<button class="ap-btn" id="ap-register">📧 Regisztráció</button>` : ''}
    <button class="ap-btn" id="ap-about">ℹ️ Az appról</button>
    <button class="ap-btn" id="ap-help">📖 Használati útmutató</button>
    <button class="ap-btn" id="ap-install">📱 Telepítési útmutató</button>
    <button class="ap-btn" id="ap-logout" style="color:var(--red);">🚪 Kijelentkezés</button>`;

  document.body.appendChild(popup);

  popup.querySelector('#ap-logout')?.addEventListener('click', async () => {
    popup.remove();
    await logout();
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

// ── Útmutató modal ────────────────────────────────────────────
function showHelpModal() {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;z-index:600;overflow-y:auto;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;padding:16px;';
  modal.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-lg);width:100%;max-width:420px;overflow:hidden;margin:auto;">
      <div style="background:var(--bg-secondary);border-bottom:1px solid var(--border);padding:18px 20px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:22px;">📖</span>
        <span style="font-family:var(--font-display);font-weight:700;font-size:18px;">Használati útmutató</span>
        <button id="help-close" style="margin-left:auto;background:var(--bg-card);border:1px solid var(--border);border-radius:50%;width:32px;height:32px;color:var(--text-secondary);cursor:pointer;font-size:14px;">✕</button>
      </div>
      <div style="padding:20px;display:flex;flex-direction:column;gap:18px;">

        <div style="background:var(--bg-input);border-radius:var(--radius);padding:14px;">
          <div style="font-family:var(--font-display);font-weight:700;font-size:14px;margin-bottom:8px;">📍 1. Helyszín hozzáadása</div>
          <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">Nyisd meg a <b style="color:var(--text-primary);">Helyszínek</b> fület (térképtű ikon). Kattints a <b style="color:var(--text-primary);">+ Új helyszín hozzáadása</b> gombra. Add meg a nevet, válassz ikont, és opcionálisan add meg a GPS koordinátákat az Open-Meteo integrációhoz. Ha nyilvánossá teszed, megosztható linket kapsz.</div>
        </div>

        <div style="background:var(--bg-input);border-radius:var(--radius);padding:14px;">
          <div style="font-family:var(--font-display);font-weight:700;font-size:14px;margin-bottom:8px;">🌡️ 2. Időjárás rögzítése</div>
          <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">Nyomd meg a <b style="color:var(--accent);">+ zöld gombot</b> az alján. Válaszd ki az időjárás típusát, állítsd be a hőmérsékletet és más mért értékeket. A ki/be kapcsolókkal döntöd el melyik mezőt töltöd ki. A végén nyomd meg a <b style="color:var(--text-primary);">Mentés</b> gombot.</div>
        </div>

        <div style="background:var(--bg-input);border-radius:var(--radius);padding:14px;">
          <div style="font-family:var(--font-display);font-weight:700;font-size:14px;margin-bottom:8px;">📅 3. Előzmények megtekintése</div>
          <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">A <b style="color:var(--text-primary);">Előzmény</b> fülön naptár nézetben látod az összes bejegyzést. A zöld emoji jelzi azokat a napokat ahol van adat. Kattints egy napra a részletek megtekintéséhez. A kuka ikonnal törölhetsz bejegyzést.</div>
        </div>

        <div style="background:var(--bg-input);border-radius:var(--radius);padding:14px;">
          <div style="font-family:var(--font-display);font-weight:700;font-size:14px;margin-bottom:8px;">📊 4. Grafikonok és export</div>
          <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">A <b style="color:var(--text-primary);">Grafikonok</b> fülön hőmérséklet és csapadék grafikonokat, valamint statisztikákat látsz. Az időszakot (7/30/90/365 nap) a gombok segítségével válthatod. Az oldal alján lévő <b style="color:var(--text-primary);">CSV letöltés</b> gombbal Excelbe exportálhatod az adatokat.</div>
        </div>

        <div style="background:var(--bg-input);border-radius:var(--radius);padding:14px;">
          <div style="font-family:var(--font-display);font-weight:700;font-size:14px;margin-bottom:8px;">🌐 5. Publikus megosztás</div>
          <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">Ha egy helyszínt nyilvánosra állítasz, megjelenik mellette a <b style="color:var(--text-primary);">🌐 Megnyitás</b> és <b style="color:var(--text-primary);">🔗 Megosztás</b> gomb. A nyilvános oldalon az Open-Meteo hivatalos adata és a te saját méréseid jelennek meg egymás mellett.</div>
        </div>

      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#help-close').onclick = () => modal.remove();
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
}

// ── PWA telepítési útmutató ───────────────────────────────────
function showInstallModal() {
  const isIOS     = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;z-index:600;overflow-y:auto;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;padding:16px;';
  modal.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-lg);width:100%;max-width:420px;overflow:hidden;margin:auto;">
      <div style="background:var(--bg-secondary);border-bottom:1px solid var(--border);padding:18px 20px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:22px;">📱</span>
        <span style="font-family:var(--font-display);font-weight:700;font-size:18px;">Telepítési útmutató</span>
        <button id="install-close" style="margin-left:auto;background:var(--bg-card);border:1px solid var(--border);border-radius:50%;width:32px;height:32px;color:var(--text-secondary);cursor:pointer;font-size:14px;">✕</button>
      </div>
      <div style="padding:20px;display:flex;flex-direction:column;gap:16px;">

        <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;">
          A MeteoLog PWA (Progressive Web App) – telepítheted a kezdőképernyőre mint egy normál alkalmazást. Nincs App Store, nincs telepítési folyamat.
        </p>

        ${isIOS ? `
        <div style="background:var(--accent-dim);border:1px solid var(--accent);border-radius:var(--radius);padding:14px;">
          <div style="font-weight:700;font-size:13px;color:var(--accent);margin-bottom:4px;">✅ iPhone / iPad észlelve</div>
          <div style="font-size:12px;color:var(--text-secondary);">Az alábbi iOS lépések vonatkoznak rád.</div>
        </div>` : isAndroid ? `
        <div style="background:var(--accent-dim);border:1px solid var(--accent);border-radius:var(--radius);padding:14px;">
          <div style="font-weight:700;font-size:13px;color:var(--accent);margin-bottom:4px;">✅ Android eszköz észlelve</div>
          <div style="font-size:12px;color:var(--text-secondary);">Az alábbi Android lépések vonatkoznak rád.</div>
        </div>` : ''}

        <div style="background:var(--bg-input);border-radius:var(--radius);padding:14px;">
          <div style="font-family:var(--font-display);font-weight:700;font-size:14px;margin-bottom:10px;">🍎 iPhone / iPad (Safari)</div>
          ${['Nyisd meg az oldalt <b>Safari</b> böngészőben',
             'Koppints a <b>Megosztás ikonra</b> (négyzet felfelé mutató nyíllal) – az oldalsáv alján',
             'Görgess le és koppints: <b>"Hozzáadás a kezdőképernyőhöz"</b>',
             'Add meg a nevet (pl. MeteoLog) → <b>Hozzáadás</b>',
             'Az app megjelenik a kezdőképernyőn – mostantól úgy nyílik mint egy natív app!'].map((s,i) =>
            `<div style="display:flex;gap:10px;margin-bottom:8px;">
              <div style="background:var(--accent);color:#000;font-weight:700;font-size:12px;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">${i+1}</div>
              <div style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${s}</div>
            </div>`).join('')}
        </div>

        <div style="background:var(--bg-input);border-radius:var(--radius);padding:14px;">
          <div style="font-family:var(--font-display);font-weight:700;font-size:14px;margin-bottom:10px;">🤖 Android (Chrome)</div>
          ${['Nyisd meg az oldalt <b>Chrome</b> böngészőben',
             'Koppints a <b>⋮ menüre</b> (jobb felső sarok)',
             'Válaszd: <b>"Hozzáadás a kezdőképernyőhöz"</b> vagy <b>"Alkalmazás telepítése"</b>',
             'Erősítsd meg → <b>Hozzáadás</b>',
             'Az app megjelenik a kezdőképernyőn!'].map((s,i) =>
            `<div style="display:flex;gap:10px;margin-bottom:8px;">
              <div style="background:var(--accent);color:#000;font-weight:700;font-size:12px;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">${i+1}</div>
              <div style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${s}</div>
            </div>`).join('')}
        </div>

        <div style="background:var(--bg-input);border-radius:var(--radius);padding:14px;">
          <div style="font-family:var(--font-display);font-weight:700;font-size:14px;margin-bottom:8px;">💡 Miért érdemes telepíteni?</div>
          <div style="font-size:13px;color:var(--text-secondary);line-height:1.7;">
            ✅ Gyorsabb indítás<br>
            ✅ Teljes képernyős megjelenés<br>
            ✅ Offline hozzáférés<br>
            ✅ Nincs böngésző sáv – tiszta, app-szerű élmény
          </div>
        </div>

      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#install-close').onclick = () => modal.remove();
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
}

// ── Az appról modal ───────────────────────────────────────────
function showAboutModal() {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;z-index:600;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:24px;';
  modal.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-lg);width:100%;max-width:400px;overflow:hidden;">

      <!-- Header -->
      <div style="background:var(--bg-secondary);border-bottom:1px solid var(--border);padding:18px 20px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:22px;">🌤️</span>
        <span style="font-family:var(--font-display);font-weight:700;font-size:18px;">Az appról</span>
        <button id="about-close" style="margin-left:auto;background:var(--bg-card);border:1px solid var(--border);border-radius:50%;width:32px;height:32px;color:var(--text-secondary);cursor:pointer;font-size:14px;">✕</button>
      </div>

      <!-- Logo szekció -->
      <div style="padding:28px 24px 20px;text-align:center;border-bottom:1px solid var(--border);">
        <div style="font-size:56px;margin-bottom:10px;">🌤️</div>
        <div style="font-family:var(--font-display);font-size:26px;font-weight:800;color:var(--accent);letter-spacing:-0.5px;">MeteoLog</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:6px;font-family:var(--font-mono);">v1.0.0</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-top:8px;line-height:1.5;">Személyes időjárás dokumentáló rendszer</div>
      </div>

      <!-- Fejlesztő -->
      <div style="padding:20px 24px;border-bottom:1px solid var(--border);">
        <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">👨‍💻 Fejlesztő</div>
        <div style="font-size:15px;font-weight:600;color:var(--text-primary);margin-bottom:12px;">Kovács Gábor</div>
        <a href="mailto:info@wfw.hu" style="display:flex;align-items:center;gap:10px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;text-decoration:none;color:var(--text-primary);margin-bottom:8px;transition:border-color 0.2s;">
          <span style="font-size:16px;">✉️</span>
          <span style="font-size:13px;">info@wfw.hu</span>
        </a>
        <a href="https://wfw.hu" target="_blank" style="display:flex;align-items:center;gap:10px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;text-decoration:none;color:var(--text-primary);transition:border-color 0.2s;">
          <span style="font-size:16px;">🌐</span>
          <span style="font-size:13px;">wfw.hu</span>
        </a>
      </div>

      <!-- Technológiák -->
      <div style="padding:20px 24px;border-bottom:1px solid var(--border);">
        <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">⚙️ Technológiák</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${['PWA','Firebase','Firestore','Open-Meteo','Chart.js','Vanilla JS'].map(t =>
            `<span style="background:var(--bg-input);border:1px solid var(--border);border-radius:20px;padding:4px 12px;font-size:12px;color:var(--text-secondary);font-family:var(--font-mono);">${t}</span>`
          ).join('')}
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:16px 24px;text-align:center;">
        <div style="font-size:12px;color:var(--text-muted);line-height:1.6;">
          © 2026 Kovács Gábor · Minden jog fenntartva<br>
          <span style="color:var(--accent);">Ingyenes, nyílt forráskódú projekt</span>
        </div>
      </div>

    </div>`;

  document.body.appendChild(modal);
  modal.querySelector('#about-close').onclick = () => modal.remove();
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
}
