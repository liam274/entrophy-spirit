#!/usr/bin/env python3
import numpy as np
import sys
from scipy import signal
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['WenQuanYi Micro Hei', 'Noto Sans CJK SC', 'SimHei']
plt.rcParams['axes.unicode_minus'] = False

def read_file_as_series(filename):
    """
    支援三種格式：
    1. 舊有純數字（每行一個整數）
    2. 舊有二進制字串（每行8位元組）
    3. 新格式： timestamp,num1:num2:num3...
       其中 timestamp 可以是絕對時間（毫秒）或增量時間（毫秒）。
       若檢測到 timestamp 單調遞增，視為絕對時間；
       否則視為增量時間，累加得到絕對時間。
    回傳 (times_sec, values)
        times_sec: 均勻時間陣列（秒）
    """
    with open(filename, 'r', errors='ignore') as f:
        lines = f.readlines()
    if not lines:
        return np.array([]), np.array([])

    # 嘗試判斷是否為新格式（第一行有逗號，且逗號後有冒號或數字）
    first = lines[0].strip()
    if ',' not in first:
        # 舊格式處理
        if first.isdigit():
            vals = [int(line.strip()) for line in lines if line.strip().isdigit()]
            return np.array([]), np.array(vals, dtype=np.uint8)
        elif all(c in '01' for c in first):
            vals = []
            for line in lines:
                line = line.strip()
                if line:
                    for i in range(0, len(line), 8):
                        byte = line[i:i+8]
                        if len(byte) == 8:
                            vals.append(int(byte, 2))
            return np.array([]), np.array(vals, dtype=np.uint8)
        else:
            with open(filename, 'rb') as f:
                data = f.read()
            return np.array([]), np.frombuffer(data, dtype=np.uint8)

    # 新格式：逐行解析 timestamp, data
    all_vals = []
    timestamps_ms = []  # 原始第一欄（可能是絕對或增量）
    for line in lines:
        line = line.strip()
        if not line:
            continue
        p = line.split(',')
        if len(p) != 2:
            continue
        try:
            t = float(p[0])
        except ValueError:
            continue
        timestamps_ms.append(t)
        num_part = p[1].strip()
        if not num_part:
            continue
        if ':' in num_part:
            nums = [int(x) for x in num_part.split(':') if x]
        else:
            nums = [int(num_part)]
        all_vals.extend(nums)

    if not all_vals:
        return np.array([]), np.array([])

    N = len(all_vals)
    # 判斷是絕對時間還是增量
    # 如果 timestamps_ms 嚴格遞增且差值>0，視為絕對時間
    is_absolute = False
    if len(timestamps_ms) > 1:
        diffs = np.diff(timestamps_ms)
        if np.all(diffs > 0):
            is_absolute = True
    if is_absolute:
        # 絕對時間：直接使用第一筆和最後一筆時間戳（毫秒）
        t_start_sec = timestamps_ms[0] / 1000.0
        t_end_sec = timestamps_ms[-1] / 1000.0
        times = np.linspace(t_start_sec, t_end_sec, N)
    else:
        # 增量時間：累加得到絕對時間
        # 注意：每行時間戳代表該行所有資料的總持續時間（毫秒）
        # 我們將該行的資料均勻分佈在該持續時間內
        times = []
        current_time = 0.0  # 秒
        for t_ms, row_vals in zip(timestamps_ms, lines):
            # 提取該行的數值個數
            p = row_vals.strip().split(',')
            if len(p) != 2:
                continue
            num_part = p[1].strip()
            if not num_part:
                continue
            if ':' in num_part:
                cnt = len(num_part.split(':'))
            else:
                cnt = 1
            if cnt == 0:
                continue
            # 該行持續時間（秒）
            dur = t_ms / 1000.0
            # 均勻分佈 cnt 個點
            row_times = np.linspace(current_time, current_time + dur, cnt, endpoint=False)
            times.extend(row_times)
            current_time += dur
        # 補上最後一個點（由於 endpoint=False，可能會漏掉最後一點）
        # 確保長度一致
        times = np.array(times)
        if len(times) > N:
            times = times[:N]
        elif len(times) < N:
            # 補齊：用線性插值
            print(f"警告：時間軸長度 ({len(times)}) 與資料長度 ({N}) 不符，進行線性插值補齊")
            times = np.linspace(times[0], times[-1] if len(times)>1 else times[0]+1e-6, N)

    return times, np.array(all_vals, dtype=np.uint8)


