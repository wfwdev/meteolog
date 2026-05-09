// ============================================================
// MeteoLog – UI Modálok
// ============================================================
import { logout, currentUser } from './auth.js';
import { showToast } from './utils.js';

// ── Útmutató modal ────────────────────────────────────────────
export function showHelpModal() {
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
export function showInstallModal() {
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
export function showAboutModal() {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;z-index:600;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);overflow-y:auto;-webkit-overflow-scrolling:touch;padding:24px;';
  modal.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-lg);width:100%;max-width:400px;overflow:hidden;margin:auto;">

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

// ── App megosztás ─────────────────────────────────────────────
export function shareApp() {
  const url   = 'https://gaben8808.github.io/meteolog';
  const title = 'MeteoLog – Személyes időjárás napló';
  const text  = 'Rögzítsd és kövesd a saját időjárási adataidat! Ingyenes PWA app – nem kell telepíteni.';

  if (navigator.share) {
    navigator.share({ title, text, url });
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url);
    showToast('🔗 Link vágólapra másolva!');
  }
}

// ── Téma váltó ────────────────────────────────────────────────
export function initTheme() {
  const saved = localStorage.getItem('meteolog_theme') || 'dark';
  applyTheme(saved);
}

export function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('meteolog_theme', theme);
  // Meta theme-color frissítése
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'light' ? '#ffffff' : '#060d1a';
}

