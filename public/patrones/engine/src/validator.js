import { Candle, StochasticResult } from "./stochastic";
export function evaluateDecision(pattern, userAction) {
    const expectedAction = pattern.classification.tradeType;
    const actionMatches = userAction === expectedAction;
    const stochRule = pattern.stochRule;
    const mtgPolicy = pattern.mtgPolicy;
    const shouldApplyMTG = mtgPolicy !== "NO_MTG";
    let feedback = "";
    if (actionMatches) {
        feedback = `✅ Acción correcta: ${userAction}. `;
    }
    else {
        feedback = `❌ Acción incorrecta: se esperaba ${expectedAction}, pero se ejecutó ${userAction}. `;
    }
    feedback += `Regla del libro: ${stochRule}. `;
    if (shouldApplyMTG) {
        feedback += `Política MTG activada (${mtgPolicy}): se recomienda aplicar gestión de dinero escalonada. `;
    }
    else {
        feedback += `Sin MTG: operación directa sin capas de dinero adicional. `;
    }
    if (!actionMatches) {
        feedback += `La acción no coincidía con la regla de ${expectedAction}. `;
    }
    return {
        passed: actionMatches,
        message: feedback.trim(),
        expectedAction,
        appliedMTG: shouldApplyMTG,
    };
}
//# sourceMappingURL=validator.js.map