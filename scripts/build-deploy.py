from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
deploy = root / "deploy"
if deploy.exists():
    shutil.rmtree(deploy)
deploy.mkdir()
shutil.copytree(root / "public", deploy / "public")
for rel in ("data/parsed/course_data.json", "data/parsed/search_index.json"):
    dst = deploy / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(root / rel, dst)
for rel in ("data/assets/images", "data/assets/docs"):
    src, dst = root / rel, deploy / rel
    if src.exists():
        shutil.copytree(src, dst)
print(f"Assets preparados en {deploy}")
