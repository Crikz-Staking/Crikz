// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTMarketplace is ReentrancyGuard {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price; // Price in CRIKZ tokens
        bool isActive;
    }

    IERC20 public crikzToken;
    mapping(address => mapping(uint256 => Listing)) public listings;

    event ItemListed(address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 price);
    event ItemSold(address indexed buyer, address indexed nftContract, uint256 indexed tokenId, uint256 price);
    event ItemCanceled(address indexed seller, address indexed nftContract, uint256 indexed tokenId);

    constructor(address _crikzToken) {
        crikzToken = IERC20(_crikzToken);
    }

    // List any NFT (Crikz or External) for sale in CRIKZ
    function listModel(address nftContract, uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "Price must be > 0");
        IERC721 nft = IERC721(nftContract);
        
        // Check ownership and approvals
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(nft.isApprovedForAll(msg.sender, address(this)) || nft.getApproved(tokenId) == address(this), "Marketplace not approved");

        listings[nftContract][tokenId] = Listing(msg.sender, nftContract, tokenId, price, true);
        emit ItemListed(msg.sender, nftContract, tokenId, price);
    }

    // Buy with CRIKZ tokens
    function buyItem(address nftContract, uint256 tokenId) external nonReentrant {
        Listing memory listing = listings[nftContract][tokenId];
        require(listing.isActive, "Item not listed");

        // Remove listing (Checks Effects Interactions pattern)
        delete listings[nftContract][tokenId];

        // Transfer CRIKZ from Buyer to Seller
        require(crikzToken.transferFrom(msg.sender, listing.seller, listing.price), "Token transfer failed");
        
        // Transfer NFT from Seller to Buyer
        IERC721(nftContract).safeTransferFrom(listing.seller, msg.sender, tokenId);

        emit ItemSold(msg.sender, nftContract, tokenId, listing.price);
    }

    function cancelListing(address nftContract, uint256 tokenId) external nonReentrant {
        Listing memory listing = listings[nftContract][tokenId];
        require(listing.seller == msg.sender, "Not seller");
        delete listings[nftContract][tokenId];
        emit ItemCanceled(msg.sender, nftContract, tokenId);
    }
}