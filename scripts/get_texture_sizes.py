#!/usr/bin/env python3
"""批量读取 Live2D 纹理尺寸"""
from PIL import Image
import os

base = r"d:\Desktop\my-anime-blog\public\live2d"

textures = {
    "shizuku":  r"shizuku\moc\shizuku.1024\texture_00.png",
    "chitose":  r"chitose\moc\chitose.2048\texture_00.png",
    "haru01":   r"haru01\moc\haru01.1024\texture_00.png",
    "haruto":   r"haruto\moc\haruto.2048\texture_00.png",
    "hibiki":   r"hibiki\moc\hibiki.2048\texture_00.png",
    "hijiki":   r"hijiki\moc\hijiki.2048\texture_00.png",
    "koharu":   r"koharu\moc\koharu.2048\texture_00.png",
    "miku":     r"miku\moc\miku.2048\texture_00.png",
    "ni-j":     r"ni-j\moc\ni-j.2048\texture_00.png",
    "ico":      r"ico\moc\nico.2048\texture_00.png",
    "ipsilon":  r"ipsilon\moc\nipsilon.2048\texture_00.png",
    "nipsilon": r"ipsilon\moc\nipsilon.2048\texture_00.png",
    "nito":     r"nito\moc\nito.2048\texture_00.png",
    "tsumiki":  r"tsumiki\moc\tsumiki.2048\texture_00.png",
    "unitychan":r"unitychan\moc\unitychan.2048\texture_00.png",
}

for name, rel in textures.items():
    path = os.path.join(base, rel)
    if not os.path.exists(path):
        print(f"{name}: FILE_NOT_FOUND")
        continue
    try:
        img = Image.open(path)
        w, h = img.size
        ratio = w / h
        print(f"{name}: {w}x{h}  ratio={ratio:.3f}")
    except Exception as e:
        print(f"{name}: ERROR {e}")
