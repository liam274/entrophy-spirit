/* eslint-disable no-magic-numbers */
"use strict";
import * as func from "./func.js";
/**
 * @typedef {number} int
 * @typedef {number} float
 */
const $ = document.querySelector.bind(document),
	$$ = document.createElement.bind(document);
const spirit = /** @type {HTMLSpanElement} */ ($("#spirit")),
	blackboard = /**@type {HTMLTextAreaElement} */ ($("#blackboard")),
	{ body } = document,
	status_board = /** @type {HTMLSpanElement}*/ ($("#status"));
const MINUTE = 60;
const MILLISECOND = 1000;
const MAX_ENERGY = 200000;
class memory_node {
	/** @type {int} */
	weigh = 0;
	/** @type {int[]} */
	related = [];
	/** @type {int} */
	actions = 0;
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
	/** @type {int} */
	most_likely = 0;
	/** @type {float} */
	delta_dopamine = 0;
	/** @type {int} */
	delta_dopamine_time = 0;
	/** @type {float} */
	delta_dopamine_sum = 0;
	/** @type {float} */
	urgency = 1;
	/**
	 * @param {int} weigh
	 * @param {int[]} related
	 * @param {int} actions
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
	/**
	 * @param {float} value
	 * @returns {float}
	 */
	update_delta_dopamine(value) {
		this.delta_dopamine_sum += value;
		return (this.delta_dopamine =
			this.delta_dopamine_sum / ++this.delta_dopamine_time);
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
		this.initial = data;
	}
	unset() {
		this.ok = false;
	}
	/**
	 * @template T
	 * @param {T} data
	 * @param {string[]} key
	 * @returns {T}
	 * */
	set(data, key = []) {
		if (key.length) {
			/** @type {any} */
			let temp = this.data;
			for (let i = 0; i < key.length - 1; i++) {
				temp = temp[key[i]];
			}
			temp[key[key.length - 1]] = data;
		} else {
			// @ts-ignore
			this.data = /** @type {type} */ (data);
		}
		this.ok = true;
		return data;
	}
	/**
	 * @returns {type}
	 */
	get() {
		return this.ok ? this.data : this.initial;
	}
}
class storage {
	/** @type {Object<string,any>} */
	data = {};
	/** @type {string} */
	name = "";
	/**
	 * @param {Object<string,any>} data
	 * @param {string} name
	 */
	constructor(data, name) {
		this.data = data;
		this.name = name;
		document.addEventListener("beforeunload", (e) => {
			if (
				localStorage.getItem(this.name) ??
				"{}" !== JSON.stringify(this.data)
			) {
				e.preventDefault();
				this.upload();
			}
		});
	}
	/**
	 * set value
	 * @template T
	 * @param {string} key
	 * @param {T} value
	 * @returns {T}
	 */
	set(key, value) {
		return (this.data[key] = value);
	}
	/**
	 * get value
	 * @template T
	 * @param {string} key
	 * @param {T} _default
	 * @returns {T}
	 */
	get(key, _default) {
		return this.data[key] ?? _default;
	}
	upload() {
		localStorage.setItem(this.name, JSON.stringify(this.data));
	}
	download() {
		this.data = JSON.parse(localStorage.getItem(this.name) ?? "{}");
	}
}
/** @type {memory_node} */
const FIRST_THOUGHT = new memory_node(1, [1, 2], 8, [100, 100], []),
	CURIOUS_THOUGHT = new memory_node(1, [0], 9, [100, 100], []),
	SLEEP_THOUGHT = new memory_node(1, [0], 7, [100, 100], []);
