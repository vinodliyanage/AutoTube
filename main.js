const logo = chrome.runtime.getURL("public/icon.png");

document.querySelector("#app").innerHTML = `
<div class="container">
  <div class="header-container">
    <img src="${logo}" />
    <h1>AutoTube</h1>
  </div>

  <div class="control-container">
  <button id="activate" class="btn btn--primary">Activate</button>
  <button id="deactivate" class="btn btn--primary">Deactivate</button>
  </div>
 
</div>`;

const activateElm = document.getElementById("activate");
const deactivateElm = document.getElementById("deactivate");

activateElm.addEventListener("click", handleActivate);
deactivateElm.addEventListener("click", handleDeactivate);

async function handleDeactivate() {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  await chrome.storage.local.set({ activate: false });
  await chrome.tabs.sendMessage(tab.id, { command: "DEACTIVATE" });
}

async function handleActivate() {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  await chrome.storage.local.set({ activate: true });
  await chrome.tabs.sendMessage(tab.id, { command: "ACTIVATE" });
}
