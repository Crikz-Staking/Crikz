import type { TestEventSource, TestReporterResult } from "./types.js";
import { type Colorizer } from "./formatters.js";
/**
 * This is a solidity test reporter. It is intended to be composed with the
 * solidity test runner's test stream. It was based on the hardhat node test
 * reporter's design.
 */
export declare function testReporter(source: TestEventSource, sourceNameToUserSourceName: Map<string, string>, verbosity: number, testSummaryIndex?: number, colorizer?: Colorizer): TestReporterResult;
//# sourceMappingURL=reporter.d.ts.map