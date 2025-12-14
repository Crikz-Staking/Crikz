export const HARDHAT_PACKAGE_NAME = "hardhat";
export async function generatePaths(packageName) {
    const { default: envPaths } = await import("env-paths");
    return envPaths(packageName);
}
//# sourceMappingURL=global-dir.js.map