/** @type {storage} */
const store = new storage({}, "state-data");
const state = store.get("state", {
	/** @type {float} */
	dopamine: 0.5,
	/**
	 * @type {memory_node[]}
	 */
	memory: [FIRST_THOUGHT, CURIOUS_THOUGHT, SLEEP_THOUGHT],
	/** @type {float} */
	short_urge: 0.9,
	/** @type {float} */
	long_urge: 0.5,
	/** @type {float} */
	urgency: 1,
	/**@type {int} */
	x: 100,
	/**@type {int} */
	y: 100,
	/** @type {memory_node} */
	current_thought: FIRST_THOUGHT,
	/** @type {string[][]} */
	action: [
		["recall_memory", "walk"],
		["run"],
		["make_action"],
		["talk"],
		["make_memory"],
		["draw"],
		["erase"],
		["sleep"],
		["recall_memory", "walk", "draw", "think_action"],
		["curious_point", "walk"],
		["nearest_point", "walk"],
		["recall_memory", "think_action"],
		["make_action", "think_action"],
		["recall_memory", "walk", "eat"],
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
		"nearest_point",
		"curious_point",
		"think_action",
		"eat",
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
		nearest_point: 1,
		curious_point: 1,
		think_action: 1,
		eat: 1,
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
	max_sleep: 90,
	/** @type {int} */
	min_sleep: 20,
	/**@type {int} */
	energy: 100000,
	/** @type {float} */
	previous_dopamine: 0,
	/** @type {[int, int, int, int, int, int, int, int, int, int, int, int, int, int, int, int, int, int, int, int, int, int, int, int]} */
	memory_direction: [
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	],
	/** @type {int} */
	old_x: 0,
	/** @type {int} */
	old_y: 0,
	/** @type {int} */
	momentum_energy: 90000,
	/** @type {int} */
	cognitive_energy: 10000,
	// TODO: MOOD
});
const isolation_state = func.copy_obj(state);
// TODO: ISOLATION STATUS CACULATIONS & UPDATES
const global_state = {
	action_use: {
		recall_memory: 0,
		walk: 0,
		run: 0,
		make_action: 0,
		talk: 0,
		make_memory: 0,
		draw: 0,
		erase: 0,
		sleep: 0,
		nearest_point: 0,
		curious_point: 0,
		think_action: 0,
		eat: 0,
	},
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
		nearest_point: 0.5,
		curious_point: 0.5,
		think_action: 0.5,
		eat: 0,
	},
	patient_factor: 1.2,
};
/** @type {cache<float>} */
const action_weigh_cache = new cache(0);
/**
 * @param {string} act
 * @returns {float}
 */
