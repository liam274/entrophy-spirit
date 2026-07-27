/**
 * @typedef {number} int
 * @typedef {number} float
 */
/**
 * Check is between
 * @param {int} value
 * @param {int} min
 * @param {int} max
 * @returns {boolean}
 */
export function between(value, min, max) {
	return value < max && value > min;
}
