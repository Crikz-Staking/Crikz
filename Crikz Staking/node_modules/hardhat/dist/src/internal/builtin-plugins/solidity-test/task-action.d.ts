import type { NewTaskActionFunction } from "../../../types/tasks.js";
interface TestActionArguments {
    testFiles: string[];
    chainType: string;
    grep?: string;
    noCompile: boolean;
    verbosity: number;
    testSummaryIndex: number;
}
declare const runSolidityTests: NewTaskActionFunction<TestActionArguments>;
export default runSolidityTests;
//# sourceMappingURL=task-action.d.ts.map