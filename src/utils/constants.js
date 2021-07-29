/**
 * @type {number}
 */
export const PRIORITY_HIGHEST = Number.MAX_SAFE_INTEGER;

/**
 * @type {number}
 */
export const PRIORITY_LOWEST = 1;

/**
 * @type {number}
 */
export const PRIORITY_LOW = Math.round(PRIORITY_HIGHEST / 4);

/**
 * @type {number}
 */
export const PRIORITY_AVERAGE = Math.round(2 * PRIORITY_LOW);

/**
 * @type {number}
 */
export const PRIORITY_HIGH = Math.round(3 * PRIORITY_LOW);

