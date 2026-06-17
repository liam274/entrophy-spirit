/* eslint-disable no-undef */
/* eslint-disable indent */
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
		let res = undefined;
		for (const act of this.current_thought) {
			if (act in this.action) {
				res = this[act](res);
			}
		}
	},
	recall_memory: function (id) {
		return this.memory[
			id ?? this.memory[Math.floor(Math.random() * this.memory.length)]
		];
	},
	/**
	 * @param {[string,string]} param0
	 */
	walk: function ([x, y]) {
		// eslint-disable-next-line no-magic-numbers
		go((x - this.x) / 100, (y - this.y) / 100, 100);
	},
	/**
	 * @param {[string,string]} param0
	 */
	run: function ([x, y]) {
		// eslint-disable-next-line no-magic-numbers
		go((x - this.x) / 30, (y - this.y) / 30, 30);
	},
};
const $ = document.querySelector.bind(document),
	log = console.log.bind(console);
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
