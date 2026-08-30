const DEFAULTS = {
  showPill: true,
  showTimer: true,
  opacity: 0.94,
  triggerSeconds: 1800,
  notifications: true
};

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(DEFAULTS);
  await chrome.storage.local.set({ ...DEFAULTS, ...current });
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const key = `tab_${tabId}`;
  await chrome.storage.session.remove(key).catch(() => {});
  await chrome.storage.local.remove(key).catch(() => {});
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id ?? message.tabId;
  const respond = (promise) => Promise.resolve(promise).then(sendResponse).catch(() => sendResponse({}));

  if (message.type === 'getTabState' && tabId != null) {
    respond(chrome.storage.session.get(`tab_${tabId}`).then((r) => ({ reason: r[`tab_${tabId}`]?.reason || null })));
    return true;
  }

  if (message.type === 'setReason' && tabId != null) {
    const reason = String(message.reason || '').trim().slice(0, 120);
    const key = `tab_${tabId}`;
    if (reason) respond(chrome.storage.session.set({ [key]: { reason, updatedAt: Date.now() } }).then(() => ({ ok: true, reason })));
    else respond(chrome.storage.session.remove(key).then(() => ({ ok: true, reason: null })));
    return true;
  }

  if (message.type === 'clearReason' && tabId != null) {
    respond(chrome.storage.session.remove(`tab_${tabId}`).then(() => ({ ok: true })));
    return true;
  }

  if (message.type === 'getSettings') {
    respond(chrome.storage.local.get(DEFAULTS));
    return true;
  }

  if (message.type === 'openOptions') {
    chrome.runtime.openOptionsPage();
  }
});
