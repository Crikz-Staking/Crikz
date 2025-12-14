import { readUtf8File } from "@nomicfoundation/hardhat-utils/fs";
export function readSourceFileFactory(hooks) {
    return async (factoryAbsPath) => {
        return hooks.runHandlerChain("solidity", "readSourceFile", [factoryAbsPath], async (_context, absPath) => readUtf8File(absPath));
    };
}
//# sourceMappingURL=read-source-file.js.map