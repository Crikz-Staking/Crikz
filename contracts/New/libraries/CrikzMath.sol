// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library CrikzMath {
    uint256 public constant WAD = 1e18;
    uint256 private constant TAX_FEE_NUMERATOR = 1618;
    uint256 private constant FEE_DENOMINATOR = 100000;
    uint256 public constant BASE_APR_RATE = 618 * 10**15;
    uint256 public constant SECONDS_PER_YEAR = 31550400;
    uint256 public constant MIN_WORK_AMOUNT = 1 * WAD;

    error InvalidAmount();
    error InvalidReputation();

    function calculateTaxFee(uint256 amount) internal pure returns (uint256) {
        if (amount == 0) revert InvalidAmount();
        return (amount * TAX_FEE_NUMERATOR) / FEE_DENOMINATOR;
    }

    function calculateReputation(uint256 amount, uint256 reputationFactor) internal pure returns (uint256) {
        if (amount == 0 || reputationFactor == 0) revert InvalidAmount();
        return (amount * reputationFactor) / WAD;
    }
    
    function calculateTimeBasedWages(
        uint256 poolBalance, 
        uint256 timeElapsed, 
        uint256 totalReputation
    ) internal pure returns (uint256 wagesAccrued) {
        if (totalReputation == 0) return 0;
        wagesAccrued = (poolBalance * BASE_APR_RATE) / WAD;
        wagesAccrued = (wagesAccrued * timeElapsed) / SECONDS_PER_YEAR;
        return wagesAccrued;
    }

    function calculateWagePerReputation(uint256 wagesAccrued, uint256 totalReputation) internal pure returns (uint256) {
        if (wagesAccrued == 0 || totalReputation == 0) return 0;
        return (wagesAccrued * WAD) / totalReputation;
    }

    function getEffectiveAPR() internal pure returns (uint256) {
        return BASE_APR_RATE;
    }
}