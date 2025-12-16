// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library WorkTiers {
    uint8 public constant MAX_TIER = 6;
    
    struct Tier {
        uint256 lockDuration;
        uint256 reputationFactor;
    }

    error InvalidTier();

    function initializeTiers() internal pure returns (Tier[] memory) {
        Tier[] memory tiers = new Tier[](7);
        tiers[0] = Tier({ lockDuration: 5 days, reputationFactor: 618 * 10**15 });
        tiers[1] = Tier({ lockDuration: 13 days, reputationFactor: 787 * 10**15 });
        tiers[2] = Tier({ lockDuration: 34 days, reputationFactor: 1001 * 10**15 });
        tiers[3] = Tier({ lockDuration: 89 days, reputationFactor: 1273 * 10**15 });
        tiers[4] = Tier({ lockDuration: 233 days, reputationFactor: 1619 * 10**15 });
        tiers[5] = Tier({ lockDuration: 610 days, reputationFactor: 2059 * 10**15 });
        tiers[6] = Tier({ lockDuration: 1597 days, reputationFactor: 2618 * 10**15 });
        return tiers;
    }
    
    function isValidTier(uint8 tier) internal pure returns (bool) {
        return tier <= MAX_TIER;
    }

    function validateTier(uint8 tier) internal pure {
        if (!isValidTier(tier)) revert InvalidTier();
    }
}