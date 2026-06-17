"use strict";
const $ = document.querySelector.bind(document),
	log = console.log.bind(console);
class memory_node {
	/**
	 * @type {int}
	 */
	weigh = 0;
	/**
	 * @type {memory_node[]}
	 */
	related = [];
	/**
	 * @type {string[]}
	 */
	actions = [];
	/**
	 * @param {int} weigh
	 * @param {memory_node[]} related
	 * @param {string[]} actions
	 * @param {[int,int]} content
	 * @returns memory_node
	 */
	constructor(weigh, related, actions, content) {
		this.weigh = weigh;
		this.related = related;
		this.action = actions;
		this.content = content;
	}
}
/**
 * @template type
 */
class expandable_iter {
	/**
	 * @type {Array<type>}
	 */
	iterable = [];
	/**
	 * @param {Array<type>} iterable
	 */
	constructor(iterable) {
		this.iterable = iterable;
	}
	/**
	 * @returns {type}
	 */
	[Symbol.iterator]() {
		let index = 0;
		return {
			next() {
				if (index < this.iterable.length) {
					return { value: this.iterable[index++], done: false };
				} else {
					return { value: undefined, done: true };
				}
			},
		};
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
	 * @type memory_node[]
	 */
	memory: [],
	short_urge: 0.9,
	long_urge: 0.5,
	/**
	 * @type {memory_node}
	 */
	current_thought: null,
	x: 10,
	y: 10,
	action: [["recall_memory", "walk"], ["run"]],
	available_action: ["recall_memory", "walk", "run", "make_action"],
	action_weigh: [1],
	execute() {
		if (this.current_thought === null) {
			return;
		}
		let res = undefined;
		for (const act of this.current_thought.actions) {
			if (act in this.action) {
				res = this[act](res);
			}
		}
	},
	recall_memory(id) {
		return this.memory[
			id ?? this.memory[Math.floor(Math.random() * this.memory.length)]
		];
	},
	/**
	 * @param {[string,string]} param0
	 */
	walk([x, y]) {
		// eslint-disable-next-line no-magic-numbers
		go((x - this.x) / 100, (y - this.y) / 100, 100);
	},
	/**
	 * @param {[string,string]} param0
	 */
	run([x, y]) {
		// eslint-disable-next-line no-magic-numbers
		go((x - this.x) / 30, (y - this.y) / 30, 30);
	},
	make_action() {
		/**
		 * @type {expandable_iter<memory_node>}
		 */
		const iter = expandable_iter(this.current_thought.related);
		for (const related of iter) {
			iter.add(related.related);
		}
	},
};
/**
 * @type {HTMLSpanElement}
 */
const spirit = $("#spirit");
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
