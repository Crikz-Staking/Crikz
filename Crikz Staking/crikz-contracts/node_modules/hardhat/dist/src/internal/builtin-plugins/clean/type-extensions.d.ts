import "../../../types/hooks.js";
declare module "../../../types/hooks.js" {
    interface HardhatHooks {
        clean: CleanHooks;
    }
    interface CleanHooks {
        onClean: (context: HookContext) => Promise<void>;
    }
}
//# sourceMappingURL=type-extensions.d.ts.map