"""Servidor estatico local para el demo BinaryTeach (solo stdlib).

`python -m http.server` no declara charset en Content-Type, por eso el
navegador interpretaba los acentos con la codificacion local y mostraba
caracteres raros. Aqui se fuerza `charset=utf-8` en toda respuesta de texto.

Ademas sirve la raiz del proyecto (no `public/`) porque `public/index.html`
pide `../data/parsed/course_data.json` y `../data/assets/...`.
"""
from __future__ import annotations

import argparse
import mimetypes
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent

TEXT_TYPES = {
    ".html": "text/html",
    ".htm": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".json": "application/json",
    ".map": "application/json",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".xml": "application/xml",
    ".svg": "image/svg+xml",
    ".csv": "text/csv",
    ".ts": "text/plain",
}

NOT_FOUND = b"<!DOCTYPE html><meta charset=utf-8><title>404</title><p>No encontrado."

LANDING = "/public/inicio.html"


def content_type(path: Path) -> str:
    ext = path.suffix.lower()
    if ext in TEXT_TYPES:
        return f"{TEXT_TYPES[ext]}; charset=utf-8"
    guessed, _ = mimetypes.guess_type(path.name)
    return guessed or "application/octet-stream"


class Handler(SimpleHTTPRequestHandler):
    server_version = "BinaryTeachStatic/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))

    def guess_type(self, path):
        return content_type(Path(str(path)))

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def send_header(self, keyword, value):
        if keyword.lower() == "content-type" and "charset=" not in value:
            target = self._charset_target()
            if target.startswith("text/") or target in (
                "application/json", "application/javascript", "image/svg+xml",
            ):
                value = f"{value}; charset=utf-8"
        super().send_header(keyword, value)

    def _charset_target(self) -> str:
        raw = unquote(urlsplit(self.path).path)
        path = (ROOT / raw.lstrip("/")).resolve()
        if path.is_dir():
            path = path / "index.html"
        if not path.is_file():
            guessed, _ = mimetypes.guess_type(path.name)
            return guessed or ""
        return content_type(path).split(";", 1)[0].strip()

    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        if path in ("", "/"):
            self.send_response(302)
            self.send_header("Location", LANDING)
            self.end_headers()
            return
        if path == "/favicon.ico":
            self.send_response(404)
            self.end_headers()
            return
        super().do_GET()

    def do_POST(self):
        path = unquote(urlsplit(self.path).path)
        if path == "/api/chat":
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            import json, urllib.request, os
            
            # Read GROQ_API_KEY from .dev.vars if not in env
            api_key = os.environ.get("GROQ_API_KEY")
            if not api_key:
                try:
                    with open(ROOT / ".dev.vars", "r") as f:
                        for line in f:
                            if line.startswith("GROQ_API_KEY="):
                                api_key = line.strip().split("=", 1)[1]
                                break
                except:
                    pass
            
            if not api_key:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(b'{"error":"GROQ_API_KEY no encontrada"}')
                return

            try:
                data = json.loads(body)
                messages = data.get("messages", [])
                
                system_prompt = {
                    "role": "system",
                    "content": "Eres un experto mentor de trading de opciones binarias exclusivo para la plataforma Binomo. Tu único propósito es enseñar sobre lectura de velas, patrones chartistas y los indicadores: RSI, MACD, Fractals, Momentum, Bollinger Bands, Fibonacci, Alligator, etc. Si el usuario pregunta algo fuera del trading o de estas herramientas, debes negarte cortésmente a responder y redirigir la conversación al trading."
                }
                
                req_data = json.dumps({
                    "model": "openai/gpt-oss-20b",
                    "messages": [system_prompt] + messages,
                    "temperature": 0.7
                }).encode('utf-8')
                
                req = urllib.request.Request(
                    "https://api.groq.com/openai/v1/chat/completions",
                    data=req_data,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                        "User-Agent": "Mozilla/5.0"
                    },
                    method="POST"
                )
                
                with urllib.request.urlopen(req) as response:
                    res_body = response.read()
                    res_json = json.loads(res_body)
                    reply = res_json["choices"][0]["message"]["content"]
                    
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.end_headers()
                    self.wfile.write(json.dumps({"reply": reply}).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return
            
        self.send_response(404)
        self.end_headers()


def main():
    parser = argparse.ArgumentParser(description="Servidor estatico local BinaryTeach")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=3000)
    args = parser.parse_args()
    handler = partial(Handler)
    print(f"Landing : http://{args.host}:{args.port}/")
    print(f"LMS     : http://{args.host}:{args.port}/public/index.html")
    ThreadingHTTPServer((args.host, args.port), handler).serve_forever()


if __name__ == "__main__":
    main()
