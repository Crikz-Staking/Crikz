// contracts/libraries/StakingTiers.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// FIX: Change to reference file in the current directory
import "./CrikzMath.sol";

library StakingTiers {
    using CrikzMath for uint256;
    
    struct Tier {
        uint256 lockDuration; // In seconds
        uint256 weightFactor; // Multiplier with WAD precision (e.g., 1.0 * 1e18)
    }

    // Tier configuration: Index is the tier ID (0, 1, 2, ...)
    function initializeTiers() internal pure returns (Tier[] memory) {
        Tier[] memory tiers = new Tier[](3); // 3 tiers: 0, 1, 2

        // Tier 0: 30 days lock, 1x weight factor
        tiers[0] = Tier({
            lockDuration: 30 days,
            weightFactor: 1 * CrikzMath.WAD
        });

        // Tier 1: 90 days lock, 1.25x weight factor
        tiers[1] = Tier({
            lockDuration: 90 days,
            weightFactor: 125 * 10**16 // 1.25 * 1e18
        });

        // Tier 2: 180 days lock, 1.5x weight factor
        tiers[2] = Tier({
            lockDuration: 180 days,
            weightFactor: 15 * 10**17 // 1.5 * 1e18
        });

        return tiers;
    }
    
    function isValidTier(uint8 tier) internal pure returns (bool) {
        return tier < 3; // Hardcoded to the number of tiers defined in initializeTiers()
    }
}