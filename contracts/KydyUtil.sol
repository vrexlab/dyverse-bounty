pragma solidity ^0.4.24;

contract KydyUtil {
    uint256 private randomSeed_ = 0;

    function isKydyUtil() public pure returns (bool) {
        return true;
    }

    function getRand(uint256 tempSeed) public returns (uint256) {
        bytes32 seedHash = keccak256(bytes32(tempSeed));
        randomSeed_ += uint256(seedHash);

        return randomSeed_ + uint256(blockhash(block.number - 1));
    }
}