export function toggleTheme() {
  const current = localStorage.getItem('meteolog_theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
  showToast(current === 'dark' ? '☀️ Világos téma' : '🌙 Sötét téma');
}


// ── Adatvédelmi nyilatkozat modal ────────────────────────────
export function showPrivacyModal() {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;z-index:600;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;';
  modal.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-lg);width:100%;max-width:480px;overflow:hidden;margin:auto;">
      <div style="background:var(--bg-secondary);border-bottom:1px solid var(--border);padding:18px 20px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:1;">
        <span style="font-size:22px;">🔒</span>
        <span style="font-family:var(--font-display);font-weight:700;font-size:18px;">Adatvédelmi nyilatkozat</span>
        <button id="privacy-close" style="margin-left:auto;background:var(--bg-card);border:1px solid var(--border);border-radius:50%;width:32px;height:32px;color:var(--text-secondary);cursor:pointer;font-size:14px;flex-shrink:0;">✕</button>
      </div>
      <div style="padding:20px;font-size:13px;color:var(--text-secondary);line-height:1.7;display:flex;flex-direction:column;gap:20px;">
        <div><div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Utolsó frissítés</div><div style="color:var(--text-primary);">2026. január 1.</div></div>
        <div style="background:var(--bg-input);border-radius:var(--radius);padding:14px;">
          <div style="font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--text-primary);margin-bottom:8px;">1. Az adatkezelő</div>
          <b style="color:var(--text-primary);">Kovács Gábor</b><br>E-mail: <a href="mailto:info@wfw.hu" style="color:var(--accent);">info@wfw.hu</a><br>Weboldal: <a href="https://wfw.hu" target="_blank" style="color:var(--accent);">wfw.hu</a><br>Ország: Magyarország
        </div>
        <div style="background:var(--bg-input);border-radius:var(--radius);padding:14px;">
          <div style="font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--text-primary);margin-bottom:8px;">2. Milyen adatokat gyűjtünk?</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div>📧 <b style="color:var(--text-primary);">E-mail cím</b> – regisztráció esetén, azonosításhoz</div>
            <div>🔑 <b style="color:var(--text-primary);">Google fiók azonosító</b> – Google belépés esetén</div>
            <div>🌡️ <b style="color:var(--text-primary);">Időjárás adatok</b> – az általad rögzített mérések</div>
            <div>📍 <b style="color:var(--text-primary);">GPS koordináta</b> – ha megadod (opcionális)</div>
            <div>🌐 <b style="color:var(--text-primary);">IP cím / eszköz adatok</b> – Firebase, biztonsági célból</div>
          </div>
        </div>
        <div style="background:var(--bg-input);border-radius:var(--radius);padding:14px;">
          <div style="font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--text-primary);margin-bottom:8px;">3. Mire használjuk?</div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <div><span style="color:var(--accent);">✓</span> Az app működtetése és felhasználói fiók kezelése</div>
            <div><span style="color:var(--accent);">✓</span> Időjárás bejegyzések tárolása és megjelenítése</div>
            <div><span style="color:var(--accent);">✓</span> Nyilvános megosztás (csak ha te engedélyezed)</div>
            <div><span style="color:var(--accent);">✓</span> Nem használjuk marketing vagy hirdetési célra</div>
            <div><span style="color:var(--accent);">✓</span> Nem adjuk át harmadik félnek</div>
          </div>
        </div>
        <div style="background:var(--bg-input);border-radius:var(--radius);padding:14px;">
          <div style="font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--text-primary);margin-bottom:8px;">4. Adatfeldolgozók</div>
          <b style="color:var(--text-primary);">Google Firebase</b> – adattárolás, EU szerver (Belgium)<br>
          <a href="https://firebase.google.com/support/privacy" target="_blank" style="color:var(--accent);">Firebase adatvédelmi irányelvek →</a><br><br>
          <b style="color:var(--text-primary);">Open-Meteo</b> – időjárás API, személyes adat nem kerül át<br>
          <a href="https://open-meteo.com/en/terms" target="_blank" style="color:var(--accent);">Open-Meteo feltételek →</a>
        </div>
        <div style="background:var(--bg-input);border-radius:var(--radius);padding:14px;">
          <div style="font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--text-primary);margin-bottom:8px;">5. A te jogaid (GDPR)</div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <div><b style="color:var(--text-primary);">Hozzáférés:</b> kérheted milyen adatot tárolunk</div>
            <div><b style="color:var(--text-primary);">Törlés:</b> kérheted az összes adatod törlését</div>
            <div><b style="color:var(--text-primary);">Export:</b> CSV letöltéssel hordozhatod az adataid</div>
            <div><b style="color:var(--text-primary);">Tiltakozás:</b> tiltakozhatsz az adatkezelés ellen</div>
          </div>
          <div style="margin-top:10px;">Kérelmek: <a href="mailto:info@wfw.hu" style="color:var(--accent);">info@wfw.hu</a></div>
          <div style="margin-top:6px;font-size:12px;">Panasz esetén: <a href="https://naih.hu" target="_blank" style="color:var(--accent);">NAIH – naih.hu</a></div>
        </div>
        <div style="background:var(--bg-input);border-radius:var(--radius);padding:14px;">
          <div style="font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--text-primary);margin-bottom:8px;">6. Sütik</div>
          Az app nem használ nyomkövető sütiket. A Firebase Authentication a belépési tokent a böngésző helyi tárhelyén tárolja.
        </div>
        <div style="text-align:center;padding-bottom:8px;font-size:12px;color:var(--text-muted);">
          © 2026 Kovács Gábor · MeteoLog<br>Jogalap: GDPR 6. cikk (1) b) pont
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#privacy-close').onclick = () => modal.remove();
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
}
// ── Fiók törlése modal ────────────────────────────────────────
export async function showDeleteAccountModal() {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;z-index:600;background:rgba(0,0,0,0.8);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:24px;';
  modal.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--red);border-radius:var(--radius-lg);width:100%;max-width:400px;overflow:hidden;">
      <div style="background:var(--bg-secondary);border-bottom:1px solid var(--border);padding:18px 20px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:22px;">⚠️</span>
        <span style="font-family:var(--font-display);font-weight:700;font-size:18px;color:var(--red);">Fiók törlése</span>
        <button id="del-close" style="margin-left:auto;background:var(--bg-card);border:1px solid var(--border);border-radius:50%;width:32px;height:32px;color:var(--text-secondary);cursor:pointer;font-size:14px;">✕</button>
      </div>
      <div style="padding:24px;display:flex;flex-direction:column;gap:16px;">

        <div style="background:var(--red-dim);border:1px solid var(--red);border-radius:var(--radius);padding:14px;font-size:13px;color:var(--text-primary);line-height:1.6;">
          <b>Ez a művelet nem visszavonható!</b><br>
          Az összes helyszíned, bejegyzésed és fiókadatod véglegesen törlődik.
        </div>

        <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">
          A törlés előtt javasoljuk, hogy töltsd le az adataidat CSV formátumban a <b style="color:var(--text-primary);">Grafikonok</b> fülön.
        </div>

        <div>
          <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">A megerősítéshez írd be: <b style="color:var(--red);">TÖRLÉS</b></div>
          <input type="text" id="del-confirm-input" placeholder="TÖRLÉS"
            style="width:100%;padding:12px 14px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius);color:var(--text-primary);font-size:15px;outline:none;box-sizing:border-box;" />
        </div>

        <div id="del-error" style="display:none;color:var(--red);font-size:13px;"></div>

        <div style="display:flex;gap:10px;">
          <button id="del-cancel" class="btn btn-ghost">Mégse</button>
          <button id="del-confirm" class="btn btn-danger" disabled style="opacity:0.5;">🗑️ Fiók törlése</button>
        </div>

      </div>
    </div>`;

  document.body.appendChild(modal);

  const input   = modal.querySelector('#del-confirm-input');
  const confirmBtn = modal.querySelector('#del-confirm');
  const errorEl = modal.querySelector('#del-error');

  // Gomb aktiválása ha helyes szó
  input.addEventListener('input', () => {
    const ok = input.value.trim() === 'TÖRLÉS';
    confirmBtn.disabled = !ok;
    confirmBtn.style.opacity = ok ? '1' : '0.5';
  });

  modal.querySelector('#del-close').onclick  = () => modal.remove();
  modal.querySelector('#del-cancel').onclick  = () => modal.remove();

  modal.querySelector('#del-confirm').addEventListener('click', async () => {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Törlés folyamatban...';
    errorEl.style.display = 'none';

    try {
      const { collection, doc, getDocs, deleteDoc, writeBatch } =
        await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const { deleteUser } =
        await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

      const fb  = window.__firebase;
      const uid = fb.auth.currentUser?.uid;
      if (!uid) throw new Error('Nincs bejelentkezve');

      // 1. Firestore adatok törlése – batch írással
      const userRef = doc(fb.db, 'users', uid);
      const subcols = ['locations', 'readings', 'pushTokens', 'settings'];

      for (const col of subcols) {
        const snap = await getDocs(collection(userRef, col));
        const batch = writeBatch(fb.db);
        snap.docs.forEach(d => batch.delete(d.ref));
        if (snap.docs.length) await batch.commit();
      }

      // 2. Publikus helyszínek törlése
      const pubSnap = await getDocs(collection(fb.db, 'publicLocations'));
      const pubBatch = writeBatch(fb.db);
      pubSnap.docs
        .filter(d => d.data().ownerUid === uid)
        .forEach(d => pubBatch.delete(d.ref));
      await pubBatch.commit();

      // 3. Felhasználói dokumentum törlése
      await deleteDoc(userRef);

      // 4. Firebase Auth fiók törlése
      await deleteUser(fb.auth.currentUser);

      modal.remove();
      showToast('✅ Fiók és összes adat sikeresen törölve.');

    } catch(e) {
      errorEl.textContent = '⚠️ Hiba: ' + e.message;
      errorEl.style.display = 'block';

      // Ha újra kell hitelesíteni (pl. rég volt belépve)
      if (e.code === 'auth/requires-recent-login') {
        errorEl.textContent = '⚠️ A törléshez újra be kell jelentkezned. Kérjük, jelentkezz ki majd be, és próbáld újra.';
      }

      confirmBtn.disabled = false;
      confirmBtn.textContent = '🗑️ Fiók törlése';
    }
  });
}
