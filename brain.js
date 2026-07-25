/* eslint-disable no-magic-numbers */
import { neuron, useless } from "./neuron.js";
/**
 * @typedef {number} int
 * @typedef {number} float
 */

const FACTOR = 1;

/**
 * @returns {boolean}
 */
function true_or_false() {
	return Math.random() > 0.5 * FACTOR;
}

/**
 * Attach two brain parts
 * @param {neuron[]} plugin
 * @param {neuron[]} socket
 */
function attach(plugin, socket) {
	const size = socket.length / 2;
	for (const plug of plugin) {
		plug.golgi = [size, size];
		plug.next = socket;
	}
}

/**
 * Update a part of the brain
 * @param {{input:neuron[],layers:neuron[],output:neuron[]}} neurons
 */
function update(neurons) {
	for (const neu of neurons.input) {
		neu.update();
	}
	for (const neu of neurons.layers) {
		neu.update();
	}
	for (const neu of neurons.output) {
		neu.update();
	}
}

/**
 * make part of brains
 * @param {int} total
 * @param {int} layer
 * @param {{input:Function,layers:Function,output:Function}} handler
 * @returns {{input:neuron[],layers:neuron[],output:neuron[]}}
 */
function make_part(
	total,
	layer,
	handler = { input: useless, layers: useless, output: useless }
) {
	/** @type {neuron[]} */
	const input = [],
		pre_layer = total / layer / 2;
	for (let i = 100; i > 0; i--) {
		input.push(
			new neuron(
				true_or_false(),
				true_or_false(),
				pre_layer,
				handler.input
			)
		);
	}
	/** @type {neuron[]} */
	const layers = []; // 反向的層
	/** @type {neuron[]} */
	let last = [];
	for (let i = layer; i > 0; i--) {
		const temp = [];
		for (let count = pre_layer * 2; count > 0; count--) {
			temp.push(
				new neuron(
					true_or_false(),
					true_or_false(),
					pre_layer,
					handler.layers
				)
			);
		}
		if (last.length) {
			for (const item of temp) {
				item.next = [...last];
			}
		}
		layers.push(...(last = temp));
	}
	/** @type {neuron[]} */
	const output = [];
	for (let i = 100; i > 0; i--) {
		output.push(
			new neuron(true_or_false(), true_or_false(), 50, handler.output)
		);
	}
	for (let count = pre_layer * 2; count > 0; count--) {
		const temp = /**@type {neuron} */ (layers[count]);
		temp.golgi = [50, 50];
		temp.next = output;
	}
	attach(input, layers.slice(layers.length - pre_layer * 2));
	return { input, layers, output };
}
/** @type {boolean[]} */
const global = [];
const language_centre = {
	speak: make_part(10000, 100, {
		input: useless,
		layers: useless,
		/**
		 * @param {boolean[]} data
		 */
		output: (data) => {
			let zero = 0,
				one = 0;
			for (const item of data) {
				if (item) {
					one++;
				} else {
					zero++;
				}
			}
			global.push(one > zero);
		},
	}),
	understand: make_part(10000, 100),
	read: make_part(10000, 100),
};
attach(language_centre.understand.output, language_centre.speak.input);
attach(language_centre.read.output, language_centre.understand.input);
attach(language_centre.speak.output, language_centre.read.input);

setInterval(() => {
	update(language_centre.read);
	update(language_centre.understand);
	update(language_centre.speak);
	/** @type {int[]} */
	const result = [],
		/** @type {string[]} */
		temp = [];
	global.reverse();
	while (global.length) {
		if (temp.length < 8) {
			temp.push(global.pop() ? "1" : "0");
		} else {
			result.push(parseInt(temp.join(""), 2));
			temp.length = 0;
		}
	}
	console.log(String.fromCharCode(...result));
	result.length = 0;
}, 10);
