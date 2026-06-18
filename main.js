"use strict";
/**
 * @typedef {number} int
 * @typedef {number} float
 */
const $ = document.querySelector.bind(document),
	log = console.log.bind(console),
	$$ = document.createElement.bind(document);
const spirit = /** @type {HTMLSpanElement} */ ($("#spirit")),
	blackboard = /**@type {HTMLTextAreaElement} */ ($("#blackboard")),
	{ body } = document;
class memory_node {
	/** @type {int} */
	weigh = 0;
	/** @type {memory_node[]} */
	related = [];
	/** @type {string[]} */
	actions = [];
	/** @type {[int,int]} */
	position = [0, 0];
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
	x: 100,
	/**@type {int} */
	y: 100,
	/** @type {memory_node} */
	current_thought: new memory_node(1, [], ["walk"], [100, 100], []),
	/**@type {string[][]} */
	action: [
		["recall_memory", "walk"],
		["run"],
		["make_action"],
		["talk"],
		["make_memory"],
		["draw"],
		["erase"],
	],
	/**@type {string[]} */
	available_action: [
		"recall_memory",
		"walk",
		"run",
		"make_action",
		"talk",
		"make_memory",
		"draw",
		"erase",
	],
	/**@type {int[]} */
	action_weigh: [1, 1, 1],
	execute() {
		let res = undefined,
			tried = false;
		for (const act of this.current_thought.actions) {
			if (act in this.available_action) {
				res = actions[act](res);
				tried = true;
			}
		}
		if (!tried) {
			this.current_thought.actions.push(
				state.available_action[
					Math.floor(Math.random() * state.available_action.length)
				]
			);
		}
		actions.make_memory();
	},
	max_depth: 3,
	site: 40,
	general_weigh: 10,
};
/**@type {Object<string,CallableFunction>} */
const actions = {
	/**
	 * @param {int} id
	 * @returns {memory_node}
	 */
	recall_memory(id) {
		const result =
			state.memory[
				id ??
					state.memory[
						Math.floor(Math.random() * state.memory.length)
					]
			];
		result.weigh++;
		return result;
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
		state.action_weigh.push(state.general_weigh);
	},
	/**
	 * @param  {...string} message
	 */
	talk(...message) {
		blackboard.innerText += message.join(". ");
	},
	make_memory() {
		const now_memory = new memory_node(
			state.general_weigh,
			[state.current_thought],
			state.current_thought.actions,
			[state.x, state.y],
			nearby()
		);
		state.current_thought.related.push(now_memory);
	},
	/**
	 * @param {{x: int, y: int}} param0
	 */
	draw({ x = state.x, y = state.y }) {
		const pixel = $$("div");
		pixel.classList.add("pixel");
		pixel.style.backgroundColor = cursor_state.color;
		for (const element of element_from_point({ x, y })) {
			element.remove();
		}
		pixel.style.left = `${x}px`;
		pixel.style.top = `${y}px`;
		body.appendChild(pixel);
	},
	/**
	 * @param {{x: int, y: int}} param0
	 */
	erase({ x = state.x, y = state.y }) {
		for (const element of element_from_point({ x, y })) {
			element.remove();
			elements.splice(elements.indexOf(element), 1);
		}
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
	const pos = { x: state.x, y: state.y };
	for (let x = -state.site; x <= state.site; x++) {
		for (let y = -state.site; y <= state.site; y++) {
			result.concat(element_from_point({ x: pos.x + x, y: pos.y + y }));
		}
	}
	return result;
}
const cursor_state = {
	/** @type {int} */
	x: 0,
	/** @type {int} */
	y: 0,
	/** @type {string} */
	mode: "",
	/** @type {string} */
	color: "black",
	/** @type {[int,int][]} */
	consume: [],
};
$("#pen")?.addEventListener("click", () => {
	cursor_state.mode = "pen";
});
$("#eraser")?.addEventListener("click", () => {
	cursor_state.mode = "eraser";
});
$("#dump-all")?.addEventListener("click", () => {
	cursor_state.mode = "click";
	elements.map((v) => {
		v.remove();
	});
	elements.length = 0;
});
let mousedown = false;
document.addEventListener("mousedown", (e) => {
	if (mousedown) {
		return;
	}
	cursor_state.x = e.clientX;
	cursor_state.y = e.clientY;
	mousedown = true;
});
document.addEventListener("mousemove", (e) => {
	if (!mousedown) {
		return;
	}
	cursor_state.x = e.clientX;
	cursor_state.y = e.clientY;
	cursor_state.consume.push([cursor_state.x, cursor_state.y]);
});
document.addEventListener("mouseup", (e) => {
	if (!mousedown) {
		return;
	}
	cursor_state.x = e.clientX;
	cursor_state.y = e.clientY;
	mousedown = false;
});
/**
 *
 * @param {{x: int,y: int}} param0
 * @returns {HTMLElement[]}
 */
function element_from_point({ x, y }) {
	// @ts-ignore
	return (document.elementsFromPoint(x, y) ?? []).filter((el) =>
		el.classList.contains("pixel")
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
	if (cursor_state.consume.length) {
		switch (cursor_state.mode) {
			case "pen": {
				const [x, y] = cursor_state.consume.pop() ?? [
					undefined,
					undefined,
				];
				const pixel = $$("div");
				pixel.classList.add("pixel");
				pixel.style.backgroundColor = cursor_state.color;
				for (const element of element_from_point(cursor_state)) {
					element.remove();
				}
				pixel.style.left = `${x}px`;
				pixel.style.top = `${y}px`;
				body.appendChild(pixel);
				elements.push(pixel);
				break;
			}
			case "eraser": {
				const { x, y } = cursor_state;
				for (let dx = -15; dx <= 15; dx++) {
					for (let dy = -15; dy < 15; dy++) {
						for (const element of element_from_point({
							x: dx + x,
							y: dy + y,
						})) {
							element.remove();
							elements.splice(elements.indexOf(element), 1);
						}
					}
				}
				break;
			}
		}
	}
	requestAnimationFrame(main);
}
requestAnimationFrame(main);
