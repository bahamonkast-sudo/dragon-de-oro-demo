/**
 * Visionarios Mathematical Engine (calculator.js)
 * High-performance, zero-dependency compound interest and risk management engine
 * with dynamic multi-currency (COP/USD) conversions, custom broker floors, and
 * emotion-focused percentage statistics.
 */
class VisionariosCalculator {
  constructor(config = {}) {
    this.updateConfig(config);
  }

  /**
   * Updates the internal configuration parameters from config.json structure
   * @param {object} config 
   */
  updateConfig(config) {
    this.moneda = config.session?.moneda || "COP";
    this.capitalInicial = Number(config.session?.capital_inicial) || 100000;
    this.stopLossDiario = Number(config.session?.stop_loss_diario) || 0;
    this.copBaseIc = Number(config.session?.tasas_conversion?.COP_BASE_IC) || 4000;
    this.usdBaseIc = Number(config.session?.tasas_conversion?.USD_BASE_IC) || 1;
    this.payoutRate = 0.83; // Binomo standard payout rate (83%)
  }

  /**
   * Gets the active exchange rate relative to USD
   * @returns {number}
   */
  getExchangeRate() {
    return this.moneda === "COP" ? this.copBaseIc : this.usdBaseIc;
  }

  /**
   * Converts a given value from COP to USD
   * @param {number} value 
   * @returns {number}
   */
  convertToUSD(value) {
    return value / this.copBaseIc;
  }

  /**
   * Converts a given value from USD to COP
   * @param {number} value 
   * @returns {number}
   */
  convertToCOP(value) {
    return value * this.copBaseIc;
  }

  /**
   * Converts a value to the current active currency
   * @param {number} value - Value in standard USD-equivalent or raw base
   * @param {string} fromCurrency 
   * @returns {number}
   */
  formatToActiveCurrency(value, fromCurrency) {
    if (fromCurrency === this.moneda) return value;
    if (fromCurrency === "USD" && this.moneda === "COP") {
      return this.convertToCOP(value);
    }
    if (fromCurrency === "COP" && this.moneda === "USD") {
      return this.convertToUSD(value);
    }
    return value;
  }

  /**
   * Switches the active currency and returns converted state variables
   * @param {string} targetCurrency - 'COP' or 'USD'
   */
  switchCurrency(targetCurrency) {
    if (targetCurrency !== "COP" && targetCurrency !== "USD") {
      throw new Error("La moneda de destino debe ser COP o USD.");
    }
    
    if (this.moneda === targetCurrency) return;

    // Convert core values
    if (targetCurrency === "COP") {
      this.capitalInicial = this.convertToCOP(this.capitalInicial);
      this.stopLossDiario = this.convertToCOP(this.stopLossDiario);
    } else {
      this.capitalInicial = this.convertToUSD(this.capitalInicial);
      this.stopLossDiario = this.convertToUSD(this.stopLossDiario);
    }
    
    this.moneda = targetCurrency;
  }

  /**
   * Computes the recommended risk management limits (1% to 2% base risk)
   * @param {number} customRiskPct - Optional custom risk percentage (e.g., 1.5)
   * @returns {object}
   */
  calculateRiskManagement(customRiskPct = null) {
    const minRiskPct = 0.01; // 1%
    const maxRiskPct = 0.02; // 2%
    
    let minLimit = this.capitalInicial * minRiskPct;
    let maxLimit = this.capitalInicial * maxRiskPct;
    
    let customLimit = 0;
    let customAmount = 0;
    if (customRiskPct !== null) {
      customLimit = Number(customRiskPct) / 100;
      customAmount = this.capitalInicial * customLimit;
    }

    // Floor rules: Min limit is $4000 COP or $1 USD
    const absoluteFloor = this.moneda === "COP" ? 4000 : 1;
    if (minLimit < absoluteFloor) minLimit = absoluteFloor;
    if (maxLimit < absoluteFloor) maxLimit = absoluteFloor;
    if (customAmount < absoluteFloor) customAmount = absoluteFloor;

    return {
      moneda: this.moneda,
      capital: this.capitalInicial,
      limite_min_1pct: minLimit,
      limite_max_2pct: maxLimit,
      riesgo_personalizado: customAmount,
      stop_loss_recomendado: this.capitalInicial * 0.05 // 5% standard daily stop loss
    };
  }

