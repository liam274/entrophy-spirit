/**
 * @typedef {number} int
 * @typedef {number} float
 */
const { floor } = Math;
const { log } = console;
if (!global.gc) {
	throw new Error("Error: gc is not exposed");
}
/** @type {NodeJS.GCFunction} */
const gc_func = global.gc;

const TIME = 10000;
const HALF = 100;
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
 * @param {int} heat
 * @returns {Object<string, template>}
 */
export function test(funcs, generator, iteration = TIME, heat = HALF) {
	if (iteration < 1) {
		throw new Error(`Error: Bad iteration count ${iteration}`);
	}
	// eslint-disable-next-line no-param-reassign
	iteration = floor(iteration);
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
		const a = funcs[name](data);
		if (isPromise(a)) {
			throw new Error(
				"Error: Bad function return value (promise-like) " +
					"Promise-like function is not recommended to do benchmark test," +
					" since network or other external source may have unstable performance."
			);
		}
	}
	log("Pre-heat: start");
	for (const name of keys) {
		for (let k = heat; k > 0; k--) {
			funcs[name](data);
			funcs[name](data);
			funcs[name](data);
			funcs[name](data);
			funcs[name](data);
			funcs[name](data);
			funcs[name](data);
			funcs[name](data);
			funcs[name](data);
			funcs[name](data);
		}
	}
	log("Pre-heat: end");
	log("Test: start");
	// real test
	for (const name of keys) {
		log("Test:", name);
		gc_func();
		const start = performance.now();
		for (let k = iteration; k > 0; k--) {
			funcs[name](data);
		}
		temp[name] = performance.now() - start;
	}
	log("Test: end");
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

/**
 * @param {((x: any)=>any)[]} funcs
 * @param {any} [initial]
 * @returns {any}
 */
export function chain(funcs, initial) {
	let res = initial;
	for (const func of funcs) {
		res = func(res);
	}
	return res;
}

/**
 * @template {Function} t
 * @param {t} handler
 * @param {Object<string,any>} environment
 * @returns {t}
 */
export function packager(handler, environment) {
	const env = Object.setPrototypeOf(environment, null);
	return handler.bind(env);
}
