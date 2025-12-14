import { isObject } from "@nomicfoundation/hardhat-utils/lang";
import { getRequestParams } from "../../../json-rpc.js";
/**
 * This class ensures that a fixed gas is applied to transaction requests.
 * For `eth_sendTransaction` requests, it sets the gas field with the value provided via the class constructor, if it hasn't been specified already.
 */
export class FixedGasHandler {
    #gas;
    constructor(gas) {
        this.#gas = gas;
    }
    async handle(jsonRpcRequest) {
        if (jsonRpcRequest.method !== "eth_sendTransaction") {
            return jsonRpcRequest;
        }
        const params = getRequestParams(jsonRpcRequest);
        const [tx] = params;
        if (isObject(tx) && tx.gas === undefined) {
            tx.gas = this.#gas;
        }
        return jsonRpcRequest;
    }
}
//# sourceMappingURL=fixed-gas-handler.js.map