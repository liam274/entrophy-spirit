import _ from "lodash";
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
 * @returns {Object<string,any>}
 * @this {Object<string,any>}
 */
export function* _chain() {
	if (this === undefined || typeof this !== "object" || this === null) {
		return Object.create(null);
	}
	const that = this.initial ?? {};
	const { funcs } = /** @type {{funcs: (()=>any)[]}} */ (this);
	let t = 0;
	for (const func of funcs) {
		const return_value = func.call(that);
		if (is_callable(return_value)) {
			funcs.splice(t + 1, 0, return_value);
		}
		if (this.iterable === true) {
			yield;
		}
		t++;
	}
	return that;
}

/**
 * @param {(()=>any)[]} funcs
 * @param {Object} [initial]
 * @param {boolean} iterable
 * @returns {Object<string,any>}
 */
export function chain(funcs, initial = {}, iterable = false) {
	const obj = Object.setPrototypeOf({ funcs, initial, iterable }, null);
	const iterator = _chain.call(obj);
	if (iterable) {
		return iterator.next().value;
	}
	return iterator;
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

/**
 * @template {Object} t
 * @param {t} obj
 * @param {Object} prototype
 * @returns {t}
 */
export function resign_prototype(obj, prototype) {
	return Object.setPrototypeOf(
		obj,
		Object.setPrototypeOf(_.cloneDeep(prototype), null)
	);
}

/**
 * @param {Function} callback
 * @param {(x:Object)=>boolean} predicate
 */
export function if_func(callback, predicate) {
	/**
	 * @this {Object}
	 */
	return function () {
		if (predicate(this)) {
			callback.call(this);
		}
	};
}

/**
 * @param {any} value
 * @returns {boolean}
 */
function is_callable(value) {
	if (typeof value === "function") {
		const str = /** @type {Function} */ (value).toString();
		return !/^class\s/.test(str);
	}
	return false;
}
