import { DEFAULT_NETWORK_NAME } from "../../../constants.js";
export default async () => ({
    created: async (context, hre) => {
        let networkManager;
        hre.network = {
            async connect(networkConnectionParams) {
                if (networkManager === undefined) {
                    networkManager = await createNetworkManager(hre, context);
                }
                return networkManager.connect(networkConnectionParams);
            },
            async createServer(...params) {
                if (networkManager === undefined) {
                    networkManager = await createNetworkManager(hre, context);
                }
                return networkManager.createServer(...params);
            },
        };
    },
});
async function createNetworkManager(hre, context) {
    const { NetworkManagerImplementation } = await import("../network-manager.js");
    return new NetworkManagerImplementation(hre.globalOptions.network !== undefined
        ? hre.globalOptions.network
        : DEFAULT_NETWORK_NAME, hre.config.defaultChainType, hre.config.networks, context.hooks, context.artifacts, hre.userConfig, hre.config.chainDescriptors, hre.globalOptions.config, hre.config.paths.root);
}
//# sourceMappingURL=hre.js.map