/* eslint-disable no-magic-numbers */
import { neuron, useless, random, floor } from "./neuron.js";
import { between, get_audio, log } from "./lib.js";
/**
 * @typedef {number} int
 * @typedef {number} float
 */

const FACTOR = 1;

/**
 * @returns {boolean}
 */
function true_or_false() {
	return random() > 0.5 * FACTOR;
}

/**
 * Attach two brain parts
 * @param {neuron[]} plugin
 * @param {neuron[]} socket
 */
function attach(plugin, socket) {
	const size = socket.length / 2;
	for (const plug of plugin) {
		plug.golgi[0] += size;
		plug.golgi[1] += size;
		plug.next.push(...socket);
	}
	for (const sock of socket) {
		sock.connected += plugin.length;
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
 * Update a part of the brain
 * @param {{input:neuron[],layers:neuron[],output:neuron[]}} neurons
 */
function init(neurons) {
	for (const neu of neurons.input) {
		neu.init();
	}
	for (const neu of neurons.layers) {
		neu.init();
	}
	for (const neu of neurons.output) {
		neu.init();
	}
}

/**
 * make part of brains
 * @param {int} total
 * @param {int} layer
 * @param {{input:{log:Function,send:Function},layers:{log:Function,send:Function},output:{log:Function,send:Function}}} handler
 * @param {{input:{least:int,max:int},layers:{least:int,max:int},output:{least:int,max:int}}} data
 * @returns {{input:neuron[],layers:neuron[],output:neuron[]}}
 */
function make_part(
	total,
	layer,
	handler = {
		input: { log: useless, send: useless },
		layers: { log: useless, send: useless },
		output: { log: useless, send: useless },
	},
	data = {
		input: { least: 0, max: 0 },
		layers: { least: 0, max: 0 },
		output: { least: 0, max: 0 },
	}
) {
	/** @type {neuron[]} */
	const input = [],
		pre_layer = total / layer / 2;
	for (let i = 100; i > 0; i--) {
		input.push(
			new neuron(
				true_or_false(),
				true_or_false(),
				0,
				handler.input.log,
				handler.input.send,
				data.input.least,
				data.input.max,
				100
			)
		);
	}
	/** @type {neuron[]} */
	const layers = [];
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
					handler.layers.log,
					handler.layers.send,
					data.layers.least,
					data.layers.max,
					pre_layer * 2
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
			new neuron(
				true_or_false(),
				true_or_false(),
				50,
				handler.output.log,
				handler.output.send,
				data.output.least,
				data.output.max,
				pre_layer * 2
			)
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
		input: { log: useless, send: useless },
		layers: { log: useless, send: useless },
		output: {
			/**
			 * @param {boolean[]} data
			 */
			log: (data) => {
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
			send: useless,
		},
	}),
	understand: make_part(10000, 100),
	read: make_part(10000, 100),
};
attach(language_centre.understand.output, language_centre.speak.input);
attach(language_centre.read.output, language_centre.understand.input);
attach(language_centre.speak.output, language_centre.read.input);
const think = make_part(10000, 100);
const PFC = make_part(
	10000,
	100,
	{
		input: { log: useless, send: useless },
		layers: { log: useless, send: useless },
		output: {
			log: useless,
			send: useless,
		},
	},
	{
		input: { least: 0, max: 0.3 },
		layers: { least: 0, max: 0.3 },
		output: { least: 0, max: 0.3 },
	}
);
const amygdala = make_part(10000, 100, {
	input: { log: useless, send: useless },
	layers: { log: useless, send: useless },
	output: {
		log: useless,
		/**
		 * @param {boolean} bool
		 * @param {neuron} obj
		 * @return {boolean}
		 */
		send: (bool, obj) => {
			if (obj.store[1] / obj.store[0] > 2) {
				return !bool;
			}
			return bool;
		},
	},
});
attach(language_centre.understand.output, think.input);
attach(think.output, PFC.input);
attach(PFC.output, amygdala.input);
attach(amygdala.output, think.input);
attach(think.output, language_centre.understand.input);
const hippocampus = make_part(10000, 100, {
	input: {
		/**
		 * @param {boolean[]} data
		 * @param {neuron} neu
		 * @return {boolean}
		 */
		log(data, neu) {
			let zero = 0,
				one = 0;
			for (const element of data) {
				if (element) {
					one++;
				} else {
					zero++;
				}
			}
			if (neu.extra.length === 2) {
				if (
					between(neu.extra[0] / (zero ?? 1), 0.8, 1.2) &&
					between(neu.extra[1] / (one ?? 1), 0.8, 1.2)
				) {
					return true;
				}
			} else {
				zero += neu.store[0];
				one += neu.store[1];
				neu.extra = [zero, one];
			}
			return false;
		},
		send: useless,
	},
	layers: { log: useless, send: useless },
	output: { log: useless, send: useless },
});
attach(think.output, hippocampus.input);
attach(hippocampus.output, think.input);

// initalize
init(language_centre.read);
init(language_centre.understand);
init(language_centre.speak);
init(think);
init(PFC);
init(hippocampus);
init(amygdala);
for (const neu of language_centre.read.input) {
	neu.connected += 25;
}
/** @type {string[]} */
const buffer = [];
let last = Date.now();
function main() {
	const audio = get_audio(false);
	const limit = Math.min(audio.length, 2500);
	for (let i = 0; i < limit; i++) {
		language_centre.read.input[floor(i / 25)].receive(audio[i]);
	}
	update(language_centre.read);
	update(language_centre.understand);
	update(language_centre.speak);
	update(think);
	update(hippocampus);
	update(PFC);
	update(amygdala);
	/** @type {int[]} */
	const result = [],
		/** @type {string[]} */
		temp = [];
	let ind = 0;
	const { length } = global;
	while (ind < length) {
		if (temp.length < 8) {
			temp.push(global[ind] ? "1" : "0");
		} else {
			result.push(parseInt(temp.join(""), 2));
			temp.length = 0;
		}
		ind++;
	}
	global.length = 0;
	const now = Date.now();
	buffer.push(`${-(last - now)},${result.join(":")}`);
	last = now;
	if (buffer.length > 100) {
		log(buffer.join("\n"));
		buffer.length = 0;
	}
	result.length = 0;
	// @ts-ignore
	// eslint-disable-next-line no-undef
	setImmediate(main); // This is Node.js thing
}
main();
