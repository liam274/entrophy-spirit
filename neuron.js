/* eslint-disable no-magic-numbers */
/**
 * @typedef {number} int
 * @typedef {number} float
 */
/**
 * @param {int} num
 * @param {boolean} condition
 */
function abs(num, condition) {
	if (condition) {
		return Math.abs(num);
	}
	return num;
}
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
		while (this.temp.length) {
			this.store[this.temp.pop() ? 1 : 0]++;
		}
		this.store[this.digestion ? 1 : 0] -= Math.min(
			this.digest_ability,
			this.store[this.digestion ? 1 : 0]
		);
		const num = this.digestion === this.store[0] < this.store[1]; // 檢查降解酶的降解類型是否與多的那種神經傳遞物質相同
		if (
			abs(this.store[0] - this.store[1], this.digestion) >
			this.digest_ability
		) {
			this.sensitivity = !this.sensitivity;
		}
		if (num === this.sensitivity && this.golgi[num ? 0 : 1] > 0) {
			this.golgi[num ? 1 : 0]++;
			this.golgi[num ? 0 : 1]--;
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
		this.do_receive();
		this.put();
	}
}
