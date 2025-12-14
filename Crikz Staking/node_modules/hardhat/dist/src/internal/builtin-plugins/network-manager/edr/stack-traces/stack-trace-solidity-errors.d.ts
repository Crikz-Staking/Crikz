import type { SolidityStackTrace, SolidityStackTraceEntry } from "./solidity-stack-trace.js";
export declare function createSolidityErrorWithStackTrace(fallbackMessage: string, stackTrace: SolidityStackTrace, data: string, transactionHash?: string): SolidityError;
export declare function encodeStackTraceEntry(stackTraceEntry: SolidityStackTraceEntry): SolidityCallSite;
/**
 * Note: This error class MUST NOT extend ProviderError, as libraries use the
 * code property to detect if they are dealing with a JSON-RPC error, and take
 * control of errors.
 **/
export declare class SolidityError extends Error {
    readonly stackTrace: SolidityStackTrace;
    readonly data: string;
    readonly transactionHash?: string | undefined;
    constructor(message: string, stackTrace: SolidityStackTrace, data: string, transactionHash?: string | undefined);
}
export declare class SolidityCallSite implements NodeJS.CallSite {
    #private;
    constructor(_sourceName: string | undefined, _contract: string | undefined, _functionName: string | undefined, _line: number | undefined);
    getColumnNumber(): null;
    getEvalOrigin(): undefined;
    getFileName(): string;
    getFunction(): undefined;
    getFunctionName(): string | null;
    getLineNumber(): number | null;
    getMethodName(): string | null;
    getPosition(): number;
    getPromiseIndex(): number;
    getScriptNameOrSourceURL(): string;
    getThis(): undefined;
    getTypeName(): string | null;
    isAsync(): boolean;
    isConstructor(): boolean;
    isEval(): boolean;
    isNative(): boolean;
    isPromiseAll(): boolean;
    isToplevel(): boolean;
    getScriptHash(): string;
    getEnclosingColumnNumber(): number;
    getEnclosingLineNumber(): number;
    toString(): string;
}
//# sourceMappingURL=stack-trace-solidity-errors.d.ts.map