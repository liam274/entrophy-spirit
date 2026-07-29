/* eslint-disable no-magic-numbers */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

/**
 * @typedef {number} int
 * @typedef {number} float
 */
const __dirname = dirname(fileURLToPath(import.meta.url));

// ========== 文件播放配置 ==========
// 在这里填入您要循环播放的 .raw 文件名（例如 'story.raw' 或 'math.raw'）
const TARGET_FILE = ""; // 必须填写，否则文件模式会报错
// ==================================

export const { warn, error, log } = console;

// ---------- 加载文件样本（仅当 TARGET_FILE 非空时） ----------
/** @type {boolean[]} */
const fileSamples = [];
let fileLoaded = false;
if (TARGET_FILE) {
	try {
		const fileBuffer = readFileSync(join(__dirname, TARGET_FILE));
		for (let i = 0; i < fileBuffer.length; i += 2) {
			const sample = fileBuffer.readInt16LE(i);
			fileSamples.push(sample > 0);
		}
		if (fileSamples.length === 0) {
			warn("⚠️ 文件为空，填充随机噪声");
			for (let i = 0; i < 16000; i++) {
				fileSamples.push(Math.random() > 0.5);
			}
		}
		fileLoaded = true;
		warn(
			`✅ 音频文件加载成功！总样本数：${fileSamples.length}，将进入无限循环播放。`
		);
	} catch (e) {
		// @ts-ignore
		error("❌ 文件读取失败，请检查路径：", e.message);
		fileLoaded = false;
	}
} else {
	warn("ℹ️ TARGET_FILE 未设置，文件模式不可用。");
}

let cursor = 0;
const CHUNK_SIZE = 2500;

// ---------- 麦克风部分（保持不变） ----------
const microphone = require("node-microphone");
const mic = new microphone({
	rate: "16000",
	channels: "1",
	fileType: "raw",
});
const micStream = mic.startRecording();

/** @type {boolean[]} */
const micBuffer = [];
const MAX_BUFFER_LENGTH = 16000;

micStream?.on("data", (chunk) => {
	for (let i = 0; i < chunk.length; i += 2) {
		let sample = chunk[i] | (chunk[i + 1] << 8);
		if (sample >= 0x8000) {
			sample -= 0x10000;
		}
		micBuffer.push(sample > 0);
	}
	if (micBuffer.length > MAX_BUFFER_LENGTH) {
		micBuffer.splice(0, micBuffer.length - MAX_BUFFER_LENGTH);
	}
});

/**
 * @param {int} value
 * @param {int} min
 * @param {int} max
 * @returns {boolean}
 */
export function between(value, min, max) {
	return value < max && value > min;
}

/**
 * 获取音频数据
 * @param {boolean} [useFile]
 * @returns {boolean[]}
 */
export function get_audio(useFile) {
	// 显式传入 false 且文件加载成功 → 文件模式
	if (useFile === false && fileLoaded) {
		const result = [];
		for (let i = 0; i < CHUNK_SIZE; i++) {
			result.push(fileSamples[cursor]);
			cursor = (cursor + 1) % fileSamples.length;
		}
		return result;
	}

	// 否则走麦克风模式（默认）
	const _ = [...micBuffer];
	micBuffer.length = 0;
	return _;
}
