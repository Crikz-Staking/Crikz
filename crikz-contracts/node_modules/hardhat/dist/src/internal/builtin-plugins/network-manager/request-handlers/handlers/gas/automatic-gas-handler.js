import { isObject } from "@nomicfoundation/hardhat-utils/lang";
import { getRequestParams } from "../../../json-rpc.js";
import { MultipliedGasEstimation } from "./multiplied-gas-estimation.js";
export const DEFAULT_GAS_MULTIPLIER = 1;
/**
 * This class modifies transaction requests by automatically estimating the gas required,
 * applying a multiplier to the estimated gas.
 *
 * It extends the `MultipliedGasEstimation` class
 * to handle the gas estimation logic. If no gas value is provided in the transaction,
 * the gas is automatically estimated before being added to the request.
 */
export class AutomaticGasHandler extends MultipliedGasEstimation {
    constructor(provider, gasMultiplier = DEFAULT_GAS_MULTIPLIER) {
        super(provider, gasMultiplier);
    }
    async handle(jsonRpcRequest) {
        if (jsonRpcRequest.method !== "eth_sendTransaction") {
            return jsonRpcRequest;
        }
        const params = getRequestParams(jsonRpcRequest);
        const [tx] = params;
        if (isObject(tx) && tx.gas === undefined) {
            tx.gas = await this.getMultipliedGasEstimation(params);
        }
        return jsonRpcRequest;
    }
}
//# sourceMappingURL=automatic-gas-handler.js.map