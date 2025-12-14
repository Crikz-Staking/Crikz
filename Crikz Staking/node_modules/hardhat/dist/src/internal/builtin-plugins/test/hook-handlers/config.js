import { resolveTestUserConfig } from "../config.js";
export default async () => {
    const handlers = {
        resolveUserConfig: async (userConfig, resolveConfigurationVariable, next) => {
            const resolvedConfig = await next(userConfig, resolveConfigurationVariable);
            return resolveTestUserConfig(userConfig, resolvedConfig);
        },
    };
    return handlers;
};
//# sourceMappingURL=config.js.map