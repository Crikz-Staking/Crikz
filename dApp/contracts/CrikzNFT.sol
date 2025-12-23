// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CrikzNFT is ERC721Enumerable, ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 public nextTokenId = 1;
    uint256 public mintPrice = 0.01 ether; // 0.01 BNB

    event NFTMinted(address indexed minter, uint256 indexed tokenId, string tokenURI);

    constructor() ERC721("Crikz Artifacts", "CRKZ-ART") Ownable(msg.sender) {}

    // 1. Public Minting (Payable in BNB)
    function mint(string memory _tokenURI) external payable nonReentrant {
        require(msg.value >= mintPrice, "Insufficient BNB sent");
        
        uint256 tokenId = nextTokenId;
        nextTokenId++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        emit NFTMinted(msg.sender, tokenId, _tokenURI);
    }

    function setMintPrice(uint256 _price) external onlyOwner {
        mintPrice = _price;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // --- SOLITIDY OVERRIDES (Fixed for OZ v5) ---

    // Enumerable and URIStorage conflict on these, so we define the hierarchy:
    
    function _update(address to, uint256 tokenId, address auth) 
        internal 
        override(ERC721Enumerable, ERC721) 
        returns (address) 
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) 
        internal 
        override(ERC721Enumerable, ERC721) 
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (string memory) 
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721Enumerable, ERC721URIStorage) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}