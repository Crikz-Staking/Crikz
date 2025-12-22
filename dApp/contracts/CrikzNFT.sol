// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CrikzNFT
 * @dev Advanced NFT contract with URI storage, Enumerable support, Royalties (EIP-2981),
 * and a built-in simple marketplace listing system.
 */
contract CrikzNFT is 
    ERC721, 
    ERC721Enumerable, 
    ERC721URIStorage, 
    ERC2981, 
    Ownable, 
    ReentrancyGuard 
{
    uint256 private _nextTokenId;

    struct Listing {
        uint256 price;
        address seller;
        bool active;
    }

    // Market Listings (Simple on-chain order book)
    mapping(uint256 => Listing) public listings;

    // Events
    event NFTMinted(address indexed owner, uint256 indexed tokenId, string tokenURI);
    event ItemListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event ItemSold(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event ItemCanceled(uint256 indexed tokenId, address indexed seller);

    constructor() 
        ERC721("Crikz Ecosystem Items", "CRIKZ-NFT") 
        Ownable(msg.sender) 
    {}

    /**
     * @notice Mints a new NFT with metadata and royalty settings
     * @param to The address receiving the NFT
     * @param uri The IPFS/Metadata URI for the token
     * @param royaltyReceiver The address to receive royalty payments
     * @param royaltyFeeNumerator The royalty percentage in basis points (e.g., 500 = 5%)
     */
    function mintItem(
        address to, 
        string memory uri, 
        address royaltyReceiver, 
        uint96 royaltyFeeNumerator
    ) external nonReentrant returns (uint256) {
        uint256 tokenId = ++_nextTokenId;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _setTokenRoyalty(tokenId, royaltyReceiver, royaltyFeeNumerator);
        
        emit NFTMinted(to, tokenId, uri);
        
        return tokenId;
    }

    /**
     * @notice Lists an item for sale in the native currency (BNB/ETH)
     * @param tokenId The ID of the token to list
     * @param price The sale price in wei
     */
    function listForItem(uint256 tokenId, uint256 price) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(price > 0, "Price must be greater than 0");
        // Ensure contract is approved to transfer the NFT when sold
        require(
            getApproved(tokenId) == address(this) || isApprovedForAll(msg.sender, address(this)), 
            "Contract not approved"
        );

        listings[tokenId] = Listing(price, msg.sender, true);
        
        emit ItemListed(tokenId, msg.sender, price);
    }

    /**
     * @notice Buys a listed item
     * @param tokenId The ID of the token to buy
     */
    function buyItem(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Item not for sale");
        require(msg.value >= listing.price, "Insufficient funds");

        // Calculate Royalties
        (address royaltyReceiver, uint256 royaltyAmount) = royaltyInfo(tokenId, listing.price);
        uint256 sellerAmount = listing.price - royaltyAmount;

        // Reset listing
        delete listings[tokenId];

        // Transfer NFT
        _safeTransfer(listing.seller, msg.sender, tokenId);

        // Payout Royalty
        if (royaltyAmount > 0) {
            (bool successRoyalty, ) = payable(royaltyReceiver).call{value: royaltyAmount}("");
            require(successRoyalty, "Royalty transfer failed");
        }

        // Payout Seller
        (bool successSeller, ) = payable(listing.seller).call{value: sellerAmount}("");
        require(successSeller, "Seller transfer failed");

        emit ItemSold(tokenId, msg.sender, listing.price);
    }

    /**
     * @notice Cancels an active listing
     */
    function cancelListing(uint256 tokenId) external nonReentrant {
        require(listings[tokenId].seller == msg.sender, "Not the seller");
        delete listings[tokenId];
        emit ItemCanceled(tokenId, msg.sender);
    }

    // =============================================================
    //                    OVERRIDES
    // =============================================================

    // The following overrides are required by Solidity for multiple inheritance
    // regarding ERC721, ERC721Enumerable, ERC721URIStorage, and ERC2981.

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
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
        override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}