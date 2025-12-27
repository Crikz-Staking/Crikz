// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CrikzMedia is Ownable {
    enum MediaType { VIDEO, AUDIO }

    struct MediaItem {
        uint256 id;
        address author;
        string cid;      // IPFS Content ID
        string title;
        MediaType mediaType;
        uint256 timestamp;
        uint256 tipsReceived;
    }

    MediaItem[] public mediaList;
    mapping(address => uint256[]) public userUploads;

    event MediaPublished(uint256 indexed id, address indexed author, string cid, string title);
    event MediaTipped(uint256 indexed id, address indexed from, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function publishMedia(string memory _cid, string memory _title, MediaType _type) external {
        uint256 newId = mediaList.length;
        
        MediaItem memory newItem = MediaItem({
            id: newId,
            author: msg.sender,
            cid: _cid,
            title: _title,
            mediaType: _type,
            timestamp: block.timestamp,
            tipsReceived: 0
        });

        mediaList.push(newItem);
        userUploads[msg.sender].push(newId);

        emit MediaPublished(newId, msg.sender, _cid, _title);
    }

    function tipAuthor(uint256 _id) external payable {
        require(_id < mediaList.length, "Media does not exist");
        MediaItem storage item = mediaList[_id];
        
        require(msg.value > 0, "Tip must be > 0");
        payable(item.author).transfer(msg.value);
        
        item.tipsReceived += msg.value;
        emit MediaTipped(_id, msg.sender, msg.value);
    }

    function getMediaCount() external view returns (uint256) {
        return mediaList.length;
    }

    // Fetch in reverse order (newest first) with pagination would be better for production,
    // but for this scale, fetching the whole array is acceptable.
    function getAllMedia() external view returns (MediaItem[] memory) {
        return mediaList;
    }
}