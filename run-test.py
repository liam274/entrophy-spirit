#!/usr/bin/env python3
"""
批量執行 brain.js 測試腳本
用法: python3 run_tests.py
功能:
    1. 清空 experiment/ 下各子目錄的舊輸出 (*.1|2.csv, *.1|2.png, *.sample.1|2)
    2. 對每個子目錄中的 .raw 檔案，分別以 run_index=1 和 2 執行 node brain.js
    3. 將 stdout 儲存為 <子目錄名>.<run_index>.csv
    4. 使用 10 個行程並行執行
"""

import subprocess
import sys
from multiprocessing import Pool
from pathlib import Path
from typing import List, Tuple

# ---- 常數設定 ----
EXPERIMENT_DIR: Path = Path("./experiment")
NODE_CMD: str = "node"
BRAIN_JS: Path = Path("./brain.js")  # 請確保 brain.js 位於專案根目錄
MAX_WORKERS: int = 10  # 並行數量


# ---- 類型別名（方便閱讀） ----
Task = Tuple[Path, int]  # (raw_file_path, run_index)


def clean_old_files(subdir: Path) -> None:
    """
    刪除子目錄下所有符合輸出模式的舊檔案
    """
    patterns: List[str] = [
        "*.1.csv",
        "*.2.csv",
        "*.1.png",
        "*.2.png",
        "*.sample.1",
        "*.sample.2",
    ]
    for pattern in patterns:
        for file_path in subdir.glob(pattern):
            print(f"🗑️  刪除 {file_path}")
            file_path.unlink()


def find_raw_file(subdir: Path) -> Path:
    """
    在子目錄中尋找第一個 .raw 檔案，若找不到則拋出錯誤
    """
    raw_files: List[Path] = list(subdir.glob("*.raw"))
    if not raw_files:
        raise FileNotFoundError(f"❌ 在 {subdir} 中找不到任何 .raw 檔案")
    if len(raw_files) > 1:
        print(f"⚠️  {subdir} 中有多個 .raw 檔案，將使用第一個：{raw_files[0]}")
    return raw_files[0]


def run_task(task: Task) -> None:
    """
    執行單一測試任務（由 multiprocessing Pool 呼叫）
    task: (raw_path, run_index)
    """
    raw_path: Path
    run_index: int
    raw_path, run_index = task

    subdir: Path = raw_path.parent
    out_csv: Path = subdir / f"{subdir.name}.{run_index}.csv"

    print(f"🚀 開始 {subdir.name} 第 {run_index} 次執行 ...")

    # 執行 node，捕獲 stdout，stderr 直接顯示（便於除錯）
    proc = subprocess.run(
        [NODE_CMD, str(BRAIN_JS), str(raw_path)],
        cwd=Path.cwd(),  # 確保在專案根目錄執行
        capture_output=True,
        text=True,
        encoding="utf-8",
    )

    # 寫入 CSV（僅 stdout）
    with open(out_csv, "w", encoding="utf-8") as f:
        f.write(proc.stdout)

    # 若有錯誤訊息，印出但不中斷流程
    if proc.stderr:
        print(f"⚠️  {subdir.name} 第 {run_index} 次有 stderr：\n{proc.stderr}")

    print(f"✅ 完成 {subdir.name} 第 {run_index} 次，輸出 => {out_csv}")


def main() -> None:
    # 檢查實驗目錄是否存在
    if not EXPERIMENT_DIR.exists():
        print("❌ 找不到 experiment/ 目錄，請確認路徑正確")
        sys.exit(1)

    # 收集所有子目錄（僅一層）
    subdirs: List[Path] = [d for d in EXPERIMENT_DIR.iterdir() if d.is_dir()]
    if not subdirs:
        print("⚠️  experiment/ 下沒有任何子目錄")
        return

    # 1. 清理舊檔案
    print("🧹 開始清理舊檔案...")
    for sd in subdirs:
        clean_old_files(sd)

    # 2. 建立任務清單（每個子目錄執行兩次）
    tasks: List[Task] = []
    for sd in subdirs:
        raw_file: Path = find_raw_file(sd)
        tasks.append((raw_file, 1))
        tasks.append((raw_file, 2))

    print(f"📦 總共 {len(tasks)} 個任務，將使用 {MAX_WORKERS} 個行程並行執行")

    # 3. 以行程池執行
    with Pool(processes=MAX_WORKERS) as pool:
        pool.map(run_task, tasks)

    print("🎉 所有測試完成！")


if __name__ == "__main__":
    main()
