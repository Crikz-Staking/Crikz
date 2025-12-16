// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library WorkTiers {
    uint8 public constant MAX_TIER = 6;
    
    struct Tier {
        uint256 lockDuration;
        uint256 reputationMultiplier;
        string name;
    }

    error InvalidTier();

    function initializeTiers() internal pure returns (Tier[7] memory) {
        Tier[7] memory tiers;
        
        tiers[0] = Tier({
            lockDuration: 5 days,
            reputationMultiplier: 618 * 10**15,
            name: "Apprentice"
        });
        
        tiers[1] = Tier({
            lockDuration: 13 days,
            reputationMultiplier: 787 * 10**15,
            name: "Journeyman"
        });
        
        tiers[2] = Tier({
            lockDuration: 34 days,
            reputationMultiplier: 1001 * 10**15,
            name: "Specialist"
        });
        
        tiers[3] = Tier({
            lockDuration: 89 days,
            reputationMultiplier: 1273 * 10**15,
            name: "Expert"
        });
        
        tiers[4] = Tier({
            lockDuration: 233 days,
            reputationMultiplier: 1619 * 10**15,
            name: "Master"
        });
        
        tiers[5] = Tier({
            lockDuration: 610 days,
            reputationMultiplier: 2059 * 10**15,
            name: "Grandmaster"
        });
        
        tiers[6] = Tier({
            lockDuration: 1597 days,
            reputationMultiplier: 2618 * 10**15,
            name: "Legend"
        });
        
        return tiers;
    }
    
    function isValidTier(uint8 tier) internal pure returns (bool) {
        return tier <= MAX_TIER;
    }

    function validateTier(uint8 tier) internal pure {
        if (!isValidTier(tier)) revert InvalidTier();
    }
}