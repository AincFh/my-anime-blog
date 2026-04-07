#!/usr/bin/env python3
"""
Live2D 模型资源下载脚本
使用 jsdelivr CDN，从 npm 下载所有模型的配置文件、纹理和动作文件
"""
import os
import json
import urllib.request
import urllib.parse
import ssl
import time

# SSL 设置
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

BASE_DIR = r"d:\Desktop\my-anime-blog\public\live2d"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://cdn.jsdelivr.net/",
}
TIMEOUT = 20  # 秒

# CDN 基础 URL（pkg 包含完整路径）
CDN_BASE = "https://cdn.jsdelivr.net/npm/{pkg}/assets/{path}"

# 所有模型列表（pkg 为 npm 包名，moc 为 .moc 文件名）
MODELS = [
    {"name": "shizuku",     "pkg": "live2d-widget-model-shizuku",    "moc": "shizuku.moc"},
    {"name": "chitose",     "pkg": "live2d-widget-model-chitose",    "moc": "chitose.moc"},
    # haru01 的资源在 haru@1.0.5/01/ 子目录下（npm 包结构特殊）
    {"name": "haru01",      "pkg": "live2d-widget-model-haru@1.0.5/01", "moc": "haru01.moc"},
    {"name": "haruto",      "pkg": "live2d-widget-model-haruto",      "moc": "haruto.moc"},
    {"name": "hibiki",      "pkg": "live2d-widget-model-hibiki",      "moc": "hibiki.moc"},
    {"name": "hijiki",      "pkg": "live2d-widget-model-hijiki",      "moc": "hijiki.moc"},
    {"name": "koharu",      "pkg": "live2d-widget-model-koharu",      "moc": "koharu.moc"},
    {"name": "miku",        "pkg": "live2d-widget-model-miku",         "moc": "miku.moc"},
    {"name": "ni-j",        "pkg": "live2d-widget-model-ni-j",         "moc": "ni-j.moc"},
    {"name": "nico",        "pkg": "live2d-widget-model-nico",         "moc": "nico.moc"},
    {"name": "nietzsche",   "pkg": "live2d-widget-model-nietzsche",   "moc": "nietzsche.moc"},
    {"name": "nipsilon",    "pkg": "live2d-widget-model-nipsilon",    "moc": "nipsilon.moc"},
    {"name": "nito",        "pkg": "live2d-widget-model-nito",        "moc": "nito.moc"},
    {"name": "tororo",      "pkg": "live2d-widget-model-tororo",      "moc": "tororo.moc"},
    {"name": "tsumiki",     "pkg": "live2d-widget-model-tsumiki",    "moc": "tsumiki.moc"},
    {"name": "unitychan",   "pkg": "live2d-widget-model-unitychan",  "moc": "unitychan.moc"},
    {"name": "wanko",       "pkg": "live2d-widget-model-wanko",      "moc": "wanko.moc"},
    {"name": "z16",         "pkg": "live2d-widget-model-z16",         "moc": "z16.moc"},
]


def download_file(url: str, dest_path: str, max_retries: int = 3) -> bool:
    """下载单个文件，已存在则跳过"""
    if os.path.exists(dest_path):
        return True

    os.makedirs(os.path.dirname(dest_path), exist_ok=True)

    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
                if response.status != 200:
                    return False
                content = response.read()
                with open(dest_path, "wb") as f:
                    f.write(content)
                return True
        except Exception:
            if attempt < max_retries - 1:
                time.sleep(1)
    return False


def get_url(pkg: str, path: str) -> str:
    """生成 CDN URL（对路径进行 URL 编码）"""
    encoded_path = urllib.parse.quote(path, safe='/')
    return CDN_BASE.format(pkg=pkg, path=encoded_path)


