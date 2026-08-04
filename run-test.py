#!/usr/bin/env python3
"""
批量執行 brain.js 測試腳本（含每任務獨立進度條）
用法: python3 run-test.py
功能:
    1. 清空 experiment/ 下各子目錄的舊輸出 (*.1|2.csv, *.1|2.png, *.sample.1|2)
    2. 對每個子目錄中的 .raw 檔案，分別以 run_index=1 和 2 執行 node brain.js
    3. 將 stdout 即時寫入 <子目錄名>.sample.<run_index>
    4. 使用 10 個行程並行執行，每個行程顯示自己的 tqdm 進度條（總行數固定 20200）
"""

import subprocess
import sys
from multiprocessing import Pool
from pathlib import Path
from typing import List, Tuple

# ---- 新增 tqdm ----
from tqdm import tqdm

# ---- 常數設定 ----
EXPERIMENT_DIR: Path = Path("./experiment")
NODE_CMD: str = "node"
BRAIN_JS: Path = Path("./brain.js")  # 請確保 brain.js 位於專案根目錄
MAX_WORKERS: int = 1  # 並行數量
TOTAL_LINES: int = 20200  # 預期總行數（可依實際調整）


# ---- 類型別名 ----
Task = Tuple[Path, int, int]  # (raw_file_path, run_index, task_id)


def find_raw_file(subdir: Path) -> Path:
    """在子目錄中尋找第一個 .raw 檔案"""
    raw_files: List[Path] = list(subdir.glob("*.raw"))
    if not raw_files:
        raise FileNotFoundError(f"❌ 在 {subdir} 中找不到任何 .raw 檔案")
    if len(raw_files) > 1:
        print(f"⚠️  {subdir} 中有多個 .raw 檔案，將使用第一個：{raw_files[0]}")
    return raw_files[0]


def run_task(task: Task) -> None:
    """
    執行單一測試任務，並顯示該任務的即時行數進度條
    task: (raw_path, run_index, task_id)
    """
    raw_path: Path
    run_index: int
    task_id: int
    raw_path, run_index, task_id = task

    subdir: Path = raw_path.parent
    out_sample: Path = subdir / f"{subdir.name}.sample.{run_index}"

    # 開一個 tqdm 進度條，指定 position 讓它固定在一行
    desc = f"{subdir.name}-{run_index}"
    pbar = tqdm(
        total=TOTAL_LINES,
        position=task_id + 1,  # 從第 1 行開始（第 0 行保留給總體訊息）
        desc=desc,
        leave=False,  # 完成後不殘留佔用行
        unit="行",
        file=sys.stdout,
    )

    # 啟動 node 並逐行讀取 stdout
    proc = subprocess.Popen(
        [NODE_CMD, str(BRAIN_JS), str(raw_path)],
        cwd=Path.cwd(),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
    )

    # 同時寫入輸出檔案和更新進度條
    with open(out_sample, "w", encoding="utf-8") as f:
        for line in proc.stdout:
            f.write(line)
            pbar.update(1)  # 每讀一行，進度條前進一格

    # 等待程序結束，順便印出 stderr（若有）
    stderr_output = proc.stderr.read()
    if stderr_output:
        print(f"⚠️  {desc} 有 stderr：\n{stderr_output}")

    # 關閉進度條
    pbar.close()


def main() -> None:
    # 檢查實驗目錄
    if not EXPERIMENT_DIR.exists():
        print("❌ 找不到 experiment/ 目錄")
        sys.exit(1)

    subdirs: List[Path] = [d for d in EXPERIMENT_DIR.iterdir() if d.is_dir()]
    if not subdirs:
        print("⚠️  沒有子目錄")
        return

    # 清理舊檔案

    # 建立任務清單，並分配 task_id（0 ~ 總數-1）
    tasks: List[Task] = []
    for sd in subdirs:
        raw_file = find_raw_file(sd)
        tasks.append((raw_file, 1, len(tasks)))
        tasks.append((raw_file, 2, len(tasks)))

    print(f"📦 總共 {len(tasks)} 個任務，使用 {MAX_WORKERS} 個並行行程")
    print(f"📊 每個進度條目標行數：{TOTAL_LINES} 行")

    # 並行執行（以任務清單長度作為行程數，但限制為 MAX_WORKERS）
    with Pool(processes=MAX_WORKERS) as pool:
        pool.map(run_task, tasks)

    print("🎉 所有測試完成！")


if __name__ == "__main__":
    main()
