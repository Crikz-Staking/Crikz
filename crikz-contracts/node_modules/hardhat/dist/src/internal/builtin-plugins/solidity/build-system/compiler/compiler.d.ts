import type { CompilerInput, CompilerOutput } from "../../../../../types/solidity/compiler-io.js";
export interface Compiler {
    readonly version: string;
    readonly longVersion: string;
    readonly compilerPath: string;
    readonly isSolcJs: boolean;
    compile(input: CompilerInput): Promise<CompilerOutput>;
}
export declare class SolcJsCompiler implements Compiler {
    readonly version: string;
    readonly longVersion: string;
    readonly compilerPath: string;
    readonly isSolcJs = true;
    constructor(version: string, longVersion: string, compilerPath: string);
    compile(input: CompilerInput): Promise<CompilerOutput>;
}
export declare class NativeCompiler implements Compiler {
    readonly version: string;
    readonly longVersion: string;
    readonly compilerPath: string;
    readonly isSolcJs = false;
    constructor(version: string, longVersion: string, compilerPath: string);
    compile(input: CompilerInput): Promise<CompilerOutput>;
}
//# sourceMappingURL=compiler.d.ts.map