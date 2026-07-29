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

// ---------- 加載文件樣本（直接存 Buffer，不轉Boolean[]） ----------
/** @type {Buffer | null} */
let fileBuffer = null;
let fileLoaded = false;
const CHUNK_SIZE = 2500;
let cursor = 0; // 字節偏移量（0, 2, 4, ...）

if (TARGET_FILE) {
	try {
		fileBuffer = readFileSync(join(__dirname, TARGET_FILE));
		// 確保字節數為偶數（16-bit 採樣）
		if (fileBuffer.length % 2 !== 0) {
			fileBuffer = fileBuffer.slice(0, fileBuffer.length - 1);
		}
		if (fileBuffer.length === 0) {
			warn("⚠️ 文件為空，填充隨機噪聲");
			fileBuffer = Buffer.alloc(32000);
			for (let i = 0; i < fileBuffer.length; i += 2) {
				fileBuffer.writeInt16LE(Math.random() > 0.5 ? 1 : -1, i);
			}
		}
		fileLoaded = true;
		const durationSec = (fileBuffer.length / 32000).toFixed(1); // 16kHz * 2字節 = 32000 字節/秒
		warn(
			`✅ 音頻文件加載成功！總大小：${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB（約 ${durationSec} 秒），將進入無限循環播放。`
		);
	} catch (e) {
		// @ts-ignore
		error("❌ 文件讀取失敗：", e.message);
		fileLoaded = false;
	}
} else {
	warn("ℹ️ TARGET_FILE 未設置，文件模式不可用。");
}

// ---------- Microphone ----------
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
 * @param {boolean} [useFile]
 * @returns {boolean[]}
 */
export function get_audio(useFile) {
	if (useFile === false && fileLoaded && fileBuffer) {
		const result = [];
		const bytesPerSample = 2;
		const totalBytes = fileBuffer.length;
		for (let i = 0; i < CHUNK_SIZE; i++) {
			const sample = fileBuffer.readInt16LE(cursor);
			result.push(sample > 0);
			cursor += bytesPerSample;
			if (cursor >= totalBytes) {
				cursor = 0;
			}
		}
		return result;
	}

	// ---------- Microphone Mode (Default) ----------
	const _ = [...micBuffer];
	micBuffer.length = 0;
	return _;
}
