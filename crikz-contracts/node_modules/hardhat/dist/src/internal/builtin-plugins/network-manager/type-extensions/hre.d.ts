import type { NetworkManager } from "../../../../types/network.js";
import "../../../../types/hre.js";
declare module "../../../../types/hre.js" {
    interface HardhatRuntimeEnvironment {
        network: NetworkManager;
    }
}
//# sourceMappingURL=hre.d.ts.map