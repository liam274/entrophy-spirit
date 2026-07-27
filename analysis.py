#!/usr/bin/env python3
import numpy as np
import sys
from scipy import signal
import matplotlib.pyplot as plt   # 新增绘图库

def read_file_as_series(filename):
    """
    支援三種格式：
    1. 舊有純數字（每行一個整數）
    2. 舊有二進制字串（每行8位元組）
    3. 新格式： timestamp,num1:num2:num3...
    回傳 (times_sec, values)
        times_sec: 均勻時間陣列（秒），若無時間則為空陣列
    """
    with open(filename, 'r', errors='ignore') as f:
        lines = f.readlines()
    if not lines:
        return np.array([]), np.array([])

    # 嘗試判斷是否為新格式（第一行有逗號，且逗號後有冒號）
    first = lines[0].strip()
    if ',' in first:
        parts = first.split(',')
        if len(parts) == 2:
            # 檢查第二部分是否包含冒號
            nums_str = parts[1]
            if ':' in nums_str or nums_str.isdigit():
                try:
                    float(parts[0])  # 時間戳
                    # 確定是新格式，解析全部行
                    all_vals = []
                    t_start = None
                    t_end = None
                    for line in lines:
                        line = line.strip()
                        if not line:
                            continue
                        p = line.split(',')
                        if len(p) != 2:
                            continue
                        try:
                            t = float(p[0])
                            if t_start is None:
                                t_start = t
                            t_end = t
                            # 解析數字列表
                            num_part = p[1].strip()
                            if not num_part:
                                continue
                            # 可能以冒號分隔多個數字
                            if ':' in num_part:
                                nums = [int(x) for x in num_part.split(':') if x]
                            else:
                                nums = [int(num_part)]
                            all_vals.extend(nums)
                        except ValueError:
                            continue
                    if not all_vals:
                        return np.array([]), np.array([])
                    # 建立均勻時間軸（秒）
                    N = len(all_vals)
                    t_start_sec = t_start / 1000.0
                    t_end_sec = t_end / 1000.0
                    if N > 1:
                        times = np.linspace(t_start_sec, t_end_sec, N)
                    else:
                        times = np.array([t_start_sec])
                    return times, np.array(all_vals, dtype=np.uint8)
                except (ValueError, IndexError):
                    pass  # 不是預期格式，繼續嘗試其他

    # 舊有純數字格式（每行一個整數）
    first = lines[0].strip()
    if first.isdigit():
        vals = [int(line.strip()) for line in lines if line.strip().isdigit()]
        return np.array([]), np.array(vals, dtype=np.uint8)

    # 舊有二進制字串格式（每行如 "01010101"）
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

    # 最後嘗試原始二進制
    else:
        with open(filename, 'rb') as f:
            data = f.read()
        return np.array([]), np.frombuffer(data, dtype=np.uint8)

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
        # 有時間戳，計算平均採樣間隔（秒）
        dt = np.diff(times)  # 秒
        mean_dt = np.mean(dt)
        fs = 1.0 / mean_dt
        print(f"檢測到時間戳，平均採樣間隔 = {mean_dt*1000:.3f} ms → 採樣率 ≈ {fs:.2f} Hz")

        # 若間隔抖動大，進行均勻重採樣（防止頻譜泄漏）
        std_dt = np.std(dt)
        if std_dt / mean_dt > 0.1:
            print("採樣間隔抖動較大，進行均勻重採樣（線性插值）...")
            # 建立均勻時間軸，點數與原始相同
            t_uniform = np.linspace(times[0], times[-1], len(values))
            values_uniform = np.interp(t_uniform, times, values)
            values = np.round(values_uniform).astype(np.uint8)
            # 重新計算 fs
            dt_new = (t_uniform[-1] - t_uniform[0]) / (len(values)-1)
            fs = 1.0 / dt_new
            print(f"重採樣後採樣率 ≈ {fs:.2f} Hz")
        # 否則直接使用原始序列（視為均勻）
    else:
        # 無時間戳，使用預設 100 Hz
        fs = 100.0
        print("未檢測到時間戳，使用預設採樣率 100 Hz")

    # 限制點數（可選）
    max_points = 100000
    if len(values) > max_points:
        # 均勻下採樣
        indices = np.linspace(0, len(values)-1, max_points, dtype=int)
        values = values[indices]
        print(f"下採樣至 {len(values)} 個點")

    # 計算功率譜密度（Welch）
    n_points = len(values)
    nperseg = min(256, n_points // 4) if n_points // 4 >= 8 else 8
    if nperseg < 8:
        nperseg = 8
    if nperseg > n_points:
        nperseg = n_points
    # 若點數過少，調整
    if n_points < nperseg:
        nperseg = n_points
    f, Pxx = signal.welch(values, fs, nperseg=nperseg)

    # 儲存 CSV
    np.savetxt(outfile, np.column_stack((f, Pxx)),
               delimiter=',', header='频率(Hz),功率谱密度', comments='')
    print(f"频谱数据已保存至 {outfile}")

    # --- 新增绘图部分 ---
    # 生成图片文件名（将 .csv 替换为 .png）
    imgfile = outfile.rsplit('.', 1)[0] + '.png' if '.' in outfile else outfile + '.png'

    plt.figure(figsize=(12, 6))
    # 使用对数 y 轴（功率谱通常用对数显示，便于观察低频细节）
    plt.semilogy(f, Pxx, linewidth=1.5)
    plt.title(f'功率谱密度估计 (采样率 {fs:.1f} Hz, 总点 {len(values)})')
    plt.xlabel('频率 (Hz)')
    plt.ylabel('功率谱密度')
    plt.grid(True, alpha=0.3, linestyle='--')
    plt.xlim([0, 20])  # 限制到 20 Hz，符合 EEG 常用范围
    plt.tight_layout()
    plt.savefig(imgfile, dpi=150)
    print(f"频谱图已保存至 {imgfile}")
    # 如果想在屏幕上显示，取消下面一行的注释
    # plt.show()
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
