pragma solidity ^0.4.24;

contract KydyUtilInterface {
    function isKydyUtil() public view returns (bool);

    function getRand(uint256 tempSeed) public returns(uint256);
}
