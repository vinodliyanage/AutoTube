window.isInjected = false;

(($) => {
  if (window.isInjected) {
    window.isInjected = true;
    return;
  }

  const MAX_WAIT = 5;
  chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
    if (request.command === "ACTIVATE") {
      onChannelNameChanged(main);
      main();
    } else if (request.command === "DEACTIVATE") location.reload();
    sendResponse(true);
  });

  async function main() {
    await sleep(1.5);
    const channelName = await getChannelName();
    if (channelName === "DreamingSpanish") {
      setPaybackSpeed(1);
      setCaption();
    } else {
      setPaybackSpeed(1.5);
      removeCaption();
    }

    onPlaybackTimeChanged((currentTime, interval) => {
      if (currentTime >= 20) {
        clearInterval(interval);
        removeFromPlaylist();
      }
    });
  }

  async function getChannelName() {
    const channelName =
      (await waitUntilExists("#owner #channel-name a[href]"))?.attr("href") ||
      "";
    return channelName.replace(/ /, "").replace("/@", "");
  }

  async function setCaption() {
    const subtitleBtn = await waitUntilExists(
      `button.ytp-subtitles-button[aria-pressed="false"]`
    );
    if (!subtitleBtn) return;

    subtitleBtn.click();

    const settingBtn = await waitUntilExists(".ytp-settings-button");
    if (!settingBtn) return;

    settingBtn.click();

    const settingsMenu = await waitUntilExists(
      ".ytp-settings-menu .ytp-panel-menu .ytp-menuitem"
    );
    if (!settingsMenu) return;

    const setSubtitleBtn = Array.from(settingsMenu).find((setting) => {
      const item = $(setting).find(".ytp-menuitem-label")?.[0];
      if (!item) return false;
      if (item.innerText.includes("Subtitles/CC")) return true;
    });
    if (!setSubtitleBtn) return;

    setSubtitleBtn.click();

    const subtitleMenu = await waitUntilExists(
      ".ytp-settings-menu .ytp-panel-menu .ytp-menuitem"
    );

    const autoTranslateBtn = Array.from(subtitleMenu).find((setting) => {
      const item = $(setting).find(".ytp-menuitem-label")?.[0];
      if (!item) return false;
      if (item.innerText.includes("Auto-translate")) return true;
    });

    if (!autoTranslateBtn) return;
    autoTranslateBtn.click();

    const subtitleMenu2 = await waitUntilExists(
      ".ytp-settings-menu .ytp-panel-menu .ytp-menuitem"
    );

    const englishSubtitle = Array.from(subtitleMenu2).find((setting) => {
      const item = $(setting).find(".ytp-menuitem-label")?.[0];
      if (!item) return false;
      if (item.innerText.includes("English")) return true;
    });
    if (!englishSubtitle) return;

    englishSubtitle.click();
    document.body.click();
  }

  async function removeCaption() {
    const subtitleBtn = await waitUntilExists("button.ytp-subtitles-button");
    if (!subtitleBtn) return;

    if (subtitleBtn.attr("aria-pressed") === "true") subtitleBtn.click();
    document.body.click();
  }

  async function setPaybackSpeed(speed = 1.0) {
    const video = (await waitUntilExists("#movie_player video"))?.[0];
    if (!video) return null;
    video.playbackRate = speed;
  }

  async function onPlaybackTimeChanged(callbackfunction) {
    const video = (await waitUntilExists("#movie_player video"))?.[0];
    if (!video) return null;

    const interval = setInterval(() => {
      callbackfunction(video.currentTime, interval);
    }, 100);
  }

  async function removeFromPlaylist() {
    const blockSaveBtn = $(
      'yt-button-shape button[aria-label="Save to playlist"]'
    )?.[0];

    if (blockSaveBtn) {
      blockSaveBtn.click();
    } else {
      const menuBtn = await waitUntilExists(
        "#top-row #actions #menu #button-shape button"
      );
      if (!menuBtn) return;

      menuBtn.click();

      const elements = await waitUntilExists(
        "tp-yt-paper-listbox#items ytd-menu-service-item-renderer"
      );
      if (!elements) return;

      const save = Array.from(elements).find(
        (element) => element.innerText.trim().toLowerCase() === "save"
      );

      if (!save) return;
      save.click();
    }

    const playlists = await waitUntilExists(
      "tp-yt-paper-dialog #playlists ytd-playlist-add-to-option-renderer"
    );
    if (!playlists) return;

    const [vvatchLat3r] = Array.from(playlists)
      .map((playlist) => {
        const checkbox = $(playlist).find("tp-yt-paper-checkbox#checkbox")?.[0];
        if (!checkbox) return false;

        const label = $(checkbox)
          ?.find(
            "#checkboxLabel #checkbox-label yt-formatted-string#label"
          )?.[0]
          .innerText.trim();
        if (label === "vvatch lat3r") return checkbox;
      })
      .filter((e) => e);

    await sleep(2);
    if (vvatchLat3r && vvatchLat3r?.ariaChecked === "true") vvatchLat3r.click();
    await sleep(2);
    document.body.click();
  }

  function waitUntilExists(selector, maxDelay = MAX_WAIT) {
    return Promise.race([
      new Promise((resolve) => {
        const interval = setInterval(() => {
          const elements = $(selector);
          if (elements.length) {
            clearInterval(interval);
            resolve(elements);
          }
        });
      }),
      new Promise((resolve) => {
        const timeout = setTimeout(() => {
          clearTimeout(timeout);
          resolve(null);
        }, maxDelay * 1000);
      }),
    ]);
  }

  async function onChannelNameChanged(callback) {
    const channelName = (
      await waitUntilExists("#owner #channel-name a[href]")
    )?.[0];
    if (!channelName) return null;

    const config = {
      attributes: true,
      childList: false,
      subtree: false,
    };

    const _callback = (mutationList) => {
      let prevHref = "";
      for (const mutation of mutationList) {
        const href = mutation.target.href;
        if (prevHref === href) return;
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "href" &&
          prevHref !== href
        ) {
          prevHref = href;
          callback();
        }
      }
    };
    const observer = new MutationObserver(_callback);
    observer.observe(channelName, config);
  }

  async function sleep(seconds) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        resolve(null);
      }, seconds * 1000);
    });
  }
})($);
