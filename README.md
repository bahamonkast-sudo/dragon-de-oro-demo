# BinaryTeach demo sobre Cloudflare Workers

El LMS se ejecuta localmente con la misma arquitectura prevista para internet:
Cloudflare Worker para API y archivos estáticos, y Cloudflare D1 para sesiones,
progreso, solicitudes y autorizaciones. Wrangler mantiene una base SQLite local
persistente; no requiere cuenta Cloudflare ni publica datos.

## Requisitos

- Node.js 20 o posterior y npm.
- Python 3 para preparar el directorio de archivos estáticos.
- Wrangler 4 (`npm install`).

## Ejecutar en local

Desde esta carpeta, en PowerShell:

```powershell
npm install
Copy-Item .dev.vars.example .dev.vars
# Para el modo local abierto, BT_SECURITY_ENABLED=0.
npm run build
npm run db:migrate:local
npm run dev
```

Abre `http://127.0.0.1:8787/public/` para el curso y
`http://127.0.0.1:8787/public/admin.html` para autorizar solicitudes.
El almacenamiento local de D1 queda en `.wrangler/state/` y sobrevive al reinicio
del servidor. Para reiniciar el demo desde cero, detén Wrangler y borra esa
carpeta.

En el modo local abierto no se exige cuenta ni contraseña. El navegador recibe
una sesión de demo y el progreso se conserva en D1 para ese navegador. La
inscripción de alumnos con cuenta, correo y contraseña sigue implementada, pero
queda inactiva con `BT_SECURITY_ENABLED=0`; para reactivarla se cambia a `1`.
El bloqueo secuencial de niveles también queda inactivo con
`BT_LEVEL_GATING_ENABLED=0`. Sin cuenta, el avance corresponde al navegador
actual; para reactivarlo se cambian las variables correspondientes a `1`.
Cloudflare debe usar el modo protegido y definir una contraseña de administrador
antes de publicar.

## Reglas del demo

- Todos los niveles y lecciones están abiertos en este demo.
- El avance se sigue guardando en D1 aunque no haya bloqueos.
- Las solicitudes de autorización y el panel se conservan en el código, pero
  permanecen inactivos junto al bloqueo secuencial mientras la variable de
  niveles sea `0`.
- El botón de visto depende del alumno, así que esto demuestra el flujo de
  navegación y administración, no una certificación de asistencia al vídeo.
- `.dev.vars` queda excluido de Git; el modo local abierto se controla con
  `BT_SECURITY_ENABLED=0`.

## Ideas conservadas para la siguiente etapa

- Landing pública para presentar la plataforma y llevar al catálogo de cursos.
- Añadir el curso ya desarrollado de patrones de velas como curso independiente.
- Incorporar un chatbot como módulo separado.
- Elegir por curso el punto opcional de inscripción (por ejemplo, después del
  vídeo 3 o al entrar a la lección 4). En este demo no se solicita inscripción.
- Reactivar cuentas y protección del panel cuando el producto y los cursos estén
  terminados. Las cuentas y contraseñas siguen en el código y en las migraciones;
  no se borraron.

## Preparar una futura publicación

La carpeta `deploy/` se genera solo con los archivos públicos que necesita el
curso. No incluye el scraper, contenido bruto ni la base local. El Worker y la
migración D1 ya comparten la estructura de Cloudflare. Para publicar después se
creará una base D1 remota, se aplicarán las migraciones remotas, se habilitará
`BT_SECURITY_ENABLED=1` y se cargarán las credenciales como secretos antes de
ejecutar `wrangler deploy`.
Este proyecto no se publica automáticamente y no contiene credenciales de
Cloudflare.

## Contenido del clon

- `public/index.html`: LMS con buscador, notas, favoritos, progreso y vídeos.
- `data/parsed/course_data.json`: estructura del curso.
- `data/parsed/search_index.json`: índice del buscador.
- `data/assets/images/` y `data/assets/docs/`: medios y PDF usados por el curso.
- `src/worker.js`: API y enrutamiento de archivos estáticos.
- `migrations/`: esquema SQLite/D1 versionado.
- `migrations/0002_student_accounts.sql`: cuentas y sesiones de alumnos.
- El punto de inscripción se podrá configurar por número de lección (por ejemplo,
  después del vídeo 3 o al llegar a la lección 4); ahora no se fuerza ninguno.
- `server.py`: backend local anterior, conservado como referencia.
