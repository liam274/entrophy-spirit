/**
 * @typedef {number} int
 * @typedef {number} float
 */

import { between, random_bit, random_float, zip } from "./lib.js";

/**
 * @param {int} num
 * @param {boolean} condition
 * @returns {int}
 */
function condition_reverse(num, condition) {
	if (condition) {
		return -num;
	}
	return num;
}
/**
 * @template t
 * @param {t} arg
 * @returns {t}
 */
export function useless(arg) {
	return arg;
}

export const { floor, min } = Math;

const CONFIG = {
	max_threshold: 30,
	max_super_golgi: 0.5,
	inhibitory_chance: 0.7,
	hundred: 100,
	half: 0.5,
	twice: 2,
	max_habitat_rate: 0.8,
	least_habitat_rate: 0.2,
	initial_weigh: 2,
};

// #意圖
// 神經元分為零敏型和壹敏型：
// 1. 零敏型在接收到較多的零時會將生產零的高爾基體轉化為生產壹的高爾基體，反亦言之
// 2. 反亦言之
// 神經元又分為零降解型和壹降解型
// 零降解型在神經元判別零多還是壹多之前，會率先對零進行降解
// 反亦言之
export class neuron {
	/** @type {boolean} */
	sensitivity = false;
	/** @type {boolean} */
	digestion = false;
	/** @type {int} */
	zero_store = 0;
	/** @type {int} */
	one_store = 0;
	/** @type {int} */
	zero_golgi = 0;
	/** @type {int} */
	one_golgi = 0;
	/** @type {int} */
	super_golgi_zero = 0;
	/** @type {int} */
	super_golgi_one = 0;
	/** @type {neuron[]} */
	next = [];
	/** @type {Function} */
	handler = useless;
	/** @type {Function} */
	send_handler = useless;
	/** @type {int[]} */
	extra = [];
	/** @type {int} */
	minium = floor(CONFIG.max_threshold * random_float());
	/** @type {int} */
	max_super_golgi = CONFIG.max_super_golgi;
	/** @type {int} */
	connected = 0;
	/** @type {int} */
	sent = 0;
	/** @type {boolean} */
	inhibitory = random_float() >= CONFIG.inhibitory_chance;
	/** @type {{total:int,actual:int}} */
	doing = {
		total: 0,
		actual: 0,
	};
	/** @type {int} */
	fake_antibodies = 0;
	/** @type {Function[]} */
	variants = [];
	/** @type {int} */
	habitat_rate = 0;
	/** @type {int[]} */
	weigh = [];
	/**
	 * @param {boolean} sensitivity - sensitive to zero or one
	 * @param {boolean} digestion - digest zero or one
	 * @param {int} maxes
	 * @param {Function} handler
	 * @param {Function} send_handler
	 * @param {int} least
	 * @param {int} max
	 * @param {int} connected
	 */
	constructor(
		sensitivity,
		digestion,
		maxes,
		handler = useless,
		send_handler = useless,
		least = 0,
		max = 1,
		connected
	) {
		this.sensitivity = sensitivity;
		this.digestion = digestion;
		this.zero_golgi = maxes;
		this.one_golgi = maxes;
		this.handler = handler;
		this.send_handler = send_handler;
		/** @type {int} */
		this.digest_ability =
			least + floor((CONFIG.hundred - least) * max * random_float());
		this.connected = connected;
	}
	init() {
		this.super_golgi_zero = floor(
			this.zero_golgi * this.max_super_golgi * random_float()
		);
		this.super_golgi_one = floor(
			this.one_golgi * this.max_super_golgi * random_float()
		);
		this.weigh = new Array(this.next.length).fill(CONFIG.initial_weigh);
	}
	/** @type {boolean[]} */
	temp = [];
	/**
	 * @param {boolean} num
	 * @returns {int}
	 */
	receive(num) {
		if (this.fake_antibodies-- > 0) {
			return 0;
		}
		this.temp.push(num);
		if (num) {
			this.one_store++;
		} else {
			this.zero_store++;
		}
		this.sent++;
		return 1;
	}
	do_receive() {
		// 機制:
		// 過多的神經遞質會與另一種神經遞質發生反應，相互結合
		if (this.one_store > this.zero_store) {
			this.zero_store *= 0.9;
			this.one_store *= 0.99;
		} else {
			this.zero_store *= 0.99;
			this.one_store *= 0.9;
		}
		if (this.digestion) {
			this.one_store -= Math.min(this.digest_ability, this.one_store);
		} else {
			this.zero_store -= Math.min(this.digest_ability, this.zero_store);
		}
		if (
			condition_reverse(
				this.zero_store - this.one_store,
				this.digestion
			) > this.digest_ability
		) {
			this.sensitivity = !this.sensitivity;
		}
		if (this.zero_store < this.one_store === this.sensitivity) {
			if (this.zero_golgi > 0) {
				this.one_golgi++;
				this.zero_golgi--;
			}
			if (this.super_golgi_zero > 0) {
				this.super_golgi_one++;
				this.super_golgi_zero--;
			}
		} else {
			if (this.one_golgi > 0) {
				this.zero_golgi++;
				this.one_golgi--;
			}
			if (this.super_golgi_one > 0) {
				this.super_golgi_zero++;
				this.super_golgi_one--;
			}
		}
		this.zero_store += this.super_golgi_zero;
		this.one_store += this.super_golgi_one;
	}
	put() {
		let zero = this.zero_golgi;
		let one = this.one_golgi;
		let max_active = -Infinity,
			min_active = Infinity;
		let max_ind = 0,
			min_ind = 0,
			ind = 0;
		for (const [neu, time] of zip(this.next, this.weigh)) {
			let too_active = 0;
			for (let i = time; i > 0; i--) {
				if (random_bit()) {
					if (zero-- > 0) {
						too_active += neu.receive(
							this.send_handler(false, this)
						);
					} else if (one-- > 0) {
						too_active += neu.receive(
							this.send_handler(true, this)
						);
					} else {
						return;
					}
				} else {
					if (one-- > 0) {
						too_active += neu.receive(
							this.send_handler(true, this)
						);
					} else if (zero-- > 0) {
						too_active += neu.receive(
							this.send_handler(false, this)
						);
					} else {
						return;
					}
				}
			}
			if (too_active > max_active) {
				max_active = too_active;
				max_ind = ind;
			}
			if (too_active < min_active) {
				min_active = too_active;
				min_ind = ind;
			}
			ind++;
		}
		this.weigh[max_ind]--; // weigh re-put
		this.weigh[min_ind]++;
	}
	/**
	 * @returns {boolean}
	 */
	update() {
		this.habitat_rate = /** @type {int}*/ (this.sent / this.connected);
		this.sent = 0;
		this.doing.total++;
		this.do_receive();
		for (const func of this.variants) {
			func(this);
		}
		if (
			!between(
				this.one_store / min(this.zero_store, 1),
				CONFIG.half,
				CONFIG.twice
			)
		) {
			this.fake_antibodies += 3;
		}
		if (this.handler(this.temp, this) === false) {
			this.temp.length = 0;
			return false;
		}
		if (this.minium > this.zero_store + this.one_store) {
			this.temp.length = 0;
			return false;
		}
		const habitat_rate = this.doing.actual / this.doing.total;
		if (habitat_rate > CONFIG.max_habitat_rate) {
			this.inhibitory = true;
		} else if (habitat_rate < CONFIG.least_habitat_rate) {
			this.inhibitory = false;
		}
		if (this.inhibitory && this.habitat_rate >= CONFIG.max_habitat_rate) {
			this.temp.length = 0;
			return false;
		}
		this.doing.actual++;
		this.put();
		this.temp.length = 0;
		return true;
	}
}
