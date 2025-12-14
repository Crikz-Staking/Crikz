import { resolveSolidityUserConfig, validateSolidityUserConfig, } from "../config.js";
export default async () => {
    const handlers = {
        validateUserConfig: async (userConfig) => validateSolidityUserConfig(userConfig),
        resolveUserConfig: async (userConfig, resolveConfigurationVariable, next) => {
            const resolvedConfig = await next(userConfig, resolveConfigurationVariable);
            return resolveSolidityUserConfig(userConfig, resolvedConfig);
        },
    };
    return handlers;
};
//# sourceMappingURL=config.js.map