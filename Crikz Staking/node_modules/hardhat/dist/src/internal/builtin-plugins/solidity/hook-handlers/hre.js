class LazySolidityBuildSystem {
    #hooks;
    #options;
    #buildSystem;
    constructor(hooks, options) {
        this.#hooks = hooks;
        this.#options = options;
    }
    async getRootFilePaths(options = {}) {
        const buildSystem = await this.#getBuildSystem();
        return buildSystem.getRootFilePaths(options);
    }
    async getScope(fsPath) {
        const buildSystem = await this.#getBuildSystem();
        return buildSystem.getScope(fsPath);
    }
    async build(rootFiles, options) {
        const buildSystem = await this.#getBuildSystem();
        return buildSystem.build(rootFiles, options);
    }
    async getCompilationJobs(rootFiles, options) {
        const buildSystem = await this.#getBuildSystem();
        return buildSystem.getCompilationJobs(rootFiles, options);
    }
    async runCompilationJob(compilationJob, options) {
        const buildSystem = await this.#getBuildSystem();
        return buildSystem.runCompilationJob(compilationJob, options);
    }
    async remapCompilerError(compilationJob, error, shouldShortenPaths) {
        const buildSystem = await this.#getBuildSystem();
        return buildSystem.remapCompilerError(compilationJob, error, shouldShortenPaths);
    }
    async emitArtifacts(compilationJob, compilerOutput, options = {}) {
        const buildSystem = await this.#getBuildSystem();
        return buildSystem.emitArtifacts(compilationJob, compilerOutput, options);
    }
    async cleanupArtifacts(rootFilePaths, options = {}) {
        const buildSystem = await this.#getBuildSystem();
        return buildSystem.cleanupArtifacts(rootFilePaths, options);
    }
    async compileBuildInfo(buildInfo, options) {
        const buildSystem = await this.#getBuildSystem();
        return buildSystem.compileBuildInfo(buildInfo, options);
    }
    async getArtifactsDirectory(scope) {
        const buildSystem = await this.#getBuildSystem();
        return buildSystem.getArtifactsDirectory(scope);
    }
    async #getBuildSystem() {
        const { SolidityBuildSystemImplementation } = await import("../build-system/build-system.js");
        if (this.#buildSystem === undefined) {
            this.#buildSystem = new SolidityBuildSystemImplementation(this.#hooks, this.#options);
        }
        return this.#buildSystem;
    }
}
export default async () => {
    return {
        created: async (_context, hre) => {
            hre.solidity = new LazySolidityBuildSystem(hre.hooks, {
                solidityConfig: hre.config.solidity,
                projectRoot: hre.config.paths.root,
                soliditySourcesPaths: hre.config.paths.sources.solidity,
                artifactsPath: hre.config.paths.artifacts,
                cachePath: hre.config.paths.cache,
                solidityTestsPath: hre.config.paths.tests.solidity,
            });
        },
    };
};
//# sourceMappingURL=hre.js.map