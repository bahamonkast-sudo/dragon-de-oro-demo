# Diagnóstico de Arquitectura para Despliegue de Demo

## 1. Stack Tecnológico

### Frontend

| Módulo | Tecnología | Build | Salida estática |
|---|---|---|---|
| LMS / Landing / Aula (`public/inicio.html`, `public/curso.html`, `public/index.html`, `public/modules/*.html`) | HTML + CSS + JS vanilla, Tailwind vía CDN | No requiere | Sí, directo |
| Laboratorio de Velas (`public/patrones/velas/`) | React + Vite | Sí, ya compilado | `assets/index-ZUW6L28u.js`, `assets/index-DJGdqZJV.css` |
| Entrenador / Hub (`public/patrones/entrenador.html`, `public/patrones/hub.html`) | HTML + JS vanilla, Tailwind CDN, jQuery 3.3.1 | No requiere | Sí |
| Consolas de riesgo (`public/patrones/control/`, `public/patrones/control_riesgo/`) | HTML + JS vanilla + Node.js nativo | No | Sí (UI), No (API) |
| Código fuente sin compilar (`public/patrones/src/`, `public/patrones/chart/`, `public/patrones/engine/`) | TypeScript / React | No compilado en repo | No usable directo |
| Chat IA (`public/ai_chat.js`) | JS vanilla + Fetch a `/api/chat` | No requiere | Sí |

### Backend

| Servicio | Lenguaje | Router | Runtime |
|---|---|---|---|
| `serve.py:50` | Python 3 stdlib (`ThreadingHTTPServer`) | Estático + `POST /api/chat` proxy a Groq | Requiere Python activo |
| `server.py:129` | Python 3 stdlib | `GET /api/student`, `POST /api/progress`, `/api/requests`, `/api/admin/*` | Requiere Python activo |
| `src/worker.js:248` | JS Workers | `fetch()` + `/api/*` + `env.ASSETS` | Requiere runtime Cloudflare, no Node |
| `public/patrones/control/server.js`, `control_riesgo/server.js` | Node.js nativo (`http`, sin Express) | `POST /api/panic`, `GET /api/debug-path`, puerto `8088` | Requiere Node activo |

Ningún backend compila a binario autocontenido. Todos requieren runtime activo.

## 2. Requisitos de Ejecución y Estado

### Persistencia

| Mecanismo | Ubicación | Uso |
|---|---|---|
| SQLite archivo local | `data/lms.sqlite3` | `server.py:31` estudiantes, progreso, solicitudes |
| D1 / SQLite versionado | `migrations/0001_initial.sql`, `0002_student_accounts.sql` | `students`, `progress`, `approval_requests`, `unlocks`, `admin_sessions`, `student_sessions` |
| JSON local | `public/patrones/control/config.json` | Capital, límites, stop-loss, sesión 60 min |
| `localStorage` navegador | `public/session-modal.js`, `public/curso.html:19` | `dragonoro_acceso_ok`, progreso, `auth` |

### Conectividad en tiempo real

| Técnica | Evidencia |
|---|---|
| No WebSockets, no SSE | No hay `ws`, `socket`, `EventSource` en backends |
| Fetch / polling simple | `GET /api/student`, `POST /api/progress`, `POST /api/chat` |
| Eventos DOM locales | `system/timer.js` dispara `timer-tick`, `timer-warning` |
| Iframes | `public/laboratorio.html` carga `patrones/velas/` |
| Voz local | `system/panic_button.js` usa Speech Synthesis API |

### Dependencias del sistema

| Requerimiento | Estado |
|---|---|
| Docker | No existe `Dockerfile` |
| Navegador headless / drivers C/Cgo | No requerido |
| Librerías nativas | No, salvo `runtime/node.exe` portable en `control_riesgo/` |
| Toolchain | Python 3 + Node.js + `wrangler ^4.122.0` (`package.json:10`) |
| Script build | `python scripts/build-deploy.py` copia `public/` a `deploy/` |

## 3. Entorno y Configuración

Variables mínimas para demo (solo nombre y propósito, sin valores):

| Variable | Propósito |
|---|---|
| `GROQ_API_KEY` | Auth contra Groq para `/api/chat` (`serve.py:103`, `src/worker.js:174`) |
| `BT_SECURITY_ENABLED` | `0` demo abierto / `1` exige cuentas (`src/worker.js:3`) |
| `BT_LEVEL_GATING_ENABLED` | `0` niveles abiertos / `1` exige autorización (`src/worker.js:4`) |
| `BT_ADMIN_PASSWORD` | Login panel `/public/admin.html` (`server.py:291`, `src/worker.js:142`) |
| `BT_COOKIE_SECURE` | Marca cookie `Secure` fuera de localhost (`server.py:292`) |
| `PORT` / `HOST` | Args CLI: `serve.py:170` default `0.0.0.0:3000`, `server.py:289` default `127.0.0.1:8090` |

`ADMIN_WA=573115893220` está hardcodeado en `server.py:21` y `src/worker.js:1`, no es env.

## 4. Recomendación Técnica de Despliegue

### Viabilidad de desacople

Viable pero con pérdida funcional:

- Frontend puro (`133` lecciones, velas build, entrenador, brochure) → cualquier CDN/Pages.
- Backend Python (`serve.py` + `server.py`) → requiere proceso persistente, no sirve Pages/Workers estático.
- Consolas `control/` → requieren Node en `:8088`, imposible en Workers/Pages.
- Desacoplar implica reescribir URLs `/api/*` a dominio backend + CORS, hoy asumen mismo origen.

Para demo de 3 personas, no conviene desacoplar. Desplegar monolito tal cual corre en `http://localhost:3000/`.

### Consumo estimado

| Proceso | RAM aprox. | CPU |
|---|---|---|
| `serve.py :3000` estático + chat | 30-60 MB | mínima |
| `server.py :8090` SQLite (si se usa) | 30-60 MB | mínima |
| `control/server.js :8088` | 60-120 MB | mínima |
| Total demo 3 usuarios concurrentes | < 350 MB | < 0.5 vCPU |

Cabe en capa gratuita de 512 MB.

### Top opciones para demo (3 viewers)

| # | Opción | Por qué |
|---|---|---|
| 1 | **Railway (recomendado)** | Soporta Python + Node en un repo, despliegue desde Git sin Dockerfile complejo, crédito `$5/mes` cubre demo. Único sitio donde corre todo sin reescribir `serve.py`, `server.py` y `control/server.js`. |
| 2 | **Render Web Service Free** | Soporta Python/Node, `750h/mes` gratis. Contra: duerme por inactividad (~50s cold start), solo 512 MB, requiere `startCommand` explícito (`python serve.py --host 0.0.0.0 --port $PORT`). |
| 3 | **Túnel local (Cloudflare Tunnel / ngrok)** | Costo `$0`, cero migración: expone `localhost:3000` con URL pública. Ideal si la demo es 1-2 días y tu PC queda encendida. Contra: no es hosting permanente, depende de tu máquina. |

No recomendado para demo completa: Cloudflare Workers/Pages solo. El `deploy/` actual solo subió `index.html`, `admin.html`, `brochure.html`; las consolas y APIs Python/Node quedan inoperativas allí.

**Decisión sugerida:** Railway con `serve.py` como proceso principal en `$PORT`, `GROQ_API_KEY` y `BT_SECURITY_ENABLED=0` como env vars. Si Railway agota crédito, fallback a túnel local para la sesión con el cliente.
