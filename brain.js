import { neuron, useless, floor, min } from "./neuron.js";
import { between, Audio, info, warn, random_float } from "./lib.js";

/**
 * @typedef {number} int
 * @typedef {number} float
 */

const FACTOR = 1;

const CONFIG = {
	half: 0.5,
	hundred: 100,
	twice: 2,
	half_hundred: 50,
	hundred_square: 10000,
	pfc_max_digest: 0.3,
	point8: 0.8,
	onepoint2: 1.2,
	frequency: 16000,
	layer_size: 100,
	millsecond: 1000,
	word: 8,
};

/**
 * @returns {boolean}
 */
function true_or_false() {
	return random_float() > CONFIG.half * FACTOR;
}

/**
 * Attach two brain parts
 * @param {neuron[]} plugin
 * @param {neuron[]} socket
 */
function attach(plugin, socket) {
	const size = socket.length >> 1; // must be even
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
 * Init a part of the brain
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
		pre_layer = total / layer; // must be even
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
				CONFIG.hundred
			)
		);
	}
	/** @type {neuron[]} */
	const layers = [];
	/** @type {neuron[]} */
	let last = [];
	for (let i = layer; i > 0; i--) {
		const temp = [];
		for (let count = pre_layer; count > 0; count--) {
			temp.push(
				new neuron(
					true_or_false(),
					true_or_false(),
					pre_layer,
					handler.layers.log,
					handler.layers.send,
					data.layers.least,
					data.layers.max,
					pre_layer
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
				CONFIG.half_hundred,
				handler.output.log,
				handler.output.send,
				data.output.least,
				data.output.max,
				pre_layer
			)
		);
	}
	for (let count = pre_layer; count > 0; count--) {
		const temp = /**@type {neuron} */ (layers[count]);
		temp.golgi = [CONFIG.half_hundred, CONFIG.half_hundred];
		temp.next = output;
	}
	attach(input, last);
	return { input, layers, output };
}
/** @type {Uint8Array} */
const global = new Uint8Array(CONFIG.hundred_square);
let global_index = 0;
const language_centre = {
	speak: make_part(CONFIG.hundred_square, CONFIG.hundred, {
		input: { log: useless, send: useless },
		layers: { log: useless, send: useless },
		output: {
			/**
			 * @param {boolean[]} data
			 */
			log: (data) => {
				let one = 0;
				for (const item of data) {
					if (item) {
						one++;
					}
				}
				// @ts-ignore
				global[global_index++] = one > data.length >> 1;
			},
			send: useless,
		},
	}),
	understand: make_part(CONFIG.hundred_square, CONFIG.hundred),
	read: make_part(CONFIG.hundred_square, CONFIG.hundred),
};
attach(language_centre.understand.output, language_centre.speak.input);
attach(language_centre.read.output, language_centre.understand.input);
attach(language_centre.speak.output, language_centre.read.input);
const think = make_part(CONFIG.hundred_square, CONFIG.hundred);
const PFC = make_part(
	CONFIG.hundred_square,
	CONFIG.hundred,
	{
		input: { log: useless, send: useless },
		layers: { log: useless, send: useless },
		output: {
			log: useless,
			send: useless,
		},
	},
	{
		input: { least: 0, max: CONFIG.pfc_max_digest },
		layers: { least: 0, max: CONFIG.pfc_max_digest },
		output: { least: 0, max: CONFIG.pfc_max_digest },
	}
);
const amygdala = make_part(CONFIG.hundred_square, CONFIG.hundred, {
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
			if (obj.store[1] > obj.store[0] * CONFIG.twice) {
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
const hippocampus = make_part(CONFIG.hundred_square, CONFIG.hundred, {
	input: {
		/**
		 * @param {boolean[]} data
		 * @param {neuron} neu
		 * @return {boolean}
		 */
		log(data, neu) {
			let zero,
				one = 0;
			for (const element of data) {
				// @ts-ignore
				one += element;
			}
			zero = data.length - one;
			if (neu.extra.length === CONFIG.twice) {
				if (
					between(
						neu.extra[0] / min(zero, 1),
						CONFIG.point8,
						CONFIG.onepoint2
					) &&
					between(
						neu.extra[1] / min(one, 1),
						CONFIG.point8,
						CONFIG.onepoint2
					)
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
	neu.connected += 160;
}
/** @type {string[]} */
const buffer = [];
const IS_MICROPHONE = false;
if (IS_MICROPHONE) {
	warn("Microphone mode is: on");
} else {
	warn("Audio-file mode is: on");
}
const audio_instance = new Audio(
	IS_MICROPHONE,
	"expirement/mozart-piano-work/Mozart - Sonata for Two Pianos in D, K. 448 [complete].raw"
);
let time = 0;
let last = Date.now();
function main() {
	const audio = audio_instance.get_audio();
	const current_frequency =
		CONFIG.frequency /
		((Date.now() - last) / CONFIG.millsecond) /
		CONFIG.layer_size;
	const limit = Math.min(
		audio.length,
		current_frequency * CONFIG.layer_size
	);
	for (let i = 0; i < limit; i++) {
		language_centre.read.input[floor(i / current_frequency)].receive(
			audio[i]
		);
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
	const length = global_index;
	while (ind < length) {
		if (temp.length < CONFIG.word) {
			temp.push(global[ind] ? "1" : "0");
		} else {
			result.push(parseInt(temp.join(""), 2));
			temp.length = 0;
		}
		ind++;
	}
	global_index = 0;
	const now = Date.now();
	buffer.push((now - last).toString() + "," + result.join(":") + "\n");
	last = now;
	if (buffer.length > CONFIG.hundred) {
		info(buffer.join(""));
		buffer.length = 0;
		time++;
		if (time === CONFIG.hundred) {
			warn("Finished");
			process.exit(0);
		}
	}
	result.length = 0;
	setImmediate(main); // This is Node.js thing
}
main();
