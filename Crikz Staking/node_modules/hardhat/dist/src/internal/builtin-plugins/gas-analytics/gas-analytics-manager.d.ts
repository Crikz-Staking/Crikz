import type { GasAnalyticsManager, GasMeasurement } from "./types.js";
interface ContractGasStats {
    deployment?: {
        gas: number;
        size: number;
    };
    functions: Map<string, // function name or signature (if overloaded)
    GasStats>;
}
type GasStatsByContract = Map<string, ContractGasStats>;
interface GasStats {
    min: number;
    max: number;
    avg: number;
    median: number;
    calls: number;
}
type GasMeasurementsByContract = Map<string, ContractGasMeasurements>;
interface ContractGasMeasurements {
    deployment?: {
        gas: number;
        size: number;
    };
    functions: Map<string, // functionSig
    number[]>;
}
export declare class GasAnalyticsManagerImplementation implements GasAnalyticsManager {
    #private;
    gasMeasurements: GasMeasurement[];
    constructor(gasStatsRootPath: string);
    addGasMeasurement(gasMeasurement: GasMeasurement): void;
    clearGasMeasurements(id: string): Promise<void>;
    saveGasMeasurements(id: string): Promise<void>;
    reportGasStats(...ids: string[]): Promise<void>;
    /**
     * @private exposed for testing purposes only
     */
    _loadGasMeasurements(...ids: string[]): Promise<void>;
    /**
     * @private exposed for testing purposes only
     */
    _calculateGasStats(): GasStatsByContract;
    /**
     * @private exposed for testing purposes only
     */
    _aggregateGasMeasurements(): GasMeasurementsByContract;
    /**
     * @private exposed for testing purposes only
     */
    _generateGasStatsReport(gasStatsByContract: GasStatsByContract): string;
}
export declare function avg(values: number[]): number;
export declare function median(values: number[]): number;
export declare function getUserFqn(inputFqn: string): string;
export declare function getFunctionName(signature: string): string;
export declare function findDuplicates<T>(arr: T[]): T[];
export declare function roundTo(value: number, decimals: number): number;
export {};
//# sourceMappingURL=gas-analytics-manager.d.ts.map