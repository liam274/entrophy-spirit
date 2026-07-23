/* eslint-disable no-magic-numbers */
/**
 * @typedef {number} int
 * @typedef {number} float
 */
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
	golgi = [50, 50];
	/** @type {neuron[]} */
	next = [];
	/**
	 * @param {boolean} sensitivity - sensitive to zero or one
	 * @param {boolean} digestion - digest zero or one
	 */
	constructor(sensitivity, digestion) {
		this.sensitivity = sensitivity;
		this.digestion = digestion;
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
		while (this.temp) {
			this.store[this.temp.pop() ? 1 : 0]++;
		}
		this.store[this.digestion ? 1 : 0] -= this.digest_ability;
		const num = this.digestion === this.store[0] > this.store[1];
		if (num === this.sensitivity) {
			this.golgi[num ? 1 : 0]++;
			this.golgi[num ? 0 : 1]--;
		}
	}
	put() {
		let [zero, one] = this.golgi;
		for (const neu of this.next) {
			if (Math.random() > 0.5 && zero-- > 0) {
				neu.receive(false);
			} else if (one-- > 0) {
				neu.receive(true);
			} else {
				return;
			}
		}
	}
	update() {
		this.do_receive();
		this.put();
		this.update();
	}
}
