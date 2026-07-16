/**
 * @typedef {number} int
 * @typedef {number} float
 */

/** @type {int} */
export const SECOND2MILISECOND = 1000;

/**
 * @template {Object} t
 * @param {t} object The object to be copied
 * @returns {t}
 */
export function copy_obj(object) {
	/** @type {t} */
	// @ts-ignore
	const result = {};
	for (const key in object) {
		// eslint-disable-next-line no-prototype-builtins
		if (object.hasOwnProperty(key)) {
			result[key] = object[key];
		}
	}
	return result;
}
/**
 *
 * @param {int} x
 * @param {int} y
 * @param {HTMLElement[]} eles
 * @returns {[int,int][]}
 */
export function to_abs(x, y, eles) {
	/** @type {[int,int][]} */
	const result = [];
	for (const element of eles) {
		result.push([
			Math.floor(parseFloat(element.style.left)) - x,
			Math.floor(parseFloat(element.style.top)) - y,
		]);
	}
	return result;
}
/**
 * @param {CallableFunction} callback
 * @param {int} FPS
 */
export function fps(callback, FPS) {
	setTimeout(callback, SECOND2MILISECOND / FPS);
}
