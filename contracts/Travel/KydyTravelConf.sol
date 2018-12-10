pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract KydyTravelConf is Ownable {
    
    mapping(uint256 => KydyType) kydyTypeInfo;

    struct KydyType {
        uint256 typeId;
        uint256 production; // 1 ~ 10
    }

    function isKydyTravelConf() public pure returns (bool) {
        return true;
    }
}