"""Small local backend for the BinaryTeach demo (stdlib only)."""
from __future__ import annotations

import argparse
from contextlib import contextmanager
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import time
import uuid
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, urlsplit

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "data" / "lms.sqlite3"
ADMIN_WA = "573115893220"
COOKIE = "bt_student"
ADMIN_SESSIONS: dict[str, float] = {}
LEVEL_URLS: dict[int, set[str]] = {}
LEVEL_ORDER: list[int] = []
ADMIN_PASSWORD = ""
SECURE_COOKIE = False


@contextmanager
def db():
    con = sqlite3.connect(DB_PATH, timeout=10)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys=ON")
    try:
        yield con
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with db() as con:
        con.executescript("""
            CREATE TABLE IF NOT EXISTS students (
                id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '',
                created_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS progress (
                student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                lesson_url TEXT NOT NULL, updated_at INTEGER NOT NULL,
                PRIMARY KEY (student_id, lesson_url)
            );
            CREATE TABLE IF NOT EXISTS approval_requests (
                id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES students(id),
                level INTEGER NOT NULL, state TEXT NOT NULL DEFAULT 'pending',
                created_at INTEGER NOT NULL, reviewed_at INTEGER
            );
            CREATE TABLE IF NOT EXISTS unlocks (
                student_id TEXT NOT NULL REFERENCES students(id), level INTEGER NOT NULL,
                request_id TEXT NOT NULL REFERENCES approval_requests(id),
                created_at INTEGER NOT NULL, PRIMARY KEY (student_id, level)
            );
            CREATE UNIQUE INDEX IF NOT EXISTS one_pending_request
                ON approval_requests(student_id,level) WHERE state='pending';
        """)


def load_course():
    with (ROOT / "data" / "parsed" / "course_data.json").open(encoding="utf-8") as f:
        data = json.load(f)
    for level in data.get("levels", []):
        number = int(level["level"])
        urls = set()
        for lesson in (level.get("classes") or []) + (level.get("video_classes") or []):
            if lesson.get("url"):
                urls.add(lesson["url"].split("#", 1)[0].rstrip("/") + "/")
        LEVEL_URLS[number] = urls
    LEVEL_ORDER[:] = sorted(LEVEL_URLS)


def normalized(url: str) -> str:
    return url.split("#", 1)[0].rstrip("/") + "/"


def get_student(handler, create=True):
    jar = SimpleCookie()
    try:
        jar.load(handler.headers.get("Cookie", ""))
        token = jar[COOKIE].value
    except Exception:
        token = ""
    token_hash = hashlib.sha256(token.encode()).hexdigest() if token else ""
    with db() as con:
        row = con.execute("SELECT id FROM students WHERE token_hash=?", (token_hash,)).fetchone() if token else None
        if row:
            return row["id"]
        if not create:
            return None
        token = secrets.token_urlsafe(32)
        student_id = uuid.uuid4().hex[:12].upper()
        con.execute("INSERT INTO students(id,token_hash,created_at) VALUES(?,?,?)",
                    (student_id, hashlib.sha256(token.encode()).hexdigest(), int(time.time())))
    secure = "; Secure" if SECURE_COOKIE else ""
    handler.send_header("Set-Cookie", f"{COOKIE}={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000{secure}")
    return student_id


def student_snapshot(student_id):
    with db() as con:
        done = {r[0] for r in con.execute("SELECT lesson_url FROM progress WHERE student_id=?", (student_id,))}
        unlocked = {r[0] for r in con.execute("SELECT level FROM unlocks WHERE student_id=?", (student_id,))}
        requests = [dict(r) for r in con.execute(
            "SELECT id,level,state,created_at FROM approval_requests WHERE student_id=? ORDER BY created_at DESC",
            (student_id,))]
    for index, level in enumerate(LEVEL_ORDER):
        if level in unlocked or index == 0:
            unlocked.add(level)
        elif all(url in done for url in LEVEL_URLS[LEVEL_ORDER[index - 1]]):
            unlocked.add(level)
    return {"doneUrls": sorted(done), "unlockedLevels": sorted(unlocked), "requests": requests}


