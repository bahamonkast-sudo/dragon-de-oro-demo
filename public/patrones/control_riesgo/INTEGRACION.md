# Guía de Integración - Guardián Visionarios de Oro

## 1. Punto de Entrada y Estructura Principal

| Componente | Archivo / Ruta | Descripción |
|------------|----------------|-------------|
| **Frontend (UI Principal)** | `index.html` (raíz) | Single-page application vanilla HTML/JS |
| **Backend (Servidor HTTP)** | `server.js` | Node.js server, puerto **8088**, valida licencia/HWID |
| **Estilos Globales** | `ui/styles.css` | CSS custom con variables (sin Tailwind) |
| **Motor de Cálculos** | `core/calculator.js` | Clase `VisionariosCalculator` (ESM + CommonJS + Global) |
| **Autenticación/Licencia** | `core/auth.js` | Lógica HWID + AES-256-CBC (referenciado por server.js) |
| **Configuración Persistente** | `config.json` + `localStorage` | Parámetros de sesión y auth |
| **Archivo de Licencia** | `.visionarios_license` | Token encriptado atado a Motherboard Serial |

---

## 2. Parámetros de Inicialización (Props / Config)

La app **no recibe props** como componente React/Vue. Se configura vía archivos y almacenamiento local:

### `config.json` (base)
```json
{
  "auth": {
    "password_set": false,
    "password_hash": ""
  },
  "session": {
    "capital_inicial": 0,
    "moneda": "COP",
    "limite_operacion_min": 0,
    "limite_operacion_max": 0,
    "stop_loss_diario": 0,
    "ganancia_acumulada": 0,
    "perdidas_consecutivas_compuesto": 0,
    "estado_interes_compuesto": "bloqueado",
    "duracion_maxima_minutos": 60,
    "tasas_conversion": {
      "COP_BASE_IC": 4000,
      "USD_BASE_IC": 1
    }
  }
}
```

### `localStorage['visionarios_config']` (runtime, prioritario)
Claves clave que la UI lee/guarda:
```js
{
  session: {
    capital_inicial: 500000,        // número
    moneda: "COP",                  // "COP" | "USD"
    riesgo_pct: 1.5,                // % riesgo base (1-2%)
    meta_diaria_pct: 15,            // % meta diaria
    stop_loss_pct: 5,               // % stop loss sesión
    recalcular_minuto_cascada: 30,  // minuto para recalcular
    usar_saldo_acumulado: false,    // bool: arrastrar saldo
    sugerir_saldo_dinamico: false,  // bool: interés compuesto dinámico
    audio_warnings: { ... },        // textos TTS personalizados
    tutorial_voice_enabled: true    // bool: voz tutorial
  }
}
```

### Licencia (`.visionarios_license`)
- Token AES-256-CBC generado por app administradora externa
- Contiene: `hwid` (Motherboard Serial), `expiry` (ISO date), `type` ("PREMIUM"/"STANDARD")
- Validación obligatoria en `server.js` antes de servir `index.html`

---

## 3. Dependencias Externas

### Frontend (Navegador) — **Cero dependencias npm**
- **Fuentes Google Fonts** (vía `<link>` en `index.html`):
  - `Poppins` (200-800)
  - `Space Grotesk` (300-700)
  - `Space Mono` (400, 700)
- **APIs nativas**: `localStorage`, `Web Audio API`, `SpeechSynthesis`, `Canvas/SVG`, `fetch`

### Backend (Node.js) — **Solo built-ins**
```json
// package.json NO EXISTE. Si lo creas para tu contenedor:
{
  "name": "visionarios-backend",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {}  // vacío
}
```
Módulos usados: `http`, `fs`, `path`, `child_process`, `crypto` (todos nativos)

---

## 4. Estilos y Aislamiento CSS

### Arquitectura CSS
- **Variables globales** en `:root` (`ui/styles.css:3-33`):
  ```css
  --bg-dark: #12151d;
  --accent-gold: #d4af37;
  --success-green: #00b88a;
  --alert-red: #ff4a4a;
  --font-main: 'Poppins', 'Space Grotesk', sans-serif;
  --font-mono: 'Space Mono', monospace;
  /* ...sombras, transiciones, etc. */
  ```
