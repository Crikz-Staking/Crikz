import type { RequestHandler } from "./types.js";
import type { ChainType, NetworkConnection } from "../../../../types/network.js";
/**
 * This function returns an handlers array based on the values in the NetworkConnection and NetworkConfig.
 * The order of the handlers, if all are present, is: chain handler, gas handlers (gasPrice first, then gas), sender handler and accounts handler.
 * The order is important to get a correct result when the handlers are executed.
 * The handlers are imported dynamically because some might take a long time to load.
 * Out of the currently supported handlers, LocalAccountsHandler and, consequently, HDWalletHandler have been identified as the most expensive.
 * See https://github.com/NomicFoundation/hardhat/pull/6481 for more details.
 */
export declare function createHandlersArray<ChainTypeT extends ChainType | string>(networkConnection: NetworkConnection<ChainTypeT>): Promise<RequestHandler[]>;
//# sourceMappingURL=handlers-array.d.ts.map