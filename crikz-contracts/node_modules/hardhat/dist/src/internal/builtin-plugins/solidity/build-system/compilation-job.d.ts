import type { DependencyGraphImplementation } from "./dependency-graph.js";
import type { SolcConfig } from "../../../../types/config.js";
import type { HookManager } from "../../../../types/hooks.js";
import type { CompilationJob } from "../../../../types/solidity/compilation-job.js";
import type { CompilerInput } from "../../../../types/solidity/compiler-io.js";
import type { DependencyGraph } from "../../../../types/solidity/dependency-graph.js";
export declare class CompilationJobImplementation implements CompilationJob {
    #private;
    readonly dependencyGraph: DependencyGraph;
    readonly solcConfig: SolcConfig;
    readonly solcLongVersion: string;
    constructor(dependencyGraph: DependencyGraphImplementation, solcConfig: SolcConfig, solcLongVersion: string, hooks: HookManager, sharedContentHashes?: Map<string, string>);
    getSolcInput(): Promise<CompilerInput>;
    getBuildId(): Promise<string>;
}
//# sourceMappingURL=compilation-job.d.ts.map