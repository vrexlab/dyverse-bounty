pragma solidity ^0.4.24;


/// @title A deterministic implementation of Breeding algo for tests
contract GeneScienceMock {
    bool public isGeneScience = true;

    /// @dev given genes of Kydy 1 & 2, return a silly genetic combination
    function mixGenes(uint256 genes1, uint256 genes2) public pure returns (uint256) {
        return ((genes1 + genes2)/2) + 1;
    }
}
