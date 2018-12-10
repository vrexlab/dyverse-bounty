pragma solidity ^0.4.24;


contract GeneReleaseInterface {
    function isGeneRelease() public pure returns (bool);

    function isCodeReleased(uint256 traitIndex, uint256 code) public view returns (bool);
}
