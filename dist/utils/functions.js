/**
 * A function that does nothing.
 *
 * @returns {void}
 */
export const noop = () => {};
/**
 * @type {Function}
 * @param {*} value A value.
 * @returns {*} The same value.
 */

export const identity = _arg4 => {
  return _arg4;
};
/**
 * @param {Promise} promise A promise to run solely for its effects, discarding its result.
 * @returns {void}
 */

export const runPromiseForEffects = _it => {
  return _it.then(noop).catch(noop);
};
/**
 * @type {Function}
 * @param {*} value A value.
 * @returns {boolean} Whether the given value is a valid, finite number.
 */

export const isNumber = _arg => {
  return typeof _arg === 'number' && Number.isFinite(_arg);
};
/**
 * @type {Function}
 * @param {*} value A value.
 * @returns {boolean} Whether the given value is a string.
 */

export const isString = _arg5 => {
  return typeof _arg5 === 'string';
};
/**
 * @type {Function}
 * @param {*} value The tested value.
 * @returns {boolean} Whether the given value is an array.
 */

export const isArray = Array.isArray;
/**
 * @type {Function}
 * @param {*} value The tested value.
 * @returns {boolean} Whether the given value is an object. This excludes Arrays, but not Dates or RegExps.
 */

export const isObject = _arg2 => {
  return 'object' === typeof _arg2 && !!_arg2 && !isArray(_arg2);
};
/**
 * @type {Function}
 * @param {*} value The tested value.
 * @returns {boolean} Whether the given value is a function.
 */

export const isFunction = _arg6 => {
  return 'function' === typeof _arg6;
};
/**
 * @type {Function}
 * @param {*} value The tested value.
 * @returns {boolean} Whether the given value is a Blob.
 */

export const isBlob = _arg3 => {
  return _arg3 instanceof Blob || Object.prototype.toString.call(_arg3) === '[object Blob]';
};
/**
 * @type {Function}
 * @param {object} Object The tested object.
 * @param {string} name The name of a property.
 * @returns {boolean} Whether the given object has the specified property as its own.
 */

export const hasObjectProperty = (_arg7, _arg8) => {
  return Object.prototype.hasOwnProperty.call(_arg7, _arg8);
};
/**
 * @param {object} object A Plain Old Javascript Object.
 * @returns {boolean} Whether the given object is empty.
 */

export const isEmptyObject = object => {
  for (let key in object) {
    if (hasObjectProperty(object, key)) {
      return false;
    }
  }

  return true;
};
/**
 * @type {Function}
 * @param {Array} xs An array.
 * @param {Array} ys Another array.
 * @returns {boolean} Whether the first array is a superset of the second.
 */

export const isSupersetOf = (_arg9, _arg10) => {
  return _arg9.every(_arg11 => {
    return _arg10.indexOf(_arg11) >= 0;
  });
};
/**
 * @type {Function}
 * @param {*} x A value.
 * @param {*} y Another value.
 * @returns {boolean} Whether the first value is larger than the second.
 */

const gt = (_arg12, _arg13) => {
  return _arg12 > _arg13;
};
/**
 * @type {Function}
 * @param {*} x A value.
 * @param {*} y Another value.
 * @returns {boolean} Whether the first value is smaller than the second.
 */


const lt = (_arg14, _arg15) => {
  return _arg14 < _arg15;
};
/**
 * @param {Function} compare A comparison function.
 * @returns {Function} The inverse of the given comparison function.
 */


export const invertComparison = compare => (x, y) => {
  const result = compare(x, y);
  return result < 0 ? 1 : result > 0 ? -1 : 0;
};
/**
 * @param {Array} values A list of values.
 * @param {Function} getter A getter for the calculated values to compare.
 * @param {Function} comparer A function usable to compare any two calculated values, and determine which one to keep.
 * @returns {*|undefined} The (first) value from the list whose corresponding calculated value was selected.
 */

export const extremumBy = (values, getter, comparer) => {
  let selected;
  let extremum;

  if (isArray(values)) {
    for (let i = 0, l = values.length; i < l; i++) {
      const calculated = getter(values[i]);

      if (undefined === extremum || comparer(calculated, extremum)) {
        selected = values[i];
        extremum = calculated;
      }
    }
  }

  return selected;
};
/**
 * @type {Function}
 * @param {Array} values A list of values.
 * @param {Function} getter A getter for the calculated values to compare.
 * @returns {*|undefined} The (first) value from the list whose corresponding calculated value is the largest.
 */

export const maxBy = (_arg16, _arg17) => {
  return extremumBy(_arg16, _arg17, gt);
};
/**
 * @param {Array} values A list of values.
 * @param {Function} getter A getter for the calculated values to compare and return.
 * @returns {*|undefined} The largest calculated value from the values in the list.
 */

export const maxOf = (values, getter) => {
  const value = maxBy(values, getter);
  return undefined === value ? value : getter(value);
};
/**
 * @type {Function}
 * @param {Array} values A list of values.
 * @returns {*|undefined} The (first) largest value in the list.
 */

