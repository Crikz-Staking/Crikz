// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library WorkTiers {
    struct Tier {
        uint256 lockDuration;
        uint256 reputationMultiplier;
        string name;
    }

    error InvalidTier();

    function initializeTiers() internal pure returns (Tier[7] memory) {
        Tier[7] memory tiers;
        tiers[0] = Tier({ lockDuration: 5 days, reputationMultiplier: 618 * 10**15, name: "Intern" });
        tiers[1] = Tier({ lockDuration: 13 days, reputationMultiplier: 787 * 10**15, name: "Apprentice" });
        tiers[2] = Tier({ lockDuration: 34 days, reputationMultiplier: 1001 * 10**15, name: "Associate" });
        tiers[3] = Tier({ lockDuration: 89 days, reputationMultiplier: 1273 * 10**15, name: "Specialist" });
        tiers[4] = Tier({ lockDuration: 233 days, reputationMultiplier: 1619 * 10**15, name: "Manager" });
        tiers[5] = Tier({ lockDuration: 610 days, reputationMultiplier: 2059 * 10**15, name: "Director" });
        tiers[6] = Tier({ lockDuration: 1597 days, reputationMultiplier: 2618 * 10**15, name: "Executive" });
        return tiers;
    }

    function validateTier(uint8 tier) internal pure {
        if (tier > 6) revert InvalidTier();
    }
}