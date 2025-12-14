import { deepClone } from "@nomicfoundation/hardhat-utils/lang";
import { AsyncMutex } from "@nomicfoundation/hardhat-utils/synchronization";
import { isJsonRpcResponse } from "../json-rpc.js";
export default async () => {
    // This map is essential for managing multiple network connections in Hardhat V3.
    // Since Hardhat V3 supports multiple connections, we use this map to track each one
    // and associate it with the corresponding handlers array.
    // When a connection is closed, its associated handlers array is removed from the map.
    // See the "closeConnection" function at the end of the file for more details.
    const requestHandlersPerConnection = new WeakMap();
    const initializationMutex = new AsyncMutex();
    const handlers = {
        async onRequest(context, networkConnection, jsonRpcRequest, next) {
            const { createHandlersArray } = await import("../request-handlers/handlers-array.js");
            const requestHandlers = await initializationMutex.exclusiveRun(async () => {
                let handlersPerConnection = requestHandlersPerConnection.get(networkConnection);
                if (handlersPerConnection === undefined) {
                    handlersPerConnection =
                        await createHandlersArray(networkConnection);
                    requestHandlersPerConnection.set(networkConnection, handlersPerConnection);
                }
                return handlersPerConnection;
            });
            // We clone the request to avoid interfering with other hook handlers that
            // might be using the original request.
            let request = await deepClone(jsonRpcRequest);
            for (const handler of requestHandlers) {
                const newRequestOrResponse = await handler.handle(request);
                if (isJsonRpcResponse(newRequestOrResponse)) {
                    return newRequestOrResponse;
                }
                request = newRequestOrResponse;
            }
            return next(context, networkConnection, request);
        },
        async closeConnection(context, networkConnection, next) {
            if (requestHandlersPerConnection.has(networkConnection) === true) {
                requestHandlersPerConnection.delete(networkConnection);
            }
            return next(context, networkConnection);
        },
    };
    return handlers;
};
//# sourceMappingURL=network.js.map