def main():
    if len(sys.argv) < 3:
        print("用法: python spectrum.py <输入文件> <输出CSV文件>")
        sys.exit(1)

    infile = sys.argv[1]
    outfile = sys.argv[2]
    print(f"读取 {infile} ...")
    times, values = read_file_as_series(infile)

    if len(values) == 0:
        print("数据为空")
        sys.exit(1)
    print(f"共 {len(values)} 个数据点")

    # 決定採樣率
    if len(times) > 1:
        dt = np.diff(times)  # 秒
        mean_dt = np.mean(dt)
        fs = 1.0 / mean_dt
        print(f"檢測到時間軸，平均採樣間隔 = {mean_dt*1000:.3f} ms → 採樣率 ≈ {fs:.2f} Hz")

        # 若間隔抖動大，進行均勻重採樣
        std_dt = np.std(dt)
        if std_dt / mean_dt > 0.1:
            print("採樣間隔抖動較大，進行均勻重採樣（線性插值）...")
            t_uniform = np.linspace(times[0], times[-1], len(values))
            values_uniform = np.interp(t_uniform, times, values)
            values = np.round(values_uniform).astype(np.uint8)
            dt_new = (t_uniform[-1] - t_uniform[0]) / (len(values)-1)
            fs = 1.0 / dt_new
            print(f"重採樣後採樣率 ≈ {fs:.2f} Hz")
    else:
        # 無時間軸，使用預設 100 Hz
        fs = 100.0
        print("未檢測到時間軸，使用預設採樣率 100 Hz")

    # 限制點數（避免記憶體問題）
    max_points = 100000
    if len(values) > max_points:
        indices = np.linspace(0, len(values)-1, max_points, dtype=int)
        values = values[indices]
        print(f"下採樣至 {len(values)} 個點")

    # 計算功率譜密度（Welch）
    n_points = len(values)
    # 動態調整 nperseg
    if n_points < 8:
        print("數據點太少，無法計算頻譜")
        sys.exit(1)
    nperseg = min(256, n_points // 4)
    if nperseg < 8:
        nperseg = 8
    # 若點數過多，可增加 nperseg 以提高頻率解析度
    if n_points > 10000:
        nperseg = min(512, n_points // 4)
    f, Pxx = signal.welch(values, fs, nperseg=nperseg)

    # 儲存 CSV
    np.savetxt(outfile, np.column_stack((f, Pxx)),
               delimiter=',', header='频率(Hz),功率谱密度', comments='')
    print(f"频谱数据已保存至 {outfile}")

    # 繪圖
    imgfile = outfile.rsplit('.', 1)[0] + '.png' if '.' in outfile else outfile + '.png'
    plt.figure(figsize=(12, 6))
    plt.semilogy(f, Pxx, linewidth=1.5)
    plt.title(f'功率谱密度估计 (采样率 {fs:.1f} Hz, 总点 {len(values)})')
    plt.xlabel('频率 (Hz)')
    plt.ylabel('功率谱密度')
    plt.grid(True, alpha=0.3, linestyle='--')
    # 根據數據自動調整 x 軸上限（取最高頻率的 1.2 倍，但不超過 50 Hz）
    max_freq = f[-1]
    xlim = min(50, max_freq * 1.1)
    plt.xlim([0, xlim])
    plt.tight_layout()
    plt.savefig(imgfile, dpi=150)
    print(f"频谱图已保存至 {imgfile}")
    # plt.show()  # 若需顯示可取消註解
    plt.close()

    # 統計
    peak_idx = np.argmax(Pxx)
    print(f"峰值频率: {f[peak_idx]:.2f} Hz (功率 {Pxx[peak_idx]:.2e})")
    print(f"总功率: {np.sum(Pxx):.2e}")
    print("前5个频率-功率对:")
    for i in range(min(5, len(f))):
        print(f"  {f[i]:.2f} Hz, {Pxx[i]:.2e}")

if __name__ == "__main__":
    main()
