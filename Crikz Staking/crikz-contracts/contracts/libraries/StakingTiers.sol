// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library StakingTiers {
    using CrikzMath for uint256;

    struct Tier {
        uint256 lockDuration;
        uint256 weightFactor;
    }

    function initializeTiers() internal pure returns (Tier[] memory tiers) {
        tiers = new Tier[](7);
        
        uint256[7] memory days = [
            uint256(5),
            uint256(13),
            uint256(34),
            uint256(89),
            uint256(233),
            uint256(610),
            uint256(1597)
        ];
        
        uint256 baseWeight = 618 * 10**15;
        uint256 multiplier = 1272 * 10**15;
        uint256 currentMultiplier = CrikzMath.WAD;
        
        for (uint8 i = 0; i < 7; i++) {
            if (i > 0) {
                currentMultiplier = (currentMultiplier * multiplier) / CrikzMath.WAD;
            }
            
            tiers[i] = Tier({
                lockDuration: days[i] * 1 days,
                weightFactor: (baseWeight * currentMultiplier) / CrikzMath.WAD
            });
        }
        
        return tiers;
    }

    function isValidTier(uint8 tier) internal pure returns (bool) {
        return tier < 7;
    }

    function getTierCount() internal pure returns (uint8) {
        return 7;
    }
}