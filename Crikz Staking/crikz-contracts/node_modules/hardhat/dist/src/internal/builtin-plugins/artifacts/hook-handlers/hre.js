class LazyArtifactManager {
    #artifactsPath;
    #artifactManager;
    constructor(artifactsPath) {
        this.#artifactManager = undefined;
        this.#artifactsPath = artifactsPath;
    }
    async readArtifact(contractNameOrFullyQualifiedName) {
        const artifactManager = await this.#getArtifactManager();
        return artifactManager.readArtifact(contractNameOrFullyQualifiedName);
    }
    async getArtifactPath(contractNameOrFullyQualifiedName) {
        const artifactManager = await this.#getArtifactManager();
        return artifactManager.getArtifactPath(contractNameOrFullyQualifiedName);
    }
    async artifactExists(contractNameOrFullyQualifiedName) {
        const artifactManager = await this.#getArtifactManager();
        return artifactManager.artifactExists(contractNameOrFullyQualifiedName);
    }
    async getAllFullyQualifiedNames() {
        const artifactManager = await this.#getArtifactManager();
        return artifactManager.getAllFullyQualifiedNames();
    }
    async getBuildInfoId(contractNameOrFullyQualifiedName) {
        const artifactManager = await this.#getArtifactManager();
        return artifactManager.getBuildInfoId(contractNameOrFullyQualifiedName);
    }
    async getAllBuildInfoIds() {
        const artifactManager = await this.#getArtifactManager();
        return artifactManager.getAllBuildInfoIds();
    }
    async getBuildInfoPath(buildInfoId) {
        const artifactManager = await this.#getArtifactManager();
        return artifactManager.getBuildInfoPath(buildInfoId);
    }
    async getBuildInfoOutputPath(buildInfoId) {
        const artifactManager = await this.#getArtifactManager();
        return artifactManager.getBuildInfoOutputPath(buildInfoId);
    }
    async clearCache() {
        const artifactManager = await this.#getArtifactManager();
        return artifactManager.clearCache();
    }
    async #getArtifactManager() {
        if (this.#artifactManager === undefined) {
            const { ArtifactManagerImplementation } = await import("../artifact-manager.js");
            this.#artifactManager = new ArtifactManagerImplementation(this.#artifactsPath);
        }
        return this.#artifactManager;
    }
}
export default async () => {
    const handlers = {
        created: async (_context, hre) => {
            hre.artifacts = new LazyArtifactManager(hre.config.paths.artifacts);
        },
    };
    return handlers;
};
//# sourceMappingURL=hre.js.map