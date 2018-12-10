pragma solidity ^0.4.24;


contract GeneSynthesisInterface {
    function isGeneSynthesis() public pure returns (bool);

    function synthGenes(uint256 gene1, uint256 gene2) public returns (uint256);
}
