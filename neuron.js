/* eslint-disable no-magic-numbers */
/**
 * @typedef {number} int
 * @typedef {number} float
 */
/**
 * @param {int} num
 * @param {boolean} condition
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

export const { random, floor } = Math;

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
	/** @type {[zero_store: int,one_store: int]} */
	store = [0, 0];
	/** @type {[zero_golgi: int,one_golgi: int]} */
	golgi = [0, 0];
	/** @type {[zero_golgi: int,one_golgi: int]} */
	super_golgi = [0, 0];
	/** @type {neuron[]} */
	next = [];
	/** @type {Function} */
	handler = useless;
	/** @type {Function} */
	send_handler = useless;
	/** @type {int[]} */
	extra = [];
	/** @type {int} */
	minium = floor(30 * random());
	/** @type {int} */
	max_super_golgi = 0.5;
	/**
	 * @param {boolean} sensitivity - sensitive to zero or one
	 * @param {boolean} digestion - digest zero or one
	 * @param {int} maxes
	 * @param {Function} handler
	 * @param {Function} send_handler
	 * @param {int} least
	 * @param {int} max
	 */
	constructor(
		sensitivity,
		digestion,
		maxes,
		handler = useless,
		send_handler = useless,
		least = 0,
		max = 1
	) {
		this.sensitivity = sensitivity;
		this.digestion = digestion;
		this.golgi = [maxes, maxes];
		this.handler = handler;
		this.send_handler = send_handler;
		/** @type {int} */
		this.digest_ability = least + floor((100 - least) * max * random());
	}
	init() {
		this.super_golgi = [
			floor(this.golgi[0] * this.max_super_golgi * random()),
			floor(this.golgi[1] * this.max_super_golgi * random()),
		];
	}
	/** @type {boolean[]} */
	temp = [];
	/**
	 * @param {boolean} num
	 */
	receive(num) {
		this.temp.push(num);
		this.store[num ? 1 : 0]++;
	}
	do_receive() {
		// 機制:
		// 過多的神經遞質會與另一種神經遞質發生反應，相互結合
		if (this.store[0] > this.store[1]) {
			this.store[0] *= 0.9;
			this.store[1] *= 0.99;
		} else {
			this.store[0] *= 0.99;
			this.store[1] *= 0.9;
		}
		this.store[this.digestion ? 1 : 0] -= Math.min(
			this.digest_ability,
			this.store[this.digestion ? 1 : 0]
		);
		if (
			condition_reverse(this.store[0] - this.store[1], this.digestion) >
			this.digest_ability
		) {
			this.sensitivity = !this.sensitivity;
		}
		if (this.store[0] < this.store[1] === this.sensitivity) {
			if (this.golgi[0] > 0) {
				this.golgi[1]++;
				this.golgi[0]--;
			}
			if (this.super_golgi[0] > 0) {
				this.super_golgi[1]++;
				this.super_golgi[0]--;
			}
		} else {
			if (this.golgi[1] > 0) {
				this.golgi[0]++;
				this.golgi[1]--;
			}
			if (this.super_golgi[1] > 0) {
				this.super_golgi[0]++;
				this.super_golgi[1]--;
			}
		}
		this.store[0] += this.super_golgi[0];
		this.store[1] += this.super_golgi[1];
	}
	put() {
		let [zero, one] = this.golgi;
		for (const neu of this.next) {
			if (random() > 0.5) {
				if (zero-- > 0) {
					neu.receive(this.send_handler(false, this));
				} else if (one-- > 0) {
					neu.receive(this.send_handler(true, this));
				} else {
					return;
				}
			} else {
				if (one-- > 0) {
					neu.receive(this.send_handler(true, this));
				} else if (zero-- > 0) {
					neu.receive(this.send_handler(false, this));
				} else {
					return;
				}
			}
		}
	}
	update() {
		this.do_receive();
		if (this.handler(this.temp, this) === false) {
			return;
		}
		if (this.minium > this.store[0] + this.store[1]) {
			return;
		}
		this.put();
		this.temp.length = 0;
	}
}
