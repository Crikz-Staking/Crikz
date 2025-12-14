import type { RunOptions } from "./runner.js";
import type { ChainType } from "../../../types/network.js";
import type { SolidityTestConfig } from "../../../types/test.js";
import type { SolidityTestRunnerConfigArgs, Artifact, ObservabilityConfig } from "@nomicfoundation/edr";
import { type Colorizer } from "./formatters.js";
interface SolidityTestConfigParams {
    chainType: ChainType;
    projectRoot: string;
    config: SolidityTestConfig;
    verbosity: number;
    observability?: ObservabilityConfig;
    testPattern?: string;
    generateGasReport: boolean;
}
export declare function solidityTestConfigToRunOptions(config: SolidityTestConfig): RunOptions;
export declare function solidityTestConfigToSolidityTestRunnerConfigArgs({ chainType, projectRoot, config, verbosity, observability, testPattern, generateGasReport, }: SolidityTestConfigParams): Promise<SolidityTestRunnerConfigArgs>;
export declare function isTestSuiteArtifact(artifact: Artifact): boolean;
export declare function warnDeprecatedTestFail(artifact: Artifact, sourceNameToUserSourceName: Map<string, string>, colorizer?: Colorizer): void;
export {};
//# sourceMappingURL=helpers.d.ts.map