function action_weigh(act) {
	if (_cache.ok) {
		return action_weigh_cache.get();
	}
	state.current_thought.update_weigh();
	/**
	 * @type {expandable_iter<memory_node>}
	 */
	const iter = new expandable_iter([state.current_thought]),
		/**@type {Object<string,float>} */
		list = {};
	/** @type {int} */
	let point = state.current_thought.related.length,
		/** @type {int} */
		time = 0,
		/** @type {int} */
		width = 0,
		/** @type {int} */
		tried = 0;
	/** @type {memory_node} */
	let result = state.current_thought;
	for (const node of iter) {
		node.update_weigh();
		iter.add(...node.related.map((v) => state.memory[v]).toReversed());
		width += node.related.length;
		if (state.action[node.actions].includes(act)) {
			result = node;
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
	// reset
	point = result.related.length;
	time = 0;
	width = 0;
	tried = 0;
	/**
	 * @type {expandable_iter<memory_node>}
	 */
	const real_iter = new expandable_iter([result]);
	for (const node of real_iter) {
		node.update_weigh();
		real_iter.add(...node.related.map((v) => state.memory[v]));
		width += node.related.length;
		const w = node.weigh * node.delta_dopamine;
		for (const action of state.action[node.actions]) {
			list[action] =
				(list[action] ?? 0) +
				w * similarity(state.current_thought.related, node.related);
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
	return action_weigh_cache.set(list[act] ?? 0);
}
/** @param {float} energy */
function consume_energy(energy) {
	state.energy -= energy;
	state.momentum_energy -= energy;
	state.cognitive_energy += energy;
}
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
		doing = false;
		return result;
	},
	/**
	 * @param {{x:int,y:int}} param0
	 * @returns {{x:int,y:int}}
	 */
	walk({ x = state.x, y = state.y } = { x: state.x, y: state.y }) {
		state.old_x = state.x;
		state.old_y = state.y;
		destination.dx = Math.min(10, x - state.x);
		destination.dy = Math.min(10, y - state.y);
		destination.step =
			Math.sqrt((x - state.x) ** 2 + (y - state.y) ** 2) / 10;
		if (x === state.x && y === state.y) {
			consume_energy(-global_state.action_energy.walk);
			destination.step = 0;
			doing = false;
		}
		return { x, y };
	},
	/**
	 * @param {{x:int,y:int}} param0
	 */
	run({ x = state.x, y = state.y } = { x: state.x, y: state.y }) {
		state.old_x = state.x;
		state.old_y = state.y;
		destination.dx = Math.min(30, x - state.x);
		destination.dy = Math.min(30, y - state.y);
		destination.step =
			Math.sqrt((x - state.x) ** 2 + (y - state.y) ** 2) / 30;
		if (x === state.x && y === state.y) {
			consume_energy(-global_state.action_energy.run);
			destination.step = 0;
			doing = false;
		}
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
		/** @type {int} */
		let point = state.current_thought.related.length,
			/** @type {int} */
			time = 0,
			/** @type {int} */
			width = 0,
			/** @type {int} */
			tried = 0;
		for (const node of iter) {
			node.update_weigh();
			iter.add(...node.related.map((v) => state.memory[v]));
			width += node.related.length;
			const w = node.weigh * node.delta_dopamine;
			for (const action of state.action[node.actions]) {
				list[action] =
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
				Object.entries(list).sort(([, a], [, b]) => a - b)
			);
		for (
			let i = Math.floor(Math.random() * state.max_depth ** 2) + 1;
			i > 0;
			i--
		) {
			const temp = sorted.pop();
			if (temp) {
				action.push(temp[0]);
			} else {
				break;
			}
		}
		/** @type {int} */
		let id = 0;
		for (const act of state.action) {
			if (array_equal(act, action)) {
				doing = false;
				return id;
			}
			id++;
		}
		state.action.push(action);
		doing = false;
		return state.action.length - 1;
	},
	/**
	 * @param  {{message: any[]}} param0
	 */
	talk({ message } = { message: [] }) {
		blackboard.innerText += message.join(". ");
		doing = false;
	},
	make_memory() {
		state.current_thought.update_weigh();
		state.memory_direction[
			Math.min(
				Math.floor(
					(Math.atan2(state.old_y - state.y, state.old_x - state.x) *
						12) /
						Math.PI
				) + 12,
				23
			)
		]++;
		if (_cache.ok) {
			state.current_thought.weigh += state.general_weigh;
			doing = false;
			return;
		}
		/** @type {memory_node} */
		const now_memory = new memory_node(
			state.general_weigh,
			[state.memory.indexOf(state.current_thought)],
			derive_action(state.action[state.current_thought.actions]),
			[state.x, state.y],
			nearby()
		);
		state.current_thought.related.push(state.memory.length);
		/** @type {float} */
		let max_sim = 0,
			/** @type {int} */
			max_id = 0;
		/** @type {int} */
		let id = 0;
		for (const node of state.memory) {
			const ori_sim = similarity(
					node.related,
					state.memory[node.most_likely].related
				),
				now_sim = similarity(node.related, now_memory.related);
			if (ori_sim < now_sim) {
				node.most_likely = state.memory.length;
			}
			if (max_sim < now_sim) {
				max_sim = now_sim;
				max_id = id;
			}
			id++;
		}
		now_memory.most_likely = max_id;
		state.memory.push(now_memory);
		state.current_thought = now_memory;
		doing = false;
	},
	/**
	 * @param {{x: int, y: int}} param0
	 */
	draw({ x = state.x, y = state.y } = { x: state.x, y: state.y }) {
		if (element_from_point({ x, y }, true).length) {
			consume_energy(-global_state.action_energy.draw);
			doing = false;
			return;
		}
		_cache.unset();
		const pixel = $$("div");
		pixel.classList.add("pixel");
		pixel.style.backgroundColor = "black";
		pixel.style.left = `${x}px`;
		pixel.style.top = `${y}px`;
		body.appendChild(pixel);
		doing = false;
	},
	/**
	 * @param {{x: int, y: int}} param0
	 */
	erase({ x = state.x, y = state.y } = { x: state.x, y: state.y }) {
		const temp = element_from_point({ x, y }, true);
		if (temp.length === 0) {
			consume_energy(-global_state.action_energy.erase);
			doing = false;
			return;
		}
		_cache.unset();
		for (const element of temp) {
			element.remove();
			elements.splice(elements.indexOf(element), 1);
		}
		doing = false;
	},
	sleep() {
		state.sleep += state.cognitive_energy + 10;
	},
	/** @returns {{x:float,y:float}} */
	nearest_point() {
		const temp = nearby();
		const el = temp[1] ??
			temp[0] ?? { style: { left: `${state.x}`, top: `${state.y}` } };
		doing = false;
		return { x: parseFloat(el.style.left), y: parseFloat(el.style.top) };
	},
	/** @returns {{x:float,y:float}} */
	curious_point() {
		let min = Infinity,
			min_index = 0,
			index = 0;
		for (const direction of state.memory_direction) {
			if (min > direction) {
				min = direction;
				min_index = index;
			}
			index++;
		}
		for (const point of nearby()) {
			if (
				Math.floor(
					(Math.atan2(
						parseFloat(point.style.top) - state.y,
						parseFloat(point.style.left) - state.x
					) *
						12) /
						Math.PI
				) === min_index
			) {
				doing = false;
				return {
					x: parseFloat(point.style.left),
					y: parseFloat(point.style.top),
				};
			}
		}
		doing = false;
		return { x: state.x, y: state.y };
	},
	think_action() {
		state.current_thought.update_weigh();
		action_iter.add(
			.../** @type {(keyof typeof actions)[]} */ (
				state.action[state.current_thought.actions]
			)
		);
		old.memory_nodes.push(state.current_thought);
		doing = false;
	},
	eat() {
		const result = nearby("food");
		if (result.length) {
			state.energy += 10;
			result[0].remove();
			_cache.unset();
		}
		doing = false;
	},
};
/** @type {expandable_iter<keyof actions>} */
const action_iter = new expandable_iter([]);
/** @type {HTMLElement[]} */
const elements = [];
/** @type {{dx: int, dy: int, step: int}} */
const destination = { dx: 0, dy: 0, step: 0 };
/**
 * @type {cache<{element: HTMLElement[],last_class_name: string}>}
 */
const _cache = new cache({
	element: [],
	last_class_name: "",
});
/**
 * @param {string} class_name
 * @returns {HTMLElement[]}
 */
function nearby(class_name = "pixel") {
	/** @type {HTMLElement[]} */
	const result = [];
	if (class_name !== _cache.data.last_class_name) {
		_cache.unset();
		_cache.data.last_class_name = class_name;
	}
	if (_cache.ok) {
		return _cache.data.element;
	}
	if (elements.length < (state.site * 2) ** 2) {
		for (const element of elements) {
			if (distance(element) < state.site) {
				result.push(element);
			}
		}
	} else {
		const pos = { x: state.x, y: state.y };
		for (let x = -state.site; x <= state.site; x++) {
			for (let y = -state.site; y <= state.site; y++) {
				result.push(
					...element_from_point(
						{ x: pos.x + x, y: pos.y + y },
						false,
						class_name
					)
				);
			}
		}
	}
	_cache.set(result, ["element"]);
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
 * @returns {int}
 */
function derive_action(action_data) {
	/** @type {string[]} */
	const result = [];
	/** @type {Object<string,int>} */
	const temp = {};
	for (const [key, value] of Object.entries(state.action_weigh)) {
		temp[key] = action_data.includes(key) ? value : 2 * value; // 好奇心模式
		// 這自然會因為記憶數量變多->重複動作權重變大，而變成習慣模式
	}
	/** @type {[string,float][]} */
	const action_w = Object.entries(temp).sort(([, a], [, b]) => b - a);
	for (
		let i = Math.floor(Math.random() * state.max_depth ** 2) + 1;
		i > 0;
		i--
	) {
		if (action_w.length <= i) {
			break;
		}
		result.push(action_w[i][0]);
	}
	/** @type {int} */
	let id = 0;
	for (const action of state.action) {
		if (array_equal(action, result)) {
			break;
		}
		id++;
	}
	if (id === state.action.length) {
		state.action.push(result);
	}
	return id;
}
/**
 * Caculate the similarity
 * @param {int[]} nodes1
 * @param {int[]} nodes2
 * @returns {float}
 */
function similarity(nodes1, nodes2) {
	/** @type {int} */
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
	/** @type {[int,int][]} */
	consume_draw: [],
	/** @type {[int,int][]} */
	consume_erase: [],
	/** @type {[int,int][]} */
	consume_food: [],
};
/** @type {string} */
let prev = "click";
$("#pen")?.addEventListener("click", () => {
	cursor_state.mode = prev = "pen";
});
$("#eraser")?.addEventListener("click", () => {
	cursor_state.mode = prev = "eraser";
});
$("#dump-all")?.addEventListener("click", () => {
	cursor_state.mode = prev = "click";
	elements.map((v) => {
		v.remove();
	});
	elements.length = 0;
	_cache.unset();
});
$("#toolbar")?.addEventListener("mouseenter", () => {
	cursor_state.mode = "click";
});
$("#toolbar")?.addEventListener("mouseleave", () => {
	cursor_state.mode = prev;
});
/** @type {{content: string, is_ok: boolean}[]} */
const todo_list = store.get("todo-list", [
	{ content: "Teach him to speak in a language", is_ok: false },
	{ content: "Teach him to draw", is_ok: false },
]);
$("#todo")?.addEventListener("click", () => {
	const filter = $$("div");
	filter.id = "filter";
	filter.addEventListener("click", (e) => {
		if (e.target === filter) {
			filter.remove();
		}
	});
	const todo = $$("div");
	todo.classList.add("todo");
	filter.appendChild(todo);
	const title = $$("h1");
	title.style.fontWeight = "bold";
	title.setHTMLUnsafe("Todo List");
	todo.appendChild(title);
	todo.append($$("hr"));
	const list = $$("div");
	list.classList.add("todo-list");
	const update = () => {
		list.innerHTML = "";
		/** @type {int} */
		let index = 0;
		for (const { content, is_ok } of todo_list) {
			/** @type {int} */
			const c_index = index;
			const list_item = $$("div");
			list_item.classList.add("todo-item");
			list_item.addEventListener("click", () => {
				todo_list.splice(c_index, 1);
				store.set("todo-list", todo_list);
				update();
			});
			const item = $$("div");
			item.classList.add("todo-item-content");
			item.setHTMLUnsafe(content);
			list_item.appendChild(item);
			const tick = $$("input");
			tick.type = "checkbox";
			if (is_ok) {
				tick.checked = true;
			}
			tick.addEventListener("change", () => {
				todo_list[c_index] = {
					content,
					is_ok: tick.checked,
				};
				store.set("todo-list", todo_list);
			});
			list_item.appendChild(tick);
			list.appendChild(list_item);
			index++;
		}
	};
	update();
	todo.appendChild(list);
	const input = $$("input");
	input.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			todo_list.push({ content: input.value, is_ok: false });
			store.set("todo-list", todo_list);
			input.value = "";
			update();
		}
	});
	todo.appendChild(input);
	body.appendChild(filter);
});
$("#food")?.addEventListener("click", () => {
	cursor_state.mode = prev = "food";
});
/** @type {boolean} */
let mousedown = false;
document.addEventListener("mousedown", (e) => {
	if (mousedown || cursor_state.mode === "click") {
		return;
	}
	/** @type {[int,int][]} */
	let _do;
	switch (cursor_state.mode) {
		case "pen":
			_do = cursor_state.consume_draw;
			break;
		case "eraser":
			_do = cursor_state.consume_erase;
			break;
		case "food":
			_do = cursor_state.consume_food;
			break;
		default:
			_do = [];
			break;
	}
	_do?.push([(cursor_state.x = e.clientX), (cursor_state.y = e.clientY)]);
	mousedown = true;
});
document.addEventListener("mousemove", (e) => {
	if (!mousedown) {
		return;
	}
	/** @type {[int,int][]} */
	let _do;
	switch (cursor_state.mode) {
		case "pen":
			_do = cursor_state.consume_draw;
			break;
		case "eraser":
			_do = cursor_state.consume_erase;
			break;
		default:
			_do = [];
			break;
	}
	_do?.push([(cursor_state.x = e.clientX), (cursor_state.y = e.clientY)]);
});
document.addEventListener("mouseup", () => {
	if (!mousedown || cursor_state.mode === "click") {
		return;
	}
	mousedown = false;
});
document.addEventListener("contextmenu", (e) => {
	e.preventDefault();
});
/**
 *
 * @param {{x: int,y: int}} param0
 * @param {boolean} inaccurate
 * @param {string} class_name
 * @returns {HTMLElement[]}
 */
function element_from_point(
	{ x, y },
	inaccurate = false,
	class_name = "pixel"
) {
	const result = inaccurate
		? [
				...document.elementsFromPoint(x, y),
				...document.elementsFromPoint(x + 1, y),
				...document.elementsFromPoint(x, y + 1),
				...document.elementsFromPoint(x + 1, y + 1),
			]
		: document.elementsFromPoint(x, y);
	// @ts-ignore
	return result.filter((el) => el.classList.contains(class_name));
}
/** @returns {float} */
function caculate_dopamine() {
	state.dopamine += state.energy / MAX_ENERGY; // 越飽就越高興
	state.dopamine += state.momentum_energy;
	state.dopamine -= state.cognitive_energy; // 越睏越煩燥
	state.dopamine /= state.urgency; // 越着急就越難受
	isolation_state.dopamine += isolation_state.energy / MAX_ENERGY; // 越飽就越高興
	isolation_state.dopamine += isolation_state.momentum_energy;
	isolation_state.dopamine -= isolation_state.cognitive_energy; // 越睏越煩燥
	isolation_state.dopamine /= isolation_state.urgency; // 越着急就越難受
	return (state.dopamine + isolation_state.dopamine) / 2;
}
/**
 * @template T
 * @param {T[]} a
 * @param {T[]} b
 * @returns {boolean}
 */
function array_equal(a, b) {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}
spirit.style.left = `${state.x}px`;
spirit.style.top = `${state.y}px`;
/** @type {any} */
let res = undefined;
/** @type {boolean} */
let doing = false;
const old = {
	/** @type {string} */
	action: "",
	/** @type {memory_node[]} */
	executing_memory_node: [FIRST_THOUGHT],
	/** @type {memory_node} */
	last_memory: FIRST_THOUGHT,
	/** @type {memory_node[]} */
	memory_nodes: [],
	/** @type {int[]} */
	act_len_left: [],
	/** @type {int} */
	last_act: state.action[FIRST_THOUGHT.actions].length,
};
/**
 * main loop
 * @returns null
 */
function spirit_main() {
	state.current_thought.update_delta_dopamine(
		-(
			state.previous_dopamine -
			(state.previous_dopamine = caculate_dopamine())
		)
	);
	// walk
	if (destination.step > 0) {
		if (!doing) {
			destination.step = 0;
		}
		destination.step--;
		_cache.unset();
		spirit.style.left = `${(state.x += destination.dx)}px`;
		spirit.style.top = `${(state.y += destination.dy)}px`;
	} else {
		doing = false;
	}
	// fall asleep
	if (state.min_sleep > state.momentum_energy) {
		doing = true;
		actions.sleep();
	}
	if (state.sleep) {
		/** @type {int} */
		const sleep_amount = state.sleep;
		state.sleep = 0;
		/** @type {int} */
		const timeout = setTimeout(() => {
			status_board.setHTMLUnsafe("Awake!");
			doing = false;
			requestAnimationFrame(spirit_main);
		}, sleep_amount * MILLISECOND);
		/** @type {int} */
		const sleep = setInterval(() => {
			state.momentum_energy++;
			state.cognitive_energy--;
			// TODO: DREAM
			if (!doing) {
				clearTimeout(timeout);
				clearInterval(sleep);
				requestAnimationFrame(spirit_main);
			}
		}, MILLISECOND);
		status_board.setHTMLUnsafe("Sleeping...");
		return;
	}
	// too much energy
	if (
		state.momentum_energy > 90000 ||
		state.energy < 20000 ||
		state.energy > 90000
	) {
		doing = true;
		actions.think_action();
	}
	if (
		action_weigh(action_iter.iterable[0]) >
		action_weigh(old.action) * global_state.patient_factor
	) {
		doing = false;
		old.last_memory.urgency *=
			state.action[old.last_memory.actions].length / old.last_act;
		state.urgency *= old.last_memory.urgency;
		old.act_len_left.push(old.last_act);
		old.executing_memory_node.push(old.last_memory);
		old.last_memory = old.memory_nodes.splice(0, 1)[0];
		old.last_act = state.action[old.last_memory.actions].length;
	}
	// execute action
	if (!doing) {
		old.last_act--;
		/** @type {boolean} */
		let tried = false;
		doing = true;
		for (const act of action_iter) {
			//@ts-ignore
			res = actions[act](res);
			tried = true;
			consume_energy(global_state.action_energy[act]);
			old.action = act;
			break;
		}
		// make new action
		if (!tried) {
			/** @type {string[]} */
			const temp = state.action[state.current_thought.actions];
			temp.push(
				state.available_action[
					Math.floor(Math.random() * state.available_action.length)
				]
			);
			/** @type {int} */
			let index = 0;
			for (const action of state.action) {
				if (array_equal(action, temp)) {
					state.current_thought.actions = index;
					index = -1;
					break;
				}
				index++;
			}
			if (index >= 0) {
				state.current_thought.actions = state.action.length;
				state.action.push(temp);
			}
			doing = false;
		}
		if (!_cache.ok) {
			actions.make_memory();
		}
		if (old.last_act === 0) {
			state.urgency /= old.last_memory.urgency;
			old.last_memory.urgency = 1;
			if (old.act_len_left.length === 0) {
				old.last_memory = old.memory_nodes.splice(0, 1)[0];
				old.last_act = state.action[old.last_memory.actions].length;
				old.act_len_left.push(old.last_act);
				old.executing_memory_node.push(old.last_memory);
			} else {
				old.last_memory = /** @type {memory_node}*/ (
					old.executing_memory_node.pop()
				);
				old.last_act = /** @type {int}*/ (old.act_len_left.pop());
			}
		}
	}
	requestAnimationFrame(spirit_main);
}
actions.think_action();
requestAnimationFrame(spirit_main);
/**
 * render main
 */
function render_main() {
	// draw point
	if (cursor_state.consume_draw.length) {
		const [x, y] = /** @type {[int,int]}*/ (
			cursor_state.consume_draw.pop()
		);
		if (!element_from_point({ x, y }).length) {
			const pixel = $$("div");
			pixel.classList.add("pixel");
			pixel.style.backgroundColor = "black";
			pixel.style.left = `${x}px`;
			pixel.style.top = `${y}px`;
			body.appendChild(pixel);
			elements.push(pixel);
			_cache.unset();
		}
	}
	if (cursor_state.consume_erase.length) {
		const [x, y] = /** @type {[int,int]}*/ (
			cursor_state.consume_erase.pop()
		);
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
	}
	if (cursor_state.consume_food.length) {
		const [x, y] = /** @type {[int,int]}*/ (
			cursor_state.consume_food.pop()
		);
		if (!element_from_point({ x, y }, false, "food").length) {
			const pixel = $$("div");
			pixel.classList.add("food");
			pixel.style.backgroundColor = "orange";
			pixel.style.left = `${x}px`;
			pixel.style.top = `${y}px`;
			body.appendChild(pixel);
			_cache.unset();
		}
	}
	requestAnimationFrame(render_main);
}
requestAnimationFrame(render_main);
