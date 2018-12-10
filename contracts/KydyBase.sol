pragma solidity ^0.4.24;

import "./KydyAccessControl.sol";


contract KydyBase is KydyAccessControl {
    event Birth(address indexed owner, uint256 kydyId, uint256 yinId, uint256 yangId, uint256 genes);

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    struct Kydy {
        uint256 genes;

        uint64 birthTime;

        uint64 cooldownEndBlock;

        uint32 yinId;
        uint32 yangId;

        uint32 synthesizingWithId;

        uint16 cooldownIndex;

        uint16 generation;
    }

    uint32[14] public cooldowns = [
        uint32(1 minutes),
        uint32(2 minutes),
        uint32(5 minutes),
        uint32(10 minutes),
        uint32(30 minutes),
        uint32(1 hours),
        uint32(2 hours),
        uint32(4 hours),
        uint32(8 hours),
        uint32(16 hours),
        uint32(1 days),
        uint32(2 days),
        uint32(4 days),
        uint32(7 days)
    ];

    uint256 public secondsPerBlock = 15;

    Kydy[] kydys;

    mapping (uint256 => address) public kydyIndexToOwner;

    mapping (address => uint256) ownershipTokenCount;

    mapping (uint256 => address) public kydyIndexToApproved;

    mapping (uint256 => address) public synthesizeAllowedToAddress;

    function _transfer(address _from, address _to, uint256 _tokenId) internal {
        ownershipTokenCount[_to]++;
        kydyIndexToOwner[_tokenId] = _to;
        if (_from != address(0)) {
            ownershipTokenCount[_from]--;
            delete synthesizeAllowedToAddress[_tokenId];
            delete kydyIndexToApproved[_tokenId];
        }
        emit Transfer(_from, _to, _tokenId);
    }

    function _createKydy(
        uint256 _yinId,
        uint256 _yangId,
        uint256 _generation,
        uint256 _genes,
        address _owner
    )
        internal
        returns (uint)
    {
        require(_yinId == uint256(uint32(_yinId)));
        require(_yangId == uint256(uint32(_yangId)));
        require(_generation == uint256(uint16(_generation)));

        uint16 cooldownIndex = uint16(_generation / 2);
        if (cooldownIndex > 13) {
            cooldownIndex = 13;
        }

        Kydy memory _kyd = Kydy({
            genes: _genes,
            birthTime: uint64(now),
            cooldownEndBlock: 0,
            yinId: uint32(_yinId),
            yangId: uint32(_yangId),
            synthesizingWithId: 0,
            cooldownIndex: cooldownIndex,
            generation: uint16(_generation)
        });
        uint256 newbabykydyId = kydys.push(_kyd) - 1;

        require(newbabykydyId == uint256(uint32(newbabykydyId)));

        emit Birth(
            _owner,
            newbabykydyId,
            uint256(_kyd.yinId),
            uint256(_kyd.yangId),
            _kyd.genes
        );

        _transfer(0, _owner, newbabykydyId);

        return newbabykydyId;
    }

    function setSecondsPerBlock(uint256 secs) external onlyCLevel {
        require(secs < cooldowns[0]);
        secondsPerBlock = secs;
    }
}
