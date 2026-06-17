"use strict";
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
const state = {
	dopamine: 0.5,
	/**
	 * @type memory_node[]
	 */
	memory: [],
	short_urge: 0.9,
	long_urge: 0.5,
	current_thought: null,
	x: 10,
	y: 10,
	action: [["recall_memory", "walk"], ["run"]],
	available_action: ["recall_memory", "walk", "run"],
	action_weigh: [1],
	execute: function () {
		if (this.current_thought === null) {
			return;
		}
		res = undefined;
		for (const act of this.current_thought) {
			if (act in action) {
				res = this[act](res);
			}
		}
	},
	recall_memory: function (id) {
		return this.memory[
			id ?? this.memory[Math.floor(Math.random() * this.memory.length)]
		];
	},
};
const $ = document.querySelector.bind(document),
	log = console.log.bind(console);
const spirit = $("#spirit");
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
