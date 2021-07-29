import { _, it } from 'one-liner.macro';
import { getUniqueKey } from '../utils/internal';
import { isArray, isObject, runPromiseForEffects } from '../utils/functions';
import { DUOLINGO_URL_PATTERN } from '../duo/url';

/**
 * @type {string}
 */
export const ACTION_RESULT_FAILURE = 'failure';

/**
 * @type {string}
 */
export const ACTION_RESULT_SUCCESS = 'success';

/**
 * @type {string}
 */
export const MESSAGE_TYPE_ACTION_REQUEST = getUniqueKey('action_request');

/**
 * @type {string}
 */
export const MESSAGE_TYPE_ACTION_RESULT = getUniqueKey('action_result');

/**
 * @type {string}
 */
export const MESSAGE_TYPE_UI_EVENT_NOTIFICATION = getUniqueKey('ui_event_notification');

/**
 * @type {string}
 */
export const MESSAGE_TYPE_BACKGROUND_EVENT_NOTIFICATION = getUniqueKey('background_event_notification');

/**
 * Sends an action request from a UI script to the content scripts.
 *
 * @param {string} action The action type.
 * @param {*=} value The action payload.
 * @returns {Promise} A promise for the result of the action.
 */
export const sendActionRequestToContentScript = async (action, value) => (
  new Promise((resolve, reject) => {
    const resultListener = event => {
      if (
        (event.source === window)
        && isObject(event.data)
        && (MESSAGE_TYPE_ACTION_RESULT === event.data.type)
        && (action === event.data.action)
      ) {
        if (event.data.result === ACTION_RESULT_SUCCESS) {
          resolve(event.data.value);
        } else {
          reject(event.data.error);
        }

        event.stopPropagation();
        window.removeEventListener('message', resultListener);
      }
    };

    window.addEventListener('message', resultListener);

    window.postMessage({
      type: MESSAGE_TYPE_ACTION_REQUEST,
      action,
      value,
    }, '*');
  })
);

/**
 * Sends an event notification from a UI script to the content scripts.
 *
 * @param {string} event The event type.
 * @param {*=} value The event payload.
 * @returns {void}
 */
export const sendEventNotificationToContentScript = (event, value) => {
  window.postMessage({
    type: MESSAGE_TYPE_UI_EVENT_NOTIFICATION,
    event,
    value,
  }, '*');
}

/**
 * Sends an action request from a content / options / popup script to the background scripts.
 *
 * @type {Function}
 * @param {string} action The action key.
 * @param {*=} value The action payload.
 * @returns {Promise} A promise for the result of the action.
 */
export const sendActionRequestToBackgroundScript = async (action, value) => (
  sendMessageToBackgroundScript({
    type: MESSAGE_TYPE_ACTION_REQUEST,
    action,
    value,
  }).then(result => {
    if (ACTION_RESULT_SUCCESS === result?.type) {
      return result.value || null;
    } else {
      throw new Error(result?.error || `An error occurred while processing a "${action}" action.`);
    }
  })
);

/**
 * Sends a message from a content / options / popup script to the background scripts.
 *
 * @type {Function}
 * @param {object} data The message payload.
 * @returns {Promise} A promise for the result of processing the message.
 */
export const sendMessageToBackgroundScript = async data => (
  new Promise((resolve, reject) => {
    if (typeof chrome !== 'undefined') {
      chrome.runtime.sendMessage(data, result => {
        if (!chrome.runtime.lastError) {
          resolve(result);
        } else {
          reject(chrome.runtime.lastError);
        }
      });
    } else {
      return browser.runtime.sendMessage(data);
    }
  })
);

/**
 * Sends an event notification from a background script to the content / options / popup scripts.
 *
 * @type {Function}
 * @param {string} event The event key.
 * @param {*=} value The event payload.
 * @returns {void}
 */
export const sendBackgroundEventNotificationToPageScript = (event, value) => {
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPE_BACKGROUND_EVENT_NOTIFICATION,
    event,
    value,
  });

  chrome.tabs.query(
    { url: DUOLINGO_URL_PATTERN },
    it.forEach(
      chrome.tabs.sendMessage(_.id, {
        type: MESSAGE_TYPE_BACKGROUND_EVENT_NOTIFICATION,
        event,
        value,
      })
    )
  );
}

/**
 * Registers a listener for background events.
 *
 * This function can be called from any script.
 *
 * @param {Function} callback
 * The function to be called when a background event is fired, with the event type and payload as parameters.
 * @param {(string[])=} eventTypes
 * The types of background events that the listener should be notified of, if not all.
 * @returns {Function}
 * A function usable to unregister the event listener.
 */
