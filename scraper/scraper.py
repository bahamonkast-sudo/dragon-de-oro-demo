#!/usr/bin/env python3
"""
BinaryTeach course scraper
=========================

Clona de forma estructurada el curso "Curso de Opciones Binarias con Accion del
Precio" de https://www.binaryteach.com/ junto con sus subpaginas (Nivel 1, Nivel 2,
Nivel 3 y las clases asociadas).

El pipeline tiene cuatro fases:

    1. CRAWL    Descarga BFS de HTML crudo (respeta robots.txt, delay, reintentos).
    2. PARSE    Convierte cada HTML en un JSON de bloques semanticos, resolviendo
                 cada imagen a su variante de mayor resolucion y dejando las rutas
                 apuntando al archivo local.
    3. ASSETS   Descarga todas las imagenes a data/assets/images/ con nombres
                 deterministas del tipo nivel-1-clase-02-soportes-01.jpg.
    4. RENDER   Genera una vista estatica 100% offline en public/.

Gestion de imagenes (fase 2-3), en detalle:

    * Se revisan `src`, `srcset`, `data-src`, `data-srcset`, `data-lazy-src`,
      `data-lazy-srcset`, `data-large_image`, `data-original` y `data-hi-res-src`.
    * Se revisan los enlaces `<a>` que apuntan a imagenes: si envuelven a un
      `<img>` se toman como version de alta resolucion (patron lightbox de
      WordPress); si no, se registran como "imagen enlazada sin mostrar".
    * De `srcset` se elige siempre el candidato de mayor descriptor.
    * A cada candidata se le anaden sus variantes originales de WordPress
      (`nombre-1024x576.jpg` -> `nombre-scaled.jpg` -> `nombre.jpg`) y se
      descargan por orden de prioridad hasta que una funciona.
    * Las descargas de assets viajan con User-Agent de navegador de escritorio y
      `Referer: https://www.binaryteach.com/` para evitar bloqueos por hotlinking.

Salidas:

    data/raw/<slug>.html            HTML crudo, byte a byte como lo sirvio el servidor
    data/parsed/<slug>.json         Contenido estructurado por pagina
    data/parsed/manifest.json       Arbol del curso (niveles -> clases)
    data/parsed/course_data.json    Dataset unico con TODO el curso ya offline
    data/assets/images/*.<ext>      Imagenes descargadas (originales cuando existen)
    data/assets-index.json          Mapa URL remota -> archivo local
    public/index.html               Portada del clon
    public/modules/<slug>.html      Una pagina por clase/recurso
    public/css/theme.css            Tema de lectura
    public/js/app.js                Interaccion minima

Uso:

    python scraper/scraper.py                     # scrape completo + render
    python scraper/scraper.py --force             # vuelve a descargar todo
    python scraper/scraper.py --no-assets         # omite imagenes
    python scraper/scraper.py --no-render         # solo data/
    python scraper/scraper.py --seeds a/ b/ c/    # seeds alternativos
    python scraper/scraper.py --asset-naming hash # nombres por hash
    python scraper/scraper.py --max-depth 3       # alcanzable mas profundo

Nota: el contenido clonado es propiedad de Binary Teach. Este scraper esta pensado
para archivo/evaluacion tecnica. Ver la seccion "Aviso legal" del README.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import re
import shutil
import sys
import time
import unicodedata
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator, Sequence
from urllib.parse import parse_qs, unquote, urljoin, urlparse, urlunparse
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup, NavigableString, Tag
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

LOG = logging.getLogger("binaryteach")

# ---------------------------------------------------------------------------
# Configuracion
# ---------------------------------------------------------------------------

SITE_HOST = "www.binaryteach.com"
BASE_URL = f"https://{SITE_HOST}/"

#: Miniaturas de YouTube, de mayor a menor resolucion. Para cada video se
#: prueban en orden hasta que una exista: many videos no tienen maxresdefault.
YOUTUBE_THUMBS: tuple[tuple[str, int], ...] = (
    ("maxresdefault.jpg", 1280),
    ("sddefault.jpg", 640),
    ("hqdefault.jpg", 480),
)

#: Cabeceras para las paginas: crawler identificado, no se hace pasar por humano.
USER_AGENT = (
    "BinaryTeachCourseArchiver/1.0 "
    "(+local educational archive; contact: local-user)"
)

#: Cabeceras para los assets: algunos CDN bloquean hotlinking por User-Agent.
DESKTOP_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
SITE_REFERER = BASE_URL

#: Paginas semilla del curso. Editar o sustituir con --seeds.
DEFAULT_SEEDS: tuple[str, ...] = (
    "curso-de-opciones-binarias-con-accion-del-precio",
    "curso-de-opciones-binarias-nivel-1",
    "curso-de-opciones-binarias-nivel-2",
    "curso-de-opciones-binarias-nivel-3",
    "accion-del-precio-opciones-binarias",
    "diccionario-del-curso-de-opciones-binarias",
)

#: Clasificacion de paginas por slug.
COURSE_SLUG = "curso-de-opciones-binarias-con-accion-del-precio"
LEVEL_RE = re.compile(r"^curso-de-opciones-binarias-nivel-(\d+)$")

#: Cualquier categoria de WordPress cuyo slug empiece por esto es una clase.
COURSE_CATEGORY_PREFIX = "curso"

#: Paginas del sitio que no son contenido del curso (chrome, ventas, legales).
EXCLUDE_SLUGS = frozenset(
    {
        "salon-virtual-de-binary-teach",
        "donaciones",
        "gracias",
        "certificado",
        "acceso-a-ai-2021",
        "linksbt",
        "politica-de-cookies",
        "politica-de-privacidad",
        "faq",
        "preguntas-frecuentes-faq",
        "dudas-aula",
        "reportes-y-comentarios",
        "area-de-principiantes",
    }
)

#: Patrones de URL que nunca se rastrean (admin, feeds, archivos, paginacion...).
SKIP_URL_RE = re.compile(
    r"""
      /wp-(?:admin|json|content|includes|login|cron)  # core de WordPress
    | /xmlrpc\.php
    | /feed/?$
    | /comments?/feed
    | /\?replytocom
    | /category/
    | /tag/
    | /author/
    | /page/\d+/?$
    | /\d{4}/\d{2}/
    | /(?:attachment|attachments)/
    | /search/
    """,
    re.IGNORECASE | re.VERBOSE,
)

#: Contenedor principal del contenido, en orden de preferencia.
CONTENT_SELECTORS: tuple[str, ...] = (
    "div.the_content_wrapper",
    "div.entry-content",
    "main .mfn-blog-content",
    "article .post-wrapper-content",
    "#Content .entry-content",
    "main",
    "article",
)

#: Selectores que se eliminan del contenido antes de parsearlo.
JUNK_SELECTORS: tuple[str, ...] = (
    "script",
    "style",
    "noscript",
    "div.wpdcom",
    "#disqus_thread",
    ".sharedaddy",
    ".jp-relatedposts",
    ".mfn-share",
    ".fixed-nav",
    "nav",
    "form",
    "button",
    "link",
    "meta",
)

#: Subcarpeta de assets dentro de data/assets/.
ASSETS_SUBDIR = "images"

#: Subcarpeta de documentos (PDF) dentro de data/assets/.
ASSETS_DOCS_SUBDIR = "docs"

#: Hosts de los que se descargan recursos estaticos.
ASSET_HOSTS = {SITE_HOST, "i.ytimg.com", "img.youtube.com"}

#: Documentos que el curso enlaza y que caben en el clon. El glosario esta en
#: WordPress; el manual de patrones se sirve desde MediaFire (hay que resolver
#: su pagina intermedia). Con esto el curso deja de depender de terceros.
COURSE_DOCUMENTS: tuple[tuple[str, str], ...] = (
    (
        "https://www.binaryteach.com/wp-content/uploads/2019/06/"
        "Glosario-de-Opciones-Binarias-Binary-Teach.pdf",
        "glosario-de-opciones-binarias.pdf",
    ),
    (
        "https://www.mediafire.com/file/61juufuq29ebfli/manualcandlestick.pdf",
        "manual-de-patrones-de-velas.pdf",
    ),
)

#: Extension de imagen (ignora la query string).
IMAGE_EXT_RE = re.compile(r"\.(?:jpe?g|png|gif|webp|svg|avif|bmp|ico)(?:[?#].*)?$", re.IGNORECASE)

#: Sufijo de tamano que WordPress anade a las miniaturas: `nombre-1024x576.jpg`.
WP_SIZE_SUFFIX_RE = re.compile(r"-(\d{2,5})x(\d{2,5})$")

#: Sufijo que WordPress anade a la version "grande": `nombre-scaled.jpg`.
WP_SCALED_SUFFIX = "-scaled"

#: Atributos que contienen una URL de imagen de tamaño completo.
IMAGE_SRC_ATTRS: tuple[str, ...] = (
    "data-large_image",
    "data-large-image",
    "data-hi-res-src",
    "data-original",
    "data-lazy-src",
    "data-src",
    "data-original-src",
    "src",
)

#: Atributos que contienen un `srcset` de imagenes.
IMAGE_SRCSET_ATTRS: tuple[str, ...] = (
    "data-lazy-srcset",
    "data-srcset",
    "srcset",
)

#: Etiquetas que, si contienen una imagen, "poseen" esa imagen.
IMAGE_HOLDER_TAGS = ("figure", "p", "li", "td", "blockquote", "div", "a", "section")

#: Tamano maximo por asset (bytes).
MAX_ASSET_BYTES = 25 * 1024 * 1024

#: Numero de palabras del slug de la clase que se incluye en el nombre del asset.
ASSET_NAME_MAX_SLUG = 46

#: Etiquetas inline permitidas al sanear HTML de bloques.
INLINE_TAGS = {
    "a", "b", "strong", "i", "em", "u", "s", "span", "br", "code", "sup", "sub",
    "mark", "small", "abbr", "time", "del", "ins",
}

#: Tags que se convierten en bloques de primer nivel.
BLOCK_TAGS = {
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "ul", "ol", "table", "blockquote", "pre",
    "img", "iframe", "figure", "hr", "video", "audio", "embed",
}

WHITESPACE_RE = re.compile(r"\s+")
YOUTUBE_ID_RE = re.compile(r"(?:embed/|youtu\.be/|v=|/v/|/shorts/)([A-Za-z0-9_-]{11})")
VIMEO_ID_RE = re.compile(r"player\.vimeo\.com/video/(\d+)")


# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------


def slugify(value: str) -> str:
    """Convierte texto en un slug estable y seguro para nombres de archivo."""
    value = unicodedata.normalize("NFKD", value or "")
    value = value.encode("ascii", "ignore").decode("ascii").lower()
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value or "sin-slug"


def clean_text(value: str | None) -> str:
    """Colapsa espacios y recorta."""
    if not value:
        return ""
    return WHITESPACE_RE.sub(" ", value).strip()


def url_slug(url: str) -> str:
    """Slug de una URL de WordPress (ultimo segmento no vacio)."""
    path = urlparse(url).path.strip("/")
    if not path:
        return "portada"
    return unquote(path.split("/")[-1])


def normalize_url(url: str) -> str:
    """Canonicaliza una URL: sin query, sin fragmento, con barra final."""
    parsed = urlparse(url)
    scheme = parsed.scheme or "https"
    netloc = parsed.netloc.lower()
    path = re.sub(r"/{2,}", "/", parsed.path)
    if netloc == SITE_HOST and not path.endswith("/"):
        path += "/"
    return urlunparse((scheme, netloc, path, "", "", ""))


def is_same_site(url: str) -> bool:
    return urlparse(url).netloc.lower() in {SITE_HOST, SITE_HOST.removeprefix("www.")}


def is_image_url(url: str) -> bool:
    """True si la URL apunta a un archivo de imagen (ignorando la query)."""
    return bool(url) and bool(IMAGE_EXT_RE.search(urlparse(url).path))


def should_crawl(url: str) -> bool:
    """True si la URL es una pagina de contenido rastreable."""
    if not is_same_site(url):
        return False
    if urlparse(url).query:
        return False
    if url_slug(url) in EXCLUDE_SLUGS:
        return False
    return not SKIP_URL_RE.search(urlparse(url).path)


def parse_srcset(value: str) -> list[tuple[str, int]]:
    """Parsea un `srcset` en [(url, ancho_px)]. El ancho es 0 si no hay descriptor."""
    out: list[tuple[str, int]] = []
    for part in re.split(r",\s*(?=\S)", value or ""):
        bits = part.strip().split()
        if not bits:
            continue
        url = bits[0]
        width = 0
        if len(bits) > 1:
            descriptor = bits[1]
            if descriptor.endswith("w"):
                try:
                    width = int(descriptor[:-1] or 0)
                except ValueError:
                    width = 0
            elif descriptor.endswith("x"):
                try:
                    width = int(float(descriptor[:-1]) * 1000)
                except ValueError:
                    width = 0
        out.append((url, width))
    return out


def best_srcset_url(value: str) -> str:
    """Devuelve la candidata de mayor resolucion de un `srcset`."""
    candidates = parse_srcset(value)
    if not candidates:
        return ""
    return max(candidates, key=lambda item: item[1])[0]


def wp_original_variants(url: str) -> list[str]:
    """Variante de maxima resolucion que WordPress deriva del archivo original.

        foto-1024x576.jpg        -> [foto.jpg]
        foto-300x200-scaled.jpg  -> [foto.jpg]
        foto-scaled.jpg          -> [foto.jpg]
        foto.jpg                 -> []   (ya es el original)

    WordPress recorta las miniaturas con el sufijo `-ANCHOxALTO` y, cuando la
    imagen supera el umbral de "big image", publica ademas una copia
    `-scaled`. Quitando ambos queda el archivo tal cual se subio, que es la
    version de mayor resolucion. Se devuelve vacia si la URL ya es el original.
    """
    parsed = urlparse(url)
    stem, dot, ext = parsed.path.rpartition(".")
    if not dot or not stem:
        return []

    base = WP_SIZE_SUFFIX_RE.sub("", stem)
    if base.lower().endswith(WP_SCALED_SUFFIX):
        base = base[: -len(WP_SCALED_SUFFIX)]
    if base == stem:
        return []

    query = f"?{parsed.query}" if parsed.query else ""
    original = urlunparse(parsed._replace(path=f"{base}.{ext}{query}"))
    return [] if original == url else [original]


def file_extension(url: str) -> str:
    """Extension normalizada (sin punto, en minusculas) de una URL de imagen."""
    ext = urlparse(url).path.rpartition(".")[2].lower()
    ext = re.sub(r"[^a-z0-9]", "", ext)
    return ext or "jpg"


def short_hash(url: str, length: int = 8) -> str:
    return hashlib.sha1(url.encode("utf-8", "replace")).hexdigest()[:length]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


# ---------------------------------------------------------------------------
# Modelo de datos
# ---------------------------------------------------------------------------


@dataclass
class Asset:
    """Un recurso estatico referenciado por el contenido.

    `candidates` es la cadena de candidatos en orden de prioridad (de mayor a
    menor resolucion). Al descargar se prueba el primero que funcione, y el
    ganador se cachea en `chosen` para que las siguientes ejecuciones no
    repitan las descargas fallidas.
    """

    url: str
    candidates: list[dict[str, str]] = field(default_factory=list)
    chosen: dict[str, str] | None = None
    local: str | None = None       # ruta relativa a la raiz del proyecto
    status: str = "pending"        # ok | skipped | failed
    bytes: int = 0
    kind: str = "image"            # image | poster

    def to_dict(self) -> dict[str, Any]:
        return {
            "url": self.url,
            "kind": self.kind,
            "candidates": self.candidates,
            "chosen": self.chosen,
            "local": self.local,
            "status": self.status,
            "bytes": self.bytes,
        }


@dataclass
class Page:
    """Una pagina del curso ya descargada y parseada."""

    url: str
    slug: str
    depth: int
    title: str = ""
    description: str = ""
    kind: str = "class"           # course | level | class | resource | unknown
    level: int | None = None
    order: int | None = None
    date_published: str | None = None
    date_modified: str | None = None
    author: str | None = None
    categories: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    blocks: list[dict[str, Any]] = field(default_factory=list)
    links: list[dict[str, str]] = field(default_factory=list)
    linked_images: list[dict[str, Any]] = field(default_factory=list)
    videos: list[dict[str, str]] = field(default_factory=list)
    assets: list[Asset] = field(default_factory=list)
    prev_url: str | None = None
    next_url: str | None = None
    status: str = "pending"       # ok | failed | not_found | skipped
    error: str | None = None

    @property
    def word_count(self) -> int:
        """Palabras de texto plano, contando tambien listas y celdas de tabla."""
        total = 0
        for block in self.blocks:
            kind = block.get("type")
            if kind == "list":
                total += sum(len(i.get("text", "").split()) for i in block.get("items", []))
            elif kind == "table":
                total += sum(
                    len(WHITESPACE_RE.sub(" ", cell).split())
                    for row in block.get("rows", [])
                    for cell in row
                )
            else:
                total += len(block.get("text", "").split())
        return total

    def asset_prefix(self) -> str:
        """Prefijo de los nombres de archivo de esta pagina.

        Las clases de un nivel llevan `nivel-1-clase-02`; el resto no lleva
        prefijo porque el slug de la pagina ya identifica el modulo.
        """
        if self.level and self.order:
            return f"nivel-{self.level}-clase-{self.order:02d}"
        return ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "url": self.url,
            "slug": self.slug,
            "depth": self.depth,
            "title": self.title,
            "description": self.description,
            "kind": self.kind,
            "level": self.level,
            "order": self.order,
            "date_published": self.date_published,
            "date_modified": self.date_modified,
            "author": self.author,
            "categories": self.categories,
            "tags": self.tags,
            "word_count": self.word_count,
            "videos": self.videos,
            "links": self.links,
            "linked_images": self.linked_images,
            "assets": [a.to_dict() for a in self.assets],
            "blocks": self.blocks,
            "status": self.status,
            "error": self.error,
        }


# ---------------------------------------------------------------------------
# Fetcher
# ---------------------------------------------------------------------------


class Fetcher:
    """Cliente HTTP con robots.txt, reintentos, delay y cache en disco."""

    def __init__(
        self,
        cache_dir: Path,
        *,
        delay: float = 1.0,
        timeout: float = 30.0,
        retries: int = 3,
        force: bool = False,
        user_agent: str = USER_AGENT,
        browser_ua: bool = True,
    ) -> None:
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.delay = delay
        self.timeout = timeout
        self.force = force
        self._last_request = 0.0
        self._robots: RobotFileParser | None = None
        #: Codigo HTTP de la ultima peticion (util para distinguir 404 del sitio).
        self.last_status = 0

        self.user_agent = user_agent
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": user_agent,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
            }
        )
        #: Cabeceras de navegador para assets (evita 403 por hotlinking).
        self.asset_headers = {
            "User-Agent": DESKTOP_USER_AGENT if browser_ua else user_agent,
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
            "Referer": SITE_REFERER,
            "Sec-Fetch-Dest": "image",
            "Sec-Fetch-Mode": "no-cors",
            "Sec-Fetch-Site": "same-origin",
        }

        retry = Retry(
            total=retries,
            connect=retries,
            read=retries,
            backoff_factor=1.0,
            status_forcelist=(408, 425, 429, 500, 502, 503, 504),
            allowed_methods=frozenset({"GET", "HEAD"}),
            raise_on_status=False,
        )
        adapter = HTTPAdapter(max_retries=retry, pool_connections=16, pool_maxsize=16)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)

    # -- robots ------------------------------------------------------------

    def robots(self) -> RobotFileParser:
        if self._robots is None:
            rp = RobotFileParser()
            rp.set_url(urljoin(BASE_URL, "/robots.txt"))
            try:
                resp = self.session.get(rp.url, timeout=self.timeout)
                if resp.status_code == 200:
                    rp.parse(resp.text.splitlines())
                    crawl_delay = rp.crawl_delay(self.user_agent) or rp.crawl_delay("*")
                    if crawl_delay:
                        self.delay = max(self.delay, float(crawl_delay))
                        LOG.info("robots.txt fija Crawl-delay=%ss", self.delay)
                else:
                    rp.allow_all = True
            except requests.RequestException as exc:
                LOG.warning("No se pudo leer robots.txt (%s); se asume permitido", exc)
                rp.allow_all = True
            self._robots = rp
        return self._robots

    def allowed(self, url: str) -> bool:
        return self.robots().can_fetch(self.user_agent, url)

    # -- rate limit -------------------------------------------------------

    def _throttle(self) -> None:
        elapsed = time.monotonic() - self._last_request
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)
        self._last_request = time.monotonic()

    # -- descarga de paginas ----------------------------------------------

    def get(self, url: str, cache_name: str | None = None) -> str | None:
        """Descarga una pagina. Devuelve el HTML (cacheado) o None si falla."""
        cached = self.cache_dir / (cache_name or f"{slugify(url)}.html")
        if cached.exists() and not self.force:
            LOG.debug("cache %s", cached.name)
            return cached.read_text(encoding="utf-8", errors="replace")

        if not self.allowed(url):
            LOG.warning("robots.txt bloquea %s", url)
            self.last_status = 999
            return None

        self._throttle()
        try:
            resp = self.session.get(url, timeout=self.timeout)
        except requests.RequestException as exc:
            LOG.error("fallo de red %s: %s", url, exc)
            self.last_status = 0
            return None

        self.last_status = resp.status_code
        if resp.status_code == 404:
            # Enlace muerto en el sitio de origen: no es un fallo del scraper.
            LOG.warning("enlace roto en el sitio de origen (404): %s", url)
            return None
        if resp.status_code != 200:
            LOG.error("HTTP %s en %s", resp.status_code, url)
            return None

        resp.encoding = resp.apparent_encoding or "utf-8"
        html = resp.text
        cached.write_text(html, encoding="utf-8")
        LOG.info("descargado %s (%d bytes)", url, len(html))
        return html

    # -- descarga de assets -----------------------------------------------

    def get_external(self, url: str) -> str | None:
        """Descarga una pagina externa sin guardarla en la cache de `data/raw/`.

        Se usa para las playlists de YouTube, que no son paginas del curso y no
        deben mezclarse con el HTML del sitio. El HTML va a la cache propia de
        la playlist (`data/parsed/playlists/<id>.html`).
        """
        self._throttle()
        try:
            resp = self.session.get(url, timeout=self.timeout)
        except requests.RequestException as exc:
            LOG.error("fallo de red %s: %s", url, exc)
            self.last_status = 0
            return None

        self.last_status = resp.status_code
        if resp.status_code != 200:
            LOG.error("HTTP %s en %s", resp.status_code, url)
            return None
        return resp.text

    def get_bytes(self, url: str, referer: str | None = None) -> tuple[bytes, str] | None:
        """Descarga un asset binario con cabeceras de navegador + Referer.

        `referer` permite descargar un PDF desde la pagina que lo enlaza
        (algunos-hosters lo exigen) en vez del referer por defecto del sitio.
        """
        if not self.allowed(url):
            return None
        self._throttle()
        headers = dict(self.asset_headers)
        if referer:
            headers["Referer"] = referer
        try:
            resp = self.session.get(
                url, timeout=self.timeout, stream=True, headers=headers
            )
        except requests.RequestException as exc:
            LOG.error("fallo asset %s: %s", url, exc)
            self.last_status = 0
            return None

        if resp.status_code != 200:
            LOG.debug("asset %s -> HTTP %s", url, resp.status_code)
            self.last_status = resp.status_code
            return None

        self.last_status = resp.status_code

        chunks: list[bytes] = []
        size = 0
        try:
            for chunk in resp.iter_content(64 * 1024):
                size += len(chunk)
                if size > MAX_ASSET_BYTES:
                    LOG.error("asset demasiado grande, se omite: %s", url)
                    return None
                chunks.append(chunk)
        except requests.RequestException as exc:
            LOG.error("fallo asset (stream) %s: %s", url, exc)
            return None

        content_type = resp.headers.get("Content-Type", "")
        payload = b"".join(chunks)
        if not payload:
            return None
        # Algunos CDNs devuelven HTML de error con 200: descartar. Con un
        # referer propio se trata de una pagina intermedia legitima.
        if "text/html" in content_type and not is_image_url(url) and not referer:
            return None
        return payload, content_type


# ---------------------------------------------------------------------------
# Parser
# ---------------------------------------------------------------------------


class PageParser:
    """Convierte el HTML de una pagina de BinaryTeach en bloques semanticos."""

    def __init__(self, fetcher: Fetcher | None = None) -> None:
        self.fetcher = fetcher

    # -- helpers ----------------------------------------------------------

    @staticmethod
    def _soup(html: str) -> BeautifulSoup:
        return BeautifulSoup(html, "lxml")

    @staticmethod
    def _meta(soup: BeautifulSoup, *names: str) -> str:
        for name in names:
            tag = soup.find("meta", attrs={"property": name}) or soup.find(
                "meta", attrs={"name": name}
            )
            if tag and tag.get("content"):
                return clean_text(tag["content"])
        return ""

    @staticmethod
    def _content_root(soup: BeautifulSoup) -> Tag | None:
        for selector in CONTENT_SELECTORS:
            node = soup.select_one(selector)
            if node and clean_text(node.get_text(" ")):
                return node
        return None

    @staticmethod
    def _strip_junk(root: Tag) -> None:
        for selector in JUNK_SELECTORS:
            for node in root.select(selector):
                node.decompose()

    # -- sanitisacion de HTML inline --------------------------------------

    def _sanitize(self, node: Tag, page_url: str) -> str:
        """Devuelve el HTML inline permitido, con enlaces resueltos."""
        fragment = BeautifulSoup(str(node), "lxml")
        for element in list(fragment.descendants):
            if not isinstance(element, Tag):
                continue
            if element.name not in INLINE_TAGS:
                element.unwrap()
                continue
            for attr in list(element.attrs):
                if element.name == "a" and attr == "href":
                    continue
                del element[attr]
            if element.name == "a":
                href = normalize_url(urljoin(page_url, element.get("href", "")))
                element["href"] = href
                if is_same_site(href) and should_crawl(href):
                    element["class"] = "internal"
                else:
                    element["class"] = "external"
                    element["target"] = "_blank"
                    element["rel"] = "noopener nofollow"
        return "".join(str(c) for c in fragment.contents).strip()

    # -- resolucion de imagenes -------------------------------------------

    @staticmethod
    def _candidates_for(img: Tag, anchor: Tag | None, page_url: str) -> list[dict[str, str]]:
        """Cadena de candidatos de una imagen, de mayor a menor resolucion."""
        raw: list[tuple[str, str]] = []

        # 1. El enlace que envuelve a la imagen apunta a la version completa
        #    (patron lightbox de WordPress: <a href="original.jpg"><img src="-300x200.jpg"></a>).
        if anchor is not None and anchor.get("href"):
            raw.append(("anchor", anchor["href"]))

        # 2. srcset: gana siempre el descriptor mas alto.
        for attr in IMAGE_SRCSET_ATTRS:
            value = img.get(attr)
            if not value:
                continue
            best = best_srcset_url(value)
            if best:
                raw.append((attr, best))
                break

        # 3. Atributos de tamaño completo y lazy-load, de mas completo a menos.
        for attr in IMAGE_SRC_ATTRS:
            value = img.get(attr)
            if value:
                raw.append((attr, value))

        # Deduplicar y expandir. El original de WordPress va ANTES que la
        # variante que lo genero: se busca siempre la maxima resolucion y solo
        # se cae a la miniatura si el original no existe.
        seen: set[str] = set()
        out: list[dict[str, str]] = []
        for role, value in raw:
            url = urljoin(page_url, value.strip())
            if not is_image_url(url) or url in seen:
                continue
            for variant in [*wp_original_variants(url), url]:
                if variant in seen:
                    continue
                seen.add(variant)
                out.append(
                    {
                        "role": role if variant == url else "original",
                        "url": variant,
                        "width": variant_width(img, variant, url),
                    }
                )
        return out

    # -- video ------------------------------------------------------------

    def _classify_link(self, url: str) -> dict:
        """Decide que puede hacer el front con este enlace.

        - `kind: "page"`    -> hay pagina local en public/modules (navegacion SPA)
        - `kind: "video"`   -> es un video de YouTube (se remata luego con el id)
        - `kind: "youtube"` -> canal/perfil de YouTube, se queda en la guia
        - `kind: "pdf"`     -> documento, candidato a descargarse al clon
        - `kind: "external"`-> recurso realmente fuera del alcance del clon
        """
        parsed = urlparse(url)
        host = (parsed.hostname or "").lower()
        path = parsed.path

        if "youtube.com" in host or "youtu.be" in host:
            if YOUTUBE_ID_RE.search(url) or ("list=" in parsed.query):
                return {"kind": "video"}
            return {"kind": "youtube"}

        if SITE_HOST in host and "wp-content" not in path:
            slug = path.strip("/").split("/")[-1]
            if slug:
                return {"kind": "page", "slug": slug}

        if path.lower().endswith(".pdf") or "drive.google.com" in host:
            return {"kind": "pdf"}

        return {"kind": "external"}

    @staticmethod
    def _video_from_url(url: str, title: str = "") -> dict[str, str] | None:
        if not url:
            return None
        if "youtube.com" in url or "youtu.be" in url:
            if "list=" in url:
                plist = parse_qs(urlparse(url).query).get("list", [""])[0]
                if plist:
                    return {
                        "provider": "youtube-playlist",
                        "id": plist,
                        "url": url,
                        "title": title or "Lista de reproduccion",
                    }
            match = YOUTUBE_ID_RE.search(url)
            if match:
                return {
                    "provider": "youtube",
                    "id": match.group(1),
                    "url": url,
                    "title": title,
                }
        match = VIMEO_ID_RE.search(url)
        if match:
            return {"provider": "vimeo", "id": match.group(1), "url": url, "title": title}
        return None

    # -- pre-pasado de imagenes ------------------------------------------

    def _claim_images(
        self, root: Tag, page_url: str, counter: list[int]
    ) -> tuple[dict[int, dict[str, Any]], set[int]]:
        """Localiza cada `<img>` y decide que nodo "posee" esa imagen.

        Devuelve ({id(poseedor): bloque_de_imagen}, {id(poseedor): ancestros}).
        El poseedor es el `<figure>` mas cercano, o el `<a>` lightbox, o el primer
        contenedor de bloque. De ese modo un `<figure>` produce un solo bloque
        (imagen + pie) en vez de varios sueltos.
        """
        claimed: dict[int, dict[str, Any]] = {}
        ancestors: set[int] = set()
        used_holders: set[int] = set()

        any_source = IMAGE_SRC_ATTRS + IMAGE_SRCSET_ATTRS

        for img in root.find_all("img"):
            if not any(img.get(attr) for attr in any_source):
                continue

            figure = img.find_parent("figure")
            anchor = img.find_parent("a", href=True)
            holder: Tag = (figure or anchor) if (figure or anchor) else img
            if holder is img:
                for parent in img.parents:
                    if parent is root:
                        break
                    if parent.name in IMAGE_HOLDER_TAGS:
                        holder = parent
                        break

            # Dos imagenes no pueden compartir poseedor: la segunda baja a su
            # propio <a> o al propio <img>.
            if id(holder) in used_holders:
                holder = anchor if (anchor is not None and id(anchor) not in used_holders) else img
                if id(holder) in used_holders:
                    continue
            used_holders.add(id(holder))

            caption = ""
            if figure is not None:
                cap_tag = figure.find("figcaption")
                caption = clean_text(cap_tag.get_text(" ")) if cap_tag else ""

            candidates = self._candidates_for(img, anchor, page_url)
            if not candidates:
                continue

            def dimension(attr: str) -> int:
                value = img.get(attr)
                return int(value) if value and str(value).isdigit() else 0

            counter[0] += 1
            # WordPress no siempre pone width/height en el <img>; si faltan, el
            # sufijo de la URL ("nombre-1024x576.jpg") los delata.
            url_w, url_h = size_from_url(candidates[0]["url"])
            claimed[id(holder)] = {
                "type": "image",
                "src": "",
                "local": "",
                "remote_src": candidates[0]["url"],
                "candidates": candidates,
                "alt": clean_text(img.get("alt", "")),
                "caption": caption,
                "width": dimension("width") or url_w,
                "height": dimension("height") or url_h,
                "index": counter[0],
            }
            for parent in holder.parents:
                ancestors.add(id(parent))

        return claimed, ancestors

    def _claim_linked_images(self, root: Tag, page_url: str) -> list[dict[str, Any]]:
        """Enlaces `<a>` a imagenes que no envuelven a ningun `<img>`."""
        out: list[dict[str, Any]] = []
        seen: set[str] = set()
        for anchor in root.find_all("a", href=True):
            url = urljoin(page_url, anchor["href"].strip())
            if not is_image_url(url) or anchor.find("img") is not None:
                continue
            if url in seen:
                continue
            seen.add(url)
            out.append(
                {
                    "text": clean_text(anchor.get_text(" ")),
                    "remote_src": url,
                    "candidates": [
                        {"role": "anchor", "url": url, "width": 0},
                        *[
                            {"role": "original", "url": v, "width": 0}
                            for v in wp_original_variants(url)
                        ],
                    ],
                    "src": "",
                }
            )
        return out

    # -- bloques ----------------------------------------------------------

    def _blocks(
        self,
        root: Tag,
        page_url: str,
        claimed: dict[int, dict[str, Any]],
        ancestors: set[int],
    ) -> Iterator[dict[str, Any]]:
        """Recorre el arbol y emite un bloque por etiqueta de primer nivel.

        Los nodos que "poseen" una imagen se emiten como bloque de imagen; los
        que solo la contienen se atraviesan para llegar a ella.
        """
        for node in root.children:
            if not isinstance(node, Tag):
                continue
            key = id(node)
            if key in claimed:
                yield claimed[key]
                continue
            if key in ancestors or node.name not in BLOCK_TAGS:
                yield from self._blocks(node, page_url, claimed, ancestors)
                continue
            block = self._to_block(node, page_url)
            if block:
                yield block

    def _to_block(self, node: Tag, page_url: str) -> dict[str, Any] | None:
        name = node.name

        if re.fullmatch(r"h[1-6]", name):
            text = clean_text(node.get_text(" "))
            if not text:
                return None
            return {
                "type": "heading",
                "level": int(name[1]),
                "text": text,
                "html": self._sanitize(node, page_url),
            }

        if name == "p":
            text = clean_text(node.get_text(" "))
            if not text:
                return None
            return {
                "type": "paragraph",
                "text": text,
                "html": self._sanitize(node, page_url),
            }

        if name in {"ul", "ol"}:
            items = [
                {
                    "text": clean_text(li.get_text(" ")),
                    "html": self._sanitize(li, page_url),
                }
                for li in node.find_all("li", recursive=False)
                if clean_text(li.get_text(" "))
            ]
            if not items:
                return None
            return {"type": "list", "ordered": name == "ol", "items": items}

        if name == "table":
            rows: list[list[str]] = []
            for tr in node.find_all("tr"):
                cells = [
                    self._sanitize(cell, page_url)
                    for cell in tr.find_all(["th", "td"], recursive=False)
                ]
                if any(clean_text(c) for c in cells):
                    rows.append(cells)
            if not rows:
                return None
            return {"type": "table", "header": bool(node.find("th")), "rows": rows}

        if name == "blockquote":
            text = clean_text(node.get_text(" "))
            if not text:
                return None
            return {"type": "quote", "text": text, "html": self._sanitize(node, page_url)}

        if name == "pre":
            text = node.get_text()
            if not text.strip():
                return None
            return {"type": "code", "text": text.strip()}

        if name == "hr":
            return {"type": "divider"}

        if name in {"figure", "img", "video", "audio", "embed", "iframe"}:
            return self._media_block(node, page_url)

        return None

    def _media_block(self, node: Tag, page_url: str) -> dict[str, Any] | None:
        """Figura o elemento multimedia sin imagenes (los videos van aparte)."""
        frames = node.find_all("iframe") if node.name != "iframe" else [node]
        caption = ""
        cap_tag = node.find("figcaption")
        if cap_tag:
            caption = clean_text(cap_tag.get_text(" "))

        if frames:
            for frame in frames:
                video = self._video_from_url(
                    urljoin(page_url, frame.get("src", "")),
                    clean_text(frame.get("title", "")),
                )
                if video:
                    video["caption"] = caption
                    return {"type": "video", **video}
            src = urljoin(page_url, frames[0].get("src", ""))
            if src:
                return {"type": "embed", "url": src, "caption": caption}
        return None

    # -- API --------------------------------------------------------------

    def parse(self, html: str, url: str, depth: int) -> Page:
        soup = self._soup(html)
        page = Page(url=url, slug=url_slug(url), depth=depth)

        page.title = self._meta(soup, "og:title") or clean_text(
            soup.title.get_text() if soup.title else ""
        )
        page.description = self._meta(soup, "og:description", "description")
        page.date_published = self._meta(soup, "article:published_time") or None
        page.date_modified = self._meta(soup, "article:modified_time") or None
        page.author = self._meta(soup, "author") or None

        article = soup.find("article")
        if article:
            classes = article.get("class", [])
            page.categories = [c for c in classes if c.startswith("category-")]
            page.tags = [t for t in classes if t.startswith("tag-")]

        prev = soup.select_one("a.fixed-nav-prev")
        next_ = soup.select_one("a.fixed-nav-next")
        if prev:
            page.prev_url = urljoin(url, prev.get("href", ""))
        if next_:
            page.next_url = urljoin(url, next_.get("href", ""))

        root = self._content_root(soup)
        if root is None:
            page.status = "skipped"
            page.error = "sin contenedor de contenido"
            return page

        self._strip_junk(root)
        counter = [0]
        claimed, ancestors = self._claim_images(root, url, counter)
        page.blocks = list(self._blocks(root, url, claimed, ancestors))
        page.linked_images = self._claim_linked_images(root, url)

        # Enlaces internos y externos en orden de documento.
        # Se enriquece cada uno con su clase para que el front sepa si puede
        # navegar dentro de la plataforma, reproducirlo embebido, o si de verdad
        # es un recurso externo inevitable.
        seen: set[str] = set()
        for anchor in root.find_all("a", href=True):
            target = normalize_url(urljoin(url, anchor["href"]))
            if target in seen or target == normalize_url(url):
                continue
            seen.add(target)
            entry = {"text": clean_text(anchor.get_text(" ")), "url": target}
            entry.update(self._classify_link(target))
            page.links.append(entry)

        # Videos: primero los embeds de bloque, luego los enlaces a YouTube.
        for block in page.blocks:
            if block.get("type") == "video":
                page.videos.append(
                    {
                        "provider": block.get("provider", ""),
                        "id": block.get("id", ""),
                        "url": block.get("url", ""),
                        "title": block.get("title", ""),
                    }
                )
        for link in page.links:
            video = self._video_from_url(link["url"], link["text"])
            if not video or video in page.videos:
                continue
            page.videos.append(
                {
                    "provider": video["provider"],
                    "id": video["id"],
                    "url": video["url"],
                    "title": video.get("title", ""),
                }
            )
            # Si el enlace apuntaba a un video, se guarda su id para que el LMS
            # pueda reproducirlo embebido en vez de sacar al alumno del clon.
            link["kind"] = "video"
            link["video_id"] = video["id"]
            link["embed_url"] = video["url"]

        page.assets = self._collect_assets(page)
        self._classify(page)
        page.status = "ok"
        return page

    @staticmethod
    def _collect_assets(page: Page) -> list[Asset]:
        """Todos los assets de la pagina, con su cadena de candidatos.

        El bloque solo guarda la lista de candidatos (dato serializable); el
        objeto `Asset` vive aqui y se localiza por su URL primaria.
        """
        assets: dict[str, Asset] = {}
        for block in page.blocks:
            if block.get("type") == "image":
                candidates = block.get("candidates") or []
                if candidates:
                    assets.setdefault(
                        candidates[0]["url"],
                        Asset(url=candidates[0]["url"], candidates=candidates, kind="image"),
                    )
            elif block.get("type") == "video" and block.get("provider") == "youtube":
                vid = block.get("id", "")
                for poster, width in youtube_thumb_variants(vid):
                    assets.setdefault(
                        poster,
                        Asset(
                            url=poster,
                            candidates=[{"role": "poster", "url": poster, "width": width}],
                            kind="poster",
                        ),
                    )
        for link in page.linked_images:
            candidates = link.get("candidates") or []
            if candidates:
                assets.setdefault(
                    candidates[0]["url"],
                    Asset(url=candidates[0]["url"], candidates=candidates, kind="image"),
                )
        return list(assets.values())

    @staticmethod
    def _classify(page: Page) -> None:
        """Asigna kind/level/order segun el slug y las categorias WP."""
        slug = page.slug
        if slug == COURSE_SLUG:
            page.kind = "course"
            return
        match = LEVEL_RE.match(slug)
        if match:
            page.kind = "level"
            page.level = int(match.group(1))
            return
        lowered = {c.replace("category-", "") for c in page.categories}
        if any(c.startswith(COURSE_CATEGORY_PREFIX) for c in lowered):
            page.kind = "class"
        else:
            page.kind = "resource"


def size_from_url(url: str) -> tuple[int, int]:
    """Dimensiones deducidas del sufijo de WordPress: `nombre-1024x576.jpg`."""
    match = WP_SIZE_SUFFIX_RE.search(urlparse(url).path.rpartition(".")[0])
    if not match:
        return 0, 0
    return int(match.group(1)), int(match.group(2))


def youtube_thumb_variants(vid: str) -> list[tuple[str, int]]:
    """URLs de miniatura de un video, de mayor a menor resolucion."""
    return [(f"https://i.ytimg.com/vi/{vid}/{name}", w) for name, w in YOUTUBE_THUMBS]


def variant_width(img: Tag, variant: str, base: str) -> int:
    """Ancho declarado de una variante, o 0 si no se sabe."""
    if variant == base:
        value = img.get("width")
        if value and str(value).isdigit():
            return int(value)
    match = WP_SIZE_SUFFIX_RE.search(urlparse(variant).path.rpartition(".")[0])
    if match:
        return int(match.group(1))
    return 0


# ---------------------------------------------------------------------------
# Crawler
# ---------------------------------------------------------------------------


class Crawler:
    """BFS limitado en profundidad sobre el mismo host."""

    def __init__(self, fetcher: Fetcher, parser: PageParser, max_depth: int,
                 max_pages: int = 0) -> None:
        self.fetcher = fetcher
        self.parser = parser
        self.max_depth = max_depth
        self.max_pages = max_pages
        self.seen: set[str] = set()
        self.queue: deque[tuple[str, int]] = deque()

    def seed(self, slugs_or_urls: Sequence[str]) -> None:
        for item in slugs_or_urls:
            url = normalize_url(item if item.startswith("http") else urljoin(BASE_URL, item))
            if url not in self.seen:
                self.seen.add(url)
                self.queue.append((url, 0))

    def run(self) -> list[Page]:
        pages: list[Page] = []
        while self.queue:
            if self.max_pages and len(pages) >= self.max_pages:
                LOG.info("limite de %d paginas alcanzado", self.max_pages)
                break
            url, depth = self.queue.popleft()
            html = self.fetcher.get(url, cache_name=f"{url_slug(url)}.html")
            if html is None:
                status = "not_found" if self.fetcher.last_status == 404 else "failed"
                LOG.error("descarga fallida (%s): %s", status, url)
                pages.append(
                    Page(url=url, slug=url_slug(url), depth=depth,
                         status=status, error=f"HTTP {self.fetcher.last_status}")
                )
                continue

            page = self.parser.parse(html, url, depth)
            pages.append(page)
            LOG.info(
                "[%s] %-3d %-8s %-3d img  %s (%d bloques, %d palabras)",
                "c" * (depth + 1), depth, page.kind,
                sum(1 for b in page.blocks if b.get("type") == "image"),
                page.title or page.slug, len(page.blocks), page.word_count,
            )

            if depth >= self.max_depth:
                continue
            for link in page.links:
                target = link["url"]
                if target in self.seen or not should_crawl(target):
                    continue
                self.seen.add(target)
                self.queue.append((target, depth + 1))
        return pages


# ---------------------------------------------------------------------------
# AssetStore
# ---------------------------------------------------------------------------


class AssetStore:
    """Descarga los assets a data/assets/images/ con nombres deterministas.

    Nombres:  nivel-1-clase-02-ciclo-del-mercado-tendencias-01.jpg
              modulo-resumen-del-curso-01.png
    Si el nombre ya esta ocupado por otra URL, se antepone un hash corto.
    """

    def __init__(
        self,
        root: Path,
        fetcher: Fetcher,
        *,
        enabled: bool = True,
        naming: str = "descriptive",
    ) -> None:
        self.root = root                        # data/assets
        self.project = root.parent.parent       # raiz del proyecto
        self.images_dir = root / ASSETS_SUBDIR
        self.fetcher = fetcher
        self.enabled = enabled
        self.naming = naming
        self.registry: dict[str, Asset] = {}     # url primaria -> asset resuelto
        self.missing: set[str] = set()            # variantes que dieron 404
        self.index_path = root.parent / "assets-index.json"
        self._taken: set[str] = set()             # nombres ya ocupados en este run
        self._load_index()

    # -- indice persistente ----------------------------------------------

    def _load_index(self) -> None:
        if self.fetcher.force or not self.index_path.exists():
            return
        try:
            data = read_json(self.index_path)
        except (OSError, json.JSONDecodeError):
            return
        for url, entry in (data.get("assets") or {}).items():
            filename = entry.get("file") or ""
            if filename and (self.images_dir / filename).exists():
                self.registry[url] = Asset(
                    url=url,
                    local=entry.get("local"),
                    status=entry.get("status", "ok"),
                    bytes=entry.get("bytes", 0),
                    chosen=entry.get("chosen"),
                )
        self.missing = set(data.get("missing") or [])
        LOG.debug(
            "indice de assets: %d entradas, %d variantes 404 recordadas",
            len(self.registry), len(self.missing),
        )

    def _save_index(self) -> None:
        write_json(
            self.index_path,
            {
                "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "assets_dir": f"data/assets/{ASSETS_SUBDIR}",
                "assets": {
                    url: {
                        "file": (a.local or "").rsplit("/", 1)[-1],
                        "local": a.local,
                        "status": a.status,
                        "bytes": a.bytes,
                        "chosen": a.chosen,
                    }
                    for url, a in sorted(self.registry.items())
                },
                "missing": sorted(self.missing),
            },
        )

    # -- nombres ----------------------------------------------------------

    def _filename(self, page: Page, asset: Asset, index: int) -> str:
        """Nombre determinista: nivel-1-clase-02-ciclo-del-mercado-01.jpg."""
        ext = file_extension(asset.url)
        if self.naming == "hash":
            return f"{short_hash(asset.url, 16)}.{ext}"

        if self.naming == "descriptive-short":
            return f"{page.asset_prefix()}-{index:02d}.{ext}"

        # El slug de la pagina ya identifica el modulo: no se repite como
        # prefijo aparte, solo se anaden nivel y numero de clase.
        name = page.asset_prefix()
        title = slugify(page.title or "")
        if name:
            name = f"{name}-{title[:ASSET_NAME_MAX_SLUG]}" if title else name
        else:
            name = page.slug[: ASSET_NAME_MAX_SLUG + 20]
        return f"{name}-{index:02d}.{ext}"

    def _unique(self, page: Page, asset: Asset, index: int) -> str:
        """Nombre sin colisiones; si el ocupado es el mismo asset, se reutiliza."""
        base = self._filename(page, asset, index)
        if base not in self._taken:
            return base
        for other_url, other in self.registry.items():
            if other.local and other.local.endswith(f"/{base}") and other_url == asset.url:
                return base

        stem, _, ext = base.rpartition(".")
        digest = short_hash(asset.url, 6)
        candidate = f"{stem}-{digest}.{ext}"
        suffix = 2
        while candidate in self._taken:
            candidate = f"{stem}-{digest}-{suffix}.{ext}"
            suffix += 1
        return candidate

    # -- descarga ---------------------------------------------------------

    def store(self, page: Page, asset: Asset, index: int) -> Asset:
        """Resuelve un asset probando sus candidatos en orden de prioridad."""
        cached = self.registry.get(asset.url)
        if cached is not None and cached.status == "ok" and cached.local:
            if (page and self._abs(cached.local)).exists():
                asset.local = cached.local
                asset.status = "ok"
                asset.bytes = cached.bytes
                asset.chosen = cached.chosen
                self._taken.add(cached.local.rsplit("/", 1)[-1])
                return asset

        if not self.enabled:
            asset.status = "skipped"
            return asset
        if not is_image_url(asset.url):
            asset.status = "skipped"
            return asset

        self.images_dir.mkdir(parents=True, exist_ok=True)
        name = self._unique(page, asset, index)
        self._taken.add(name)
        target = self.images_dir / name
        asset.local = f"data/assets/{ASSETS_SUBDIR}/{name}"

        if target.exists() and target.stat().st_size > 0 and not self.fetcher.force:
            # El archivo ya esta en disco pero no hay registro de que variante se
            # descargo: se marca como "on-disk" en vez de inventar el origen.
            asset.status = "ok"
            asset.bytes = target.stat().st_size
            asset.chosen = {"role": "on-disk", "url": asset.url, "resolved": False}
            self.registry[asset.url] = asset
            return asset

        for candidate in asset.candidates:
            url = candidate.get("url", "")
            if not url or not is_image_url(url):
                continue
            if url in self.missing:
                # Ya se comprobo que esta variante no existe: no repetir el 404.
                continue
            result = self.fetcher.get_bytes(url)
            if result is None:
                if self.fetcher.last_status == 404:
                    self.missing.add(url)
                continue
            payload, _ = result
            target.write_bytes(payload)
            asset.status = "ok"
            asset.bytes = len(payload)
            asset.chosen = {"role": candidate.get("role", "?"), "url": url, "resolved": True}
            LOG.debug("asset ok %s <- %s", name, candidate.get("role"))
            break

        if asset.status != "ok":
            asset.status = "failed"
            asset.local = None
            LOG.warning("no se pudo descargar ninguna variante de %s", asset.url)

        self.registry[asset.url] = asset
        return asset

    def _abs(self, local: str) -> Path:
        """Convierte una ruta relativa al proyecto en ruta absoluta."""
        parts = local.replace("\\", "/").split("/")
        return self.project.joinpath(*parts)

    def measure(self, local: str) -> tuple[int, int]:
        """Dimensiones reales del archivo ya descargado (0, 0 si no se puede).

        WordPress no siempre declara width/height en el `<img>` y la variante
        original no lleva sufijo de tamano, asi que la unica fuente fiable es
        la cabecera del propio archivo.
        """
        path = self._abs(local)
        try:
            head = path.open("rb").read(32)
            if head[:8] == b"\x89PNG\r\n\x1a\n":
                return (
                    int.from_bytes(head[16:20], "big"),
                    int.from_bytes(head[20:24], "big"),
                )
            if head[:2] != b"\xff\xd8":
                return 0, 0
        except OSError:
            return 0, 0

        # JPEG: se recorren los segmentos hasta el SOF, que trae alto y ancho.
        try:
            data = path.read_bytes()
        except OSError:
            return 0, 0
        i = 2
        while i < len(data) - 9:
            if data[i] != 0xFF:
                i += 1
                continue
            marker = data[i + 1]
            if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                          0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                height = int.from_bytes(data[i + 5 : i + 7], "big")
                width = int.from_bytes(data[i + 7 : i + 9], "big")
                return width, height
            if marker in (0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
                i += 2
                continue
            if i + 4 > len(data):
                break
            i += 2 + int.from_bytes(data[i + 2 : i + 4], "big")
        return 0, 0

    # -- orquestacion -----------------------------------------------------

    def store_thumbnail(self, url: str, name: str) -> str | None:
        """Descarga una miniatura suelta (video de playlist) a images/.

        A diferencia de `store()`, aqui no hay una pagina que aporte el nombre:
        se recibe el nombre ya calculado (video-0012.jpg). Devuelve la ruta
        relativa al proyecto, o None si no se pudo descargar.
        """
        if not self.enabled or not url:
            return None

        cached = self.registry.get(url)
        if cached is not None and cached.status == "ok" and cached.local:
            if self._abs(cached.local).exists():
                return cached.local

        self.images_dir.mkdir(parents=True, exist_ok=True)
        self._taken.add(name)
        target = self.images_dir / name

        if target.exists() and target.stat().st_size > 0 and not self.fetcher.force:
            asset = Asset(url=url, local=f"data/assets/{ASSETS_SUBDIR}/{name}",
                          status="ok", bytes=target.stat().st_size)
            self.registry[url] = asset
            return asset.local

        # Se prueban las variantes de mayor a menor resolucion para este video.
        vid = url.split("/vi/")[-1].split("/")[0]
        for variant_url, _w in youtube_thumb_variants(vid):
            if variant_url in self.missing:
                continue
            result = self.fetcher.get_bytes(variant_url)
            if result is None:
                if self.fetcher.last_status == 404:
                    self.missing.add(variant_url)
                continue
            payload, _ = result
            target.write_bytes(payload)
            asset = Asset(url=url, local=f"data/assets/{ASSETS_SUBDIR}/{name}",
                          status="ok", bytes=len(payload),
                          chosen={"role": "poster", "url": variant_url, "resolved": True})
            self.registry[url] = asset
            return asset.local

        asset = Asset(url=url, status="failed")
        self.registry[url] = asset
        return None

    def store_document(self, url: str, name: str) -> str | None:
        """Descarga un PDF/documento enlazado a data/assets/docs/.

        Los PDF de WordPress se piden tal cual; los de MediaFire requieren
        resolver antes la pagina intermedia para sacar el enlace directo.
        """
        if not self.enabled or not url:
            return None

        docs_dir = self.root / ASSETS_DOCS_SUBDIR
        docs_dir.mkdir(parents=True, exist_ok=True)
        target = docs_dir / name
        local = f"data/assets/{ASSETS_DOCS_SUBDIR}/{name}"

        if target.exists() and target.stat().st_size > 0 and not self.fetcher.force:
            return local

        candidates = [url]
        if "mediafire.com" in url:
            resolved = self._resolve_mediafire(url)
            if resolved:
                candidates.insert(0, resolved)

        for candidate in candidates:
            result = self.fetcher.get_bytes(candidate, referer=url)
            if result is None:
                continue
            payload, _ = result
            if not payload.startswith(b"%PDF"):
                LOG.warning("no es un PDF: %s", candidate)
                continue
            target.write_bytes(payload)
            LOG.info("documento ok %s (%d KB)", name, len(payload) // 1024)
            return local
        return None

    def _resolve_mediafire(self, page_url: str) -> str | None:
        """Saca el enlace de descarga real de una pagina de MediaFire."""
        result = self.fetcher.get_bytes(page_url)
        if result is None:
            return None
        html, _ = result
        match = re.search(rb"https://download[\w.-]*mediafire\.com/[^\"'\\s]+", html)
        return match.group(0).decode("utf-8", "replace") if match else None

    def store_all(self, pages: Sequence[Page]) -> tuple[int, int, int]:
        """Descarga los assets y reescribe los bloques para que apunten al local.

        Devuelve (ok, fallidos, omitidos).
        """
        self._taken = set()
        lookup = [{a.url: a for a in p.assets} for p in pages]
        ok = failed = skipped = 0

        for page, by_page in zip(pages, lookup):
            index = 0
            for block in page.blocks:
                kind = block.get("type")
                if kind == "image":
                    candidates = block.get("candidates") or []
                    if not candidates:
                        continue
                    index += 1
                    asset = by_page.get(candidates[0]["url"])
                    if asset is None:
                        continue
                    self.store(page, asset, index)
                    if asset.status == "ok":
                        block["src"] = asset.local
                        block["local"] = asset.local
                        block["status"] = "ok"
                        if asset.chosen:
                            block["chosen"] = asset.chosen
                        # WordPress no siempre declara los atributos: se leen
                        # del archivo baixado para no dejar imagenes en 0x0.
                        w, h = self.measure(asset.local or "")
                        if w and h:
                            # El width del HTML a veces miente (declara 534 para
                            # una imagen de 1024): manda lo que mide el archivo.
                            block["width"], block["height"] = w, h
                        ok += 1
                    elif asset.status == "skipped":
                        skipped += 1
                    else:
                        block["status"] = "failed"
                        failed += 1
                elif kind == "video" and block.get("provider") == "youtube":
                    vid = block.get("id", "")
                    for poster_url, _w in youtube_thumb_variants(vid):
                        asset = by_page.get(poster_url)
                        if asset is None:
                            continue
                        index += 1
                        self.store(page, asset, index)
                        if asset.status == "ok":
                            block["poster"] = asset.local
                            block["thumb_width"] = _w
                            ok += 1
                            break
                        # si esta variante falla, se prueba la siguiente
                        skipped += 1

            for link in page.linked_images:
                candidates = link.get("candidates") or []
                if not candidates:
                    continue
                index += 1
                asset = by_page.get(candidates[0]["url"])
                if asset is None:
                    continue
                self.store(page, asset, index)
                if asset.status == "ok":
                    link["src"] = asset.local
                    link["local"] = asset.local
                    ok += 1
                else:
                    failed += 1

        self._save_index()
        return ok, failed, skipped

    # -- poda -------------------------------------------------------------

    def prune(self, keep: set[str]) -> int:
        """Borra archivos de la carpeta de imagenes que ya no se referencian."""
        if not self.images_dir.exists():
            return 0
        referenced = {p.replace("\\", "/").rsplit("/", 1)[-1] for p in keep if p}
        removed = 0
        for file in sorted(self.images_dir.rglob("*")):
            if file.is_file() and file.name not in referenced:
                file.unlink()
                removed += 1
        return removed


# ---------------------------------------------------------------------------
# Arbol del curso
# ---------------------------------------------------------------------------


class PlaylistFetcher:
    """Convierte una lista de reproduccion de YouTube en clases navegables.

    El Nivel 2 y el Nivel 3 del curso original no tienen articulos escritos:
    sus paginas solo embeben un `videoseries?list=...`. Para que el LMS no
    muestre dos niveles vacios, se leen los items de la playlist desde el
    `ytInitialData` que YouTube embebe en la pagina publica (no hace falta API
    key ni cuenta). De cada video se,title, duracion y miniatura.
    """

    CACHE_NAME = "playlists.json"

    def __init__(self, cache_path: Path, fetcher: Fetcher, *, enabled: bool = True) -> None:
        self.cache_path = cache_path
        self.fetcher = fetcher
        self.enabled = enabled
        self.cache: dict[str, list[dict[str, Any]]] = {}
        if cache_path.exists():
            try:
                self.cache = read_json(cache_path).get("playlists", {})
            except Exception:
                LOG.warning("cache de playlists ilegible: %s", cache_path)

    def save(self) -> None:
        if self.cache:
            write_json(self.cache_path, {"playlists": self.cache})

    @staticmethod
    def _duration(seconds: Any) -> str:
        try:
            total = int(seconds)
        except (TypeError, ValueError):
            return ""
        h, rem = divmod(total, 3600)
        m, s = divmod(rem, 60)
        return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"

    @staticmethod
    def _duration_seconds(duration: str) -> int:
        if not duration or ":" not in duration:
            return 0
        parts = [int(p) for p in duration.split(":")]
        total = 0
        for p in parts:
            total = total * 60 + p
        return total

    def fetch(self, playlist_id: str) -> list[dict[str, Any]]:
        """Devuelve los items de la playlist, usando cache en disco."""
        if playlist_id in self.cache:
            return self.cache[playlist_id]
        if not self.enabled:
            return []

        html_path = self.cache_path.parent / "playlists" / f"{playlist_id}.html"
        if html_path.exists() and not self.fetcher.force:
            html = html_path.read_text(encoding="utf-8", errors="replace")
        else:
            html = self.fetcher.get_external(f"https://www.youtube.com/playlist?list={playlist_id}")
            if html:
                html_path.parent.mkdir(parents=True, exist_ok=True)
                html_path.write_text(html, encoding="utf-8")
        if not html:
            LOG.warning("no se pudo leer la playlist %s", playlist_id)
            return []

        match = re.search(r"var ytInitialData\s*=\s*(\{.*?\});</script>", html, re.S)
        if not match:
            LOG.warning("ytInitialData no encontrado en %s", playlist_id)
            return []
        try:
            data = json.loads(match.group(1))
        except json.JSONDecodeError as exc:
            LOG.warning("ytInitialData ilegible (%s): %s", playlist_id, exc)
            return []

        items: list[dict[str, Any]] = []
        for renderer in self._iter_lockups(data):
            video_id = renderer.get("contentId") or ""
            metadata = (renderer.get("metadata") or {}).get("lockupMetadataViewModel") or {}
            title = ((metadata.get("title") or {}).get("content") or "").strip()
            if not video_id or not title:
                continue
            duration = ""
            for overlay in ((renderer.get("contentImage") or {}).get("thumbnailViewModel") or {}).get(
                "overlays", []
            ):
                for badge in (overlay.get("thumbnailBottomOverlayViewModel") or {}).get("badges", []):
                    text = (badge.get("thumbnailBadgeViewModel") or {}).get("text")
                    if text and re.fullmatch(r"[\d:]+", text):
                        duration = text
            items.append(
                {
                    "video_id": video_id,
                    "title": title,
                    "duration": duration,
                    "thumbnail": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                    "watch_url": f"https://www.youtube.com/watch?v={video_id}",
                    "embed_url": f"https://www.youtube-nocookie.com/embed/{video_id}",
                }
            )

        if items:
            self.cache[playlist_id] = items
            LOG.info("playlist %s: %d videos", playlist_id, len(items))
        return items

    @staticmethod
    def _iter_lockups(node: Any) -> Any:
        """Recorre el arbol en ORDEN DE DOCUMENTO buscando los items.

        Importa el orden: la posicion en la playlist es el temario del nivel.
        Un recorrido en profundidad con pila invertiria las clases.
        """
        stack = [node]
        while stack:
            current = stack.pop()
            if isinstance(current, dict):
                lockup = current.get("lockupViewModel")
                if isinstance(lockup, dict) and lockup.get("contentId"):
                    yield lockup
                # Se apila al reves para que la salida siga el orden del HTML.
                stack.extend(reversed(list(current.values())))
            elif isinstance(current, list):
                stack.extend(reversed(current))


def build_manifest(pages: Sequence[Page]) -> dict[str, Any]:
    """Construye el arbol course -> levels -> classes a partir del grafo de enlaces."""
    by_url = {p.url: p for p in pages if p.status == "ok"}
    course = next((p for p in pages if p.kind == "course" and p.status == "ok"), None)
    unique_assets = {a.local for p in pages for a in p.assets if a.status == "ok"}

    levels: list[dict[str, Any]] = []
    assigned: set[str] = set()

    for page in sorted((p for p in pages if p.kind == "level" and p.status == "ok"),
                       key=lambda p: p.level or 0):
        classes: list[dict[str, Any]] = []
        seen: set[str] = set()
        for link in page.links:
            target = by_url.get(link["url"])
            if target is None or target.url in seen or target.url in assigned:
                continue
            if target.kind not in {"class", "resource"}:
                continue
            seen.add(target.url)
            assigned.add(target.url)
            target.level = page.level
            target.order = len(classes) + 1
            classes.append(
                {
                    "order": target.order,
                    "title": target.title or link["text"] or target.slug,
                    "anchor": link["text"],
                    "slug": target.slug,
                    "url": target.url,
                }
            )
        levels.append(
            {
                "level": page.level,
                "title": page.title,
                "slug": page.slug,
                "url": page.url,
                "videos": page.videos,
                "class_count": len(classes),
                "classes": classes,
            }
        )

    extras = [
        {
            "title": p.title or p.slug,
            "slug": p.slug,
            "url": p.url,
            "kind": p.kind,
        }
        for p in pages
        if p.status == "ok" and p.url not in assigned
        and p.kind not in {"course", "level"}
    ]

    return {
        "source": BASE_URL,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "course": {
            "title": (course.title if course else "Curso de Opciones Binarias"),
            "slug": COURSE_SLUG,
            "url": normalize_url(urljoin(BASE_URL, COURSE_SLUG)),
            "description": course.description if course else "",
        },
        "stats": {
            "pages": len(pages),
            "ok": sum(1 for p in pages if p.status == "ok"),
            "failed": sum(1 for p in pages if p.status == "failed"),
            "not_found": sum(1 for p in pages if p.status == "not_found"),
            "skipped": sum(1 for p in pages if p.status == "skipped"),
            "blocks": sum(len(p.blocks) for p in pages),
            "words": sum(p.word_count for p in pages),
            "images": sum(
                1 for p in pages for a in p.assets if a.status == "ok" and a.kind == "image"
            ),
            "assets": len(unique_assets),
            "videos": sum(len(p.videos) for p in pages),
        },
        "levels": levels,
        "extras": extras,
    }


def playlist_duration(duration: str) -> int:
    """'1:14:13' -> 4453 segundos."""
    if not duration or ":" not in duration:
        return 0
    total = 0
    for part in duration.split(":"):
        try:
            total = total * 60 + int(part)
        except ValueError:
            return 0
    return total


def doc_fingerprint(url: str) -> str:
    """Clave de comparacion para un documento enlazado.

    El mismo PDF aparece con variantes distintas en el HTML ("...pdf",
    "...pdf/", "...pdf/file") y con http o https. Se comparan solo el host y el
    nombre del archivo, para reconocer las tres formas como el mismo documento.
    """
    parsed = urlparse(url)
    name = Path(parsed.path).name
    # MediaFire añade "/file" al final y el nombre acaba siendo "file".
    if name in ("file", "download"):
        name = Path(parsed.path).parent.name
    return f"{(parsed.hostname or '').removeprefix('www.').lower()}|{name.lower()}"


def plain_text(blocks: Sequence[dict[str, Any]]) -> str:
    """Texto corrido de los bloques, sin HTML, para el indice de busqueda."""
    parts: list[str] = []
    for block in blocks or []:
        for value in (block.get("text"), block.get("html")):
            if value:
                parts.append(re.sub(r"<[^>]+>", " ", str(value)))
                break
        for item in block.get("items") or []:
            parts.append(re.sub(r"<[^>]+>", " ", str(item.get("text") or item.get("html") or "")))
        for row in block.get("rows") or []:
            parts.extend(str(cell) for cell in row)
        if block.get("caption"):
            parts.append(str(block["caption"]))
    return re.sub(r"\s+", " ", " ".join(parts)).strip()


def build_search_index(course_data: dict[str, Any]) -> dict[str, Any]:
    """Indice de texto completo por leccion.

    El LMS busca sobre 17.000 palabras en cada pulsacion: meter el texto plano
    en un indice aparte evita tener que recorrer los bloques del curso en el
    navegador y de paso permite recortar que se descarga.
    """
    entries: list[dict[str, Any]] = []

    def add(url: str, title: str, group: str, kind: str, blocks: Any, words: int) -> None:
        text = plain_text(blocks or [])
        if not text:
            return
        entries.append(
            {
                "url": url,
                "title": title,
                "group": group,
                "kind": kind,
                "words": words,
                "text": text,
            }
        )

    course_page = course_data.get("course_page")
    if course_page:
        add(course_page["url"], course_page.get("title", ""), "Inicio", "course",
            course_page.get("blocks"), course_page.get("word_count", 0))

    for level in course_data.get("levels") or []:
        group = f"Nivel {level['level']}"
        for c in level.get("classes") or []:
            add(c["url"], c.get("title", ""), group, "class",
                c.get("blocks"), c.get("word_count", 0))
        for c in level.get("video_classes") or []:
            # Sin transcripcion, pero el titulo y la duracion ya son utiles
            # como texto indexable del video.
            add(c["url"], c.get("title", ""), group, "video", [], 0)

    for c in course_data.get("extras") or []:
        add(c["url"], c.get("title", ""), "Recursos", "resource",
            c.get("blocks"), c.get("word_count", 0))

    return {
        "schema_version": 1,
        "entries": entries,
        "total_words": sum(e["words"] for e in entries),
    }


def build_course_data(
    manifest: dict[str, Any],
    pages: Sequence[Page],
    playlist_cache: dict[str, list[dict[str, Any]]] | None = None,
    thumbs: dict[str, str] | None = None,
    docs: dict[str, str] | None = None,
) -> dict[str, Any]:
    """Dataset unico con todo el curso, listo para consumir sin red."""
    by_url = {p.url: p for p in pages if p.status == "ok"}
    playlist_cache = playlist_cache or {}
    thumbs = thumbs or {}
    docs = docs or {}

    def page_payload(page: Page) -> dict[str, Any]:
        payload = page.to_dict()
        payload["web_path"] = f"public/modules/{page.slug}.html"
        # Cierre del clasificado de enlaces: los que apuntaban a una pagina del
        # sitio ya clonada en el curso se actualizan a navegacion local.
        slug_by_url = {p.url.rstrip("/") + "/": p.slug for p in pages if p.status == "ok"}
        for link in payload.get("links", []):
            raw = link.get("url") or ""
            link_url = raw.rstrip("/") + "/"

            # Un PDF descargado al clon se sirve desde data/assets/docs/. La
            # comparacion ignora esquema y sufijo final: el articulo enlaza a
            # ".../Glosario....pdf/" y a "...manualcandlestick.pdf/file".
            if link.get("kind") in ("pdf", "external"):
                for doc_url, doc_local in docs.items():
                    if doc_fingerprint(raw) == doc_fingerprint(doc_url):
                        link["kind"] = "doc"
                        link["local"] = doc_local
                        break
                if link.get("kind") == "doc":
                    continue

            if link.get("kind") == "page":
                slug = slug_by_url.get(link_url)
                if slug:
                    link["kind"] = "page"
                    link["slug"] = slug
                else:
                    link["kind"] = "external"
                    link.pop("slug", None)
        return payload

    levels: list[dict[str, Any]] = []
    for level in manifest["levels"]:
        classes = [
            page_payload(by_url[item["url"]])
            for item in level["classes"]
            if item["url"] in by_url
        ]
        level_page = by_url.get(level["url"])

        # Nivel sin articulos escritos: se convierte la playlist en clases.
        playlist_id = next(
            (
                v.get("id")
                for v in level["videos"]
                if v.get("provider") == "youtube-playlist" and v.get("id")
            ),
            None,
        )
        video_classes: list[dict[str, Any]] = []
        if playlist_id and playlist_id in playlist_cache:
            for order, item in enumerate(playlist_cache[playlist_id], start=1):
                # La miniatura local gana si se pudo descargar: el LMS no debe
                # depender de i.ytimg.com para pintar la lista de videos.
                thumb = thumbs.get(item["thumbnail"]) or item["thumbnail"]
                video_classes.append(
                    {
                        "order": order,
                        "title": item["title"],
                        "slug": f"nivel-{level['level']}-video-{order:02d}",
                        "kind": "video",
                        "level": level["level"],
                        "url": item["watch_url"],
                        "web_path": None,
                        "videos": [
                            {
                                "provider": "youtube",
                                "id": item["video_id"],
                                "title": item["title"],
                                "url": item["embed_url"],
                            }
                        ],
                        "thumbnail": thumb,
                        "duration": item["duration"],
                        "duration_seconds": playlist_duration(item["duration"]),
                        "word_count": 0,
                        "blocks": [
                            {
                                "type": "video",
                                "provider": "youtube",
                                "id": item["video_id"],
                                "title": item["title"],
                                "url": item["embed_url"],
                                "thumbnail": thumb,
                                "duration": item["duration"],
                            }
                        ],
                    }
                )

        levels.append(
            {
                "level": level["level"],
                "title": level["title"],
                "slug": level["slug"],
                "url": level["url"],
                "videos": level["videos"],
                "playlist_id": playlist_id,
                "class_count": len(classes) or len(video_classes),
                "source": "articles" if classes else "playlist",
                "page": page_payload(level_page) if level_page else None,
                "classes": classes,
                "video_classes": video_classes,
            }
        )

    course_page = next(
        (p for p in pages if p.kind == "course" and p.status == "ok"), None
    )
    video_lessons = sum(len(lvl["video_classes"]) for lvl in levels)
    article_lessons = sum(len(lvl["classes"]) for lvl in levels)

    return {
        "meta": {
            "schema_version": 3,
            "source": BASE_URL,
            "generated_at": manifest["generated_at"],
            "assets_dir": f"data/assets/{ASSETS_SUBDIR}",
            "note": "Todas las rutas de imagenes apuntan a archivos locales.",
            "note_playlists": (
                "Los niveles 2 y 3 no tienen articulos en el sitio original: sus "
                "clases se generan desde la lista de reproduccion de YouTube "
                "embebida en la pagina del nivel."
            ),
        },
        "stats": {
            **manifest["stats"],
            "article_lessons": article_lessons,
            "video_lessons": video_lessons,
            "lessons_total": article_lessons + video_lessons + len(manifest["extras"]),
            "video_seconds": sum(
                c["duration_seconds"] for lvl in levels for c in lvl["video_classes"]
            ),
        },
        "course": manifest["course"],
        "course_page": page_payload(course_page) if course_page else None,
        "levels": levels,
        "extras": [page_payload(by_url[e["url"]]) for e in manifest["extras"] if e["url"] in by_url],
    }


# ---------------------------------------------------------------------------
# Render
# ---------------------------------------------------------------------------

THEME_CSS = """
:root {
  --bg: #0f1115;
  --bg-soft: #161a21;
  --bg-card: #1b2029;
  --fg: #e6e9ef;
  --fg-dim: #98a2b3;
  --accent: #4f9cf9;
  --accent-soft: rgba(79, 156, 249, .12);
  --border: #262c37;
  --radius: 10px;
  --max: 860px;
}
@media (prefers-color-scheme: light) {
  :root {
    --bg: #f7f8fa; --bg-soft: #fff; --bg-card: #fff;
    --fg: #1b2029; --fg-dim: #5b6474; --accent: #1a6fe0;
    --accent-soft: rgba(26, 111, 224, .09); --border: #e3e7ee;
  }
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0; background: var(--bg); color: var(--fg); line-height: 1.7;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
.wrap { max-width: var(--max); margin: 0 auto; padding: 0 20px; }
.site-header { border-bottom: 1px solid var(--border); background: var(--bg-soft); }
.site-header .wrap { display: flex; align-items: center; gap: 16px; padding: 14px 20px; }
.brand { font-weight: 700; letter-spacing: -.01em; color: var(--fg); }
.badge {
  font-size: 11px; text-transform: uppercase; letter-spacing: .08em;
  padding: 3px 8px; border-radius: 999px; background: var(--accent-soft); color: var(--accent);
}
#progress {
  position: fixed; top: 0; left: 0; height: 3px; width: 0;
  background: var(--accent); z-index: 50; transition: width .1s linear;
}
.crumbs { font-size: 13px; color: var(--fg-dim); padding: 18px 0 4px; }
.crumbs a { color: var(--fg-dim); }
h1 { font-size: 30px; line-height: 1.25; letter-spacing: -.02em; margin: 8px 0 10px; }
h2 { font-size: 22px; margin: 34px 0 10px; letter-spacing: -.01em; }
h3 { font-size: 18px; margin: 26px 0 8px; }
h4, h5, h6 { font-size: 15px; margin: 20px 0 6px; color: var(--fg-dim); }
p { margin: 0 0 14px; }
.lede { color: var(--fg-dim); font-size: 16px; margin-bottom: 18px; }
.meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 12.5px; color: var(--fg-dim); margin: 14px 0 28px; }
.meta span { background: var(--bg-card); border: 1px solid var(--border); padding: 3px 9px; border-radius: 999px; }
ul, ol { margin: 0 0 16px; padding-left: 22px; }
li { margin: 5px 0; }
blockquote {
  margin: 18px 0; padding: 12px 18px; border-left: 3px solid var(--accent);
  background: var(--bg-card); border-radius: 0 var(--radius) var(--radius) 0; color: var(--fg-dim);
}
pre {
  background: var(--bg-card); border: 1px solid var(--border); padding: 14px;
  border-radius: var(--radius); overflow-x: auto; font-size: 13px;
}
figure { margin: 22px 0; }
img { max-width: 100%; height: auto; border-radius: var(--radius); display: block; }
figcaption { font-size: 13px; color: var(--fg-dim); margin-top: 8px; text-align: center; }
.video { position: relative; padding-top: 56.25%; border-radius: var(--radius); overflow: hidden; background: #000; margin: 22px 0; }
.video img, .video iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; object-fit: cover; }
.video .play {
  position: absolute; inset: 0; display: grid; place-items: center;
  background: rgba(0,0,0,.25); border: 0; cursor: pointer; color: #fff;
}
.video .play span {
  width: 66px; height: 66px; border-radius: 50%; background: rgba(0,0,0,.7);
  display: grid; place-items: center; font-size: 24px; padding-left: 4px;
  border: 2px solid rgba(255,255,255,.85);
}
.video.playing { padding-top: 0; }
.table-wrap { overflow-x: auto; margin: 20px 0; }
table { border-collapse: collapse; width: 100%; font-size: 14px; }
th, td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; }
th { background: var(--bg-card); }
hr { border: 0; border-top: 1px solid var(--border); margin: 30px 0; }
.cards { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); margin: 22px 0; }
.card {
  display: block; background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 16px; color: var(--fg);
}
.card:hover { border-color: var(--accent); text-decoration: none; }
.card h3 { margin: 0 0 6px; font-size: 16px; }
.card p { margin: 0; font-size: 13px; color: var(--fg-dim); }
.section { margin: 40px 0; }
.section > h2 { border-bottom: 1px solid var(--border); padding-bottom: 8px; }
.lesson-list { list-style: none; padding: 0; }
.lesson-list li {
  display: flex; gap: 12px; align-items: baseline; padding: 9px 12px;
  border: 1px solid transparent; border-radius: var(--radius);
}
.lesson-list li:hover { background: var(--bg-card); border-color: var(--border); }
.lesson-list .num { color: var(--fg-dim); font-variant-numeric: tabular-nums; min-width: 26px; font-size: 13px; }
.lesson-list .thumb { width: 64px; height: 36px; object-fit: cover; border-radius: 4px; flex: none; }
.toolbar { display: flex; gap: 10px; align-items: center; margin: 18px 0; flex-wrap: wrap; }
input[type=search] {
  flex: 1; min-width: 200px; padding: 9px 13px; border-radius: var(--radius);
  border: 1px solid var(--border); background: var(--bg-card); color: var(--fg); font-size: 14px;
}
.count { font-size: 13px; color: var(--fg-dim); }
.pager { display: flex; justify-content: space-between; gap: 12px; margin: 40px 0 0; }
.pager a { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 16px; flex: 1; }
.pager a.next { text-align: right; }
.pager small { display: block; color: var(--fg-dim); font-size: 12px; }
.site-footer { border-top: 1px solid var(--border); margin-top: 50px; padding: 22px 0 40px; color: var(--fg-dim); font-size: 13px; }
.site-footer .wrap { padding: 0 20px; }
.notice {
  border: 1px solid var(--border); border-left: 3px solid #d9822b;
  background: var(--bg-card); border-radius: 0 var(--radius) var(--radius) 0;
  padding: 12px 16px; font-size: 13.5px; color: var(--fg-dim);
}
.gallery { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
.gallery figure { margin: 0; }
mark { background: var(--accent-soft); color: inherit; border-radius: 3px; }
""".strip()

APP_JS = """
(function () {
  'use strict';

  // Barra de progreso de lectura.
  var bar = document.getElementById('progress');
  if (bar) {
    var update = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    };
    document.addEventListener('scroll', update, { passive: true });
    update();
  }

  // Los iframes de video se insertan al hacer clic: no se pide nada a YouTube
  // hasta que el usuario decide reproducir.
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.video .play');
    if (!btn) return;
    var box = btn.parentNode;
    var id = box.getAttribute('data-video');
    if (!id) return;
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1';
    iframe.title = 'Video del curso';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope';
    iframe.allowFullscreen = true;
    box.classList.add('playing');
    box.replaceChildren(iframe);
  });

  // Filtro de busqueda sobre todas las listas de clases de la pagina.
  var search = document.getElementById('q');
  var lists = document.querySelectorAll('.lesson-list');
  var count = document.getElementById('count');
  if (search && lists.length) {
    search.addEventListener('input', function () {
      var q = search.value.trim().toLowerCase();
      var shown = 0;
      lists.forEach(function (list) {
        list.querySelectorAll('li').forEach(function (li) {
          var hit = !q || li.textContent.toLowerCase().indexOf(q) !== -1;
          li.hidden = !hit;
          if (hit) shown++;
        });
      });
      if (count) count.textContent = shown + ' resultado' + (shown === 1 ? '' : 's');
    });
  }
})();
""".strip()

DISCLAIMER = (
    "Clon local de material educativo de Binary Teach. El contenido y las marcas "
    "son propiedad de sus autores. Uso interno de evaluacion tecnica unicamente."
)

PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{title}} | {{course_title}}</title>
<meta name="description" content="{{description}}">
<meta name="robots" content="noindex, nofollow">
<link rel="stylesheet" href="{{css}}">
</head>
<body>
<div id="progress"></div>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="{{index_href}}">{{course_title}}</a>
    <span class="badge">{{kind_label}}</span>
  </div>
</header>
<main class="wrap">
  <nav class="crumbs">{{crumbs}}</nav>
  <h1>{{heading}}</h1>
  {{meta}}
  {{content}}
  {{gallery}}
  <nav class="pager">{{pager}}</nav>
</main>
<footer class="site-footer">
  <div class="wrap">
    <p class="notice">{{disclaimer}}</p>
    <p>Fuente: <a href="{{url}}" rel="noopener nofollow">{{url}}</a></p>
  </div>
</footer>
<script src="{{js}}"></script>
</body>
</html>
"""


