import { globalFlag } from "../../core/config.js";
import "./type-extensions.js";
const hardhatPlugin = {
    id: "builtin:gas-analytics",
    tasks: [],
    globalOptions: [
        globalFlag({
            name: "gasStats",
            description: "Collects and displays gas usage statistics for all function calls during tests",
        }),
    ],
    hookHandlers: {
        hre: () => import("./hook-handlers/hre.js"),
    },
    npmPackage: "hardhat",
};
export default hardhatPlugin;
//# sourceMappingURL=index.js.map