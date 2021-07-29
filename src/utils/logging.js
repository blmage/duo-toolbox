import { getToolboxIframe } from './internal';

/**
 * @returns {Object} A console usable for logging data.
 */
const getLoggingConsole = () => getToolboxIframe().contentWindow.console;

/**
 * @param {...*} data The debug data to log.
 * @returns {void}
 */
export const logDebug = (...data) => getLoggingConsole().debug(...data);

/**
 * @param {...*} data The info data to log.
 * @returns {void}
 */
export const logInfo = (...data) => getLoggingConsole().info(...data);

/**
 * @param {...*} data The warning data to log.
 * @returns {void}
 */
export const logWarning = (...data) => getLoggingConsole().warn(...data);

/**
 * @param {...*} data The error data to log.
 * @returns {void}
 */
export const logError = (...data) => getLoggingConsole().error(...data);
