// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CrikzNFT is ERC721Enumerable, ReentrancyGuard, Ownable {
    uint256 private _tokenIds;
    
    struct Listing {
        uint256 price;
        address seller;
        bool active;
    }

    mapping(uint256 => Listing) public listings;

    event NFTMinted(address indexed owner, uint256 indexed tokenId, string name);
    event ItemListed(uint256 indexed tokenId, uint256 price);

    constructor() ERC721("Crikz Ecosystem Items", "CRIKZ-NFT") {}

    function mintItem() external nonReentrant returns (uint256) {
        _tokenIds++;
        uint256 newItemId = _tokenIds;
        _safeMint(msg.sender, newItemId);
        
        emit NFTMinted(msg.sender, newItemId, string(abi.encodePacked("crikz", uint2str(newItemId))));
        return newItemId;
    }

    function listForItem(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Nuk jeni pronari");
        require(price > 0, "Cmimi duhet te jete mbi zero");
        listings[tokenId] = Listing(price, msg.sender, true);
        emit ItemListed(tokenId, price);
    }

    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) { len++; j /= 10; }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            bstr[--k] = bytes1(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }
}