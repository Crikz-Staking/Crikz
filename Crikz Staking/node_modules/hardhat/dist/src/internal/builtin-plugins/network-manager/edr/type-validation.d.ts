import type { DebugTraceResult } from "@nomicfoundation/edr";
export declare function isDebugTraceResult(result: unknown): result is DebugTraceResult;
interface EdrProviderErrorData {
    data: string;
    transactionHash?: string;
}
export declare function isEdrProviderErrorData(errorData: unknown): errorData is EdrProviderErrorData;
export {};
//# sourceMappingURL=type-validation.d.ts.map