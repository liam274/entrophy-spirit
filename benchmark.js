/**
 * @typedef {number} int
 * @typedef {number} float
 */
const { error } = console;
/** @type {NodeJS.GCFunction} */
const gc_func =
	global.gc ?? (error("Error: gc is not exposed"), process.exit(1));

const TIME = 10000;
/**
 * @typedef {Object} template
 * @property {number} avg
 * @property {number} total
 * @property {number} time
 */

/**
 * @param {any} value
 * @returns {boolean}
 */
function isPromise(value) {
	return (
		value !== null &&
		(typeof value === "object" || typeof value === "function") &&
		typeof value.then === "function"
	);
}

/**
 * @param {Object<string,Function>} funcs
 * @param {()=>any} generator
 * @param {int} time
 * @returns {Object<string, template>}
 */
export function test(funcs, generator, time = TIME) {
	const data = generator();
	/** @type {Object<string, float>} */
	const temp = {};
	for (let k = time; k > 0; k--) {
		for (const name in funcs) {
			gc_func();
			const start = performance.now();
			const a = funcs[name](data);
			temp[name] += performance.now() - start;
			if (isPromise(a)) {
				error(
					"Error: Bad function return value (promise-like) " +
						"Promise-like function is not recommended to do benchmark test," +
						" since network or other external source may have unstable performance."
				);
			}
		}
	}
	/** @type {Object<string, template>} */
	const result = {};
	for (const key in temp) {
		result[key] = { avg: temp[key] / time, total: temp[key], time };
	}
	return result;
}
