import { _, it, lift } from 'one-liner.macro';
import { hasObjectProperty, isFunction, isObject, noop } from './functions';

/**
 * @type {string}
 */
export const UNIQUE_KEY_PREFIX = '__duo-toolbox__-';

/**
 * @type {Function}
 * @param {string} baseKey A key.
 * @returns {string} The given key, uniquely prefixed.
 */
export const getUniqueKey = `${UNIQUE_KEY_PREFIX}${_}`;

/**
 * @type {string}
 */
const KEY_GLOBAL_VARIABLES = getUniqueKey('global_variables');

/**
 * @param {string} key A variable key.
 * @param {*=} defaultValue The default value to return if the variable has not been set yet.
 * @returns {*} The value of the given variable.
 */
export const getSharedGlobalVariable = (key, defaultValue) => {
  if (!isObject(window[KEY_GLOBAL_VARIABLES])) {
    window[KEY_GLOBAL_VARIABLES] = {};
  }

  return !hasObjectProperty(window[KEY_GLOBAL_VARIABLES], key)
    ? defaultValue
    : window[KEY_GLOBAL_VARIABLES][key];
};

/**
 * @param {string} key A variable key.
 * @param {*} value The new variable value.
 * @returns {void}
 */
export const setSharedGlobalVariable = (key, value) => {
  if (!isObject(window[KEY_GLOBAL_VARIABLES])) {
    window[KEY_GLOBAL_VARIABLES] = {};
  }

  window[KEY_GLOBAL_VARIABLES][key] = value;
};

/**
 * @param {string} key A variable key.
 * @param {Function} callback A function usable to calculate the new value of the variable, given the old one.
 * @param {*=} defaultValue The default value to use if the variable has not been set yet.
 * @returns {*} The updated value.
 */
export const updateSharedGlobalVariable = (key, callback, defaultValue) => {
  const updatedValue = callback(getSharedGlobalVariable(key, defaultValue));
  setSharedGlobalVariable(key, updatedValue);
  return updatedValue;
};

/**
 * @param {string} key They key of a counter.
 * @returns {number} The next value of the counter, starting at 1 if it was not used yet.
 */
export const bumpGlobalCounter = key => updateSharedGlobalVariable(`__counter::${key}__`, lift(_ + 1), 0);

/**
 * @type {string}
 */
const KEY_PENDING_GLOBAL_LISTENERS = 'pending_global_listeners';

/**
 * Registers a listener for when a global variable is defined and matches a given predicate.
 *
 * This only has an effect if no up-to-date listener was already registered with the same ID.
 * @param {string} name The name of a global variable.
 * @param {Function} predicate The predicate that the variable must match.
 * @param {Function} callback The function to be called once the variable is defined and matches the predicate.
 * @param {string} listenerId The listener ID.
 * @param {number} listenerVersion The listener version. Only the most recent listener for a given ID will be called.
 * @returns {void}
 */
const onceGlobalDefined = (name, predicate, callback, listenerId, listenerVersion = 1) => {
  if (hasObjectProperty(window, name) && predicate(window[name])) {
    callback(window[name]);
  } else {
    updateSharedGlobalVariable(KEY_PENDING_GLOBAL_LISTENERS, (listeners = {}) => {
      if (!listeners[name]) {
        listeners[name] = {};
        let currentValue = window[name];

        // Add a getter and a setter on the window to detect when the variable is changed.
        Object.defineProperty(window, name, {
          get: () => currentValue,

          set: value => {
            if (predicate(value)) {
              Object.defineProperty(window, name, {
                value,
                configurable: true,
                enumerable: true,
                writable: true,
              });

              Object.values(listeners[name]).forEach(it.callback(value));
            } else {
              currentValue = value;
            }
          },

          configurable: true,
        });
      }

      if (listenerVersion > (Number(listeners[name][listenerId]?.version) || 0)) {
        listeners[name][listenerId] = {
          callback,
          version: listenerVersion,
        };
      }

      return listeners;
    });
  }
};

/**
 * @type {string}
 */
const KEY_ORIGINAL_FUNCTION = getUniqueKey('original_function');

/**
 * @type {string}
 */
const KEY_OVERRIDE_VERSION = getUniqueKey('override_version');

/**
 * Applies an override to a (global) function hosted by a specific object.
 *
 * The override is only applied if necessary, and if the function exists.
 * @param {object} host The object that hosts the function to override.
 * @param {string} name The name of the function to override.
 * @param {Function} applyOverride A callback responsible for overriding the original function.
 * @param {number} overrideVersion The override version. Only the most recent override will take effect.
 * @returns {void}
 */
const overrideFunction = (host, name, applyOverride, overrideVersion = 1) => {
  if (!isObject(host)) {
    return;
  }

  if (overrideVersion > (Number(host[name]?.[KEY_OVERRIDE_VERSION]) || 0)) {
    const original = host[name]?.[KEY_ORIGINAL_FUNCTION] || host[name] || noop;
    host[name] = applyOverride(original);
    host[name][KEY_ORIGINAL_FUNCTION] = original;
    host[name][KEY_OVERRIDE_VERSION] = overrideVersion;
  }
}

