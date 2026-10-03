"""Chequeo de salud de la plataforma (solo stdlib).
Uso: python scripts/verificar.py   (con serve.py corriendo en :3000)
Sale con codigo 0 si todo esta OK, 1 si algo falla.
"""
from __future__ import annotations

import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "http://127.0.0.1:3000"
fails: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    print(("OK   " if ok else "FALLA") + f" {name}" + (f" ({detail})" if detail else ""))
    if not ok:
        fails.append(name)


def get(path: str) -> tuple[int, str, bytes]:
    import urllib.error
    try:
        with urllib.request.urlopen(BASE + path, timeout=8) as r:
            return r.status, r.headers.get("Content-Type", ""), r.read()
    except urllib.error.HTTPError as exc:
        return exc.code, exc.headers.get("Content-Type", ""), exc.read()
    except Exception as exc:  # noqa: BLE001
        return 0, "", f"ERROR: {exc}".encode()


# 1. Paginas clave: 200 + charset en texto
for path in ("/", "/public/inicio.html", "/public/curso.html",
             "/public/patrones/velas/", "/public/patrones/entrenador.html",
             "/public/patrones/hub.html", "/public/laboratorio.html",
             "/public/temario.js", "/public/data/course_data.json",
             "/data/parsed/course_data.json"):
    code, ctype, _ = get(path)
    is_text = any(k in ctype for k in ("text/", "json", "javascript"))
    check(f"GET {path} -> {code}", code in (200, 302),
          ctype or "sin respuesta")
    if code == 200 and ("html" in ctype or "javascript" in ctype or "json" in ctype or "css" in ctype):
        check(f"charset {path}", "charset=utf-8" in ctype, ctype)

# 2. URLs viejas deben dar 404 (ya no existen)
for path in ("/curso.html", "/public/patrones/entrenador_anita.html",
             "/public/patrones/granjita_hub.html"):
    code, _, _ = get(path)
    check(f"vieja {path} -> 404", code == 404, f"dio {code}")

# 3. Contenido: sin marca vieja, sin CSP bloqueante, sin 5174
inicio = get("/public/inicio.html")[2].decode("utf-8", "replace")
check("inicio sin CSP bloqueante", 'content-security-policy content="' not in inicio)
check("inicio sin 5174", "5174" not in inicio)
check("inicio carga temario.js", "temario.js" in inicio)
check("inicio sin mojibake Ã", "Ã" not in inicio and "Â" not in inicio)

pat = re.compile(r"[Gg]ranjita|[Aa]nita")
archivos = [p for p in ROOT.joinpath("public").rglob("*")
            if p.is_file() and "node_modules" not in str(p)
            and p.suffix in (".html", ".js", ".css", ".json")]
restos = [str(p.relative_to(ROOT)) for p in archivos
          if pat.search(p.read_text(encoding="utf-8", errors="replace"))]
check("cero granjita/anita en public/", not restos, "; ".join(restos[:5]))

nombres = [str(p.relative_to(ROOT)) for p in ROOT.joinpath("public").rglob("*")
           if pat.search(p.name)]
check("cero granjita/anita en nombres", not nombres, "; ".join(nombres[:5]))

# 4. Datos del curso integros
import json  # noqa: E402

code, _, raw = get("/public/data/course_data.json")
try:
    data = json.loads(raw.decode("utf-8"))
    niveles = {l.get("level"): len(l.get("classes", [])) + len(l.get("video_classes", []))
               for l in data.get("levels", [])}
    check("curso 26/27/80", niveles == {1: 26, 2: 27, 3: 80}, str(niveles))
except Exception as exc:  # noqa: BLE001
    check("curso JSON valido", False, str(exc)[:100])

print()
if fails:
    print(f"RESULTADO: {len(fails)} FALLAS")
    sys.exit(1)
print("RESULTADO: TODO OK")
