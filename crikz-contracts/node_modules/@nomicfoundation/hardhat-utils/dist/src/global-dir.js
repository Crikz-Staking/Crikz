import { ensureDir } from "./fs.js";
import { generatePaths, HARDHAT_PACKAGE_NAME } from "./internal/global-dir.js";
/**
 * Returns the configuration directory path for a given package (defaults to "hardhat").
 * Ensures that the directory exists before returning the path.
 *
 * @param packageName The name of the package for which to generate paths. Defaults to "hardhat" if no package name is provided.
 * @returns The path to the hardhat configuration directory.
 * @throws FileSystemAccessError for any error.
 */
export async function getConfigDir(packageName = HARDHAT_PACKAGE_NAME) {
    const { config } = await generatePaths(packageName);
    await ensureDir(config);
    return config;
}
/**
 * Returns the cache directory path for a given package (defaults to "hardhat").
 * Ensures that the directory exists before returning the path.
 *
 * @param packageName The name of the package for which to generate paths. Defaults to "hardhat" if no package name is provided.
 * @returns The path to the hardhat cache directory.
 * @throws FileSystemAccessError for any error.
 */
export async function getCacheDir(packageName = HARDHAT_PACKAGE_NAME) {
    const { cache } = await generatePaths(packageName);
    await ensureDir(cache);
    return cache;
}
/**
 * Returns the telemetry directory path for a given package (defaults to "hardhat").
 * Ensures that the directory exists before returning the path.
 *
 * @param packageName The name of the package for which to generate paths. Defaults to "hardhat" if no package name is provided.
 * @returns A promise that resolves to the path of the telemetry directory.
 * @throws FileSystemAccessError for any error.
 */
export async function getTelemetryDir(packageName = HARDHAT_PACKAGE_NAME) {
    const { data } = await generatePaths(packageName);
    await ensureDir(data);
    return data;
}
//# sourceMappingURL=global-dir.js.map