def download_model_files(model: dict) -> dict:
    """下载单个模型的所有资源文件"""
    name = model["name"]
    pkg = model["pkg"]
    moc_name = model["moc"]
    model_dir = os.path.join(BASE_DIR, name)

    os.makedirs(os.path.join(model_dir, "moc"), exist_ok=True)
    os.makedirs(os.path.join(model_dir, "textures"), exist_ok=True)
    os.makedirs(os.path.join(model_dir, "exp"), exist_ok=True)
    os.makedirs(os.path.join(model_dir, "mtn"), exist_ok=True)

    # 1. model.json
    model_json_name = f"{name}.model.json"
    model_json_path = os.path.join(model_dir, model_json_name)
    url = get_url(pkg, model_json_name)
    ok = download_file(url, model_json_path)
    if not ok:
        return {"ok": False, "reason": "model.json 下载失败"}

    # 2. 读取 model.json 获取所有资源路径
    try:
        with open(model_json_path, "r", encoding="utf-8") as f:
            config = json.load(f)
    except Exception as e:
        return {"ok": False, "reason": f"JSON 解析失败: {e}"}

    results = {"ok": True, "downloaded": [], "failed": [], "skipped": []}

    # textures
    for tex_path in config.get("textures", []):
        dest = os.path.join(model_dir, tex_path)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        url = get_url(pkg, tex_path)
        if download_file(url, dest):
            results["downloaded"].append(f"textures/{os.path.basename(tex_path)}")
        else:
            results["failed"].append(f"textures/{os.path.basename(tex_path)}")

    # moc 文件（model.json 中的路径）
    moc_path = config.get("model", "")
    if moc_path:
        dest = os.path.join(model_dir, moc_path)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        url = get_url(pkg, moc_path)
        if download_file(url, dest):
            results["downloaded"].append(f"moc/{os.path.basename(moc_path)}")
        else:
            results["failed"].append(f"moc/{os.path.basename(moc_path)}")

    # physics
    physics_path = config.get("physics", "")
    if physics_path:
        dest = os.path.join(model_dir, physics_path)
        if download_file(get_url(pkg, physics_path), dest):
            results["downloaded"].append(physics_path)
        else:
            results["failed"].append(physics_path)

    # pose
    pose_path = config.get("pose", "")
    if pose_path:
        dest = os.path.join(model_dir, pose_path)
        if download_file(get_url(pkg, pose_path), dest):
            results["downloaded"].append(pose_path)
        else:
            results["failed"].append(pose_path)

    # expressions
    for exp in config.get("expressions", []):
        exp_file = exp.get("file", "")
        if exp_file:
            dest = os.path.join(model_dir, exp_file)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            if download_file(get_url(pkg, exp_file), dest):
                results["downloaded"].append(f"exp/{os.path.basename(exp_file)}")

    # motions（只下载 .mtn，不打印详细信息）
    for motion_list in config.get("motions", {}).values():
        if isinstance(motion_list, list):
            for motion in motion_list:
                mtn = motion.get("file", "")
                if mtn and mtn.endswith(".mtn"):
                    dest = os.path.join(model_dir, mtn)
                    os.makedirs(os.path.dirname(dest), exist_ok=True)
                    download_file(get_url(pkg, mtn), dest)

    return results


def main():
    print("=" * 60)
    print("Live2D 模型资源下载器")
    print("=" * 60)

    # 只处理还缺少 model.json 的模型
    for model in MODELS:
        name = model["name"]
        model_dir = os.path.join(BASE_DIR, name)
        model_json = os.path.join(model_dir, f"{name}.model.json")

        if os.path.exists(model_json):
            print(f"\n[{name}] 已存在，跳过")
            continue

        print(f"\n[{name}] 开始下载...")
        res = download_model_files(model)
        if res["ok"]:
            for d in res["downloaded"]:
                print(f"  [OK] {d}")
            if res["failed"]:
                for f in res["failed"]:
                    print(f"  [FAIL] {f}")
            print(f"  [{name}] 完成 (下载 {len(res['downloaded'])} 个文件)")
        else:
            print(f"  [SKIP] {res['reason']}")

    print("\n" + "=" * 60)
    print("下载完成！")
    print("=" * 60)

    # 统计
    total = 0
    for model in MODELS:
        model_dir = os.path.join(BASE_DIR, model["name"])
        if os.path.exists(model_dir):
            count = sum(len(files) for _, _, files in os.walk(model_dir))
            total += count
            model_json = os.path.join(model_dir, f"{model['name']}.model.json")
            status = "✅" if os.path.exists(model_json) else "❌"
            print(f"  {status} {model['name']}: {count} 个文件")

    print(f"\n总计: {total} 个文件已下载到 public/live2d/")


if __name__ == "__main__":
    main()
