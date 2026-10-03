export interface PatternExplanation {
  code: string;
  name: string;
  whyItHappens: string;
  whoIsTrapped: string;
  triggerRule: string;
}

export const DIDACTIC_PATTERNS: Record<string, PatternExplanation> = {
  ss01: {
    code: "SS01",
    name: "Continuación tras Ruptura SNR",
    whyItHappens: "El precio venía empujando contra una pared (soporte o resistencia). Cuando una vela cierra con cuerpo sólido cruzando la pared sin dejar mecha de regreso, significa que los defensores se quedaron sin órdenes. Los compradores (o vendedores) ganaron el territorio y el camino queda libre para seguir avanzando.",
    whoIsTrapped: "Los que intentaron adivinar un rebote contra la pared; al ver que se rompió, sus stop-loss se ejecutan a mercado y esa salida empuja aún más la siguiente vela a nuestro favor.",
    triggerRule: "Entrar apenas abre la siguiente vela tras ver el cuerpo cerrar completamente fuera del nivel."
  },
  ss03: {
    code: "SS03",
    name: "Mágicos en V Avanzado",
    whyItHappens: "El precio baja con 2 velas rojas formando un valle y luego una vela verde fuerte rompe hacia arriba la línea donde empezó la caída. Esto confirma una 'V' institucional: los compradores entraron con urgencia y no van a permitir que el precio regrese abajo.",
    whoIsTrapped: "Los vendedores que asumieron que la tendencia bajista continuaría; quedan descolocados ante la velocidad de la recuperación.",
    triggerRule: "Entrada directa en CALL apenas la vela verde rompe el nivel SNR de la V, sin esperar vela de confirmación."
  },
  ss08: {
    code: "SS08",
    name: "Ruptura del Patrón de Color",
    whyItHappens: "El mercado estaba jugando al 'ping-pong' (verde, roja, verde, roja) atrapado en una caja lateral. De repente, una vela repite el color y rompe la caja. El ritmo se rompió y quien rompió la alternancia toma el control direccional inmediato.",
    whoIsTrapped: "Los traders y algoritmos minoristas que operaban mecánicamente apostando a que el color siempre cambiaría en cada vela.",
    triggerRule: "Operar a favor de la vela que rompió la caja en cuanto abre la siguiente vela."
  },
  ss14: {
    code: "SS14",
    name: "Ruptura de Mecha en Alternancia",
    whyItHappens: "Ves una secuencia verde -> roja -> verde. Parece que los compradores ganan el turno, pero la mecha inferior de la última verde bajó y perforó el piso de la roja previa. Esa mecha fue una trampa de barrido: fue a absorber las órdenes que protegían el soporte. Aunque la vela cerró verde, el piso ya quedó perforado.",
    whoIsTrapped: "Los compradores que se confían al ver un cuerpo verde sin notar que la mecha previa ya vació la liquidez de defensa inferior.",
    triggerRule: "Operar en VENTA (PUT) inmediatamente al cierre de la vela verde que rompió el mínimo con su mecha."
  },
  ss24: {
    code: "SS24",
    name: "Clímax de 4 Velas Crecientes",
    whyItHappens: "Imagina un corredor que empieza trotando y de pronto mete un sprint descontrolado: cada vela es visiblemente más grande que la anterior (1 < 2 < 3 < 4). Esto no es salud de tendencia, es un clímax de euforia (Wyckoff). En la 4ª vela gigante se consume todo el combustible disponible y el movimiento colapsa por falta de nuevos participantes.",
    whoIsTrapped: "El público retail que entra tarde por FOMO en la 4ª vela gigante, sirviendo como contrapartida para que las manos fuertes tomen ganancias.",
    triggerRule: "Operar en REVERSIÓN (dirección opuesta) inmediatamente al cierre de la 4ª vela creciente."
  },
  ss25: {
    code: "SS25",
    name: "Patrón Brasileño (1V, 2R, 1V, 1R)",
    whyItHappens: "Es una oscilación periódica de 5 fases dentro de un canal en vivo. El mercado acumula energía en ciclos repetitivos: 1 verde, 2 rojas, 1 verde y 1 roja que toca el soporte sin perforarlo. Al completarse la 5ª fase, la demanda pasiva frena la caída y activa la rotación al alza.",
    whoIsTrapped: "Los vendedores que siguen apostando a la ruptura bajista en la última roja, ignorando que el ciclo fractal ya completó su recorrido.",
    triggerRule: "Entrar en COMPRA (CALL) en cuanto cierra la 5ª vela roja del ciclo."
  }
};

export const getExplanation = (patternId: string, userQuery?: string): string => {
  const cleanId = (patternId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const pattern = DIDACTIC_PATTERNS[cleanId] || DIDACTIC_PATTERNS['ss03'];

  if (!userQuery) {
    return `📘 **${pattern.code} - ${pattern.name}**\n\n` +
      `💡 **¿Por qué ocurre?**\n${pattern.whyItHappens}\n\n` +
      `🪤 **¿Quién cae en la trampa?**\n${pattern.whoIsTrapped}\n\n` +
      `🎯 **Gatillo de Entrada:**\n${pattern.triggerRule}`;
  }

  return `Respecto al patrón **${pattern.code}**:\n${pattern.whyItHappens}\n\nRegla clave: ${pattern.triggerRule}`;
};
