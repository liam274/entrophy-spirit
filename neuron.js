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

export function useless() {}

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
	digest_ability = Math.floor(100 * Math.random());
	/** @type {[zero_store: int,one_store: int]} */
	store = [0, 0];
	/** @type {[zero_golgi: int,one_golgi: int]} */
	golgi = [0, 0];
	/** @type {neuron[]} */
	next = [];
	/** @type {Function} */
	handler = useless;
	/**
	 * @param {boolean} sensitivity - sensitive to zero or one
	 * @param {boolean} digestion - digest zero or one
	 * @param {int} maxes
	 * @param {Function} handler
	 */
	constructor(sensitivity, digestion, maxes, handler = useless) {
		this.sensitivity = sensitivity;
		this.digestion = digestion;
		this.golgi = [maxes, maxes];
		this.handler = handler;
	}
	/** @type {boolean[]} */
	temp = [];
	/**
	 * @param {boolean} num
	 */
	receive(num) {
		this.temp.push(num);
	}
	do_receive() {
		while (this.temp.length) {
			this.store[this.temp.pop() ? 1 : 0]++;
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
		} else if (this.golgi[1] > 0) {
			this.golgi[0]++;
			this.golgi[1]--;
		}
	}
	put() {
		let [zero, one] = this.golgi;
		for (const neu of this.next) {
			if (Math.random() > 0.5) {
				if (zero-- > 0) {
					neu.receive(false);
				} else if (one-- > 0) {
					neu.receive(true);
				} else {
					return;
				}
			} else {
				if (one-- > 0) {
					neu.receive(true);
				} else if (zero-- > 0) {
					neu.receive(false);
				} else {
					return;
				}
			}
		}
	}
	update() {
		this.handler(this.temp);
		this.do_receive();
		this.put();
	}
}
