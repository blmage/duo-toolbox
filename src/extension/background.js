import { DUOLINGO_URL_REGEXP } from '../duo/url';

/**
 * Checks the value of chrome.runtime.lastError, and does nothing else.
 *
 * This is especially useful as a callback to chrome.* functions, when their result does not matter.
 *
 * @returns {void}
 */
export const discardLastRuntimeError = () => {
  if (chrome.runtime.lastError) {
    return;
  }
}

/**
 * @returns {object}
 * A rule for triggering the page action of an extension on Duolingo pages.
 * For compatibility with browsers that do not support the declarativeContent API, use registerPopupListeners instead.
 */
export const getPageActionRule = () => ({
  actions: [
    new chrome.declarativeContent.ShowPageAction(),
  ],
  conditions: [
    new chrome.declarativeContent.PageStateMatcher({
      pageUrl: {
        urlMatches: DUOLINGO_URL_REGEXP.source,
      },
    })
  ],
});

/**
 * Enables or disables the extension popup on a browser tab, depending on whether it is browsing a Duolingo page.
 *
 * @param {Object} tab A browser tab.
 * @returns {void}
 */
const togglePopupOnTab = tab => {
  if (tab?.id) {
    (tab.url || '').match(/^https:\/\/.*duolingo\.com\//)
      ? chrome.pageAction.show(tab.id, discardLastRuntimeError)
      : chrome.pageAction.hide(tab.id, discardLastRuntimeError);

    chrome.runtime.lastError && setTimeout(() => togglePopupOnTab(tab), 50);
  }
};

/**
 * Applies a callback to a given tab.
 *
 * @param {number} tabId The ID of a tab.
 * @param {Function} callback The callback to apply to the given tab.
 * @returns {void}
 */
const withTab = (tabId, callback) => chrome.tabs.get(tabId, tab => (
  // Work-around for https://bugs.chromium.org/p/chromium/issues/detail?id=1213925
  (chrome.runtime.lastError?.message !== 'Tabs cannot be edited right now (user may be dragging a tab).')
    ? callback(tab)
    : setTimeout(() => withTab(tabId, callback), 100)
));

/**
 * Registers the necessary event listeners for the extension popup to be enabled on Duolingo pages.
 *
 * @returns {void}
 */
export const registerPopupActivationListeners = () => {
  chrome.tabs.onUpdated.addListener((tabId, tab) => (
    tabId && (
      tab?.id
        ? togglePopupOnTab(tab)
        : withTab(tabId, togglePopupOnTab)
    )
  ));

  chrome.tabs.onActivated.addListener(({ tabId }) => tabId && withTab(tabId, togglePopupOnTab));
};
