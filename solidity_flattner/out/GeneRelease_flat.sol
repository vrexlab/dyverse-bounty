pragma solidity ^0.4.12;



/// @title A facet of KydyCore that manages special access privileges.
/// @author Axiom Zen (https://www.axiomzen.co)
/// @dev See the KydyCore contract documentation to understand how the various contract facets are arranged.
contract KydyAccessControl {
    // This facet controls access control for CryptoKydys. There are four roles managed here:
    //
    //     - The CEO: The CEO can reassign other roles and change the addresses of our dependent smart
    //         contracts. It is also the only role that can unpause the smart contract. It is initially
    //         set to the address that created the smart contract in the KydyCore constructor.
    //
    //     - The CFO: The CFO can withdraw funds from KydyCore and its auction contracts.
    //
    //     - The COO: The COO can release gen0 Kydys to auction, and mint promo cats.
    //
    // It should be noted that these roles are distinct without overlap in their access abilities, the
    // abilities listed for each role above are exhaustive. In particular, while the CEO can assign any
    // address to any role, the CEO address itself doesn't have the ability to act in those roles. This
    // restriction is intentional so that we aren't tempted to use the CEO address frequently out of
    // convenience. The less we use an address, the less likely it is that we somehow compromise the
    // account.

    /// @dev Emited when contract is upgraded - See README.md for updgrade plan
    event ContractUpgrade(address newContract);

    // The addresses of the accounts (or contracts) that can execute actions within each roles.
    address public ceoAddress;
    address public cfoAddress;
    address public cooAddress;

    // @dev Keeps track whether the contract is paused. When that is true, most actions are blocked
    bool public paused = false;

    /// @dev Access modifier for CEO-only functionality
    modifier onlyCEO() {
        require(msg.sender == ceoAddress);
        _;
    }

    /// @dev Access modifier for CFO-only functionality
    modifier onlyCFO() {
        require(msg.sender == cfoAddress);
        _;
    }

    /// @dev Access modifier for COO-only functionality
    modifier onlyCOO() {
        require(msg.sender == cooAddress);
        _;
    }

    modifier onlyCLevel() {
        require(
            msg.sender == cooAddress ||
            msg.sender == ceoAddress ||
            msg.sender == cfoAddress
        );
        _;
    }

    /// @dev Assigns a new address to act as the CEO. Only available to the current CEO.
    /// @param _newCEO The address of the new CEO
    function setCEO(address _newCEO) public onlyCEO {
        require(_newCEO != address(0));

        ceoAddress = _newCEO;
    }

    /// @dev Assigns a new address to act as the CFO. Only available to the current CEO.
    /// @param _newCFO The address of the new CFO
    function setCFO(address _newCFO) public onlyCEO {
        require(_newCFO != address(0));

        cfoAddress = _newCFO;
    }

    /// @dev Assigns a new address to act as the COO. Only available to the current CEO.
    /// @param _newCOO The address of the new COO
    function setCOO(address _newCOO) public onlyCEO {
        require(_newCOO != address(0));

        cooAddress = _newCOO;
    }

    function withdrawBalance() external onlyCFO {
        cfoAddress.transfer(this.balance);
    }


    /*** Pausable functionality adapted from OpenZeppelin ***/

    /// @dev Modifier to allow actions only when the contract IS NOT paused
    modifier whenNotPaused() {
        require(!paused);
        _;
    }

    /// @dev Modifier to allow actions only when the contract IS paused
    modifier whenPaused {
        require(paused);
        _;
    }

    /// @dev Called by any "C-level" role to pause the contract. Used only when
    ///  a bug or exploit is detected and we need to limit damage.
    function pause() public onlyCLevel whenNotPaused {
        paused = true;
    }

    /// @dev Unpauses the smart contract. Can only be called by the CEO, since
    ///  one reason we may pause the contract is when CFO or COO accounts are
    ///  compromised.
    function unpause() public onlyCEO whenPaused {
        // can't unpause if contract was upgraded
        paused = false;
    }

}


contract GeneRelease is KydyAccessControl {

    bool public isGeneRelease = true;
    bool[12][32] private releaseStatus;

    // This should be fixed in production
    function GeneRelease() public {
        ceoAddress = msg.sender;
        cooAddress = msg.sender;
        cfoAddress = msg.sender;

        releaseStatus[0][0] = true;
        releaseStatus[1][0] = true;
        releaseStatus[2][0] = true;
        releaseStatus[3][0] = true;

        releaseStatus[0][1] = true;
        releaseStatus[1][1] = true;
        releaseStatus[2][1] = true;
        releaseStatus[3][1] = true;
        releaseStatus[4][1] = true;

        releaseStatus[0][2] = true;
        releaseStatus[1][2] = true;
        releaseStatus[2][2] = true;
        releaseStatus[3][2] = true;
        releaseStatus[4][2] = true;

        releaseStatus[0][3] = true;
        releaseStatus[1][3] = true;
        releaseStatus[2][3] = true;
        releaseStatus[3][3] = true;

        releaseStatus[0][4] = true;
        releaseStatus[1][4] = true;
        releaseStatus[2][4] = true;
        releaseStatus[3][4] = true;
        releaseStatus[4][4] = true;

        releaseStatus[0][5] = true;
        releaseStatus[1][5] = true;
        releaseStatus[2][5] = true;
        releaseStatus[3][5] = true;
        releaseStatus[4][5] = true;

        releaseStatus[0][6] = true;
        releaseStatus[1][6] = true;
        releaseStatus[2][6] = true;
        releaseStatus[3][6] = true;
        releaseStatus[4][6] = true;

        releaseStatus[0][7] = true;
        releaseStatus[1][7] = true;
        releaseStatus[2][7] = true;
        releaseStatus[3][7] = true;

        releaseStatus[0][8] = true;
        releaseStatus[1][8] = true;
        releaseStatus[2][8] = true;
        releaseStatus[3][8] = true;

        releaseStatus[0][9] = true;
        releaseStatus[1][9] = true;

        releaseStatus[0][10] = true;
        releaseStatus[1][10] = true;
        releaseStatus[2][10] = true;
        releaseStatus[3][10] = true;
        releaseStatus[4][10] = true;
        releaseStatus[5][10] = true;
        releaseStatus[6][10] = true;
        releaseStatus[7][10] = true;

        releaseStatus[0][11] = true;
        releaseStatus[1][11] = true;
        releaseStatus[2][11] = true;
        releaseStatus[3][11] = true;
    }

    function isCodeReleased(uint256 traitIndex, uint256 code) public view returns (bool) {
        return releaseStatus[code][traitIndex];
    }

    function releaseCode(uint256 traitIndex, uint256 code) public onlyCEO {
        require(isCodeReleased(traitIndex, code) == false);
        releaseStatus[code][traitIndex] = true;
    }

    function blockCode(uint256 traitIndex, uint256 code) public onlyCEO {
        require(isCodeReleased(traitIndex, code) == true);
        releaseStatus[code][traitIndex] = false;
    }
}
