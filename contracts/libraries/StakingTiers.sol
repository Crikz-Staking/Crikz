// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CrikzMath.sol";

library StakingTiers {
    struct Tier {
        uint256 lockDuration; // In seconds
        uint256 weightFactor; // Multiplier with WAD precision
    }

    // Initialize the 7 tiers
    function initializeTiers() internal pure returns (Tier[] memory) {
        Tier[] memory tiers = new Tier[](7);

        // Tier 0: Seed (5 days, 0.618x)
        tiers[0] = Tier({ lockDuration: 5 days, weightFactor: 618 * 10**15 }); 

        // Tier 1: Growth (13 days, 0.787x)
        tiers[1] = Tier({ lockDuration: 13 days, weightFactor: 787 * 10**15 });

        // Tier 2: Rise (34 days, 1.001x)
        tiers[2] = Tier({ lockDuration: 34 days, weightFactor: 1001 * 10**15 });

        // Tier 3: Peak (89 days, 1.273x)
        tiers[3] = Tier({ lockDuration: 89 days, weightFactor: 1273 * 10**15 });

        // Tier 4: Zenith (233 days, 1.619x)
        tiers[4] = Tier({ lockDuration: 233 days, weightFactor: 1619 * 10**15 });

        // Tier 5: Crown (610 days, 2.059x)
        tiers[5] = Tier({ lockDuration: 610 days, weightFactor: 2059 * 10**15 });

        // Tier 6: Legacy (1597 days, 2.618x)
        tiers[6] = Tier({ lockDuration: 1597 days, weightFactor: 2618 * 10**15 });

        return tiers;
    }
    
    function isValidTier(uint8 tier) internal pure returns (bool) {
        return tier < 7;
    }
}