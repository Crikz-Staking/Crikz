import type { InstallationName, RemappedNpmPackagesGraph, Remapping, ResolvedUserRemapping, RemappedNpmPackagesGraphJson, Result } from "./types.js";
import type { ResolvedFile, ResolvedNpmPackage, UserRemappingError } from "../../../../../types/solidity.js";
export declare function isResolvedUserRemapping(remapping: Remapping | ResolvedUserRemapping): remapping is ResolvedUserRemapping;
export declare class RemappedNpmPackagesGraphImplementation implements RemappedNpmPackagesGraph {
    #private;
    static create(projectRootPath: string): Promise<RemappedNpmPackagesGraphImplementation>;
    private constructor();
    getHardhatProjectPackage(): ResolvedNpmPackage;
    /**
     * Resolves a dependency of the package `from` by its installation name.
     *
     * This method modifies the graph, potentially loading new packages, but it
     * doesn't read its remappings, and it doesn't take user remappings into
     * account.
     *
     * This method is pretty complex, so read the comments carefully.
     *
     * @param from The package from which the dependency is being resolved.
     * @param installationName The installation name of the dependency.
     * @returns The package and generated remappings, or undefined if the
     * dependency could not be resolved.
     */
    resolveDependencyByInstallationName(from: ResolvedNpmPackage, installationName: InstallationName): Promise<{
        package: ResolvedNpmPackage;
        generatedRemapping: Remapping;
    } | undefined>;
    selectBestUserRemapping(from: ResolvedFile, directImport: string): Promise<Result<ResolvedUserRemapping | undefined, UserRemappingError[]>>;
    generateRemappingIntoNpmFile(fromNpmPackage: ResolvedNpmPackage, directImport: string, targetInputSourceName: string): Promise<Remapping>;
    toJSON(): RemappedNpmPackagesGraphJson;
}
//# sourceMappingURL=remapped-npm-packages-graph.d.ts.map