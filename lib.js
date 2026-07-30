/* eslint-disable no-magic-numbers */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Buffer } from "buffer";

/**
 * @typedef {number} int
 * @typedef {number} float
 */

export const { warn, error, log } = console;

const CONFIG = {
	half_dig: 0x8000,
	half_switch: 0x10000,
	twice: 2,
	eight: 8,
	frequency: 16000,
	double_frequency: 32000,
	twotwenty: 1 << 20,
};

const CHUNK_SIZE = 2500;
export class Audio {
	/** @type {boolean[]} */
	micBuffer = [];
	/** @type {int} */
	cursor = 0;
	/** @type {Buffer | null} */
	fileBuffer = null;
	/** @type {boolean} */
	fileLoaded = false;
	/** @type {boolean} */
	is_microphone = true;
	/**
	 * @param {boolean} is_microphone
	 * @param {string} [TARGET_FILE]
	 */
	constructor(is_microphone, TARGET_FILE = "") {
		this.is_microphone = is_microphone;
		if (is_microphone) {
			const microphone = require("node-microphone");
			const mic = new microphone({
				rate: "16000",
				channels: "1",
				fileType: "raw",
			});
			const micStream = mic.startRecording();

			/** @type {int} */
			const MAX_BUFFER_LENGTH = 16000;

			micStream?.on("data", (chunk) => {
				for (let i = 0; i < chunk.length; i += CONFIG.twice) {
					let sample = chunk[i] | (chunk[i + 1] << CONFIG.eight);
					if (sample >= CONFIG.half_dig) {
						sample -= CONFIG.half_switch;
					}
					this.micBuffer.push(sample > 0);
				}
				if (this.micBuffer.length > MAX_BUFFER_LENGTH) {
					this.micBuffer.splice(
						0,
						this.micBuffer.length - MAX_BUFFER_LENGTH
					);
				}
			});
		} else {
			const __dirname = dirname(fileURLToPath(import.meta.url));
			try {
				this.fileBuffer = readFileSync(join(__dirname, TARGET_FILE));
				if (this.fileBuffer.length & 1) {
					// @ts-ignore
					this.fileBuffer.length--;
				} else if (this.fileBuffer.length === 0) {
					warn("⚠️ 文件為空，填充隨機噪聲");
					this.fileBuffer = Buffer.alloc(CONFIG.double_frequency);
					for (
						let i = 0;
						i < this.fileBuffer.length;
						i += CONFIG.twice
					) {
						this.fileBuffer.writeInt16LE(
							(random_bit() << 1) - 1,
							i
						);
					}
				}
				this.fileLoaded = true;
				const durationSec = (
					this.fileBuffer.length / CONFIG.double_frequency
				).toFixed(1); // 16kHz * 2字節 = 32000 字節/秒
				warn(
					`✅ 音頻文件加載成功！總大小：${(this.fileBuffer.length / CONFIG.twotwenty).toFixed(1)} MB（約 ${durationSec} 秒），將進入無限循環播放。`
				);
			} catch (e) {
				// @ts-ignore
				error("❌ 文件讀取失敗：", e.message);
			}
		}
	}
	/**
	 * @returns {boolean[]}
	 */
	get_audio() {
		if (
			this.fileLoaded &&
			this.fileBuffer &&
			this.is_microphone === false
		) {
			const result = [];
			const bytesPerSample = 2;
			const totalBytes = this.fileBuffer.length;
			for (let i = 0; i < CHUNK_SIZE; i++) {
				const sample = this.fileBuffer.readInt16LE(this.cursor);
				result.push(sample > 0);
				this.cursor += bytesPerSample;
				if (this.cursor >= totalBytes) {
					this.cursor = 0;
				}
			}
			return result;
		}
		const _ = [...this.micBuffer];
		this.micBuffer.length = 0;
		return _;
	}
}

/**
 * @param {int} value
 * @param {int} min
 * @param {int} max
 * @returns {boolean}
 */
export function between(value, min, max) {
	return value < max && value > min;
}

// ------------------- Xorshift32 core by Deepseek -------------------
let state = 1; // non‑zero seed; will be overwritten by seed()

/**
 * Seed the generator.
 * @param {number} s – integer seed (will be coerced to unsigned 32‑bit)
 */
export function seed(s) {
	state = s >>> 0;
	if (state === 0) {
		state = 1;
	}
}

// Auto‑seed with time (comment out for fully deterministic start)
seed(Date.now());
/**
 * @returns {0|1}
 */
export function random_bit() {
	// xorshift32 update (inlined for maximum speed)
	let x = state;
	x ^= x << 13;
	x ^= x >> 17;
	x ^= x << 5;
	state = x;
	// extract lowest bit
	return /** @type {0|1}*/ (x & 1);
}

/**
 * Returns a uniform float in [0, 1).
 * @returns {float}
 */
export function random_float() {
	let x = state;
	x ^= x << 13;
	x ^= x >> 17;
	x ^= x << 5;
	state = x;
	// convert to unsigned int then scale to [0,1)
	return (x >>> 0) / 4294967296; // 2^32
}
