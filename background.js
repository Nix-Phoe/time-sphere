chrome.tabs.onUpdated.addListener((tabId, tab) => {
    if (tab.url && tab.url.includes("youtube.com/watch")) {
        const queryParameters = tab.url.split("?")[1];
        const urlParameters = new URLSearchParams(queryParameters);

        //Reinjection du content-script si perdue :
        chrome.tabs.sendMessage(tabId, { type: "NEW", videoId: urlParameters.get("v") }, (response) => {
            if (chrome.runtime.lastError) {
                chrome.scripting.executeScript(
                    { target: { tabId }, files: ["contentScript.js"] },
                    () => {
                        chrome.tabs.sendMessage(tabId, {
                            type: "NEW",
                            videoId: urlParameters.get("v"),
                        });
                    }
                );
            }
        });
    }
});