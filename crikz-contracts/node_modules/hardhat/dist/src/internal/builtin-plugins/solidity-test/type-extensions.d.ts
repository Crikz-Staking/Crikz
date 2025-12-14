import "../../../types/config.js";
import type { SensitiveString, ResolvedConfigurationVariable } from "../../../types/config.js";
declare module "../../../types/config.js" {
    interface TestPathsUserConfig {
        solidity?: string;
    }
    interface TestPathsConfig {
        solidity: string;
    }
}
declare module "../../../types/test.js" {
    interface SolidityTestConfigBase {
        timeout?: number;
        fsPermissions?: {
            readWriteFile?: string[];
            readFile?: string[];
            writeFile?: string[];
            dangerouslyReadWriteDirectory?: string[];
            readDirectory?: string[];
            dangerouslyWriteDirectory?: string[];
        };
        isolate?: boolean;
        ffi?: boolean;
        allowInternalExpectRevert?: boolean;
        from?: string;
        txOrigin?: string;
        initialBalance?: bigint;
        blockBaseFeePerGas?: bigint;
        coinbase?: string;
        blockTimestamp?: bigint;
        prevRandao?: bigint;
        blockGasLimit?: bigint | false;
        fuzz?: {
            failurePersistDir?: string;
            failurePersistFile?: string;
            runs?: number;
            maxTestRejects?: number;
            seed?: string;
            dictionaryWeight?: number;
            includeStorage?: boolean;
            includePushBytes?: boolean;
        };
        invariant?: {
            failurePersistDir?: string;
            runs?: number;
            depth?: number;
            failOnRevert?: boolean;
            callOverride?: boolean;
            dictionaryWeight?: number;
            includeStorage?: boolean;
            includePushBytes?: boolean;
            shrinkRunLimit?: number;
        };
    }
    interface SolidityTestForkingUserConfig {
        url?: SensitiveString;
        blockNumber?: bigint;
        rpcEndpoints?: Record<string, SensitiveString>;
    }
    interface SolidityTestUserConfig extends SolidityTestConfigBase {
        forking?: SolidityTestForkingUserConfig;
    }
    interface HardhatTestUserConfig {
        solidity?: SolidityTestUserConfig;
    }
    interface SolidityTestForkingConfig {
        url?: ResolvedConfigurationVariable;
        blockNumber?: bigint;
        rpcEndpoints?: Record<string, ResolvedConfigurationVariable>;
    }
    interface SolidityTestConfig extends SolidityTestConfigBase {
        forking?: SolidityTestForkingConfig;
    }
    interface HardhatTestConfig {
        solidity: SolidityTestConfig;
    }
}
//# sourceMappingURL=type-extensions.d.ts.map