class Handler(SimpleHTTPRequestHandler):
    server_version = "BinaryTeachDemo/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))

    def send_json(self, code, payload, cookie_student=False):
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        if cookie_student:
            # get_student queued Set-Cookie; the header must be emitted before end_headers.
            pass
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length > 64_000:
            raise ValueError("Solicitud demasiado grande")
        raw = self.rfile.read(length) if length else b"{}"
        data = json.loads(raw.decode("utf-8"))
        if not isinstance(data, dict):
            raise ValueError("Cuerpo JSON no válido")
        return data

    def admin_ok(self):
        token = self.headers.get("Authorization", "").removeprefix("Bearer ")
        expiry = ADMIN_SESSIONS.get(token, 0)
        if expiry < time.time():
            ADMIN_SESSIONS.pop(token, None)
            return False
        return True

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == "/api/health":
            return self.send_json(200, {"ok": True})
        if path == "/api/student":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            student_id = get_student(self)
            self.end_headers()
            self.wfile.write(json.dumps(student_snapshot(student_id)).encode("utf-8"))
            return
        if path == "/api/admin/requests":
            if not self.admin_ok(): return self.send_json(401, {"error": "Inicia sesión como administrador."})
            with db() as con:
                rows = [dict(r) for r in con.execute("""
                    SELECT r.id,r.level,r.state,r.created_at,s.id AS student_code,s.name,s.phone,
                    (SELECT COUNT(*) FROM progress p WHERE p.student_id=s.id) AS done_count
                    FROM approval_requests r JOIN students s ON s.id=r.student_id
                    WHERE r.state='pending' ORDER BY r.created_at
                """)]
            return self.send_json(200, {"requests": rows})
        if path == "/":
            self.send_response(302); self.send_header("Location", "/public/"); self.end_headers(); return
        return super().do_GET()

    def do_POST(self):
        path = urlsplit(self.path).path
        try:
            body = self.read_json()
        except (ValueError, json.JSONDecodeError, UnicodeDecodeError) as exc:
            return self.send_json(400, {"error": str(exc)})

        if path == "/api/admin/login":
            supplied = str(body.get("password", ""))
            if not hmac.compare_digest(supplied, ADMIN_PASSWORD):
                return self.send_json(401, {"error": "Contraseña incorrecta."})
            token = secrets.token_urlsafe(32)
            ADMIN_SESSIONS[token] = time.time() + 8 * 3600
            return self.send_json(200, {"token": token})

        if path.startswith("/api/admin/requests/"):
            if not self.admin_ok(): return self.send_json(401, {"error": "Inicia sesión como administrador."})
            request_id = path.rsplit("/", 1)[-1]
            decision = body.get("decision")
            if decision not in ("approve", "deny"):
                return self.send_json(400, {"error": "Decisión no válida."})
            with db() as con:
                row = con.execute("SELECT student_id,level,state FROM approval_requests WHERE id=?", (request_id,)).fetchone()
                if not row or row["state"] != "pending": return self.send_json(404, {"error": "Solicitud no encontrada o ya revisada."})
                con.execute("UPDATE approval_requests SET state=?,reviewed_at=? WHERE id=?",
                            ("approved" if decision == "approve" else "denied", int(time.time()), request_id))
                if decision == "approve":
                    con.execute("INSERT OR REPLACE INTO unlocks(student_id,level,request_id,created_at) VALUES(?,?,?,?)",
                                (row["student_id"], row["level"], request_id, int(time.time())))
            return self.send_json(200, {"ok": True})

        student_id = get_student(self, create=False)
        if not student_id:
            return self.send_json(401, {"error": "Sesión de alumno no encontrada. Recarga el curso."})

        if path == "/api/progress":
            raw = body.get("doneUrls", [])
            if not isinstance(raw, list) or len(raw) > 200:
                return self.send_json(400, {"error": "Progreso no válido."})
            allowed = {url for urls in LEVEL_URLS.values() for url in urls}
            done = {normalized(str(url)) for url in raw if isinstance(url, str)} & allowed
            with db() as con:
                con.execute("DELETE FROM progress WHERE student_id=?", (student_id,))
                con.executemany("INSERT INTO progress(student_id,lesson_url,updated_at) VALUES(?,?,?)",
                                [(student_id, url, int(time.time())) for url in done])
            return self.send_json(200, student_snapshot(student_id))

        if path == "/api/requests":
            try: level = int(body.get("level"))
            except (TypeError, ValueError): return self.send_json(400, {"error": "Nivel no válido."})
            snap = student_snapshot(student_id)
            next_level = next((n for n in LEVEL_ORDER if n not in snap["unlockedLevels"]), None)
            if level not in LEVEL_URLS or level != next_level:
                return self.send_json(409, {"error": "Solo se puede solicitar el siguiente nivel bloqueado."})
            name, phone = str(body.get("name", "")).strip()[:100], str(body.get("phone", "")).strip()[:30]
            if not name or len(phone) < 7:
                return self.send_json(400, {"error": "Escribe tu nombre y WhatsApp para la solicitud."})
            with db() as con:
                con.execute("UPDATE students SET name=?,phone=? WHERE id=?", (name, phone, student_id))
                existing = con.execute("SELECT id FROM approval_requests WHERE student_id=? AND level=? AND state='pending'",
                                       (student_id, level)).fetchone()
                request_id = existing["id"] if existing else uuid.uuid4().hex[:10].upper()
                if not existing:
                    con.execute("INSERT INTO approval_requests(id,student_id,level,created_at) VALUES(?,?,?,?)",
                                (request_id, student_id, level, int(time.time())))
            counts = {n: sum(1 for url in LEVEL_URLS[n] if url in snap["doneUrls"]) for n in LEVEL_ORDER}
            status = ", ".join(f"Nivel {n}: {counts[n]}/{len(LEVEL_URLS[n])}" for n in LEVEL_ORDER)
            message = f"Hola, solicito autorización para continuar al Nivel {level}. Código alumno: {student_id}. Solicitud: {request_id}. Progreso: {status}. Mi nombre: {name}. Mi WhatsApp: {phone}."
            wa_url = f"https://wa.me/{ADMIN_WA}?text={quote(message)}"
            return self.send_json(201, {"requestId": request_id, "whatsappUrl": wa_url})

        return self.send_json(404, {"error": "Ruta API no encontrada."})

    def translate_path(self, path):
        route = urlsplit(path).path
        if route.startswith("/public/"):
            relative = route[len("/public/"):]
            base = ROOT / "public"
        elif route in ("/data/parsed/course_data.json", "/data/parsed/search_index.json"):
            relative, base = route[len("/data/"):], ROOT / "data"
        elif route.startswith("/data/assets/images/"):
            relative, base = route[len("/data/"):], ROOT / "data"
        elif route.startswith("/data/assets/docs/"):
            relative, base = route[len("/data/"):], ROOT / "data"
        else:
            return str(ROOT / "__not_found__")
        candidate = (base / relative).resolve()
        if candidate != base.resolve() and base.resolve() not in candidate.parents:
            return str(ROOT / "__not_found__")
        return str(candidate)


def main():
    global ADMIN_PASSWORD, SECURE_COOKIE
    parser = argparse.ArgumentParser(description="Servidor local BinaryTeach LMS")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8090)
    args = parser.parse_args()
    ADMIN_PASSWORD = os.environ.get("BT_ADMIN_PASSWORD", "")
    SECURE_COOKIE = os.environ.get("BT_COOKIE_SECURE", "0") == "1"
    if len(ADMIN_PASSWORD) < 8:
        raise SystemExit("Define BT_ADMIN_PASSWORD con al menos 8 caracteres antes de iniciar.")
    load_course(); init_db()
    print(f"BinaryTeach LMS: http://{args.host}:{args.port}/public/")
    print(f"Panel admin: http://{args.host}:{args.port}/public/admin.html")
    ThreadingHTTPServer((args.host, args.port), Handler).serve_forever()


if __name__ == "__main__":
    main()