  /**
   * Determines if the user has reached their daily target percentage to protect capital from greed.
   * @param {number} profitActual - Current net profit in session (can be positive or negative)
   * @param {number} metaPorcentaje - Daily profit target percentage (e.g. 10 for 10%)
   * @returns {object} { alcanzada: boolean, porcentajeActual: number }
   */
  verificarMetaDiaria(profitActual, metaPorcentaje) {
    if (!this.capitalInicial || this.capitalInicial <= 0) {
      return { alcanzada: false, porcentajeActual: 0 };
    }
    const porcentajeActual = (profitActual / this.capitalInicial) * 100;
    const alcanzada = porcentajeActual >= Number(metaPorcentaje);
    return {
      alcanzada,
      porcentajeActual: Number(porcentajeActual.toFixed(2))
    };
  }

  /**
   * Recalculates dynamic baseline capital for suggestions from a given minute
   * @param {number} startMinute - The threshold minute (1-60)
   * @param {Array<object>} rows - The current session rows
   * @param {number} riskPct - Active risk percentage
   * @returns {object} { balanceAtThreshold: number }
   */
  recalcularBitacoraDesdeMinuto(startMinute, rows, riskPct) {
    let currentBalance = this.capitalInicial;
    let balanceAtThreshold = this.capitalInicial;
    const absoluteFloor = this.moneda === "COP" ? 4000 : 1;
    
    for (let i = 0; i < 60; i++) {
      const row = rows[i];
      if (!row) continue;
      
      const prevBalance = currentBalance;
      
      // Determine trade amount for past rows
      let tradeAmount = currentBalance * (riskPct / 100);
      if (row.customAmount !== null && row.customAmount !== undefined) {
        tradeAmount = row.customAmount;
      }
      
      if (currentBalance > 0 && tradeAmount < absoluteFloor) {
        tradeAmount = absoluteFloor;
      } else if (currentBalance <= 0) {
        tradeAmount = 0;
      }
      
      if (row.result === 'win') {
        const winReturn = tradeAmount * this.payoutRate;
        currentBalance = prevBalance + winReturn;
      } else if (row.result === 'loss') {
        currentBalance = prevBalance - tradeAmount;
      }
      
      if (row.minute === startMinute) {
        balanceAtThreshold = currentBalance;
      }
    }
    
    return {
      balanceAtThreshold
    };
  }

  /**
   * Generates the compound interest table projection at 83% payout (Binomo)
   * @param {number} cycles - Number of cycles/days to project (default 30)
   * @param {number} reinvestmentRate - Reinvestment rate of profits (0.0 to 1.0, default 1.0)
   * @returns {Array<object>} array of compounding cycle objects
   */
  generateCompoundTable(cycles = 30, reinvestmentRate = 1.0) {
    const table = [];
    let currentBalance = this.capitalInicial;
    let totalProfit = 0;

    for (let cycle = 1; cycle <= cycles; cycle++) {
      const startBalance = currentBalance;
      const grossProfit = startBalance * this.payoutRate;
      const profitToReinvest = grossProfit * reinvestmentRate;
      const profitToWithdraw = grossProfit * (1.0 - reinvestmentRate);
      
      currentBalance = startBalance + profitToReinvest;
      totalProfit += grossProfit;

      table.push({
        ciclo: cycle,
        balance_inicial: startBalance,
        rentabilidad_bruta: grossProfit,
        reinvertido: profitToReinvest,
        retirado: profitToWithdraw,
        balance_final: currentBalance,
        ganancia_acumulada: totalProfit
      });
    }

    return table;
  }
}

// Support both ES Modules/CommonJS and Global Browser Scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VisionariosCalculator;
} else if (typeof window !== 'undefined') {
  window.VisionariosCalculator = VisionariosCalculator;
}