def esc(value: str) -> str:
    """Escapa texto para insertar en HTML."""
    return (
        (value or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def to_web(local_path: str, from_module: bool) -> str:
    """Convierte una ruta relativa a la raiz del proyecto en una ruta de navegador."""
    return f"../../{local_path}" if from_module else f"../{local_path}"


class SiteRenderer:
    """Genera la vista estatica en public/, 100% offline."""

    def __init__(self, root: Path, manifest: dict[str, Any], pages: Sequence[Page]) -> None:
        self.root = root
        self.public = root / "public"
        self.manifest = manifest
        self.pages = {p.url: p for p in pages if p.status == "ok"}
        self.local_assets: set[str] = set()

    # -- rutas ------------------------------------------------------------

    def _href(self, url: str, from_module: bool) -> str:
        """Enlace local a una pagina scrapeada, o URL absoluta si no existe."""
        page = self.pages.get(url)
        if page is None:
            return url
        target = f"modules/{page.slug}.html"
        return f"../{target}" if from_module else target

    @staticmethod
    def _home(from_module: bool) -> str:
        # La portada estatica vive en portada.html; index.html es el LMS.
        return "../portada.html" if from_module else "portada.html"

    def _first_image(self, page: Page) -> str | None:
        for block in page.blocks:
            if block.get("type") == "image" and block.get("src"):
                return block["src"]
        for block in page.blocks:
            if block.get("type") == "video" and block.get("poster"):
                return block["poster"]
        return None

    # -- bloques ----------------------------------------------------------

    def render_blocks(self, page: Page, from_module: bool) -> str:
        out: list[str] = []
        for block in page.blocks:
            kind = block.get("type")

            if kind == "heading":
                level = min(max(int(block.get("level", 2)), 2), 6)
                out.append(f"<h{level}>{block.get('html') or esc(block.get('text', ''))}</h{level}>")

            elif kind == "paragraph":
                out.append(f"<p>{block.get('html') or esc(block.get('text', ''))}</p>")

            elif kind == "list":
                tag = "ol" if block.get("ordered") else "ul"
                items = "".join(
                    f"<li>{item.get('html') or esc(item.get('text', ''))}</li>"
                    for item in block.get("items", [])
                )
                out.append(f"<{tag}>{items}</{tag}>")

            elif kind == "quote":
                out.append(f"<blockquote>{block.get('html') or esc(block.get('text', ''))}</blockquote>")

            elif kind == "code":
                out.append(f"<pre><code>{esc(block.get('text', ''))}</code></pre>")

            elif kind == "divider":
                out.append("<hr>")

            elif kind == "table":
                head = ""
                body_rows = block.get("rows", [])
                if block.get("header") and body_rows:
                    head = "<thead><tr>" + "".join(
                        f"<th>{cell}</th>" for cell in body_rows[0]
                    ) + "</tr></thead>"
                    body_rows = body_rows[1:]
                body = "<tbody>" + "".join(
                    "<tr>" + "".join(f"<td>{cell}</td>" for cell in row) + "</tr>"
                    for row in body_rows
                ) + "</tbody>"
                out.append(f'<div class="table-wrap"><table>{head}{body}</table></div>')

            elif kind == "image":
                out.append(self._image_html(block, from_module))

            elif kind == "video":
                out.append(self._video_html(page, block, from_module))

            elif kind == "embed":
                out.append(
                    f'<p><a href="{esc(block.get("url", ""))}" rel="noopener nofollow">'
                    "Recurso externo</a></p>"
                )

        return "\n".join(out)

    def _image_html(self, block: dict[str, Any], from_module: bool) -> str:
        local = block.get("local") or block.get("src") or ""
        if not local:
            # Sin descarga: se enlaza al original, indicando que es remoto.
            return (
                f'<p class="notice">Imagen no descargada: '
                f'<a href="{esc(block.get("remote_src", ""))}" rel="noopener nofollow">'
                f"ver original</a></p>"
            )
        self.local_assets.add(local)
        src = to_web(local, from_module)
        alt = esc(block.get("alt") or "Ilustración de la clase")
        fig = f'<img src="{esc(src)}" alt="{alt}" loading="lazy" decoding="async">'
        if block.get("caption"):
            fig += f"<figcaption>{esc(block['caption'])}</figcaption>"
        if block.get("width") and block.get("height"):
            fig = fig.replace("<img ", f'<img width="{block["width"]}" height="{block["height"]}" ', 1)
        return f"<figure>{fig}</figure>"

    def _video_html(self, page: Page, block: dict[str, Any], from_module: bool) -> str:
        provider = block.get("provider", "")
        vid = block.get("id", "")
        title = block.get("title") or "Video del curso"
        cap = block.get("caption") or ""

        if provider == "youtube":
            poster_local = block.get("poster") or ""
            if poster_local:
                self.local_assets.add(poster_local)
                poster = to_web(poster_local, from_module)
            else:
                poster = f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
            html = (
                f'<div class="video" data-video="{esc(vid)}">'
                f'<img src="{esc(poster)}" alt="{esc(title)}" loading="lazy">'
                f'<button class="play" type="button" aria-label="Reproducir video">'
                f"<span>&#9654;</span></button></div>"
            )
        elif provider == "youtube-playlist":
            html = (
                '<p class="notice">Lista de reproduccion de YouTube: '
                f'<a href="{esc(block.get("url", ""))}" rel="noopener nofollow" target="_blank">'
                f"{esc(title)}</a></p>"
            )
        else:
            html = (
                '<p class="notice">Video externo: '
                f'<a href="{esc(block.get("url", ""))}" rel="noopener nofollow" target="_blank">'
                f"{esc(title or vid)}</a></p>"
            )
        if cap:
            html += f"<figcaption>{esc(cap)}</figcaption>"
        return f"<figure>{html}</figure>"

    def _gallery_html(self, page: Page, from_module: bool) -> str:
        """Imagenes enlazadas que no se muestran en el flujo del articulo."""
        cards: list[str] = []
        for link in page.linked_images:
            local = link.get("local") or link.get("src") or ""
            if not local:
                # Sin descarga: se omite en vez de emitir un <img> vacio.
                continue
            self.local_assets.add(local)
            href = to_web(local, from_module)
            label = esc(link.get("text") or "Imagen enlazada")
            cards.append(
                f'<figure><a href="{esc(href)}"><img src="{esc(href)}" alt="{label}" '
                'loading="lazy"></a></figure>'
            )
        if not cards:
            return ""
        return (
            '<section class="section"><h2>Imagenes enlazadas</h2>'
            f'<div class="gallery">{"".join(cards)}</div></section>'
        )

    # -- paginas ----------------------------------------------------------

    def _meta_html(self, page: Page, from_module: bool) -> str:
        chips: list[str] = []
        if page.kind == "class" and page.level:
            chips.append(f"Nivel {page.level}")
        if page.order:
            chips.append(f"Clase {page.order}")
        chips.append(f"{page.word_count} palabras")
        if page.date_published:
            chips.append(page.date_published[:10])
        images = sum(1 for b in page.blocks if b.get("type") == "image")
        if images:
            chips.append(f"{images} imagen{'es' if images != 1 else ''}")
        if page.videos:
            chips.append(f"{len(page.videos)} video(s)")
        body = "".join(f"<span>{esc(c)}</span>" for c in chips)
        return f'<div class="meta">{body}</div>'

    def _crumbs_html(self, page: Page, from_module: bool) -> str:
        parts = [f'<a href="{self._home(from_module)}">Inicio</a>']
        if page.kind == "class" and page.level:
            level_page = next(
                (p for p in self.pages.values() if p.kind == "level" and p.level == page.level),
                None,
            )
            if level_page:
                parts.append(
                    f'<a href="{self._href(level_page.url, from_module)}">Nivel {page.level}</a>'
                )
        parts.append(f"<span>{esc(page.title or page.slug)}</span>")
        return " / ".join(parts)

    def _pager_html(self, page: Page, from_module: bool) -> str:
        def link(target: str | None, css: str, label: str) -> str:
            if not target:
                return ""
            normalized = normalize_url(target)
            other = self.pages.get(normalized)
            title = other.title if other else target
            href = self._href(normalized, from_module)
            return f'<a class="{css}" href="{href}"><small>{label}</small>{esc(title)}</a>'

        return (
            link(page.prev_url, "prev", "Anterior")
            + link(page.next_url, "next", "Siguiente")
        ).strip()

    def render_module(self, page: Page) -> str:
        from_module = True
        pager = self._pager_html(page, from_module)
        if not pager:
            pager = (
                f'<a class="next" href="{self._home(True)}">'
                "<small>Fin</small>Volver al indice</a>"
            )
        return (
            PAGE_TEMPLATE.replace("{{title}}", esc(page.title or page.slug))
            .replace("{{course_title}}", esc(self.manifest["course"]["title"]))
            .replace("{{description}}", esc(page.description))
            .replace("{{css}}", "../css/theme.css")
            .replace("{{js}}", "../js/app.js")
            .replace("{{index_href}}", self._home(from_module))
            .replace("{{kind_label}}", self._kind_label(page))
            .replace("{{crumbs}}", self._crumbs_html(page, from_module))
            .replace("{{heading}}", esc(page.title or page.slug))
            .replace("{{meta}}", self._meta_html(page, from_module))
            .replace("{{content}}", self.render_blocks(page, from_module))
            .replace("{{gallery}}", self._gallery_html(page, from_module))
            .replace("{{pager}}", pager)
            .replace("{{disclaimer}}", esc(DISCLAIMER))
            .replace("{{url}}", esc(page.url))
        )

    @staticmethod
    def _kind_label(page: Page) -> str:
        if page.kind == "course":
            return "Curso"
        if page.kind == "level":
            return f"Nivel {page.level}"
        if page.kind == "class":
            return f"Clase · Nivel {page.level}" if page.level else "Clase"
        return "Recurso"

    def render_index(self) -> str:
        course = self.manifest["course"]
        stats = self.manifest["stats"]
        from_module = False

        hero = (
            f'<h1>{esc(course["title"])}</h1>'
            f'<p class="lede">{esc(course.get("description", ""))}</p>'
            '<div class="meta">'
            f'<span>{stats["ok"]} paginas</span>'
            f'<span>{stats["words"]:,} palabras</span>'
            f'<span>{stats["videos"]} videos</span>'
            f'<span>{stats["images"]} imagenes</span>'
            f'<span>generado {esc(self.manifest["generated_at"][:10])}</span>'
            "</div>"
        )

        sections: list[str] = []
        for level in self.manifest["levels"]:
            items = ""
            for item in level["classes"]:
                page = self.pages.get(item["url"])
                thumb = self._first_image(page) if page else None
                badge = (
                    f'<img class="thumb" src="{esc(to_web(thumb, from_module))}" alt="" '
                    "loading=\"lazy\">"
                    if thumb
                    else ""
                )
                if thumb:
                    self.local_assets.add(thumb)
                items += (
                    f'<li><span class="num">{item["order"]:02d}</span>{badge}'
                    f'<a href="modules/{item["slug"]}.html">{esc(item["title"])}</a></li>'
                )
            if not items:
                items = (
                    '<li><span class="num">--</span><span class="count">'
                    "Esta seccion solo enlaza a una lista de reproduccion externa de "
                    "YouTube.</span></li>"
                )
            head = f'<a href="modules/{level["slug"]}.html">{esc(level["title"])}</a>'
            parts = [f"{level['class_count']} clase{'s' if level['class_count'] != 1 else ''}"]
            playlist = next(
                (v for v in level["videos"] if v.get("provider") == "youtube-playlist"), None
            )
            if playlist:
                parts.append(
                    f'<a href="{esc(playlist["url"])}" rel="noopener nofollow" '
                    f'target="_blank">lista de YouTube</a>'
                )
            sections.append(
                f'<section class="section"><h2>{head}</h2>'
                f'<p>{" · ".join(parts)}</p>'
                f'<ul class="lesson-list">{items}</ul></section>'
            )

        if self.manifest["extras"]:
            labels = {"class": "Clase del curso", "resource": "Recurso"}
            cards = "".join(
                f'<a class="card" href="modules/{e["slug"]}.html">'
                f'<h3>{esc(e["title"])}</h3><p>{esc(labels.get(e["kind"], "Recurso"))}</p></a>'
                for e in self.manifest["extras"]
            )
            sections.append(
                f'<section class="section"><h2>Recursos complementarios</h2>'
                f'<div class="cards">{cards}</div></section>'
            )

        return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(course["title"])}</title>
<meta name="description" content="{esc(course.get("description", ""))}">
<meta name="robots" content="noindex, nofollow">
<link rel="stylesheet" href="css/theme.css">
</head>
<body>
<div id="progress"></div>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="index.html">{esc(course["title"])}</a>
    <span class="badge">Clon local · offline</span>
  </div>
</header>
<main class="wrap">
  {hero}
  <div class="toolbar">
    <input type="search" id="q" placeholder="Buscar clase por nombre..." aria-label="Buscar clase">
    <span class="count" id="count"></span>
  </div>
  {''.join(sections)}
</main>
<footer class="site-footer">
  <div class="wrap">
    <p class="notice">{esc(DISCLAIMER)}</p>
    <p>Fuente: <a href="{esc(course["url"])}" rel="noopener nofollow">{esc(course["url"])}</a></p>
  </div>
</footer>
<script src="js/app.js"></script>
</body>
</html>
"""

    # -- entrada ----------------------------------------------------------

    def run(self) -> tuple[int, set[str]]:
        (self.public / "css").mkdir(parents=True, exist_ok=True)
        (self.public / "js").mkdir(parents=True, exist_ok=True)
        (self.public / "modules").mkdir(parents=True, exist_ok=True)

        (self.public / "css" / "theme.css").write_text(THEME_CSS + "\n", encoding="utf-8")
        (self.public / "js" / "app.js").write_text(APP_JS + "\n", encoding="utf-8")

        # Eliminar modulos de ejecuciones anteriores que ya no existen.
        expected = {f"{p.slug}.html" for p in self.pages.values()}
        for stale in (self.public / "modules").glob("*.html"):
            if stale.name not in expected:
                LOG.info("eliminando modulo obsoleto: %s", stale.name)
                stale.unlink()

        for page in self.pages.values():
            target = self.public / "modules" / f"{page.slug}.html"
            target.write_text(self.render_module(page), encoding="utf-8")

        index_html = self.render_index()
        # La portada estatica nunca pisa index.html (ahí vive el LMS).
        (self.public / "portada.html").write_text(index_html, encoding="utf-8")

        # Comprobar que ninguna imagen quedo apuntando al sitio original.
        html_files = [self.public / "portada.html"] + [
            self.public / "modules" / f"{p.slug}.html" for p in self.pages.values()
        ]
        remote_images: list[str] = []
        remote_other: list[str] = []
        for file in html_files:
            html = file.read_text(encoding="utf-8")
            for ref in re.findall(r'(?:src|href)="(https?://[^"]+)"', html):
                if not re.search(r"(?:wp-content|ytimg|uploads)", ref):
                    continue
                (remote_images if is_image_url(ref) else remote_other).append(ref)

        if remote_images:
            LOG.warning("%d imagenes siguen apuntando al sitio original", len(remote_images))
            for ref in dict.fromkeys(remote_images):
                LOG.warning("  %s", ref)
        else:
            LOG.info("verificacion offline: 0 imagenes remotas en public/")
        if remote_other:
            LOG.info(
                "%d recursos no-imagen remotos (PDF/documentos), fuera del alcance del clon:",
                len(remote_other),
            )
            for ref in dict.fromkeys(remote_other):
                LOG.info("  %s", ref)

        return len(self.pages), self.local_assets


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Clona el curso de Opciones Binarias de Binary Teach.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--seeds", nargs="+", default=list(DEFAULT_SEEDS),
        help="Slugs o URLs de las paginas semilla (BFS desde ahi).",
    )
    parser.add_argument("--max-depth", type=int, default=2, help="Profundidad maxima del BFS.")
    parser.add_argument("--delay", type=float, default=1.0, help="Pausa entre peticiones (s).")
    parser.add_argument("--timeout", type=float, default=30.0, help="Timeout HTTP (s).")
    parser.add_argument("--retries", type=int, default=3, help="Reintentos por peticion.")
    parser.add_argument("--max-pages", type=int, default=0, help="Limite de paginas (0 = sin limite).")
    parser.add_argument("--force", action="store_true", help="Ignora la cache en data/raw/.")
    parser.add_argument("--no-assets", action="store_true", help="No descarga imagenes.")
    parser.add_argument(
        "--no-docs", action="store_true",
        help="No descarga los PDF del curso (glosario, manual de patrones).",
    )
    parser.add_argument(
        "--no-playlists", action="store_true",
        help="No convierte las playlists de YouTube de los niveles 2/3 en clases.",
    )
    parser.add_argument("--no-render", action="store_true", help="No genera public/.")
    parser.add_argument(
        "--asset-naming", choices=("descriptive", "short", "hash"), default="descriptive",
        help="descriptive = nivel-1-clase-02-titulo-01.jpg | short = nivel-1-clase-02-01.jpg | hash = sha1",
    )
    parser.add_argument(
        "--no-prune", action="store_true",
        help="No borra imagenes locales que ya no se referencian.",
    )
    parser.add_argument(
        "--crawler-ua", action="store_true",
        help="Usa el User-Agent de crawler tambien para los assets "
             "(por defecto los assets usan UA de navegador de escritorio).",
    )
    parser.add_argument(
        "--strict", action="store_true",
        help="Devuelve codigo de error 1 si alguna pagina no se pudo descargar "
             "(por defecto los 404 del sitio de origen no hacen fallar el run).",
    )
    parser.add_argument("--clean", action="store_true", help="Borra data/ y public/ antes de empezar.")
    parser.add_argument("-v", "--verbose", action="store_true", help="Log detallado.")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)-7s %(message)s",
        stream=sys.stdout,
    )

    root = Path(__file__).resolve().parent.parent
    raw_dir = root / "data" / "raw"
    parsed_dir = root / "data" / "parsed"
    assets_dir = root / "data" / "assets"
    public_dir = root / "public"

    if args.clean:
        for path in (raw_dir, parsed_dir, assets_dir, public_dir):
            if path.exists():
                LOG.info("borrando %s", path)
                shutil.rmtree(path)

    fetcher = Fetcher(
        raw_dir, delay=args.delay, timeout=args.timeout,
        retries=args.retries, force=args.force, browser_ua=not args.crawler_ua,
    )
    parser_ = PageParser(fetcher)
    crawler = Crawler(fetcher, parser_, max_depth=args.max_depth, max_pages=args.max_pages)
    crawler.seed(args.seeds)

    pages: list[Page] = crawler.run()

    # El manifiesto se calcula ANTES de descargar assets: es lo que asigna
    # level/order a cada clase, y de ahi salen los nombres de archivo
    # (nivel-1-clase-02-ciclo-del-mercado-01.jpg). Se recalcula despues para que
    # las estadisticas reflejen los assets ya resueltos.
    manifest = build_manifest(pages)

    store = AssetStore(
        assets_dir, fetcher,
        enabled=not args.no_assets,
        naming="descriptive-short" if args.asset_naming == "short" else args.asset_naming,
    )
    ok_assets, failed_assets, skipped_assets = store.store_all(pages)
    LOG.info(
        "assets: %d ok, %d fallidos, %d omitidos -> data/assets/%s/",
        ok_assets, failed_assets, skipped_assets, ASSETS_SUBDIR,
    )

    manifest = build_manifest(pages)

    # Los niveles 2 y 3 solo embeben una playlist de YouTube: se leen sus items
    # para convertirlos en clases navegables con titulo, duracion y miniatura.
    playlists = PlaylistFetcher(parsed_dir / PlaylistFetcher.CACHE_NAME, fetcher,
                                enabled=not args.no_playlists)
    for level in manifest["levels"]:
        playlist_id = next(
            (v.get("id") for v in level["videos"]
             if v.get("provider") == "youtube-playlist" and v.get("id")),
            None,
        )
        if playlist_id and not level["classes"]:
            items = playlists.fetch(playlist_id)
            if items:
                LOG.info(
                    "nivel %s: %d clases de vídeo desde la playlist",
                    level["level"], len(items),
                )
    playlists.save()

    # Las miniaturas de los videos de playlist no vienen en el HTML: se
    # descargan aparte a data/assets/images/ para que el LMS no dependa de
    # i.ytimg.com y funcione sin conexion.
    thumbs: dict[str, str] = {}
    seq = 0
    for level in manifest["levels"]:
        playlist_id = next(
            (v.get("id") for v in level["videos"]
             if v.get("provider") == "youtube-playlist" and v.get("id")),
            None,
        )
        for item in (playlists.cache.get(playlist_id) or [] if playlist_id else []):
            seq += 1
            url = item.get("thumbnail")
            if not url or url in thumbs:
                continue
            local = store.store_thumbnail(url, f"video-{seq:04d}.jpg")
            if local:
                thumbs[url] = local
    if thumbs:
        LOG.info("miniaturas de video descargadas: %d", len(thumbs))

    # Los PDF que el curso enlaza (glosario y manual de patrones) se copian al
    # clon: asi el curso no depende de WordPress ni de MediaFire para estudiarlos.
    docs: dict[str, str] = {}
    if not args.no_docs:
        for url, name in COURSE_DOCUMENTS:
            local = store.store_document(url, name)
            if local:
                docs[url] = local
    if docs:
        LOG.info("documentos descargados: %d -> data/assets/%s/", len(docs), ASSETS_DOCS_SUBDIR)

    for page in pages:
        write_json(parsed_dir / f"{page.slug}.json", page.to_dict())
    write_json(parsed_dir / "manifest.json", manifest)

    course_data = build_course_data(manifest, pages, playlists.cache, thumbs, docs)
    write_json(parsed_dir / "course_data.json", course_data)

    # Indice de texto completo: lo consulta el buscador del LMS.
    search_index = build_search_index(course_data)
    write_json(parsed_dir / "search_index.json", search_index)
    LOG.info(
        "indice de busqueda: %d lecciones, %d palabras",
        len(search_index["entries"]), search_index["total_words"],
    )
    LOG.info("JSON escrito en %s (course_data.json incluido)", parsed_dir)

    if not args.no_render:
        renderer = SiteRenderer(root, manifest, pages)
        modules, referenced = renderer.run()
        LOG.info("public/: portada.html + %d modulos (index.html = LMS intacto)", modules)
        if not args.no_prune:
            # Podar solo lo que el render no menciona nunca (p. ej. assets de
            # paginas que se excluieron con --seeds).
            keep = set(referenced) | {
                a.local for p in pages for a in p.assets if a.local
            } | set(thumbs.values())
            removed = store.prune(keep)
            if removed:
                LOG.info("poda: %d imagenes huerfanas eliminadas", removed)

    stats = manifest["stats"]
    LOG.info(
        "resumen: %(ok)d ok | %(failed)d fallidas | %(not_found)d 404 | "
        "%(words)d palabras | %(blocks)d bloques | %(images)d imagenes | "
        "%(videos)d videos",
        stats,
    )
    if args.strict and (stats["failed"] or stats["not_found"] or stats["skipped"]):
        return 1
    return 0 if stats["failed"] == 0 and failed_assets == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())



