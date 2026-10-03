# ESTADO DE LA PLATAFORMA — BinaryTeach / Dragón de Oro

> **REGLA DE ORO:** lo listado en "Zonas protegidas" está terminado y verificado.
> No modificarlo sin correr antes `python scripts/verificar.py` y después
> volver a correrlo. Si algo falla, ver "Emergencia" abajo.

Última actualización: 2026-10-01. Servidor local: `http://localhost:3000/`

## Mapa (qué abre cada cosa)

| URL | Archivo | Estado |
|---|---|---|
| `/` → `/public/inicio.html` | `public/inicio.html` | Página de inicio Dragón de Oro (acentos OK) |
| `/public/curso.html` (+ `#n{NIVEL}-{CLASE}`) | `public/curso.html` | Aula Virtual: 133 lecciones, video, bloques, progreso local, deep-link |
| `/public/patrones/velas/` | `public/patrones/velas/index.html` | Laboratorio de Velas (app React compilada) |
| `/public/patrones/entrenador.html` | `public/patrones/entrenador.html` | Entrenador de Patrones |
| `/public/patrones/hub.html` | `public/patrones/hub.html` | Hub (dashboard/trainer/IA/bot) |
| `/public/laboratorio.html` | `public/laboratorio.html` | Marco del lab (iframe local) |
| `/public/index.html` | `public/index.html` | LMS BinaryTeach original (menú árbol niveles) |
| `/public/portada.html` | `public/portada.html` | Landing antigua de enlaces (ya no es el inicio) |
| `/public/data/course_data.json` | datos del curso | 3 niveles: 26 + 27 + 80 = 133 lecciones (+9 extras = 142) |
| `/data/parsed/course_data.json` | datos raíz | Lo que pide `index.html` (LMS) |

## Zonas protegidas (NO TOCAR sin verificar)

1. **`serve.py`** — sirve la RAÍZ del proyecto (no `public/`), fuerza
   `charset=utf-8` en todo texto, `/` → landing. Arranque:
   `python serve.py --port 3000` desde la raíz.
2. **`public/inicio.html`** — textos reparados (doble codificación `Ã³→ó`
   eliminada), SIN etiqueta CSP de SingleFile, con `<script src="temario.js">`
   y `</body></html>` al final. Enlaces relativos (`curso.html`,
   `patrones/velas/`, `patrones/entrenador.html`).
3. **`public/temario.js`** — tabs Nivel 1/2/3 + 133 tarjetas con enlace
   `curso.html#n{nivel}-{orden}`. Quita `hidden` Y `sf-hidden` al mostrar.
4. **`public/curso.html`** — lee `data/course_data.json` (relativo),
   imágenes en `assets/images/`, deep-link `#n2-5`, "Volver a la Academia"
   → `inicio.html`, check "Marcar como vista" + barra de progreso por nivel.
5. **`public/patrones/velas/index.html`** — assets con rutas RELATIVAS
   `./assets/...` (el build Vite traía `/velas/assets/...` absoluto → 404).
6. **Rebrand total** — cero `granjita/anita` en contenido y nombres:
   `entrenador.html`, `hub.html`, identificadores `DragonOro*`, textos
   "Dragón de Oro". Consolas `control/` y `control_riesgo/` renombradas
   (son copias idénticas, tratarlas igual).

## Historial de fallas ya resueltas (no reintroducir)

- `python -m http.server` no manda `charset` → acentos rotos. Usar `serve.py`.
- Dos `http.server` a la vez en el 3000 → matar duplicados antes de arrancar.
- Servir `public/` como raíz rompe `../data/parsed/...` (404) → servir la raíz.
- SingleFile deja `<meta CSP default-src 'none'>` que BLOQUEA scripts y
  `fetch` → quitarlo de cualquier HTML rescatado.
- URLs absolutas `http://localhost:3000/curso.html` y `http://127.0.0.1:5174/velas/`
  (servidor Vite MUERTO) → usar rutas relativas locales.
- Caché del navegador muestra páginas viejas rotas → Ctrl+Shift+R o incógnito.
- `control/.../Granjita_knowledge.js` y `golden_Granjita_logo.png` NO existen;
  se redirigieron a `visionarios_knowledge.js` y `golden_visionarios_logo.png`.

## Emergencia (la página no carga / se ve rota)

1. ¿Escucha el 3000? `netstat -ano | Select-String ":3000"`.
   Si hay 2 python o ninguno: matar y arrancar uno solo:
   `Stop-Process -Name python -Force; python serve.py --port 3000`
2. Probar en **incógnito** `http://localhost:3000/` (descarta caché).
3. Correr `python scripts/verificar.py` → todo debe salir OK.
4. Revisar la tabla de arriba: cada URL debe dar 200 + `charset=utf-8`.
5. F12 → Consola del navegador: el primer error rojo dice la causa real.

## Arranque normal

```powershell
cd C:\consola_maestra\Proyectos\binaryteach-clone
python serve.py --port 3000
# Abrir http://localhost:3000/  (Ctrl+Shift+R la primera vez)
```
