import type { TestsStream } from "./types.js";
import type { ChainType } from "../../../types/network.js";
import type { ArtifactId, Artifact, SolidityTestRunnerConfigArgs, TracingConfigWithBuffers } from "@nomicfoundation/edr";
export interface RunOptions {
    /**
     * The maximum time in milliseconds to wait for all the test suites to finish.
     */
    timeout?: number;
}
/**
 * Run all the given solidity tests and returns the stream of results.
 *
 * It returns a Readable stream that emits the test events similarly to how the
 * node test runner does it.
 *
 * The stream is closed when all the test suites have been run.
 *
 * This function, initially, was a direct port of the example v2 integration in
 * the EDR repo (see  https://github.com/NomicFoundation/edr/blob/main/js/helpers/src/index.ts).
 *
 * Despite the changes, the signature of the function should still be considered
 * a draft that may change in the future.
 *
 * TODO: Once the signature is finalised, give feedback to the EDR team.
 */
export declare function run(chainType: ChainType, artifacts: Artifact[], testSuiteIds: ArtifactId[], configArgs: SolidityTestRunnerConfigArgs, tracingConfig: TracingConfigWithBuffers, sourceNameToUserSourceName: Map<string, string>, options?: RunOptions): TestsStream;
//# sourceMappingURL=runner.d.ts.map