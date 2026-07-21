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

/**
 * @param {[x1: int, y1: int]} param0
 * @param {[x2: int, y2: int]} param1
 */
export function distance([x1, y1], [x2, y2]) {
	// eslint-disable-next-line no-magic-numbers
	return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

/**
 *
 * @param {[int,int][]} data
 * @returns {[[x: int,y: int],dis: [dis: int, [x: int, y: int]][]]}
 */
export function closest_point(data) {
	/** @type {[x: int,y: int]} */
	let result = data[0];
	let shortest_distance_sum = Infinity;
	/** @type {[dis: int, [x: int, y: int]][]} */
	const res = [];
	for (const now of data) {
		let dis = 0;
		/** @type {[dis: int, [x: int, y: int]][]} */
		const now_res = [];
		for (const point of data) {
			now_res.push([distance(result, point), point]);
			dis += /** @type {[dis: int, [x: int, y: int]]}*/ (
				now_res.at(-1)
			)[0];
		}
		if (shortest_distance_sum > dis) {
			shortest_distance_sum = dis;
			result = now;
			res.length = 0;
			res.push(...now_res);
		}
	}
	return [result, res];
}

/**
 *
 * @param {[int,int][]} data1
 * @param {[int,int][]} data2
 * @returns {[int,int][]}
 */
export function find_pattern(data1, data2) {
	/** @type {[int,int][]} */
	const pattern = [];
	const [, dis1] = closest_point(data1);
	const [, dis2] = closest_point(data2);
	const big = dis1.length > dis2.length ? dis1 : dis2;
	const small = big === dis1 ? dis2 : dis1;
	for (const [dis, point] of big) {
		for (const [d] of small) {
			if (Math.floor(dis) === Math.floor(d)) {
				pattern.push(point);
			}
		}
	}
	return pattern;
}
