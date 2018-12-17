pragma solidity ^0.4.24;

import "./KydyMinting.sol";
import "./Travel/KydyTravelInterface.sol";

contract KydyCore is KydyMinting {

    address public newContractAddress;

    constructor() public {
        paused = true;

        ceoAddress = msg.sender;

        cfoAddress = msg.sender;

        cooAddress = msg.sender;

        _createKydy(0, 0, 0, uint256(-1), address(0));
    }

    function setNewAddress(address _v2Address) public onlyCEO whenPaused {
        newContractAddress = _v2Address;
        emit ContractUpgrade(_v2Address);
    }

    function() external payable {
        require(
            msg.sender == address(saleAuction) ||
            msg.sender == address(synthesizingAuction)
        );
    }

    function getKydy(uint256 _id)
        public
        view
        returns (
        bool isGestating,
        bool isReady,
        uint256 cooldownIndex,
        uint256 nextActionAt,
        uint256 synthesizingWithId,
        uint256 birthTime,
        uint256 yinId,
        uint256 yangId,
        uint256 generation,
        uint256 genes
    ) {
        Kydy storage kyd = kydys[_id];

        isGestating = (kyd.synthesizingWithId != 0);
        isReady = (kyd.cooldownEndBlock <= block.number);
        cooldownIndex = uint256(kyd.cooldownIndex);
        nextActionAt = uint256(kyd.cooldownEndBlock);
        synthesizingWithId = uint256(kyd.synthesizingWithId);
        birthTime = uint256(kyd.birthTime);
        yinId = uint256(kyd.yinId);
        yangId = uint256(kyd.yangId);
        generation = uint256(kyd.generation);
        genes = kyd.genes;
    }

    function unpause() public onlyCEO whenPaused {
        require(saleAuction != address(0));
        require(synthesizingAuction != address(0));
        require(geneSynthesis != address(0));
        require(newContractAddress == address(0));

        super.unpause();
    }

    function withdrawBalance() external onlyCFO {
        uint256 balance = address(this).balance;

        uint256 subtractFees = (pregnantKydys + 1) * autoBirthFee;

        if (balance > subtractFees) {
            cfoAddress.transfer(balance - subtractFees);
        }
    }

    // Kydy Travel Plugin part
    // Can be separated when needed
    KydyTravelInterface public travelCore;

    function setTravelCore(address _newTravelCore) public onlyCEO whenPaused {
        travelCore = KydyTravelInterface(_newTravelCore);
    }
}