/**
 * Applies an override to a function available in the global (window) scope.
 *
 * The override is only applied if necessary, once the function is defined.
 * @type {Function}
 * @param {string} name The name of the function to override.
 * @param {Function} applyOverride A callback responsible for overriding the original function.
 * @param {number} overrideVersion The override version. More recent overrides take precedence over older ones.
 * @returns {void}
 */
export const overrideGlobalFunction = (name, applyOverride, overrideVersion = 1) => (
  onceGlobalDefined(
    name,
    isFunction,
    () => overrideFunction(window, name, applyOverride, overrideVersion),
    'global',
    overrideVersion
  )
);

/**
 * Applies an override to a static method belonging to an interface available in the global (window) scope.
 *
 * The override is only applied if necessary, once the interface is defined, and if the method exists.
 * @param {string} constructorName The name of the constructor whose prototype holds the method to override.
 * @param {string} methodName The name of the static method to override.
 * @param {Function} applyOverride A callback responsible for overriding the original method.
 * @param {number} overrideVersion The override version. More recent overrides take precedence over older ones.
 * @returns {void}
 */
export const overrideStaticMethod = (constructorName, methodName, applyOverride, overrideVersion = 1) => (
  onceGlobalDefined(
    constructorName,
    isFunction,
    overrideFunction(_, methodName, applyOverride, overrideVersion),
    `static_method:${methodName}`,
    overrideVersion
  )
);

/**
 * Applies an override to an instance method belonging to an interface available in the global (window) scope.
 *
 * The override is only applied if necessary, once the interface is defined, and if the method exists.
 * @param {string} constructorName The name of the constructor whose prototype holds the method to override.
 * @param {string} methodName The name of the instance method to override.
 * @param {Function} applyOverride A callback responsible for overriding the original method.
 * @param {number} overrideVersion The override version. More recent overrides take precedence over older ones.
 * @returns {void}
 */
export const overrideInstanceMethod = (constructorName, methodName, applyOverride, overrideVersion = 1) => (
  onceGlobalDefined(
    constructorName,
    isFunction,
    overrideFunction(_?.prototype, methodName, applyOverride, overrideVersion),
    `instance_method:${methodName}`,
    overrideVersion
  )
);

/**
 * Registers a listener for when a constructor available the global (window) scope is called.
 *
 * This only has an effect if no up-to-date listener was already registered with the same ID.
 * @param {string} name The name of the constructor.
 * @param {Function} callback The function to be called with the result and arguments of the constructor when it is called.
 * @param {string} listenerId The listener ID.
 * @param {number} listenerVersion The listener version. Only the most recent listener for a given ID will be called.
 * @returns {void}
 */
export const onConstructorCall = (name, callback, listenerId, listenerVersion = 1) => (
  overrideGlobalFunction(
    name,
    constructor => function (...data) {
      if (!new.target) {
        const result = constructor.call(this, ...data);
        callback(result, ...data);
        return result;
      }

      const instance = new constructor(...data);

      instance.constructor = new.target;
      constructor.prototype.constructor = new.target;

      callback(instance, ...data);

      return instance;
    },
    listenerVersion
  )
);

/**
 * Applies an override to the descriptor of an object property.
 *
 * The override is only applied if necessary. If the property does not exist yet, it will be initialized.
 * @param {object} host The object that owns the property to override.
 * @param {string} name The name of the property to override.
 * @param {Function} applyOverride A callback responsible for overriding the original property descriptor.
 * @param {number} overrideVersion The override version. Only the most recent override will take effect.
 * @returns {void}
 */
export const overrideOwnPropertyDescriptor = (host, name, applyOverride, overrideVersion = 1) => {
  if (!isObject(host)) {
    return;
  }

  const overrideKey = getUniqueKey(`${name}_override_version`);

  if (overrideVersion > (Number(host[overrideKey]) || 0)) {
    Object.defineProperty(
      host,
      name,
      applyOverride(Object.getOwnPropertyDescriptor(host, name))
    );
  }
};

/**
 * @type {string}
 */
const TOOLBOX_IFRAME_ID = getUniqueKey('logging_iframe');

/**
 * @returns {HTMLElement}
 * An iframe element usable to access features that may not be accessible from the current context,
 * including (but not limited to) working logging methods and listening of localStorage changes.
 */
export const getToolboxIframe = () => {
  let toolboxIframe = document.getElementById(TOOLBOX_IFRAME_ID);

  if (!toolboxIframe || !toolboxIframe.isConnected) {
    toolboxIframe = document.createElement('iframe');
    toolboxIframe.id = TOOLBOX_IFRAME_ID;
    toolboxIframe.style.display = 'none';
    document.body.appendChild(toolboxIframe);
  }

  return toolboxIframe;
};
