const input = document.getElementById('reason');
const main = document.querySelector('main');

async function save() {
  const reason = input.value.trim().slice(0, 120);
  if (!reason) return input.focus();
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tabs[0]?.id;
  await chrome.runtime.sendMessage({ type: 'setReason', tabId, reason });
  main.innerHTML = `<div class="kicker">TABMIND · SET</div><h1>Intent locked in.</h1><p>“${reason.replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\\':'&#92;'}[c]))}”</p><small>Open a website and your intention will stay visible.</small>`;
}

document.getElementById('save').onclick = save;
document.getElementById('skip').onclick = () => {
  main.innerHTML = '<div class="kicker">TABMIND</div><h1>New tab, clear intent.</h1><p>You skipped this one. You can still set a reason when you open a website.</p>';
};
input.addEventListener('keydown', e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') document.getElementById('skip').click(); });
