#!/usr/bin/env python3
"""读取所有模型的 layout 字段"""
import json, os

base = r"d:\Desktop\my-anime-blog\public\live2d"

names = ["shizuku","chitose","haru01","haruto","hibiki","hijiki","koharu","miku","ni-j","ico","ipsilon","nipsilon","nito","tsumiki","unitychan"]

for name in names:
    model_json_name = f"{name}.model.json"
    # Some models have their own folder (name) with the model.json
    # Check inside the folder directly first
    candidates = [
        os.path.join(base, name, model_json_name),
        os.path.join(base, name, "..", name, model_json_name),
        os.path.join(base, name, "..", model_json_name),
    ]
    model_path = None
    for p in candidates:
        if os.path.exists(p):
            model_path = p
            break
    
    if not model_path:
        print(f"{name}: NOT_FOUND")
        continue
    
    try:
        with open(model_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        layout = data.get("layout", {})
        moc = data.get("model", "")
        textures = data.get("textures", [])
        print(f"{name}: layout={json.dumps(layout)}, model={moc}, textures_count={len(textures)}")
    except Exception as e:
        print(f"{name}: ERROR {e}")
