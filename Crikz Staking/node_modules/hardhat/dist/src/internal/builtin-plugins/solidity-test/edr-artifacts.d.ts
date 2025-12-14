import type { ArtifactManager } from "../../../types/artifacts.js";
import type { BuildInfoAndOutput, Artifact as EdrArtifact } from "@nomicfoundation/edr";
/**
 * This function returns all the build infos and associated outputs.
 *
 * @param artifactManager The artifact manager.
 * @returns The build infos in the Hardhat v3 format as expected by the EDR.
 */
export declare function getBuildInfos(artifactManager: ArtifactManager): Promise<BuildInfoAndOutput[]>;
/**
 * This function returns the artifacts generated during the compilation.
 *
 * @param artifactManager The artifact manager.
 * @returns The artifacts in the format expected by the EDR.
 */
export declare function getEdrArtifacts(artifactManager: ArtifactManager): Promise<Array<{
    edrAtifact: EdrArtifact;
    userSourceName: string;
}>>;
//# sourceMappingURL=edr-artifacts.d.ts.map