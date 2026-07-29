/* eslint-disable no-magic-numbers */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Buffer } from "buffer";

/**
 * @typedef {number} int
 * @typedef {number} float
 */
const __dirname = dirname(fileURLToPath(import.meta.url));

// ========== 文件播放配置 ==========
const TARGET_FILE = "story/story.raw";
// ==================================

export const { warn, error, log } = console;

// ---------- 加载文件样本（直接存 Buffer，不转布尔数组） ----------
/** @type {Buffer | null} */
let fileBuffer = null;
let fileLoaded = false;
const CHUNK_SIZE = 2500;
let cursor = 0; // 字节偏移量（0, 2, 4, ...）

if (TARGET_FILE) {
	try {
		fileBuffer = readFileSync(join(__dirname, TARGET_FILE));
		// 确保字节数为偶数（16-bit 采样）
		if (fileBuffer.length % 2 !== 0) {
			fileBuffer = fileBuffer.slice(0, fileBuffer.length - 1);
		}
		if (fileBuffer.length === 0) {
			warn("⚠️ 文件为空，填充随机噪声");
			fileBuffer = Buffer.alloc(32000);
			for (let i = 0; i < fileBuffer.length; i += 2) {
				fileBuffer.writeInt16LE(Math.random() > 0.5 ? 1 : -1, i);
			}
		}
		fileLoaded = true;
		const durationSec = (fileBuffer.length / 32000).toFixed(1); // 16kHz * 2字节 = 32000 字节/秒
		warn(
			`✅ 音频文件加载成功！总大小：${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB（约 ${durationSec} 秒），将进入无限循环播放。`
		);
	} catch (e) {
		// @ts-ignore
		error("❌ 文件读取失败，请检查路径：", e.message);
		fileLoaded = false;
	}
} else {
	warn("ℹ️ TARGET_FILE 未设置，文件模式不可用。");
}

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
	// ---------- 文件模式 ----------
	if (useFile === false && fileLoaded && fileBuffer) {
		const result = [];
		const bytesPerSample = 2;
		const totalBytes = fileBuffer.length;
		for (let i = 0; i < CHUNK_SIZE; i++) {
			// 直接从 Buffer 读取 Int16LE，转布尔
			const sample = fileBuffer.readInt16LE(cursor);
			result.push(sample > 0);
			cursor += bytesPerSample;
			if (cursor >= totalBytes) {
				cursor = 0; // 循环
			}
		}
		return result;
	}

	// ---------- 麦克风模式（默认） ----------
	const _ = [...micBuffer];
	micBuffer.length = 0;
	return _;
}
