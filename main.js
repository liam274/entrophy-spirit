/* eslint-disable no-magic-numbers */
"use strict";
/**
 * @typedef {number} int
 * @typedef {number} float
 */
const $ = document.querySelector.bind(document),
	$$ = document.createElement.bind(document);
const spirit = /** @type {HTMLSpanElement} */ ($("#spirit")),
	blackboard = /**@type {HTMLTextAreaElement} */ ($("#blackboard")),
	{ body } = document;
const MINUTE = 60;
const MILLISECOND = 1000;
const FPS = 60;
const MUST_SLEEP = MILLISECOND / FPS;
const MAX_ENERGY = 200;
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
		this.delta_dopamine =
			this.delta_dopamine_sum / ++this.delta_dopamine_time;
		return this.delta_dopamine;
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
	 * @param {string} key
	 * @param {any} value
	 * @returns {any}
	 */
	set(key, value) {
		return (this.data[key] = value);
	}
	/**
	 * get value
	 * @param {string} key
	 * @param {any} _default
	 * @returns {any}
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
const FIRST_THOUGHT = new memory_node(1, [], 8, [100, 100], []),
	CURIOUS_THOUGHT = new memory_node(1, [], 9, [100, 100], []);
/** @type {storage} */
const store = new storage({}, "state-data");
/** @type {Object<string,any>} */
const state = store.get("state", {
	/** @type {float} */
	dopamine: 0.5,
	/**
	 * @type {memory_node[]}
	 */
	memory: [FIRST_THOUGHT, CURIOUS_THOUGHT],
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
		["recall_memory", "walk", "draw"],
		["nearest_point", "walk"],
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
		for (const act of state.action[this.current_thought.actions]) {
			if (this.available_action.includes(act)) {
				res = actions[act](res);
				tried = true;
				state.energy -=
					this.action_energy[this.available_action.indexOf(act)];
			}
		}
		if (!tried) {
			const temp = state.action[this.current_thought.actions];
			temp.push(
				state.available_action[
					Math.floor(Math.random() * state.available_action.length)
				]
			);
			if (state.action.includes(temp)) {
				this.current_thought.actions = state.action.indexOf(temp);
			} else {
				this.current_thought.actions = state.action.length;
				state.action.push(temp);
			}
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
	/** @type {float} */
	previous_dopamine: 0,
});
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
		destination.dx = (x - state.x) / 100;
		destination.dy = (y - state.y) / 100;
		destination.step = 100;
		return { x, y };
	},
	/**
	 * @param {{x:int,y:int}} param0
	 */
	run({ x = state.x, y = state.y } = { x: state.x, y: state.y }) {
		destination.dx = (x - state.x) / 30;
		destination.dy = (y - state.y) / 30;
		destination.step = 30;
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
			const w = node.weigh * node.delta_dopamine;
			for (const action in state.action[node.actions]) {
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
			decive_action(state.action[state.current_thought.actions]),
			[state.x, state.y],
			nearby()
		);
		state.current_thought.related.push(state.memory.length);
		/** @type {float} */
		let max_sim = 0,
			max_id = 0;
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
	/** @returns {HTMLElement} */
	nearest_point() {
		return nearby()[0];
	},
};
/** @type {HTMLElement[]} */
const elements = [];
const destination = { dx: 0, dy: 0, step: 0 };
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
 * @returns {int}
 */
function decive_action(action_data) {
	/** @type {string[]} */
	const result = [];
	/** @type {Object<string,int>} */
	const temp = {};
	for (const [key, value] of Object.entries(state.action_weigh)) {
		temp[key] = action_data.includes(key) ? value : 2 * value; // 好奇心模式
		// 這自然會因為記憶數量變多->重複動作權重變大，而變成習慣模式
	}
	const action_weigh = Object.entries(temp).sort(([, a], [, b]) => b - a);
	for (let i = Math.floor(Math.random() * state.max_depth) + 1; i > 0; i--) {
		result.push(action_weigh[i][0]);
	}
	let id;
	if (state.action.includes(result)) {
		id = state.action.indexOf(result);
	} else {
		id = state.action.length;
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
	consume_draw: [],
	/** @type {[int,int][]} */
	consume_erase: [],
};
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
	let index = 0;
	for (const { content, is_ok } of todo_list) {
		const list_item = $$("div");
		list_item.classList.add("todo-item");
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
			todo_list[index] = {
				content,
				is_ok: tick.checked,
			};
		});
		list_item.appendChild(tick);
		list.appendChild(list_item);
		index++;
	}
	body.appendChild(filter);
});
let mousedown = false;
document.addEventListener("mousedown", (e) => {
	if (mousedown || cursor_state.mode === "click") {
		return;
	}
	(cursor_state.mode === "pen"
		? cursor_state.consume_draw
		: cursor_state.consume_erase
	).push([(cursor_state.x = e.clientX), (cursor_state.y = e.clientY)]);
	mousedown = true;
});
document.addEventListener("mousemove", (e) => {
	if (!mousedown) {
		return;
	}
	(cursor_state.mode === "pen"
		? cursor_state.consume_draw
		: cursor_state.consume_erase
	).push([(cursor_state.x = e.clientX), (cursor_state.y = e.clientY)]);
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
 * @returns {HTMLElement[]}
 */
function element_from_point({ x, y }) {
	// @ts-ignore
	return (document.elementsFromPoint(x, y) ?? []).filter((el) =>
		el.classList.contains("pixel")
	);
}
/** @returns {float} */
function caculate_dopamine() {
	state.dopamine += state.energy / MAX_ENERGY; // 越飽就越高興
	state.dopamine /= state.urgency; // 越着急就越難受
	return state.dopamine;
}
/**
 * main loop
 * @returns null
 */
function main() {
	state.current_thought.update_delta_dopamine(
		caculate_dopamine() - state.previous_dopamine
	);
	if (destination.step-- > 0) {
		if (destination.dx === 0 && destination.dy === 0) {
			destination.step = 0;
		} else {
			spirit.style.left = `${(state.x += destination.dx)}px`;
			spirit.style.top = `${(state.y += destination.dy)}px`;
		}
	}
	state.execute();
	if (cursor_state.consume_draw.length) {
		const [x, y] = /** @type {[int,int]}*/ (
			cursor_state.consume_draw.pop()
		);
		let a = false;
		for (const element of element_from_point({ x, y })) {
			element.style.backgroundColor = cursor_state.color;
			a = true;
			break;
		}
		if (!a) {
			const pixel = $$("div");
			pixel.classList.add("pixel");
			pixel.style.backgroundColor = cursor_state.color;
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
	const sleep_amount = state.sleep;
	state.sleep = 0;
	setTimeout(
		() => {
			state.energy += sleep_amount;
			requestAnimationFrame(main);
		},
		sleep_amount * MILLISECOND + MUST_SLEEP
	);
}
requestAnimationFrame(main);
