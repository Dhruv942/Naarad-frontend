// Naarad AI Companion - background.js

const extensionIconPaths = {
  active: {
    16: "/icons/icon16.png",
    48: "/icons/icon48.png",
    128: "/icons/icon128.png",
  },
  disabled: {
    16: "/icons/icon16_disabled.png",
    48: "/icons/icon48_disabled.png",
    128: "/icons/icon128_disabled.png",
  },
};

// Function to update the extension icon and state based on the tab's URL
const updateAction = async (tabId) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.url && (tab.url.startsWith("http:") || tab.url.startsWith("https://"))) {
      await chrome.action.enable(tabId);
      await chrome.action.setIcon({
        path: extensionIconPaths.active,
        tabId: tabId,
      });
    } else {
      await chrome.action.disable(tabId);
      await chrome.action.setIcon({
        path: extensionIconPaths.disabled,
        tabId: tabId,
      });
    }
  } catch (error) {
    // This can happen if the tab is closed while we're trying to get it.
    // console.error(`Could not update action for tab ${tabId}: ${error.message}`);
  }
};


// --- Event Listeners ---

// On first install, ensure the action is appropriately set for all existing tabs.
chrome.runtime.onInstalled.addListener(async () => {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) {
       updateAction(tab.id);
    }
  }
});


// When the active tab changes, update the action
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (activeInfo.tabId) {
    updateAction(activeInfo.tabId);
  }
});

// When a tab is updated (e.g., new URL), update the action
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
   // We only need to act if the URL changes
  if (changeInfo.status === 'complete' || changeInfo.url) {
    updateAction(tabId);
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_PAGE_INFO') {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js'],
          });
          // The result is an array, we expect one result from our one content script
          if (results && results.length > 0) {
            sendResponse(results[0].result);
          } else {
             sendResponse(null);
          }
        } else {
           sendResponse(null);
        }
      } catch (e) {
        console.error("Error getting page info:", e);
        sendResponse(null);
      }
    })();
    return true; // Indicates that the response is sent asynchronously
  }
});
