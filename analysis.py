#!/usr/bin/env python3
import numpy as np
import sys
from scipy import signal

def read_file_as_series(filename):
    with open(filename, 'r', errors='ignore') as f:
        lines = f.readlines()
    if not lines:
        return np.array([])
    first = lines[0].strip()
    if first.isdigit():
        vals = [int(line.strip()) for line in lines if line.strip().isdigit()]
        return np.array(vals, dtype=np.uint8)
    elif all(c in '01' for c in first):
        vals = []
        for line in lines:
            line = line.strip()
            if line:
                for i in range(0, len(line), 8):
                    byte = line[i:i+8]
                    if len(byte) == 8:
                        vals.append(int(byte, 2))
        return np.array(vals, dtype=np.uint8)
    else:
        with open(filename, 'rb') as f:
            data = f.read()
        return np.frombuffer(data, dtype=np.uint8)

def main():
    if len(sys.argv) < 3:
        print("用法: python spectrum.py <输入文件> <输出CSV文件>")
        sys.exit(1)
    
    infile = sys.argv[1]
    outfile = sys.argv[2]
    print(f"读取 {infile} ...")
    values = read_file_as_series(infile)
    if len(values) == 0:
        print("数据为空")
        sys.exit(1)
    print(f"共 {len(values)} 个数据点")

    fs = 100.0
    max_points = 100000
    if len(values) > max_points:
        values = values[::len(values)//max_points]
    
    nperseg = min(256, len(values)//4) if len(values)//4 >= 8 else 8
    f, Pxx = signal.welch(values, fs, nperseg=nperseg)

    # 保存为CSV
    np.savetxt(outfile, np.column_stack((f, Pxx)), 
               delimiter=',', header='频率(Hz),功率谱密度', comments='')
    print(f"频谱数据已保存至 {outfile}")

    # 打印统计
    peak_idx = np.argmax(Pxx)
    print(f"峰值频率: {f[peak_idx]:.2f} Hz (功率 {Pxx[peak_idx]:.2e})")
    print(f"总功率: {np.sum(Pxx):.2e}")
    print("前5个频率-功率对:")
    for i in range(5):
        print(f"  {f[i]:.2f} Hz, {Pxx[i]:.2e}")

if __name__ == "__main__":
    main()
