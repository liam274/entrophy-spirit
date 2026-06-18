"use strict";
/**
 * @typedef {number} int
 * @typedef {number} float
 */
const $ = document.querySelector.bind(document),
	log = console.log.bind(console);
const spirit = /** @type {HTMLSpanElement} */ ($("#spirit")),
	blackboard = /**@type {HTMLTextAreaElement} */ ($("#blackboard"));
class memory_node {
	/** @type {int} */
	weigh = 0;
	/** @type {memory_node[]} */
	related = [];
	/** @type {string[]} */
	actions = [];
	/** @type {[int,int]} */
	position = [state.x, state.y];
	/** @type {any[]} */
	content = [];
	/**
	 * @param {int} weigh
	 * @param {memory_node[]} related
	 * @param {string[]} actions
	 * @param {[int,int]} position
	 * @param {any[]} content
	 * @returns memory_node
	 */
	constructor(weigh, related, actions, position, content) {
		this.weigh = weigh;
		this.related = related;
		this.actions = actions;
		this.position = position;
		this.content = content;
	}
}
/**
 * @template type
 */
class expandable_iter {
	/**
	 * @type {type[]}
	 */
	iterable = [];
	/**
	 * @param {type[]} iterable
	 */
	constructor(iterable) {
		this.iterable = iterable;
	}
	/**
	 * @returns {Generator<type, void, unknown>}
	 */
	*[Symbol.iterator]() {
		yield* this.iterable;
	}
	/**
	 * @param  {...type} items
	 */
	add(...items) {
		for (const item of items) {
			this.iterable.push(item);
		}
	}
}
const state = {
	dopamine: 0.5,
	/**
	 * @type {memory_node[]}
	 */
	memory: [],
	short_urge: 0.9,
	long_urge: 0.5,
	/**@type {int} */
	x: 10,
	/**@type {int} */
	y: 10,
	/** @type {memory_node} */
	current_thought: new memory_node(1, [], [], [10, 10], []),
	/**@type {string[][]} */
	action: [
		["recall_memory", "walk"],
		["run"],
		["make_action"],
		["talk"],
		["make_memory"],
	],
	/**@type {Set<string>} */
	available_action: new Set([
		"recall_memory",
		"walk",
		"run",
		"make_action",
		"talk",
		"make_memory",
	]),
	/**@type {int[]} */
	action_weigh: [1, 1, 1],
	execute() {
		if (this.current_thought === null) {
			return;
		}
		let res = undefined;
		for (const act of this.current_thought.actions) {
			if (act in this.action) {
				res = actions[act](res);
			}
		}
	},
	max_depth: 3,
};
/**@type {Object<string,CallableFunction>} */
const actions = {
	/**
	 * @param {int} id
	 * @returns {memory_node}
	 */
	recall_memory(id) {
		return state.memory[
			id ?? state.memory[Math.floor(Math.random() * state.memory.length)]
		];
	},
	/**
	 * @param {[int,int]} param0
	 */
	walk([x, y]) {
		// eslint-disable-next-line no-magic-numbers
		go((x - state.x) / 100, (y - state.y) / 100, 100);
	},
	/**
	 * @param {[int,int]} param0
	 */
	run([x, y]) {
		// eslint-disable-next-line no-magic-numbers
		go((x - state.x) / 30, (y - state.y) / 30, 30);
	},
	make_action() {
		/**
		 * @type {expandable_iter<memory_node>}
		 */
		const iter = new expandable_iter([state.current_thought]),
			/**@type {Object<string,int>} */
			list = {};
		let point = state.current_thought.related.length,
			time = 0,
			width = 0,
			tried = 0;
		for (const node of iter) {
			iter.add(...node.related);
			width += node.related.length;
			const w = node.weigh;
			for (const action in node.actions) {
				list[action] += (list[action] ?? 0) + w;
			}
			if (time++ === point) {
				point = width;
				time = 0;
				width = 0;
				if (tried++ === state.max_depth) {
					break;
				}
			}
		}
		/**@type {string[]} */
		const action = [],
			sorted = /**@type {[string,int][]} */ (
				Object.entries(list)
					.sort(([, a], [, b]) => b - a)
					.reduce((r, [k, v]) => ({ ...r, [k]: v }), {})
			);
		for (
			let i = Math.floor(Math.random() * state.max_depth) + 1;
			i > 0;
			i--
		) {
			const temp = sorted[0];
			if (temp) {
				action.push(temp[0]);
			} else {
				break;
			}
		}
		state.action.push(action);
		state.action_weigh.push(10);
	},
	/**
	 * @param  {...string} message
	 */
	talk(...message) {
		blackboard.innerText += message.join(". ");
	},
	make_memory() {
		const now_memory = new memory_node(
			10,
			[state.current_thought],
			state.current_thought.actions,
			[state.x, state.y],
			nearby()
		);
		state.current_thought.related.push(now_memory);
	},
};
/** @type {HTMLElement[]} */
const elements = [];
/**
 * walk to somewhere
 * @param {int} dx
 * @param {int} dy
 * @param {int} step
 */
function go(dx, dy, step) {
	let time = 0;
	const id = setInterval(() => {
		if (time === step) {
			clearInterval(id);
		}
		spirit.style.left = `${(state.x += dx)}px`;
		spirit.style.top = `${(state.y += dy)}px`;
		time++;
	}, 1);
}
/**
 * @returns {any[]}
 */
function nearby() {
	/** @type {any[]} */
	const result = [];
	for (const element of elements) {
		if (distance(element) < 40) {
			result.push(element);
		}
	}
	return result;
}
/**
 * @param {HTMLElement} element
 * @returns {float}
 */
function distance(element) {
	const temp = getComputedStyle(element);
	return Math.sqrt(
		Math.pow(parseFloat(temp.left) - state.x, 2) +
			Math.pow(parseFloat(temp.top) - state.y, 2)
	);
}
/**
 * main loop
 * @returns null
 */
function main() {
	spirit.style.left = `${state.x}px`;
	spirit.style.top = `${state.y}px`;
	state.execute();
	requestAnimationFrame(main);
}
requestAnimationFrame(main);
