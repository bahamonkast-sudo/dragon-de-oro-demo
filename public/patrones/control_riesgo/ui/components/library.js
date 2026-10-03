/**
 * DragonOro Passive Visual Knowledge Library (library.js)
 * curfew: high-fidelity candlestick patterns with clean native vector SVGs.
 * Supports text search, filtering, offline capabilities, and dynamic CSS styling.
 */

const DragonOroLibrary = {
  // Legacy fields preserved for backward compatibility
  velas: [],
  patrones: [],

  // High-fidelity curated catalog of patterns
  catalog: [
    {
      id: "marubozu_alcista",
      nombre: "Marubozu Alcista",
      categoria: "vela",
      tipo: "Fuerza / Continuidad Alcista",
      fiabilidad: "Alta",
      icono: "📈",
      descripcion: "Vela con cuerpo grande, verde y sin mechas (o sombras extremadamente cortas). Representa el dominio absoluto del volumen de compra desde el inicio hasta el cierre.",
      estrategia: "Indica fuerza dominante. Confirmación de ruptura de resistencia o inicio de tendencia. Operar compras al cierre de la vela.",
      svg: `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" style="background:#0b0f19; border-radius:8px; width:100%; height:120px; display:block;">
          <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <rect x="40" y="15" width="20" height="90" rx="2" fill="var(--success-green, #10b981)" filter="drop-shadow(0 0 6px rgba(16, 185, 129, 0.3))"/>
          <text x="50" y="112" font-family="sans-serif" font-size="8" fill="#6b7280" text-anchor="middle">Fuerza Total</text>
        </svg>
      `
    },
    {
      id: "marubozu_bajista",
      nombre: "Marubozu Bajista",
      categoria: "vela",
      tipo: "Fuerza / Continuidad Bajista",
      fiabilidad: "Alta",
      icono: "📉",
      descripcion: "Vela con cuerpo grande, rojo y sin mechas. Muestra control de volumen vendedor masivo y continuo de principio a fin.",
      estrategia: "Validación de rupturas a la baja o continuación de tendencia bajista. Ideal para operar ventas rápidas.",
      svg: `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" style="background:#0b0f19; border-radius:8px; width:100%; height:120px; display:block;">
          <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <rect x="40" y="15" width="20" height="90" rx="2" fill="var(--alert-red, #ef4444)" filter="drop-shadow(0 0 6px rgba(239, 68, 68, 0.3))"/>
          <text x="50" y="112" font-family="sans-serif" font-size="8" fill="#6b7280" text-anchor="middle">Fuerza Total</text>
        </svg>
      `
    },
    {
      id: "martillo",
      nombre: "Martillo (Hammer)",
      categoria: "vela",
      tipo: "Reversión Alcista",
      fiabilidad: "Alta",
      icono: "🔨",
      descripcion: "Cuerpo pequeño en la parte superior con una mecha inferior extremadamente larga (al menos el doble del cuerpo). Representa un rechazo rotundo de mínimos.",
      estrategia: "Buscar en soporte estructural tras una caída. Esperar que la siguiente vela confirme la entrada antes de comprar.",
      svg: `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" style="background:#0b0f19; border-radius:8px; width:100%; height:120px; display:block;">
          <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <!-- Faint support line -->
          <line x1="10" y1="105" x2="90" y2="105" stroke="var(--accent-gold, #f59e0b)" stroke-width="1" stroke-dasharray="2"/>
          <!-- Hammer Candle -->
          <line x1="50" y1="30" x2="50" y2="35" stroke="var(--success-green, #10b981)" stroke-width="2"/>
          <rect x="40" y="35" width="20" height="15" rx="2" fill="var(--success-green, #10b981)" filter="drop-shadow(0 0 4px rgba(16, 185, 129, 0.25))"/>
          <line x1="50" y1="50" x2="50" y2="105" stroke="var(--success-green, #10b981)" stroke-width="2"/>
          <text x="50" y="115" font-family="sans-serif" font-size="8" fill="#6b7280" text-anchor="middle">Soporte/Rebote</text>
        </svg>
      `
    },
    {
      id: "estrella_fugaz",
      nombre: "Estrella Fugaz (Shooting Star)",
      categoria: "vela",
      tipo: "Reversión Bajista",
      fiabilidad: "Alta",
      icono: "☄️",
      descripcion: "Cuerpo pequeño en la parte inferior con una mecha superior extremadamente larga. Señala que los compradores empujaron al alza pero fueron repelidos por completo.",
      estrategia: "Buscar en resistencia o techos de canales dinámicos. Ideal para gatillar operaciones de venta en Crypto IDX.",
      svg: `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" style="background:#0b0f19; border-radius:8px; width:100%; height:120px; display:block;">
          <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <!-- Faint resistance line -->
          <line x1="10" y1="15" x2="90" y2="15" stroke="var(--accent-gold, #f59e0b)" stroke-width="1" stroke-dasharray="2"/>
          <!-- Shooting Star Candle -->
          <line x1="50" y1="15" x2="50" y2="70" stroke="var(--alert-red, #ef4444)" stroke-width="2"/>
          <rect x="40" y="70" width="20" height="15" rx="2" fill="var(--alert-red, #ef4444)" filter="drop-shadow(0 0 4px rgba(239, 68, 68, 0.25))"/>
          <line x1="50" y1="85" x2="50" y2="90" stroke="var(--alert-red, #ef4444)" stroke-width="2"/>
          <text x="50" y="112" font-family="sans-serif" font-size="8" fill="#6b7280" text-anchor="middle">Techo/Rechazo</text>
        </svg>
      `
    },
    {
      id: "envolvente_alcista",
      nombre: "Envolvente Alcista",
      categoria: "vela",
      tipo: "Reversión Alcista",
      fiabilidad: "Alta",
      icono: "📈",
      descripcion: "Vela verde de gran tamaño que cubre o 'envuelve' por completo el cuerpo de la vela roja previa. Señala una fuerte entrada de volumen y reversión agresiva.",
      estrategia: "Operar inmediatamente después del cierre de la vela envolvente si ocurre en soportes principales u OTE.",
      svg: `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" style="background:#0b0f19; border-radius:8px; width:100%; height:120px; display:block;">
          <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <!-- Red Candle -->
          <line x1="30" y1="45" x2="30" y2="85" stroke="var(--alert-red, #ef4444)" stroke-width="2"/>
          <rect x="22" y="55" width="16" height="20" rx="1" fill="var(--alert-red, #ef4444)"/>
          <!-- Green Candle (Engulfing) -->
          <line x1="70" y1="20" x2="70" y2="100" stroke="var(--success-green, #10b981)" stroke-width="2"/>
          <rect x="62" y="30" width="16" height="60" rx="1" fill="var(--success-green, #10b981)" filter="drop-shadow(0 0 5px rgba(16, 185, 129, 0.25))"/>
        </svg>
      `
    },
    {
      id: "envolvente_bajista",
      nombre: "Envolvente Bajista",
      categoria: "vela",
      tipo: "Reversión Bajista",
      fiabilidad: "Alta",
      icono: "📉",
      descripcion: "Vela roja grande que envuelve completamente el cuerpo de la vela verde anterior. Muestra el colapso absoluto del volumen comprador y control de osos.",
      estrategia: "Operar ventas tras el cierre de la vela envolvente roja cuando se presente en resistencias clave.",
      svg: `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" style="background:#0b0f19; border-radius:8px; width:100%; height:120px; display:block;">
          <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <!-- Green Candle -->
          <line x1="30" y1="45" x2="30" y2="85" stroke="var(--success-green, #10b981)" stroke-width="2"/>
          <rect x="22" y="50" width="16" height="25" rx="1" fill="var(--success-green, #10b981)"/>
          <!-- Red Candle (Engulfing) -->
          <line x1="70" y1="20" x2="70" y2="100" stroke="var(--alert-red, #ef4444)" stroke-width="2"/>
          <rect x="62" y="35" width="16" height="55" rx="1" fill="var(--alert-red, #ef4444)" filter="drop-shadow(0 0 5px rgba(239, 68, 68, 0.25))"/>
        </svg>
      `
    },
    {
      id: "tweezers_top",
      nombre: "Techo en Pinzas (Tweezers Top)",
      categoria: "vela",
      tipo: "Reversión Bajista (Crypto IDX)",
      fiabilidad: "Alta",
      icono: "👯",
      descripcion: "Dos velas con máximos exactamente al mismo nivel de precio (mismas mechas superiores). Representa una resistencia local instantánea insuperable.",
      estrategia: "Excelente señal en techos de canales laterales en Crypto IDX. Operar a la baja al cierre de la segunda vela roja.",
      svg: `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" style="background:#0b0f19; border-radius:8px; width:100%; height:120px; display:block;">
          <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <!-- Shared Resistance level -->
          <line x1="10" y1="20" x2="90" y2="20" stroke="var(--accent-gold, #f59e0b)" stroke-width="1" stroke-dasharray="2"/>
          <!-- Green Candle (Touches y=20) -->
          <line x1="35" y1="20" x2="35" y2="90" stroke="var(--success-green, #10b981)" stroke-width="2"/>
          <rect x="25" y="45" width="20" height="35" rx="1" fill="var(--success-green, #10b981)"/>
          <!-- Red Candle (Touches y=20) -->
          <line x1="65" y1="20" x2="65" y2="90" stroke="var(--alert-red, #ef4444)" stroke-width="2"/>
          <rect x="55" y="45" width="20" height="35" rx="1" fill="var(--alert-red, #ef4444)"/>
          <text x="50" y="112" font-family="sans-serif" font-size="8" fill="#6b7280" text-anchor="middle">Máximos Iguales</text>
        </svg>
      `
    },
    {
      id: "tweezers_bottom",
      nombre: "Suelo en Pinzas (Tweezers Bottom)",
      categoria: "vela",
      tipo: "Reversión Alcista (Crypto IDX)",
      fiabilidad: "Alta",
      icono: "👯",
      descripcion: "Dos velas con mínimos exactamente al mismo nivel (mismas mechas inferiores). Indica un soporte instantáneo infranqueable en la sesión.",
      estrategia: "Buscar rebote en zonas de demanda. Operar compras al cierre de la segunda vela si es de confirmación alcista.",
      svg: `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" style="background:#0b0f19; border-radius:8px; width:100%; height:120px; display:block;">
          <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <!-- Shared Support level -->
          <line x1="10" y1="100" x2="90" y2="100" stroke="var(--accent-gold, #f59e0b)" stroke-width="1" stroke-dasharray="2"/>
          <!-- Red Candle (Touches y=100) -->
          <line x1="35" y1="30" x2="35" y2="100" stroke="var(--alert-red, #ef4444)" stroke-width="2"/>
          <rect x="25" y="40" width="20" height="35" rx="1" fill="var(--alert-red, #ef4444)"/>
          <!-- Green Candle (Touches y=100) -->
          <line x1="65" y1="30" x2="65" y2="100" stroke="var(--success-green, #10b981)" stroke-width="2"/>
          <rect x="55" y="40" width="20" height="35" rx="1" fill="var(--success-green, #10b981)"/>
          <text x="50" y="112" font-family="sans-serif" font-size="8" fill="#6b7280" text-anchor="middle">Mínimos Iguales</text>
        </svg>
      `
    },
    {
      id: "doble_techo",
      nombre: "Doble Techo",
      categoria: "chartista",
      tipo: "Estructura de Reversión Bajista",
      fiabilidad: "Alta",
      icono: "⛰️",
      descripcion: "Patrón clásico en 'M' donde el precio choca dos veces contra la misma resistencia fuerte y rompe a la baja la línea de cuello.",
      estrategia: "Esperar el cierre por debajo de la línea de cuello (Neckline) para entrar en corto, proyectando un objetivo igual a la altura de la estructura.",
      svg: `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" style="background:#0b0f19; border-radius:8px; width:100%; height:120px; display:block;">
          <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <!-- M Pattern (Double Top) -->
          <line x1="15" y1="90" x2="35" y2="30" stroke="var(--success-green, #10b981)" stroke-width="3" stroke-linecap="round"/>
          <line x1="35" y1="30" x2="50" y2="70" stroke="var(--alert-red, #ef4444)" stroke-width="3" stroke-linecap="round"/>
          <line x1="50" y1="70" x2="65" y2="30" stroke="var(--success-green, #10b981)" stroke-width="3" stroke-linecap="round"/>
          <line x1="65" y1="30" x2="85" y2="95" stroke="var(--alert-red, #ef4444)" stroke-width="3" stroke-linecap="round"/>
          <!-- Neckline -->
          <line x1="10" y1="70" x2="90" y2="70" stroke="#6b7280" stroke-width="1" stroke-dasharray="3"/>
          <text x="50" y="112" font-family="sans-serif" font-size="8" fill="#6b7280" text-anchor="middle">Ruptura del cuello</text>
        </svg>
      `
    },
    {
      id: "doble_suelo",
      nombre: "Doble Suelo",
      categoria: "chartista",
      tipo: "Estructura de Reversión Alcista",
      fiabilidad: "Alta",
      icono: "🏆",
      descripcion: "Patrón clásico en 'W' donde el precio choca dos veces contra un soporte fuerte y rebota rompiendo al alza la línea de cuello.",
      estrategia: "Esperar a que la vela de ruptura cierre por encima de la línea de cuello para entrar en compras, proyectando la altura de los suelos.",
      svg: `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" style="background:#0b0f19; border-radius:8px; width:100%; height:120px; display:block;">
          <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <!-- W Pattern (Double Bottom) -->
          <line x1="15" y1="30" x2="35" y2="90" stroke="var(--alert-red, #ef4444)" stroke-width="3" stroke-linecap="round"/>
          <line x1="35" y1="90" x2="50" y2="50" stroke="var(--success-green, #10b981)" stroke-width="3" stroke-linecap="round"/>
          <line x1="50" y1="50" x2="65" y2="90" stroke="var(--alert-red, #ef4444)" stroke-width="3" stroke-linecap="round"/>
          <line x1="65" y1="90" x2="85" y2="25" stroke="var(--success-green, #10b981)" stroke-width="3" stroke-linecap="round"/>
          <!-- Neckline -->
          <line x1="10" y1="50" x2="90" y2="50" stroke="#6b7280" stroke-width="1" stroke-dasharray="3"/>
          <text x="50" y="112" font-family="sans-serif" font-size="8" fill="#6b7280" text-anchor="middle">Ruptura del cuello</text>
        </svg>
      `
    },
    {
      id: "hombro_cabeza_hombro",
      nombre: "Hombro Cabeza Hombro",
      categoria: "chartista",
      tipo: "Estructura de Reversión Bajista",
      fiabilidad: "Alta",
      icono: "👤",
      descripcion: "Figura de tres picos sucesivos donde el del medio (Cabeza) supera a los laterales (Hombros Izq/Der). Señala un giro bajista.",
      estrategia: "Vender al quiebre y cierre definitivo del Neckline o en el retesteo inmediato (pullback) de la línea de cuello rota.",
      svg: `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" style="background:#0b0f19; border-radius:8px; width:100%; height:120px; display:block;">
          <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <!-- HCH path -->
          <path d="M 10 90 L 30 60 L 45 85 L 55 40 L 65 85 L 80 60 L 90 95" fill="none" stroke="var(--alert-red, #ef4444)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="20" y1="85" x2="85" y2="85" stroke="#6b7280" stroke-width="1" stroke-dasharray="3"/>
          <text x="50" y="112" font-family="sans-serif" font-size="8" fill="#6b7280" text-anchor="middle">H-C-H</text>
        </svg>
      `
    },
    {
      id: "bandera_alcista",
      nombre: "Bandera Alcista",
      categoria: "chartista",
      tipo: "Estructura de Continuidad",
      fiabilidad: "Alta",
      icono: "🚩",
      descripcion: "Impulso vertical fuerte (Mástil) seguido de una breve consolidación paralela descendente. Indica continuación del movimiento.",
      estrategia: "Comprar inmediatamente al quiebre de la línea superior del canal de consolidación, buscando la proyección del mástil.",
      svg: `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" style="background:#0b0f19; border-radius:8px; width:100%; height:120px; display:block;">
          <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <!-- Pole -->
          <line x1="25" y1="100" x2="45" y2="40" stroke="var(--success-green, #10b981)" stroke-width="3" stroke-linecap="round"/>
          <!-- Flag channel -->
          <line x1="42" y1="36" x2="80" y2="52" stroke="var(--accent-gold, #f59e0b)" stroke-width="1.5"/>
          <line x1="46" y1="48" x2="84" y2="64" stroke="var(--accent-gold, #f59e0b)" stroke-width="1.5"/>
          <!-- Flag interior waves -->
          <path d="M 45 40 L 55 53 L 64 45 L 72 58 L 81 50" fill="none" stroke="var(--text-primary, #f3f4f6)" stroke-width="1.5"/>
          <!-- Breakout projection -->
          <line x1="81" y1="50" x2="95" y2="20" stroke="var(--success-green, #10b981)" stroke-width="2" stroke-dasharray="2" stroke-linecap="round"/>
        </svg>
      `
    },
    {
      id: "canales",
      nombre: "Canales de Tendencia",
      categoria: "chartista",
      tipo: "Estructura de Continuidad",
      fiabilidad: "Media",
      icono: "🛣️",
      descripcion: "El precio oscila de manera armónica dentro de dos líneas paralelas de soporte y resistencia dinámicos que definen la dirección principal.",
      estrategia: "Comprar en los rebotes del soporte dinámico inferior y vender en la resistencia dinámica a favor de la tendencia macro.",
      svg: `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" style="background:#0b0f19; border-radius:8px; width:100%; height:120px; display:block;">
          <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
          <!-- Channel Bounds -->
          <line x1="10" y1="50" x2="90" y2="20" stroke="var(--accent-gold, #f59e0b)" stroke-width="1.5"/>
          <line x1="10" y1="90" x2="90" y2="60" stroke="var(--accent-gold, #f59e0b)" stroke-width="1.5"/>
          <!-- Bounce ZigZag -->
          <path d="M 15 88 L 30 43 L 50 75 L 68 28 L 85 62" fill="none" stroke="var(--text-primary, #f3f4f6)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `
    }
  ],

  // Active filter state
  searchTerm: "",
  activeFilter: "todos", // todos, vela, chartista, alta_fiabilidad, media_fiabilidad

  /**
   * Initializes the dynamic search, filters, and dynamic styles, then renders cards.
   * @param {string} containerId - ID of the container element
   */
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Contenedor #${containerId} no encontrado.`);
      return;
    }

    // Inject dedicated interactive styles if not present
    this.injectStyles();

    // Rebuild the legacy arrays for backward compatibility so other code doesn't crash
    this.velas = this.catalog.filter(p => p.categoria === 'vela');
    this.patrones = this.catalog.filter(p => p.categoria === 'chartista');

    // Build overall UI scaffolding inside container
    container.innerHTML = `
      <div class="library-search-wrapper">
        <div class="library-search-box">
          <span class="search-icon">🔍</span>
          <input type="text" id="lib-search-input" class="lib-search-input" placeholder="Buscar por nombre o descripción de patrón..." value="${this.searchTerm}">
          ${this.searchTerm ? `<button id="lib-clear-search" class="lib-clear-btn">✕</button>` : ''}
        </div>
        
        <div class="library-filters">
          <button class="lib-filter-btn ${this.activeFilter === 'todos' ? 'active' : ''}" data-filter="todos">Todos</button>
          <button class="lib-filter-btn ${this.activeFilter === 'vela' ? 'active' : ''}" data-filter="vela">📉 Velas Gatillo</button>
          <button class="lib-filter-btn ${this.activeFilter === 'chartista' ? 'active' : ''}" data-filter="chartista">👥 Estructuras</button>
          <button class="lib-filter-btn ${this.activeFilter === 'alta_fiabilidad' ? 'active' : ''}" data-filter="alta_fiabilidad">⭐ Alta Fiabilidad</button>
        </div>
      </div>

      <div class="library-grid" id="lib-grid-container">
        <!-- Pattern cards will be dynamically injected here -->
      </div>
      
      <div id="lib-no-results" class="lib-no-results hidden">
        <span style="font-size:3rem; display:block; margin-bottom:1rem;">🐉</span>
        <h3>Ningún patrón coincide con tu búsqueda</h3>
        <p style="color:var(--text-secondary); margin-top:0.5rem;">Intenta con otros términos de velas o estructuras.</p>
      </div>
    `;

    // Add event listeners for interaction
    const searchInput = document.getElementById('lib-search-input');
    searchInput.focus();
    searchInput.addEventListener('input', (e) => {
      this.searchTerm = e.target.value;
      this.updateCards();
    });

    const clearBtn = document.getElementById('lib-clear-search');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.searchTerm = "";
        this.render(containerId);
      });
    }

    const filterBtns = container.querySelectorAll('.lib-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.activeFilter = e.target.getAttribute('data-filter');
        this.render(containerId);
      });
    });

    // Run initial card layout update
    this.updateCards();
  },

  /**
   * Filters and updates the cards layout dynamically without full layout rebuild
   */
  updateCards() {
    const grid = document.getElementById('lib-grid-container');
    const noResultsEl = document.getElementById('lib-no-results');
    if (!grid) return;

    // Filter items based on active states
    const filteredItems = this.catalog.filter(item => {
      // 1. Text filter
      const matchesText = 
        item.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.descripcion.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.tipo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.estrategia.toLowerCase().includes(this.searchTerm.toLowerCase());

      if (!matchesText) return false;

      // 2. Category / reliability filter
      if (this.activeFilter === 'todos') return true;
      if (this.activeFilter === 'vela') return item.categoria === 'vela';
      if (this.activeFilter === 'chartista') return item.categoria === 'chartista';
      if (this.activeFilter === 'alta_fiabilidad') return item.fiabilidad === 'Alta';
      if (this.activeFilter === 'media_fiabilidad') return item.fiabilidad === 'Media';

      return true;
    });

    // Clear grid
    grid.innerHTML = '';

    if (filteredItems.length === 0) {
      grid.classList.add('hidden');
      noResultsEl.classList.remove('hidden');
      return;
    }

    grid.classList.remove('hidden');
    noResultsEl.classList.add('hidden');

    // Create cards
    filteredItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'library-card-interactive';
      
      const reliabilityClass = item.fiabilidad === 'Alta' ? 'badge-high' : 'badge-med';
      
      card.innerHTML = `
        <div class="lib-card-header">
          <div class="lib-card-title-group">
            <span class="lib-card-icon">${item.icono}</span>
            <h4 class="lib-card-title">${item.nombre}</h4>
          </div>
          <span class="lib-card-badge ${reliabilityClass}">${item.fiabilidad} Fiabilidad</span>
        </div>

        <div class="lib-card-visual">
          ${item.svg}
        </div>

        <div class="lib-card-body">
          <div class="lib-card-type-tag">${item.tipo}</div>
          <p class="lib-card-desc">${item.descripcion}</p>
          <div class="lib-card-strategy">
            <strong>Plan de Operación:</strong>
            <p>${item.estrategia}</p>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  },

  /**
   * Inject specialized dynamic styles into the document head to avoid touching external CSS files
   */
  injectStyles() {
    if (document.getElementById('visionarios-library-styles')) return;

    const style = document.createElement('style');
    style.id = 'visionarios-library-styles';
    style.textContent = `
      .library-search-wrapper {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 1.5rem;
        width: 100%;
      }

      .library-search-box {
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;
      }

      .search-icon {
        position: absolute;
        left: 14px;
        color: var(--text-muted, #6b7280);
        font-size: 1.1rem;
        pointer-events: none;
      }

      .lib-search-input {
        width: 100%;
        background: var(--bg-secondary, #141822);
        border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.05));
        border-radius: var(--border-radius-md, 8px);
        padding: 0.85rem 1rem 0.85rem 2.5rem;
        color: var(--text-primary, #f3f4f6);
        font-family: var(--font-main, sans-serif);
        font-size: 0.95rem;
        transition: var(--transition-smooth, all 0.3s ease);
      }

      .lib-search-input:focus {
        outline: none;
        border-color: var(--accent-gold, #f59e0b);
        box-shadow: 0 0 10px var(--accent-gold-glow, rgba(245, 158, 11, 0.15));
      }

      .lib-clear-btn {
        position: absolute;
        right: 14px;
        background: transparent;
        border: none;
        color: var(--text-muted, #6b7280);
        cursor: pointer;
        font-size: 1rem;
        padding: 0.25rem;
        transition: var(--transition-smooth, all 0.3s ease);
      }

      .lib-clear-btn:hover {
        color: var(--text-primary, #f3f4f6);
      }

      .library-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .lib-filter-btn {
        background: var(--bg-secondary, #141822);
        border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.05));
        border-radius: 6px;
        color: var(--text-secondary, #9ca3af);
        padding: 0.5rem 1rem;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: var(--transition-smooth, all 0.3s ease);
      }

      .lib-filter-btn:hover {
        background: var(--bg-tertiary, #1e2535);
        color: var(--text-primary, #f3f4f6);
      }

      .lib-filter-btn.active {
        background: var(--accent-gold, #f59e0b);
        color: var(--bg-primary, #0a0c10);
        border-color: var(--accent-gold, #f59e0b);
        box-shadow: 0 4px 10px var(--accent-gold-glow, rgba(245, 158, 11, 0.2));
      }

      .library-card-interactive {
        background: var(--bg-secondary, #141822);
        border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.05));
        border-radius: var(--border-radius-md, 8px);
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        transition: var(--transition-smooth, all 0.3s ease);
        position: relative;
        overflow: hidden;
      }

      .library-card-interactive:hover {
        border-color: rgba(245, 158, 11, 0.3);
        transform: translateY(-4px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.4);
      }

      .lib-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .lib-card-title-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .lib-card-icon {
        font-size: 1.2rem;
      }

      .lib-card-title {
        color: var(--accent-gold, #f59e0b);
        font-size: 1.1rem;
        font-weight: 700;
      }

      .lib-card-badge {
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        white-space: nowrap;
      }

      .lib-card-badge.badge-high {
        background: rgba(16, 185, 129, 0.15);
        color: var(--success-green, #10b981);
        border: 1px solid rgba(16, 185, 129, 0.3);
      }

      .lib-card-badge.badge-med {
        background: rgba(245, 158, 11, 0.15);
        color: var(--accent-gold, #f59e0b);
        border: 1px solid rgba(245, 158, 11, 0.3);
      }

      .lib-card-visual {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 1px solid rgba(255, 255, 255, 0.02);
        border-radius: 6px;
        overflow: hidden;
      }

      .lib-card-type-tag {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--text-muted, #6b7280);
        margin-bottom: 0.5rem;
        letter-spacing: 0.5px;
      }

      .lib-card-desc {
        color: var(--text-secondary, #9ca3af);
        font-size: 0.88rem;
        line-height: 1.4;
        margin-bottom: 0.75rem;
        min-height: 50px;
      }

      .lib-card-strategy {
        background: var(--bg-tertiary, #1e2535);
        border-left: 3px solid var(--accent-gold, #f59e0b);
        padding: 0.65rem 0.85rem;
        border-radius: 4px;
        font-size: 0.82rem;
      }

      .lib-card-strategy strong {
        color: var(--text-primary, #f3f4f6);
        display: block;
        margin-bottom: 0.25rem;
      }

      .lib-card-strategy p {
        color: var(--text-secondary, #9ca3af);
        line-height: 1.35;
        margin: 0;
      }

      .lib-no-results {
        text-align: center;
        padding: 3rem 1rem;
        width: 100%;
        grid-column: 1 / -1;
      }

      .lib-no-results h3 {
        color: var(--text-primary, #f3f4f6);
        font-size: 1.25rem;
      }

      .hidden {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }
};

// Support both ES Modules/CommonJS and Global Browser Scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DragonOroLibrary;
} else if (typeof window !== 'undefined') {
  window.DragonOroLibrary = DragonOroLibrary;
  // Alias heredado por compatibilidad con codigo anterior
  window.VisionariosLibrary = DragonOroLibrary;
}
