/* eslint-disable no-magic-numbers */
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
const MINUTE = 60;
const MILLISECOND = 1000;
const FPS = 60;
const MUST_SLEEP = MILLISECOND / FPS;
class memory_node {
	/** @type {int} */
	weigh = 0;
	/** @type {int[]} */
	related = [];
	/** @type {string[]} */
	actions = [];
	/** @type {[int,int]} */
	position = [0, 0];
	/** @type {any[]} */
	content = [];
	/** @type {int} */
	x = 0;
	/** @type {int} */
	y = 0;
	/** @type {float} */
	last_time = 0;
	/**
	 * @param {int} weigh
	 * @param {int[]} related
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
		[this.x, this.y] = this.position;
		this.last_time = Date.now();
	}
	update_weigh() {
		/* We don't care what the weigh is like, until we access the node */
		const now = Date.now();
		const interval = now - this.last_time;
		this.weigh -= interval / (MINUTE * MILLISECOND);
		this.last_time = now - (interval % (MINUTE * MILLISECOND));
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
/**
 * @template type
 */
class cache {
	/** @type {boolean} */
	ok = true;
	/**
	 * @param {type} data
	 */
	constructor(data) {
		this.data = data;
	}
	unset() {
		this.ok = false;
	}
	/** @param {type} data */
	set(data) {
		this.data = data;
		this.ok = true;
	}
	/**
	 * @returns {type|undefined}
	 */
	get() {
		return this.ok ? this.data : undefined;
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
	current_thought: new memory_node(
		1,
		[],
		["recall_memory", "walk", "draw"],
		[100, 100],
		[]
	),
	/**@type {string[][]} */
	action: [
		["recall_memory", "walk"],
		["run"],
		["make_action"],
		["talk"],
		["make_memory"],
		["draw"],
		["erase"],
		["sleep"],
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
		"sleep",
	],
	/**@type {Object<string,int>} */
	action_weigh: {
		recall_memory: 1,
		walk: 1,
		run: 1,
		make_action: 1,
		talk: 1,
		make_memory: 1,
		draw: 1,
		erase: 1,
		sleep: 1,
	},
	/**@type {Object<string,int>} */
	action_energy: {
		recall_memory: 0.5,
		walk: 10,
		run: 20,
		make_action: 0.5,
		talk: 1,
		make_memory: 0,
		draw: 1,
		erase: 1,
		sleep: 0,
	},
	execute() {
		let res = undefined,
			tried = false;
		this.current_thought.update_weigh();
		for (const act of this.current_thought.actions) {
			if (this.available_action.includes(act)) {
				res = actions[act](res);
				tried = true;
				state.energy -=
					this.action_energy[this.available_action.indexOf(act)];
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
	/**@type {int} */
	max_depth: 3,
	/**@type {int} */
	site: 40,
	/**@type {int} */
	general_weigh: 10,
	/**@type {int} */
	sleep: 0,
	/**@type {int} */
	energy: 100,
	/**@type {int} */
	max_sleep: 100,
};
state.memory.push(state.current_thought);
/**@type {Object<string,CallableFunction>} */
const actions = {
	/**
	 * @param {int} id
	 * @returns {memory_node}
	 */
	recall_memory(id = -1) {
		/** @type {memory_node} */
		const result =
			state.memory.at(
				id ??
					state.memory[
						Math.floor(Math.random() * state.memory.length)
					]
			) ?? state.current_thought;
		result.weigh += state.general_weigh;
		result.update_weigh();
		return result;
	},
	/**
	 * @param {{x:int,y:int}} param0
	 * @returns {{x:int,y:int}}
	 */
	walk({ x = state.x, y = state.y } = { x: state.x, y: state.y }) {
		go((x - state.x) / 100, (y - state.y) / 100, 100);
		return { x, y };
	},
	/**
	 * @param {{x:int,y:int}} param0
	 */
	run({ x = state.x, y = state.y } = { x: state.x, y: state.y }) {
		go((x - state.x) / 30, (y - state.y) / 30, 30);
		return { x, y };
	},
	make_action() {
		state.current_thought.update_weigh();
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
			node.update_weigh();
			iter.add(...node.related.map((v) => state.memory[v]));
			width += node.related.length;
			const w = node.weigh;
			for (const action in node.actions) {
				list[action] +=
					(list[action] ?? 0) +
					w *
						similarity(
							state.current_thought.related,
							node.related
						);
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
				Object.entries(list).sort(([, a], [, b]) => b - a)
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
		return state.action.length - 1;
	},
	/**
	 * @param  {...string} message
	 */
	talk(...message) {
		blackboard.innerText += message.join(". ");
	},
	make_memory() {
		state.current_thought.update_weigh();
		if (_cache.ok) {
			state.current_thought.weigh += state.general_weigh;
			return;
		}
		const now_memory = new memory_node(
			state.general_weigh,
			[state.memory.indexOf(state.current_thought)],
			decive_action(state.current_thought.actions),
			[state.x, state.y],
			nearby()
		);
		state.current_thought.related.push(state.memory.length);
		state.memory.push(now_memory);
		state.current_thought = now_memory;
	},
	/**
	 * @param {{x: int, y: int}} param0
	 */
	draw({ x = state.x, y = state.y } = { x: state.x, y: state.y }) {
		_cache.unset();
		for (const element of element_from_point({ x, y })) {
			element.style.backgroundColor = cursor_state.color;
			return;
		}
		const pixel = $$("div");
		pixel.classList.add("pixel");
		pixel.style.backgroundColor = cursor_state.color;
		pixel.style.left = `${x}px`;
		pixel.style.top = `${y}px`;
		body.appendChild(pixel);
	},
	/**
	 * @param {{x: int, y: int}} param0
	 */
	erase({ x = state.x, y = state.y } = { x: state.x, y: state.y }) {
		_cache.unset();
		for (const element of element_from_point({ x, y })) {
			element.remove();
			elements.splice(elements.indexOf(element), 1);
		}
	},
	sleep() {
		state.sleep += Math.floor(Math.random() * state.max_sleep);
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
	if (dx === 0 && dy === 0) {
		_cache.unset();
		return;
	}
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
 * @type {cache<HTMLElement[]>}
 */
const _cache = new cache([]);
/**
 * @returns {HTMLElement[]}
 */
function nearby() {
	/** @type {HTMLElement[]} */
	const result = [];
	if (_cache.ok) {
		return _cache.data;
	}
	if (elements.length < 10000) {
		for (const element of elements) {
			if (distance(element) < state.site) {
				result.push(element);
			}
		}
	} else {
		const pos = { x: state.x, y: state.y };
		for (let x = -state.site; x <= state.site; x++) {
			for (let y = -state.site; y <= state.site; y++) {
				result.concat(
					element_from_point({ x: pos.x + x, y: pos.y + y })
				);
			}
		}
	}
	_cache.set(result);
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
 * deceive new action
 * @param {string[]} action_data
 * @returns {string[]}
 */
function decive_action(action_data) {
	/** @type {string[]} */
	const result = [];
	/** @type {Object<string,int>} */
	const temp = {};
	for (const [key, value] of Object.entries(state.action_weigh)) {
		temp[key] = action_data.includes(key) ? value : 2 * value;
	}
	const action_weigh = Object.entries(temp).sort(([, a], [, b]) => b - a);
	for (let i = Math.floor(Math.random() * state.max_depth) + 1; i > 0; i--) {
		result.push(action_weigh[i][0]);
	}
	return result;
}
/**
 * Caculate the similarity
 * @param {int[]} nodes1
 * @param {int[]} nodes2
 * @returns {float}
 */
function similarity(nodes1, nodes2) {
	let result = 0;
	for (const i of nodes1) {
		if (nodes2.includes(i)) {
			result++;
		}
	}
	for (const i of nodes2) {
		if (nodes1.includes(i)) {
			result++;
		}
	}
	return result / (nodes1.length + nodes2.length);
}
const cursor_state = {
	/** @type {int} */
	x: 0,
	/** @type {int} */
	y: 0,
	/** @type {string} */
	mode: "click",
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
	if (mousedown || cursor_state.mode === "click") {
		return;
	}
	cursor_state.consume.push([
		(cursor_state.x = e.clientX),
		(cursor_state.y = e.clientY),
	]);
	mousedown = true;
});
document.addEventListener("mousemove", (e) => {
	if (!mousedown) {
		return;
	}
	cursor_state.consume.push([
		(cursor_state.x = e.clientX),
		(cursor_state.y = e.clientY),
	]);
});
document.addEventListener("mouseup", () => {
	if (!mousedown || cursor_state.mode === "click") {
		return;
	}
	mousedown = false;
	cursor_state.consume.length = 0;
});
document.addEventListener("contextmenu", (e) => {
	// e.preventDefault();
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
		_cache.unset();
		switch (cursor_state.mode) {
			case "pen": {
				const [x, y] = /** @type {[int,int]}*/ (
					cursor_state.consume.pop()
				);
				let a = false;
				for (const element of element_from_point({ x, y })) {
					element.style.backgroundColor = cursor_state.color;
					a = true;
					break;
				}
				if (a) {
					break;
				}
				const pixel = $$("div");
				pixel.classList.add("pixel");
				pixel.style.backgroundColor = cursor_state.color;
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
	setTimeout(
		() => {
			state.energy += state.sleep;
			state.sleep = 0;
			requestAnimationFrame(main);
		},
		state.sleep * MILLISECOND + MUST_SLEEP
	);
}
requestAnimationFrame(main);
