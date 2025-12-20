module.exports = {
  // We skip 'test/' because it contains LibraryHarness.sol 
  // which is not part of the production code.
  skipFiles: [
    'test/LibraryHarness.sol' 
  ]
};