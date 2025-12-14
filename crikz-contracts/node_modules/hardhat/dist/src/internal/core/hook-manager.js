import { assertHardhatInvariant } from "@nomicfoundation/hardhat-errors";
import { ensureError } from "@nomicfoundation/hardhat-utils/error";
import { AsyncMutex } from "@nomicfoundation/hardhat-utils/synchronization";
import { detectPluginNpmDependencyProblems } from "./plugins/detect-plugin-npm-dependency-problems.js";
export class HookManagerImplementation {
    #mutex = new AsyncMutex();
    #projectRoot;
    #pluginsInReverseOrder;
    /**
     * Initially `undefined` to be able to run the config hooks during
     * initialization.
     */
    #context;
    /**
     * The initialized handler categories for each plugin.
     */
    #staticHookHandlerCategories = new Map();
    /**
     * A map of the dynamically registered handler categories.
     *
     * Each array is a list of categories, in reverse order of registration.
     */
    #dynamicHookHandlerCategories = new Map();
    constructor(projectRoot, plugins) {
        this.#projectRoot = projectRoot;
        this.#pluginsInReverseOrder = plugins.toReversed();
    }
    setContext(context) {
        this.#context = context;
    }
    registerHandlers(hookCategoryName, hookHandlerCategory) {
        let categories = this.#dynamicHookHandlerCategories.get(hookCategoryName);
        if (categories === undefined) {
            categories = [];
            this.#dynamicHookHandlerCategories.set(hookCategoryName, categories);
        }
        categories.unshift(hookHandlerCategory);
    }
    unregisterHandlers(hookCategoryName, hookHandlerCategory) {
        const categories = this.#dynamicHookHandlerCategories.get(hookCategoryName);
        if (categories === undefined) {
            return;
        }
        this.#dynamicHookHandlerCategories.set(hookCategoryName, categories.filter((c) => c !== hookHandlerCategory));
    }
    async runHandlerChain(hookCategoryName, hookName, params, defaultImplementation) {
        const handlers = await this.#getHandlersInChainedRunningOrder(hookCategoryName, hookName);
        let handlerParams;
        if (hookCategoryName !== "config") {
            assertHardhatInvariant(this.#context !== undefined, "Context must be set before running non-config hooks");
            handlerParams = [this.#context, ...params];
        }
        else {
            handlerParams = params;
        }
        const numberOfHandlers = handlers.length;
        let index = 0;
        const next = async (...nextParams) => {
            const result = index < numberOfHandlers
                ? await handlers[index++](...nextParams, next)
                : await defaultImplementation(...nextParams);
            return result;
        };
        return next(...handlerParams);
    }
    async runSequentialHandlers(hookCategoryName, hookName, params) {
        const handlers = await this.#getHandlersInSequentialRunningOrder(hookCategoryName, hookName);
        let handlerParams;
        if (hookCategoryName !== "config") {
            assertHardhatInvariant(this.#context !== undefined, "Context must be set before running non-config hooks");
            handlerParams = [this.#context, ...params];
        }
        else {
            handlerParams = params;
        }
        const result = [];
        for (const handler of handlers) {
            result.push(await handler(...handlerParams));
        }
        return result;
    }
    async runParallelHandlers(hookCategoryName, hookName, params) {
        // The ordering of handlers is unimportant here, as they are run in parallel
        const handlers = await this.#getHandlersInChainedRunningOrder(hookCategoryName, hookName);
        let handlerParams;
        if (hookCategoryName !== "config") {
            assertHardhatInvariant(this.#context !== undefined, "Context must be set before running non-config hooks");
            handlerParams = [this.#context, ...params];
        }
        else {
            handlerParams = params;
        }
        return Promise.all(handlers.map((handler) => handler(...handlerParams)));
    }
    async hasHandlers(hookCategoryName, hookName) {
        // The ordering of handlers is unimportant here, as we only check if any exist
        const handlers = await this.#getHandlersInChainedRunningOrder(hookCategoryName, hookName);
        return handlers.length > 0;
    }
    async #getHandlersInChainedRunningOrder(hookCategoryName, hookName) {
        const pluginHooks = await this.#getPluginHooks(hookCategoryName, hookName);
        const dynamicHooks = await this.#getDynamicHooks(hookCategoryName, hookName);
        return [...dynamicHooks, ...pluginHooks];
    }
    async #getHandlersInSequentialRunningOrder(hookCategoryName, hookName) {
        const handlersInChainedOrder = await this.#getHandlersInChainedRunningOrder(hookCategoryName, hookName);
        return handlersInChainedOrder.reverse();
    }
    async #getDynamicHooks(hookCategoryName, hookName) {
        const categories = this.#dynamicHookHandlerCategories.get(hookCategoryName);
        if (categories === undefined) {
            return [];
        }
        return categories.flatMap((hookCategory) => {
            return (hookCategory[hookName] ?? []);
        });
    }
    async #getPluginHooks(hookCategoryName, hookName) {
        const categories = await this.#mutex.exclusiveRun(async () => {
            return Promise.all(this.#pluginsInReverseOrder.map(async (plugin) => {
                const existingCategory = this.#staticHookHandlerCategories
                    .get(plugin.id)
                    ?.get(hookCategoryName);
                if (existingCategory !== undefined) {
                    return existingCategory;
                }
                const hookHandlerCategoryFactory = plugin.hookHandlers?.[hookCategoryName];
                if (hookHandlerCategoryFactory === undefined) {
                    return;
                }
                let factory;
                try {
                    factory = (await hookHandlerCategoryFactory()).default;
                }
                catch (error) {
                    ensureError(error);
                    await detectPluginNpmDependencyProblems(this.#projectRoot, plugin, error);
                    throw error;
                }
                assertHardhatInvariant(typeof factory === "function", `Plugin ${plugin.id} doesn't export a hook factory for category ${hookCategoryName}`);
                const hookCategory = await factory();
                assertHardhatInvariant(hookCategory !== null && typeof hookCategory === "object", `Plugin ${plugin.id} doesn't export a valid factory for category ${hookCategoryName}, it didn't return an object`);
                if (!this.#staticHookHandlerCategories.has(plugin.id)) {
                    this.#staticHookHandlerCategories.set(plugin.id, new Map());
                }
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Defined right above
                this.#staticHookHandlerCategories
                    .get(plugin.id)
                    .set(hookCategoryName, hookCategory);
                return hookCategory;
            }));
        });
        return categories.flatMap((category) => {
            const handler = category?.[hookName];
            if (handler === undefined) {
                return [];
            }
            return handler;
        });
    }
}
//# sourceMappingURL=hook-manager.js.map