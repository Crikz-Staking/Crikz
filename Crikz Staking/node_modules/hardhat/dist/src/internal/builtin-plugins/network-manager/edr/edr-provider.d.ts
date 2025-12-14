import type { CoverageConfig } from "./types/coverage.js";
import type { LoggerConfig } from "./types/logger.js";
import type { ChainDescriptorsConfig, EdrNetworkConfig, EdrNetworkHDAccountsConfig } from "../../../../types/config.js";
import type { RequestArguments, SuccessfulJsonRpcResponse } from "../../../../types/providers.js";
import type { RequireField } from "../../../../types/utils.js";
import type { DefaultHDAccountsConfigParams } from "../accounts/constants.js";
import type { JsonRpcRequestWrapperFunction } from "../network-manager.js";
import type { SubscriptionEvent, ProviderConfig, TracingConfigWithBuffers, GasReportConfig } from "@nomicfoundation/edr";
import { BaseProvider } from "../base-provider.js";
export declare const EDR_NETWORK_DEFAULT_COINBASE = "0xc014ba5ec014ba5ec014ba5ec014ba5ec014ba5e";
interface EdrNetworkDefaultHDAccountsConfigParams extends DefaultHDAccountsConfigParams {
    mnemonic: string;
    accountsBalance: bigint;
}
export declare const EDR_NETWORK_MNEMONIC = "test test test test test test test test test test test junk";
export declare const DEFAULT_EDR_NETWORK_BALANCE = 10000000000000000000000n;
export declare const DEFAULT_EDR_NETWORK_HD_ACCOUNTS_CONFIG_PARAMS: EdrNetworkDefaultHDAccountsConfigParams;
export declare function isDefaultEdrNetworkHDAccountsConfig(accounts: EdrNetworkHDAccountsConfig): Promise<boolean>;
export declare const EDR_NETWORK_DEFAULT_PRIVATE_KEYS: string[];
interface EdrProviderConfig {
    chainDescriptors: ChainDescriptorsConfig;
    networkConfig: RequireField<EdrNetworkConfig, "chainType">;
    loggerConfig?: LoggerConfig;
    tracingConfig?: TracingConfigWithBuffers;
    jsonRpcRequestWrapper?: JsonRpcRequestWrapperFunction;
    coverageConfig?: CoverageConfig;
    gasReportConfig?: GasReportConfig;
}
export declare class EdrProvider extends BaseProvider {
    #private;
    /**
     * Creates a new instance of `EdrProvider`.
     */
    static create({ chainDescriptors, networkConfig, loggerConfig, tracingConfig, jsonRpcRequestWrapper, coverageConfig, gasReportConfig, }: EdrProviderConfig): Promise<EdrProvider>;
    /**
     * @private
     *
     * This constructor is intended for internal use only.
     * Use the static method {@link EdrProvider.create} to create an instance of
     * `EdrProvider`.
     */
    private constructor();
    request(requestArguments: RequestArguments): Promise<SuccessfulJsonRpcResponse["result"]>;
    close(): Promise<void>;
    addCompilationResult(solcVersion: string, compilerInput: any, compilerOutput: any): Promise<void>;
    onSubscriptionEvent(event: SubscriptionEvent): void;
}
export declare function getProviderConfig(networkConfig: RequireField<EdrNetworkConfig, "chainType">, coverageConfig: CoverageConfig | undefined, gasReportConfig: GasReportConfig | undefined, chainDescriptors: ChainDescriptorsConfig): Promise<ProviderConfig>;
export {};
//# sourceMappingURL=edr-provider.d.ts.map