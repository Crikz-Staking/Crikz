import type { HardhatUserConfig } from "../../../config.js";
import type { HardhatConfig } from "../../../types/config.js";
import type { HardhatUserConfigValidationError } from "../../../types/hooks.js";
export declare function validateSolidityUserConfig(userConfig: unknown): HardhatUserConfigValidationError[];
export declare function resolveSolidityUserConfig(userConfig: HardhatUserConfig, resolvedConfig: HardhatConfig): Promise<HardhatConfig>;
export declare function shouldUseWasm(): boolean;
//# sourceMappingURL=config.d.ts.map