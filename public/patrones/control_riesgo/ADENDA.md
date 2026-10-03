# ADENDA DE ACTUALIZACIÓN AUTÓNOMA: SOPORTE MULTIMONEDA (COP/USD)

Modificación inmediata del módulo matemático (`calculator.js`), el archivo de configuración (`config.json`) y la interfaz principal (`index.html`) para permitir la conmutación activa entre Pesos Colombianos (COP) y Dólares (USD), recalculando dinámicamente los montos de la tabla de interés compuesto y la gestión de riesgo base sin intervención manual.

---

### 📂 1. ACTUALIZACIÓN DEL ARCHIVO DE CONFIGURACIÓN
El archivo `./config.json` ahora incluye la propiedad de tasa de cambio estática para mantener la portabilidad offline:

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
``````

