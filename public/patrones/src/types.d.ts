export interface STPattern {
    id: string;
    code: string;
    name: string;
    classification: {
        market: 'TRENDING' | 'RANGED';
        tradeType: 'CALL' | 'PUT';
    };
    requirements: string[];
    snrRule: {
        level: string;
        tipoRuptura: 'body' | 'wick';
    };
    stochRule: string;
    mtgPolicy: '1_STEP' | '2_STEP' | 'NO_MTG';
    simulation: {
        velasBase: number;
        triggerIndex: number;
        resolutionCandle: number;
    };
}
export interface PatternStore {
    patterns: STPattern[];
    selectedPattern: STPattern | null;
    searchQuery: string;
}
export interface MTGBadgeProps {
    policy: STPattern['mtgPolicy'];
}
//# sourceMappingURL=types.d.ts.map