- **Clases con prefijo semántico** (baja colisión):
  - `.regla-oro-container`, `.neumorphic-*`, `.sidebar-btn`
  - `.bitacora-row-card`, `.modal-overlay`, `.kpi-badge`
  - `.session-accordion-card`, `.netflix-card`, `.library-card`

### Riesgo de Colisión al Integrar
| Escenario | Riesgo | Mitigación |
|-----------|--------|------------|
| **Inyectar HTML directo en tu DOM** | **Alto**: `body` tiene `margin:0`, `background`, `font-family`, `overflow-x:hidden`; variables CSS sangran al padre | **No recomendado** |
| **Iframe** | **Nulo** | `<iframe src="http://localhost:8088" style="width:100%;height:100vh;border:none;">` |
| **Shadow DOM** | **Bajo** | Clona `ui/styles.css` dentro del shadow root |

### Recomendación de Integración
```html
<!-- Opción A: Iframe (más simple, aislado 100%) -->
<iframe 
  src="http://localhost:8088" 
  style="width:100%; height:100vh; border:none;"
  title="Guardián Visionarios de Oro"
></iframe>

<!-- Opción B: Shadow DOM (si necesitas comunicación JS bidireccional) -->
<div id="visionarios-host"></div>
<script>
  const host = document.getElementById('visionarios-host');
  const shadow = host.attachShadow({ mode: 'open' });
  // 1. Fetch index.html
  // 2. Inyectar CSS + JS en shadow root
  // 3. PostMessage para sync config/licencia
</script>
```

---

## 5. Endpoints Backend (server.js) — Replicar si no usas Node

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/hwid` | ❌ | Devuelve Motherboard Serial de la máquina |
| `POST` | `/api/activate` | ❌ | Recibe `{token}`, valida HWID+expiry, guarda `.visionarios_license` |
| `POST` | `/api/reset-local` | ✅ | Borra licencia + resetea `config.json` a fábrica |
| `GET` | `/api/license-status` | ❌ | `{valid:bool, reason?, data?}` — usado por UI para saber estado |
| `POST` | `/api/panic` | ✅ | Cierra proceso servidor (`process.exit(0)`) |
| `GET` | `/api/debug-path` | ✅ | Devuelve `__dirname` del servidor |
| `GET` | `/` + assets | ✅* | Sirve `index.html`, `ui/styles.css`, `core/calculator.js`, etc. (*requiere licencia válida) |

> **Nota**: Los endpoints marcados ❌ son **whitelisted** (bypassean validación de licencia). El resto redirige a `/activation.html` si no hay licencia válida.

---

## 6. Checklist de Integración Rápida

- [ ] Copiar carpeta completa del proyecto a tu infraestructura
- [ ] Ejecutar `node server.js` → confirma `http://localhost:8088`
- [ ] Verificar que `.visionarios_license` existe y es válido (o usar `/activation.html` para activar)
- [ ] Embeber vía **iframe** en tu app host
- [ ] (Opcional) Sincronizar `localStorage['visionarios_config']` desde tu backend vía `postMessage` si necesitas pre-cargar capital/moneda/riesgo

---

## 7. Archivos Críticos que NO Debes Mover/Renombrar

```
visionarios/
├── index.html              # Entry point frontend
├── server.js               # Entry point backend
├── config.json             # Config base
├── .visionarios_license    # Licencia (se crea al activar)
├── ui/
│   ├── styles.css          # Estilos globales (requerido por index.html)
│   └── components/         # JS modular (library, tutorial, knowledge)
├── core/
│   ├── calculator.js       # Motor matemático (requerido por index.html)
│   └── auth.js             # Crypto HWID (requerido por server.js)
└── system/                 # Timer, panic button (requeridos por index.html)
```

---

**Versión del documento**: 1.0  
**Generado**: 2026-09-15  
**Proyecto**: Guardián Visionarios de Oro — Consola FX Panel