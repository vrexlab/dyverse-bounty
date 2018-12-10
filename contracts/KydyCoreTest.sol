pragma solidity ^0.4.24;

import './KydyCore.sol';


/// @title Kydy core with extra test fn and overrides
contract KydyCoreTest is KydyCore {
    // https://ethereum.stackexchange.com/questions/16318/inherited-constructors
    constructor() public {
    }

    /*** ALL TEST FUNCTIONS GO HERE: ***/

    /// @dev Contract owner can create kydys at will (test-only)
    /// @param _genes the actual genetic load of kydys
    /// @param _cloneCount how many are being created
    function mintKydys(uint256 _genes, uint32 _cloneCount) public onlyCOO whenNotPaused {
        // NOTE: this method should be removed after ETHWaterloo
        // require(_genes > 0);
        require(_cloneCount > 0);

        for (uint256 i = 0; i < _cloneCount; i++) {
            _createKydy(0, 0, 0, _genes, msg.sender);
        }
    }

    /// @dev for tests we can easily fund the contract
    function fundMe() public payable returns (bool) {
        return true;
    }

    function timeNow() public constant returns (uint256) {
        return now;
    }
}
