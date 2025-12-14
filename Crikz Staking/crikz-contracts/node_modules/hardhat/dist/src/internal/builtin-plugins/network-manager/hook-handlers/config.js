import { HardhatError } from "@nomicfoundation/hardhat-errors";
import { DEFAULT_NETWORK_NAME, GENERIC_CHAIN_TYPE, } from "../../../constants.js";
import { resolveChainDescriptors, resolveEdrNetwork, resolveHttpNetwork, } from "../config-resolution.js";
import { validateNetworkUserConfig } from "../type-validation.js";
export default async () => ({
    extendUserConfig,
    validateUserConfig: validateNetworkUserConfig,
    resolveUserConfig,
});
export async function extendUserConfig(config, next) {
    const extendedConfig = await next(config);
    const networks = extendedConfig.networks ?? {};
    const localhostConfig = {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- This is always http
        ...networks.localhost,
    };
    const defaultConfig = {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- This is always edr
        ...networks.default,
    };
    return {
        ...extendedConfig,
        networks: {
            ...networks,
            localhost: {
                url: "http://localhost:8545",
                ...localhostConfig,
                type: "http",
            },
            [DEFAULT_NETWORK_NAME]: {
                chainId: 31337,
                gas: "auto",
                gasMultiplier: 1,
                gasPrice: "auto",
                ...defaultConfig,
                type: "edr-simulated",
            },
        },
    };
}
export async function resolveUserConfig(userConfig, resolveConfigurationVariable, next) {
    const resolvedConfig = await next(userConfig, resolveConfigurationVariable);
    const resolvedDefaultChainType = userConfig.defaultChainType ?? GENERIC_CHAIN_TYPE;
    const networks = userConfig.networks ?? {};
    const resolvedNetworks = {};
    for (const [networkName, networkConfig] of Object.entries(networks)) {
        const networkType = networkConfig.type;
        if (networkType !== "http" && networkType !== "edr-simulated") {
            throw new HardhatError(HardhatError.ERRORS.CORE.NETWORK.INVALID_NETWORK_TYPE, {
                networkName,
                networkType,
            });
        }
        resolvedNetworks[networkName] =
            networkConfig.type === "http"
                ? resolveHttpNetwork(networkConfig, resolveConfigurationVariable)
                : resolveEdrNetwork(networkConfig, resolvedDefaultChainType, resolvedConfig.paths.cache, resolveConfigurationVariable);
    }
    return {
        ...resolvedConfig,
        chainDescriptors: await resolveChainDescriptors(userConfig.chainDescriptors),
        defaultChainType: resolvedDefaultChainType,
        networks: resolvedNetworks,
    };
}
//# sourceMappingURL=config.js.map