export const onBackgroundEvent = (callback, eventTypes) => {
  const isRelevantEventType = !isArray(eventTypes)
    ? (() => true)
    : (eventTypes.indexOf(_) >= 0);

  const listener = event => {
    const eventData = isObject(event.data) ? event.data : event;

    return (
      eventData
      && (MESSAGE_TYPE_BACKGROUND_EVENT_NOTIFICATION === eventData.type)
      && isRelevantEventType(eventData.event)
      && callback(eventData.event, eventData.value)
    );
  };

  if ((typeof chrome !== 'undefined') && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener(listener);

    return () => chrome.runtime.onMessage.removeListener(listener);
  }

  window.addEventListener('message', listener);

  return () => window.removeEventListener('message', listener);
}

/**
 * Registers a listener for action requests.
 *
 * This function must be called from a script with access to the extension messages.
 *
 * @type {Function}
 * @param {Function} callback
 * The async function to be called when an action request is sent, with these parameters:
 * - the action type,
 * - the action payload,
 * - an object containing information about the context of the script that sent the request,
 * - a function usable to send back the result of the action.
 * - a function usable to send back an error instead.
 * When the function is resolved, if neither a result nor an error was sent, a generic error will be sent instead.
 * @returns {void}
 */
export const onActionRequest = callback => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (MESSAGE_TYPE_ACTION_REQUEST === message.type) {
      let isResponseSent = false;

      const sendResult = value => {
        isResponseSent = true;
        sendResponse({ type: ACTION_RESULT_SUCCESS, value });
      };

      const sendError = error => {
        isResponseSent = true;
        sendResponse({ type: ACTION_RESULT_FAILURE, error });
      };

      try {
        Promise.resolve(
          callback(message.action, message.value, sender, sendResult, sendError)
        ).then(() => {
          if (!isResponseSent) {
            throw new Error(`Could not handle action request: "${message.action}".`);
          }
        }).catch(error => {
          if (!isResponseSent) {
            sendError(error);
          }
        });
      } catch (error) {
        !isResponseSent && sendError(error);
      }

      return true;
    }
  });
};

/**
 * Registers a listener for UI events.
 *
 * This function must be called from a script with access to the extension messages.
 *
 * @type {Function}
 * @param {Function} callback
 * The function to be called when UI event is fired, with these parameters:
 * - the event type,
 * - the event payload,
 * - an object containing information about the context of the script that fired the event.
 * @returns {void}
 */
export const onUiEvent = callback => {
  chrome.runtime.onMessage.addListener((message, sender) => {
    if (MESSAGE_TYPE_UI_EVENT_NOTIFICATION === message.type) {
      callback(message.event, message.value, sender);
    }
  });
};

/**
 * Sets up a bridge between UI scripts and background scripts on a content script, that forwards:
 * - event notifications,
 * - action requests,
 * - action results.
 *
 * @type {Function}
 * @param {string[]} actionTypes
 * The types of action requests that should be forwarded to the background scripts, if not all.
 * @param {string[]} uiEventTypes
 * The types of UI events that should be forwarded to the background scripts, if not all.
 * @param {string[]} backgroundEventTypes
 * The types of background events that should be forwarded to the UI scripts, if not all.
 * @returns {Function}
 * A function usable to stop forwarding event notifications and action requests.
 */
export const setupContentScriptBridge = (actionTypes, uiEventTypes, backgroundEventTypes) => {
  const isRelevantActionType = !isArray(actionTypes)
    ? (() => true)
    : (actionTypes.indexOf(_) >= 0);

  // Forward event notifications from the background script to the UI scripts.
  const unregisterBackgroundListener = onBackgroundEvent((event, value) => {
    window.postMessage({
      type: MESSAGE_TYPE_BACKGROUND_EVENT_NOTIFICATION,
      event,
      value,
    }, '*');
  }, backgroundEventTypes);

  // Forward action requests from UI scripts to the background scripts.
  // Forward action results from background scripts to the UI scripts.
  const uiListener = event => {
    if ((event.source === window) && isObject(event.data)) {
      if (MESSAGE_TYPE_ACTION_REQUEST === event.data.type) {
        const action = event.data.action || null;

        if (isRelevantActionType(action)) {
          sendMessageToBackgroundScript(event.data)
            .then(result => {
              if (!isObject(result) || (ACTION_RESULT_SUCCESS !== result.type)) {
                throw new Error();
              }

              return result.value;
            })
            .then(value => {
              event.source.postMessage({
                type: MESSAGE_TYPE_ACTION_RESULT,
                action,
                result: ACTION_RESULT_SUCCESS,
                value,
              }, '*')
            })
            .catch(error => {
              event.source.postMessage({
                type: MESSAGE_TYPE_ACTION_RESULT,
                action,
                result: ACTION_RESULT_FAILURE,
                error,
              }, '*')
            });
        }
      } else if (MESSAGE_TYPE_UI_EVENT_NOTIFICATION === event.data.type) {
        const eventType = event.data.event || null;

        if (uiEventTypes.indexOf(eventType) >= 0) {
          runPromiseForEffects(sendMessageToBackgroundScript(event.data));
        }
      }
    }
  };

  window.addEventListener('message', uiListener);

  return () => {
    unregisterBackgroundListener();
    window.removeEventListener('message', uiListener);
  };
}
