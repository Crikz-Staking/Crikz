const { ethers } = require("hardhat");

// Contract Constants
const INITIAL_SUPPLY = ethers.parseUnits("1000000000", 18); // 1 Billion
const WAD = ethers.parseUnits("1", 18);

// Order Type Durations (in seconds)
const ORDER_DURATIONS = {
  PROTOTYPE: 5 * 24 * 60 * 60,      // 5 days
  SMALL_BATCH: 13 * 24 * 60 * 60,   // 13 days
  STANDARD_RUN: 34 * 24 * 60 * 60,  // 34 days
  MASS_PRODUCTION: 89 * 24 * 60 * 60, // 89 days
  INDUSTRIAL: 233 * 24 * 60 * 60,   // 233 days
  GLOBAL_SCALE: 610 * 24 * 60 * 60, // 610 days
  MONOPOLY: 1597 * 24 * 60 * 60     // 1597 days
};

// Reputation Multipliers (18 decimals)
const REPUTATION_MULTIPLIERS = {
  PROTOTYPE: ethers.parseUnits("0.618", 18),
  SMALL_BATCH: ethers.parseUnits("0.787", 18),
  STANDARD_RUN: ethers.parseUnits("1.001", 18),
  MASS_PRODUCTION: ethers.parseUnits("1.273", 18),
  INDUSTRIAL: ethers.parseUnits("1.619", 18),
  GLOBAL_SCALE: ethers.parseUnits("2.059", 18),
  MONOPOLY: ethers.parseUnits("2.618", 18)
};

// Time Constants
const ONE_DAY = 24 * 60 * 60;
const ONE_YEAR = 365 * ONE_DAY;

// APR
const ANNUAL_PERCENTAGE_RATE = 6.182; // 6.182%

module.exports = {
  INITIAL_SUPPLY,
  WAD,
  ORDER_DURATIONS,
  REPUTATION_MULTIPLIERS,
  ONE_DAY,
  ONE_YEAR,
  ANNUAL_PERCENTAGE_RATE
};