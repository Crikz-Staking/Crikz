import type { HardhatUserConfig } from "../../../config.js";
import type { ConfigurationVariableResolver, HardhatConfig } from "../../../types/config.js";
import type { HardhatUserConfigValidationError } from "../../../types/hooks.js";
import type { SolidityTestForkingConfig, SolidityTestUserConfig } from "../../../types/test.js";
export declare function resolveSolidityTestForkingConfig(forkingUserConfig: SolidityTestUserConfig["forking"], resolveConfigurationVariable: ConfigurationVariableResolver): SolidityTestForkingConfig | undefined;
export declare function validateSolidityTestUserConfig(userConfig: unknown): HardhatUserConfigValidationError[];
export declare function resolveSolidityTestUserConfig(userConfig: HardhatUserConfig, resolvedConfig: HardhatConfig, resolveConfigurationVariable: ConfigurationVariableResolver): Promise<HardhatConfig>;
//# sourceMappingURL=config.d.ts.map