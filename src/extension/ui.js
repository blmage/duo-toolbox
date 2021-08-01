import { it } from 'one-liner.macro';
import { PRIORITY_AVERAGE } from '../utils/constants';
import { isObject, maxBy, noop } from '../utils/functions';
import { bumpGlobalCounter, getSharedGlobalVariable, updateSharedGlobalVariable } from '../utils/internal';

/**
 * @type {string}
 */
const KEY_MUTEXES = 'mutexes';

/**
 * @typedef {object} Mutex
 * @property {?MutexHolder} currentHolder
 * The holder that is currently locking the mutex, if any.
 * @property {MutexHolder[]} pendingHolders
 * The holders that are waiting for the mutex to become available.
 */

/**
 * @typedef {object} MutexHolder
 * @property {number} uniqueId
 * A unique key identifying the holder.
 * @property {number} priority
 * The priority of the holder.
 * @property {Function} onAcquired
 * The callback usable to notify the holder when it has acquired the mutex.
 * @property {Function} onSupersessionRequest
 * The callback usable to notify the holder when a request with a higher priority is made to acquire the mutex it holds.
 */

/**
 * @returns {number} The next unique ID usable for a mutex holder.
 */
const getNextHolderId = () => bumpGlobalCounter('last_mutex_holder_id');

/**
 * @type {Function}
 * @param {string} mutexCode The code of a mutex.
 * @returns {boolean} Whether the given mutex is locked.
 */
export const isMutexLocked = !!getSharedGlobalVariable(KEY_MUTEXES, {})?.[it]?.currentHolder;

/**
 * Updates a mutex, initializing it if necessary.
 *
 * @param {string} mutexCode The code of a mutex.
 * @param {Function} updateCallback The callback usable to update the mutex.
 * @returns {void}
 */
const updateMutex = (mutexCode, updateCallback) => {
  updateSharedGlobalVariable(KEY_MUTEXES, mutexes => {
    if (!isObject(mutexes[mutexCode])) {
      mutexes[mutexCode] = {
        currentHolder: null,
        pendingHolders: [],
      };
    }

    mutexes[mutexCode] = updateCallback(mutexes[mutexCode]);

    return mutexes;
  }, {});
};

/**
 * Releases a mutex, and schedules the next pending acquisition (if any, based on priority).
 *
 * This only has an effect if the mutex is locked by the given holder.
 *
 * @param {string} mutexCode The code of the mutex to be released.
 * @param {number} holderId The ID of the holder that is releasing the mutex.
 * @returns {void}
 */
const releaseMutex = (mutexCode, holderId) => {
  updateMutex(mutexCode, mutex => {
    if (mutex.currentHolder?.uniqueId !== holderId) {
      return;
    }

    const nextHolder = maxBy(mutex.pendingHolders, it.priority);

    if (nextHolder) {
      setTimeout(() => nextHolder.onAcquired());
      mutex.currentHolder = nextHolder;
      mutex.pendingHolders = mutex.pendingHolders.filter(it.uniqueId !== nextHolder.uniqueId);
    } else {
      mutex.currentHolder = null;
    }

    return mutex;
  });
};

/**
 * Attempts to acquire a mutex, waiting as long as necessary for it to become available.
 *
 * @param {string} mutexCode
 * The code of the mutex to acquire.
 * @param {object} config A set of configuration options.
 * @param {?number} config.priority
 * The priority of the request. Requests with higher priorities are handled first.
 * @param {?number} config.timeoutDelay
 * The maximum delay (if any) to wait for the mutex to become available, in milliseconds.
 * @param {?Function} config.onSupersessionRequest
 * A callback usable to be notified when another request with a higher priority is made to acquire the same mutex.
 * @returns {Promise<Function>}
 * A promise for when the mutex has been acquired, holding the callback usable to release it.
 * If the request times out, the promise will be rejected instead.
 */
export const requestMutex =
  async (
    mutexCode,
    {
      priority = PRIORITY_AVERAGE,
      timeoutDelay = null,
      onSupersessionRequest = noop,
    } = {}
  ) => (
    new Promise((resolve, reject) => {
      const uniqueId = getNextHolderId();

      const cancelTimeoutId = (timeoutDelay > 0)
        ? (
          setTimeout(() => {
            updateMutex(mutexCode, mutex => {
              return {
                ...mutex,
                pendingHolders: mutex.pendingHolders.filter(uniqueId !== it.uniqueId),
              };
            });

            reject();
          }, timeoutDelay)
        ) : null;

      const onAcquired = () => {
        cancelTimeoutId && clearTimeout(cancelTimeoutId);
        resolve(() => releaseMutex(mutexCode, uniqueId));
      };

      const holder = {
        uniqueId,
        priority,
        onAcquired,
        onSupersessionRequest,
      };

      updateMutex(mutexCode, mutex => {
        if (!mutex.currentHolder) {
          mutex.currentHolder = holder;
          setTimeout(() => onAcquired());
        } else {
          mutex.pendingHolders.push(holder);

          if (holder.priority > mutex.currentHolder.priority) {
            setTimeout(() => mutex.currentHolder.onSupersessionRequest());
          }
        }

        return mutex;
      });
    })
  );

export {
  PRIORITY_LOWEST,
  PRIORITY_LOW,
  PRIORITY_AVERAGE,
  PRIORITY_HIGH,
  PRIORITY_HIGHEST,
} from '../utils/constants';

/**
 * @type {string}
 */
export const MUTEX_HOTKEYS = 'hotkeys';