export const max = _arg18 => {
  return maxOf(_arg18, identity);
};
/**
 * @type {Function}
 * @param {Array} values A list of values.
 * @param {Function} getter A getter for the calculated values to compare.
 * @returns {*|undefined} The (first) value from the list whose corresponding calculated value is the smallest.
 */

export const minBy = (_arg19, _arg20) => {
  return extremumBy(_arg19, _arg20, lt);
};
/**
 * @param {Array} values A list of values.
 * @param {Function} getter A getter for the calculated values to compare and return.
 * @returns {*|undefined} The smallest calculated value from the values in the list.
 */

export const minOf = (values, getter) => {
  const value = minBy(values, getter);
  return undefined === value ? value : getter(value);
};
/**
 * @type {Function}
 * @param {Array} values A list of values.
 * @returns {*|undefined} The (first) smallest value from the list.
 */

export const min = _arg21 => {
  return minOf(_arg21, identity);
};
/**
 * @param {Array} values A list of values.
 * @param {Function} getter A getter for the calculated values to be summed up.
 * @returns {number} The sum of the calculated values from the values in the list.
 */

export const sumOf = (values, getter) => values.reduce((result, value) => result + getter(value), 0);
/**
 * @type {Function}
 * @param {number[]} values A list of numbers.
 * @returns {number} The sum of the numbers in the list.
 */

export const sum = _arg22 => {
  return sumOf(_arg22, identity);
};
/**
 * @param {Array} values A list of values.
 * @param {Function} getter A getter for the calculated values on which to group the values in the list.
 * @returns {Object<string, Array>} An object from calculated values to the corresponding subset of original values.
 */

export const groupBy = (values, getter) => {
  const result = {};

  for (let i = 0, l = values.length; i < l; i++) {
    const value = values[i];
    const key = String(getter(value));

    if (!(key in result)) {
      result[key] = [];
    }

    result[key].push(values[i]);
  }

  return result;
};
/**
 * @param {Array[]} xss A list of arrays.
 * @returns {Array[]} The cartesian product of the given arrays.
 */

export const cartesianProduct = xss => 0 === xss.length ? [] : xss.reduce((yss, xs) => yss.flatMap(ys => xs.map(x => [...ys, x])), [[]]);
/**
 * @param {Array} values A list of values.
 * @param {Function} choose
 * A function that will be applied to adjacent values whose calculated value is strictly equal.
 * Should return:
 * - -1 to keep only the left value,
 * -  0 to keep both values,
 * - +1 to keep only the right value.
 * @param {Function} map
 * A function that will be applied to the values before comparing them for strict equality.
 * @returns {Array} The given list of values, in which equivalent adjacent values have been deduplicated.
 */

export function dedupeAdjacentBy(values, choose, map = identity) {
  if (values.length <= 1) {
    return values.slice();
  }

  const result = [];
  let baseIndex = 0;
  let left = map(values[0]);

  for (let i = 1, l = values.length; i < l; i++) {
    const right = map(values[i]);
    const choice = left !== right ? 0 : choose(values[baseIndex], values[i], left);

    if (-1 !== choice) {
      if (0 === choice) {
        result.push(values[baseIndex]);
      }

      left = right;
      baseIndex = i;
    }
  }

  result.push(values[baseIndex]);
  return result;
}
/**
 * @type {Function}
 * @param {Array} values A list of values.
 * @returns {Array} The given list of values, in which equal adjacent values have been deduplicated.
 */

export const dedupeAdjacent = _arg23 => {
  return dedupeAdjacentBy(_arg23, () => -1);
};
/**
 * @param {Function} mergeValues A function usable to merge any two values.
 * @param {Map[]} maps A list of maps.
 * @returns {Map}
 * A new map that contains all the keys of the given maps.
 * If a key occurs in two or more maps, the given function will be used to merge the corresponding values.
 */

export const mergeMapsWith = (mergeValues, ...maps) => {
  const result = new Map();
  const [base, ...additional] = maps;

  for (const [key, value] of base) {
    result.set(key, value);
  }

  for (const map of additional) {
    for (const [key, value] of map) {
      const existing = result.get(key);
      result.set(key, existing === undefined ? value : mergeValues(existing, value));
    }
  }

  return result;
};
/**
 * @param {number} delay A delay, in milliseconds.
 * @returns {Promise<void>} A promise for when the delay is elapsed.
 */

export const sleep = delay => new Promise(resolve => setTimeout(resolve, delay));
/**
 * @param {string} url A URL of any shape.
 * @returns {string} The corresponding path.
 */

export const getUrlPath = url => {
  let path = null;

  if (url.charAt(0) === '/') {
    if (url.charAt(1) === '/') {
      url = `https://${url}`;
    } else {
      path = url;
    }
  }

  if (null === path) {
    try {
      path = new URL(url).pathname;
    } catch (error) {
      path = url;
    }
  }

  return path;
};