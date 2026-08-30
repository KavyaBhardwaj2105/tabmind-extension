(() => {
  if (window.top !== window) return;

  const ROOT_ID = '__tabmind_root__';
  const STYLE_ID = '__tabmind_style__';
  const DEFAULT_TRIGGER = 1800;

  let startedAt = Date.now();
  let reason = null;
  let settings = { showPill: true, showTimer: true, opacity: 0.94, triggerSeconds: DEFAULT_TRIGGER, notifications: true };
  let root = null;
  let pillEl = null;
  let textEl = null;
  let timerEl = null;
  let promptInput = null;
  let triggerShown = false;
  let triggerTimer = null;

  const send = (msg) => new Promise((resolve) => {
    try { chrome.runtime.sendMessage(msg, resolve); } catch { resolve({}); }
  });

  const fmt = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  function createStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID}{position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:Inter,system-ui,-apple-system,sans-serif;color:#f4f6f8}
      #${ROOT_ID} *{box-sizing:border-box}
      .tm-pill-wrap{position:fixed;top:18px;right:22px;pointer-events:auto}
      .tm-pill{display:flex;align-items:center;gap:10px;max-width:min(440px,calc(100vw - 44px));padding:9px 13px;border:1px solid rgba(240,184,64,.45);border-radius:999px;background:rgba(25,22,16,var(--tm-opacity));box-shadow:0 10px 30px rgba(0,0,0,.25);backdrop-filter:blur(12px);font:500 13px/1.2 Inter,system-ui,sans-serif}
      .tm-dot{width:7px;height:7px;border-radius:50%;background:#7fd8b0;box-shadow:0 0 10px rgba(127,216,176,.6);flex:0 0 auto}.tm-text{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:text}.tm-timer{font:12px/1 JetBrains Mono,ui-monospace,monospace;color:#7fd8b0}.tm-edit{border:0;background:transparent;color:#9aa2b1;cursor:pointer;padding:2px 4px}.tm-input{width:230px;max-width:55vw;border:0;outline:0;background:transparent;color:#f4f6f8;font:500 13px Inter}.tm-empty{color:#9aa2b1;cursor:pointer}
      .tm-overlay{position:fixed;inset:0;display:grid;place-items:center;background:rgba(6,8,11,.48);backdrop-filter:blur(3px);pointer-events:auto}
      .tm-card{width:min(480px,calc(100vw - 36px));padding:30px;border:1px solid #2c313b;border-radius:20px;background:#161a21;box-shadow:0 30px 90px rgba(0,0,0,.5);animation:tm-in .22s ease-out}
      @keyframes tm-in{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
      .tm-kicker{font:12px JetBrains Mono,monospace;color:#7fd8b0;margin-bottom:12px;letter-spacing:.04em}.tm-title{font:700 26px/1.15 Space Grotesk,Inter,sans-serif;margin-bottom:9px}.tm-sub{color:#9aa2b1;font-size:14px;margin-bottom:20px}.tm-field{width:100%;padding:13px 14px;border:1px solid #343a46;border-radius:10px;background:#0e1116;color:#e9ecf1;outline:0;font-size:14px}.tm-field:focus{border-color:#f0b840;box-shadow:0 0 0 3px rgba(240,184,64,.12)}.tm-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:14px}.tm-btn{padding:10px 15px;border-radius:9px;border:1px solid #303641;background:#20252e;color:#e9ecf1;cursor:pointer;font-weight:600}.tm-btn.primary{background:#f0b840;color:#1a1305;border-color:#f0b840}.tm-hint{font-size:11px;color:#707887;margin-top:10px}.tm-trigger{font-size:12px;color:#f0b840;margin-top:12px}
    `;
    document.documentElement.appendChild(style);
  }

  function ensureRoot() {
    createStyles();
    if (!root || !root.isConnected) {
      root = document.createElement('div');
      root.id = ROOT_ID;
      document.body.appendChild(root);
    }
    return root;
  }

  function renderPill() {
    if (!document.body || (!reason && !settings.showPill)) return;
    const r = ensureRoot();
    const old = r.querySelector('.tm-pill-wrap');
    old?.remove();
    if (!settings.showPill) return;

    const wrap = document.createElement('div');
    wrap.className = 'tm-pill-wrap';
    wrap.innerHTML = `<div class="tm-pill"><span class="tm-dot"></span><span class="tm-text"></span><span class="tm-timer"></span><button class="tm-edit" title="Edit intention">✎</button></div>`;
    wrap.querySelector('.tm-pill').style.setProperty('--tm-opacity', settings.opacity);
    r.appendChild(wrap);
    textEl = wrap.querySelector('.tm-text');
    timerEl = wrap.querySelector('.tm-timer');
    textEl.textContent = reason || 'No intention set';
    textEl.classList.toggle('tm-empty', !reason);
    timerEl.style.display = settings.showTimer ? '' : 'none';
    textEl.onclick = reason ? edit : showPrompt;
    wrap.querySelector('.tm-edit').onclick = showPrompt;
    updateTimer();
  }

  function removeOverlay() {
    root?.querySelector('.tm-overlay')?.remove();
    promptInput = null;
  }

  function showPrompt({ triggered = false } = {}) {
    if (!document.body || document.visibilityState === 'hidden') return;
    const r = ensureRoot();
    if (r.querySelector('.tm-overlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'tm-overlay';
    overlay.innerHTML = `<div class="tm-card" role="dialog" aria-modal="true">
      <div class="tm-kicker">TABMIND · ${triggered ? '30 MINUTE CHECK-IN' : 'INTENTION'}</div>
      <div class="tm-title">Why did you open this tab?</div>
      <div class="tm-sub">${triggered ? `You've been here for 30 minutes. Still on purpose?` : 'A tiny note now can save you from wondering what you were doing ten tabs later.'}</div>
      <input class="tm-field" maxlength="120" autocomplete="off" placeholder="e.g. Fix auth bug, research Ladakh trip…">
      <div class="tm-actions"><button class="tm-btn" data-skip>Not now</button><button class="tm-btn primary" data-save>Remember it →</button></div>
      <div class="tm-hint">Enter to save · Esc to dismiss</div>
      ${triggered ? '<div class="tm-trigger">Focus check triggered automatically after 30 minutes.</div>' : ''}
    </div>`;
    r.appendChild(overlay);
    promptInput = overlay.querySelector('.tm-field');
    if (triggered && reason) promptInput.value = reason;
    overlay.querySelector('[data-save]').onclick = () => save(promptInput.value);
    overlay.querySelector('[data-skip]').onclick = () => dismissPrompt();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) dismissPrompt(); });
    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); save(promptInput.value); }
      if (e.key === 'Escape') dismissPrompt();
    });
    setTimeout(() => promptInput?.focus(), 30);
  }

  function dismissPrompt() {
    removeOverlay();
    if (triggerShown) {
      sessionStorage.setItem('tabmind_trigger_dismissed', '1');
    }
  }

  async function save(value) {
    const clean = String(value || '').trim().slice(0, 120);
    if (!clean) { promptInput?.focus(); return; }
    const result = await send({ type: 'setReason', reason: clean });
    if (result?.ok) {
      reason = clean;
      startedAt = Date.now();
      triggerShown = false;
      sessionStorage.removeItem('tabmind_trigger_dismissed');
      removeOverlay();
      renderPill();
    }
  }

  function edit() {
    if (!textEl || !reason) return showPrompt();
    const current = reason;
    const input = document.createElement('input');
    input.className = 'tm-input';
    input.value = current;
    textEl.replaceWith(input);
    input.focus(); input.select();
    let finished = false;
    const finish = async (saveIt) => {
      if (finished) return; finished = true;
      if (saveIt) await save(input.value); else renderPill();
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false); });
    input.addEventListener('blur', () => finish(true), { once: true });
  }

  function updateTimer() {
    if (!timerEl || !settings.showTimer) return;
    timerEl.textContent = fmt(Math.floor((Date.now() - startedAt) / 1000));
  }

  function checkTrigger() {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const triggerAt = Number(settings.triggerSeconds) || DEFAULT_TRIGGER;
    const dismissed = sessionStorage.getItem('tabmind_trigger_dismissed') === '1';
    if (!triggerShown && !dismissed && elapsed >= triggerAt) {
      triggerShown = true;
      showPrompt({ triggered: true });
    }
  }

  async function init() {
    if (location.protocol === 'chrome-extension:' || !document.body) return;
    settings = { ...settings, ...(await send({ type: 'getSettings' })) };
    const state = await send({ type: 'getTabState' });
    reason = state?.reason || null;
    startedAt = Date.now();
    renderPill();

    // Intentionally do NOT interrupt immediately. The first check-in happens after 30 minutes.
    triggerTimer = setInterval(() => {
      updateTimer();
      checkTrigger();
    }, 1000);
    checkTrigger();
  }

  window.addEventListener('pagehide', () => clearInterval(triggerTimer));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
