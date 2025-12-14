/**
 * Returns the configuration directory path for a given package (defaults to "hardhat").
 * Ensures that the directory exists before returning the path.
 *
 * @param packageName The name of the package for which to generate paths. Defaults to "hardhat" if no package name is provided.
 * @returns The path to the hardhat configuration directory.
 * @throws FileSystemAccessError for any error.
 */
export declare function getConfigDir(packageName?: string): Promise<string>;
/**
 * Returns the cache directory path for a given package (defaults to "hardhat").
 * Ensures that the directory exists before returning the path.
 *
 * @param packageName The name of the package for which to generate paths. Defaults to "hardhat" if no package name is provided.
 * @returns The path to the hardhat cache directory.
 * @throws FileSystemAccessError for any error.
 */
export declare function getCacheDir(packageName?: string): Promise<string>;
/**
 * Returns the telemetry directory path for a given package (defaults to "hardhat").
 * Ensures that the directory exists before returning the path.
 *
 * @param packageName The name of the package for which to generate paths. Defaults to "hardhat" if no package name is provided.
 * @returns A promise that resolves to the path of the telemetry directory.
 * @throws FileSystemAccessError for any error.
 */
export declare function getTelemetryDir(packageName?: string): Promise<string>;
//# sourceMappingURL=global-dir.d.ts.map