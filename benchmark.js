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
 * @property {number} iteration
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
 * Test function shall be no-side-effect functions
 * @param {Object<string,Function>} funcs
 * @param {()=>any} generator
 * @param {int} iteration
 * @returns {Object<string, template>}
 */
export function test(funcs, generator, iteration = TIME) {
	const data = generator();
	/** @type {Object<string, float>} */
	const temp = {};
	/** @type {string[]} */
	const keys = [];
	// warm up
	for (const name in funcs) {
		if (!Object.hasOwn(funcs, name)) {
			continue;
		}
		keys.push(name);
		funcs[name](data);
		funcs[name](data);
		funcs[name](data);
	}
	// real test
	for (let k = iteration; k > 0; k--) {
		for (const name of keys) {
			gc_func();
			const start = performance.now();
			const a = funcs[name](data);
			temp[name] = (temp[name] ?? 0) + performance.now() - start;
			if (isPromise(a)) {
				error(
					"Error: Bad function return value (promise-like) " +
						"Promise-like function is not recommended to do benchmark test," +
						" since network or other external source may have unstable performance."
				);
				process.exit(1);
			}
		}
	}
	/** @type {Object<string, template>} */
	const result = {};
	for (const key in temp) {
		result[key] = {
			avg: temp[key] / iteration,
			total: temp[key],
			iteration,
		};
	}
	return result;
}
