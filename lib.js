/* eslint-disable no-magic-numbers */
import { createRequire } from "module";
const require = createRequire(import.meta.url);

/**
 * @typedef {number} int
 * @typedef {number} float
 */
/**
 * Check is between
 * @param {int} value
 * @param {int} min
 * @param {int} max
 * @returns {boolean}
 */
export function between(value, min, max) {
	return value < max && value > min;
}

const microphone = require("node-microphone");

const mic = new microphone({
	rate: "16000",
	channels: "1",
	fileType: "raw",
});
const micStream = mic.startRecording();

/** @type {boolean[]} */
const buffer = [];
micStream?.on("data", (chunk) => {
	for (let i = 0; i < chunk.length; i += 2) {
		let sample = chunk[i] | (chunk[i + 1] << 8);
		if (sample >= 0x8000) {
			sample -= 0x10000;
		}
		buffer.push(sample > 0);
	}
});

/**
 * @returns {boolean[]}
 */
export function get_audio() {
	const _ = [...buffer];
	buffer.length = 0;
	return _;
}
