import urllib.request, ssl, os, json

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE
headers = {"User-Agent": "Mozilla/5.0", "Referer": "https://cdn.jsdelivr.net/"}
BASE = r"d:\Desktop\my-anime-blog\public\live2d"

models_to_fix = [
    ("nietzsche", "live2d-widget-model-nietzsche", "nietzsche.model.json"),
    ("z16", "live2d-widget-model-z16", "z16.model.json"),
]

for name, pkg, fname in models_to_fix:
    model_json_path = os.path.join(BASE, name, fname)
    if not os.path.exists(model_json_path):
        print(f"[SKIP] {name}/{fname} not found")
        continue

    with open(model_json_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    print(f"\n[{name}] 需要下载的文件:")
    # textures
    for tex in config.get("textures", []):
        dest = os.path.join(BASE, name, tex)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        if not os.path.exists(dest):
            url = f"https://cdn.jsdelivr.net/npm/{pkg}@1.0.5/assets/{tex}"
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=15, context=ssl_ctx) as r:
                    if r.status == 200:
                        with open(dest, "wb") as f2:
                            f2.write(r.read())
                        print(f"  [OK] {tex}")
                    else:
                        print(f"  [FAIL] HTTP {r.status}: {tex}")
            except Exception as e:
                print(f"  [FAIL] {tex}: {e}")
        else:
            print(f"  [SKIP] {tex} exists")

    # physics
    phys = config.get("physics", "")
    if phys:
        dest = os.path.join(BASE, name, phys)
        if not os.path.exists(dest):
            url = f"https://cdn.jsdelivr.net/npm/{pkg}@1.0.5/assets/{phys}"
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=15, context=ssl_ctx) as r:
                    if r.status == 200:
                        with open(dest, "wb") as f2:
                            f2.write(r.read())
                        print(f"  [OK] {phys}")
            except:
                pass
