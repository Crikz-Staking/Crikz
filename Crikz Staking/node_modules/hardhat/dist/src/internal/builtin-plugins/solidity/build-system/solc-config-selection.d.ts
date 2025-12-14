import type { SolcConfig, SolidityBuildProfileConfig } from "../../../../types/config.js";
import type { CompilationJobCreationError } from "../../../../types/solidity/build-system.js";
import type { DependencyGraph } from "../../../../types/solidity.js";
export declare class SolcConfigSelector {
    #private;
    /**
     * Creates a new SolcConfigSelector that can be used to select the best solc
     * configuration for subgraphs of the given dependency graph.
     *
     * All the queries are done in the context of the given dependency graph, and
     * using the same build profile.
     *
     * @param buildProfileName The name of the build profile to use.
     * @param buildProfile  The build profile config.
     * @param _dependencyGraph The entire dependency graph of the project.
     */
    constructor(buildProfileName: string, buildProfile: SolidityBuildProfileConfig, _dependencyGraph: DependencyGraph);
    /**
     * Selects the best solc configuration for a subgraph of the dependency graph
     * with which this selector was created.
     *
     * @param subgraph A single-root subgraph of the dependency graph.
     * @returns The best solc configuration for the subgraph, or a
     * CompilationJobCreationError if no compatible solc version could be found.
     */
    selectBestSolcConfigForSingleRootGraph(subgraph: DependencyGraph): SolcConfig | CompilationJobCreationError;
}
//# sourceMappingURL=solc-config-selection.d.ts.map