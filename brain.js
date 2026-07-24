/* eslint-disable no-magic-numbers */
import { neuron } from "./neuron.js";
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
 * make part of brains
 * @param {int} total
 * @param {int} layer
 * @returns {{input:neuron[],layers:neuron[],output:neuron[]}}
 */
function make_part(total, layer) {
	/** @type {neuron[]} */
	const input = [],
		pre_layer = total / layer / 2;
	for (let i = 100; i > 0; i--) {
		input.push(new neuron(true_or_false(), true_or_false(), pre_layer));
	}
	/** @type {neuron[]} */
	const layers = []; // 反向的層
	/** @type {neuron[]} */
	let last = [];
	for (let i = layer; i > 0; i--) {
		const temp = [];
		for (let count = pre_layer * 2; count > 0; count--) {
			temp.push(new neuron(true_or_false(), true_or_false(), pre_layer));
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
		output.push(new neuron(true_or_false(), true_or_false(), 50));
	}
	for (let count = pre_layer * 2; count > 0; count--) {
		const temp = /**@type {neuron} */ (layers[count]);
		temp.golgi = [50, 50];
		temp.next = output;
	}
	attach(input, layers.slice(layers.length - pre_layer * 2));
	return { input, layers, output };
}
const language_centre = {
	speak: make_part(10000, 100),
	understand: make_part(10000, 100),
	read: make_part(10000, 100),
};
attach(language_centre.understand.output, language_centre.speak.input);
attach(language_centre.read.output, language_centre.understand.input);
