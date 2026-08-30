const defaults = { showPill:true, showTimer:true, opacity:.94, triggerSeconds:1800, notifications:true };
const $ = id => document.getElementById(id);

async function load(){
  const s = await chrome.storage.local.get(defaults);
  $('showPill').checked = s.showPill;
  $('showTimer').checked = s.showTimer;
  $('notifications').checked = s.notifications;
  $('triggerSeconds').value = s.triggerSeconds;
  $('opacity').value = s.opacity;
  $('opacityValue').textContent = Math.round(s.opacity*100)+'%';
}

$('showPill').onchange = () => chrome.storage.local.set({showPill:$('showPill').checked});
$('showTimer').onchange = () => chrome.storage.local.set({showTimer:$('showTimer').checked});
$('notifications').onchange = () => chrome.storage.local.set({notifications:$('notifications').checked});
$('triggerSeconds').onchange = () => {
  const value = Math.max(10, Math.min(7200, Number($('triggerSeconds').value) || 1800));
  $('triggerSeconds').value = value;
  chrome.storage.local.set({triggerSeconds:value});
};
$('opacity').oninput = () => {
  $('opacityValue').textContent = Math.round($('opacity').value*100)+'%';
  chrome.storage.local.set({opacity:Number($('opacity').value)});
};
$('openNewTab').onclick = () => chrome.tabs.create({url: chrome.runtime.getURL('newtab.html')});
load();
