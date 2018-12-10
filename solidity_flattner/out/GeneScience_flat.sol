pragma solidity ^0.4.12;

contract KydyUtil {
    uint256 private randomSeed_ = 0;

    function isKydyUtil() public pure returns (bool) {
        return true;
    }

    function getRand(uint256 tempSeed) public returns (uint256) {
        bytes32 seedHash = keccak256(bytes32(tempSeed));
        randomSeed_ += uint256(seedHash);

        return randomSeed_ + uint256(block.blockhash(block.number - 1));
    }
}



contract GeneReleaseInterface {
    function isGeneRelease() public pure returns (bool);

    function isCodeReleased(uint256 traitIndex, uint256 code) public view returns (bool);
}


contract KydyUtilInterface {
    function isKydyUtil() public view returns (bool);

    function getRand(uint256 tempSeed) public returns(uint256);
}






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



/// @title A deterministic implementation of Breeding algo for tests
contract GeneScience is KydyAccessControl {
    bool public isGeneScience = true;
    uint256 traitBits_ = 20;
    uint256 codeBits_ = 5;
    uint256 traitsInGene_ = 12;

    KydyUtilInterface public kydyUtil_;
    GeneReleaseInterface private geneRelease_;

    function GeneScience(address kydyUtilAddr, address geneReleaseAddr) public {
        ceoAddress = msg.sender;
        cooAddress = msg.sender;
        cfoAddress = msg.sender;
        kydyUtil_ = KydyUtilInterface(kydyUtilAddr);
        geneRelease_ = GeneReleaseInterface(geneReleaseAddr);
    }

    function setKydyUtilAddress(address newKydyUtil) public onlyCEO {
        KydyUtilInterface candidateContract = KydyUtilInterface(newKydyUtil);

        require(candidateContract.isKydyUtil());

        kydyUtil_ = candidateContract;
    }

    function setGeneReleaseAddress(address newGeneRelease) public onlyCEO {
        GeneReleaseInterface candidateContract = GeneReleaseInterface(newGeneRelease);

        require(candidateContract.isGeneRelease());

        geneRelease_ = candidateContract;
    }

    function isGeneScience() public pure returns (bool) {
        return true;
    }

    event mixGeneResult(uint256 indexed gene1, uint256 indexed gene2, uint256 mixedGene);
    /// @dev given genes of Kydy 1 & 2, return a silly genetic combination
    function mixGenes(uint256 gene1, uint256 gene2) public returns (uint256) {
        uint256 _mixedGene = 0;

        for (uint8 i = 0 ; i < traitsInGene_; i++) {
            uint256 _mixedTrait =
                mixTraits(
                    (gene1 >> (i * traitBits_)) & 0xfffff,
                    (gene2 >> (i * traitBits_)) & 0xfffff,
                    i
                );
            _mixedGene += _mixedTrait << (i * traitBits_);
        }

        mixGeneResult(gene1, gene2, _mixedGene);
        return _mixedGene;
    }

    function mixTraits(uint256 trait1, uint256 trait2, uint256 traitIndex) public returns (uint256) {
        uint256 _mixedTrait = 0;

        for (uint8 i = 0 ; i < 4 ; i++) {
            uint256 _code1 = selectCode(trait1);
            uint256 _code2 = selectCode(trait2);
            _mixedTrait += mixCodes(_code1, _code2, traitIndex) << (i * codeBits_);
        }

        return _mixedTrait;
    }

    uint256 public selectSeed_ = uint256(keccak256("SELECT"));
    uint256 public selectDenom_ = 128;
    uint256 public selectActive_ = 96;
    uint256 public selectHidden1_ = selectActive_ + 24;
    uint256 public selectHidden2_ = selectHidden1_ + 6;
    // Selector 3 below is unnecessary
    // uint256 public selectHiddenNumer3_ = 2;

    function selectCode(uint256 trait) public returns (uint256) {
        uint256 _selector = kydyUtil_.getRand(selectSeed_) % selectDenom_;

        if (_selector < selectActive_) return trait & 0x1f;
        else if (_selector < selectHidden1_) return (trait >> codeBits_) & 0x1f;
        else if (_selector < selectHidden2_) return (trait >> (codeBits_ * 2)) & 0x1f;
        else return (trait >> (codeBits_ * 3)) & 0x1f;
    }

    function isMutatable(uint256 code1, uint256 code2) public pure returns (bool) {
        if (code1 - code2 == 1 || code2 - code1 == 1) {
            if ((code1 + code2) % 4 == 1) return true;
        }
        return false;
    }

    function mixCodes(uint256 code1, uint256 code2, uint256 traitIndex) public returns (uint256) {
        if (isMutatable(code1, code2)) return mixCodesMutatable(code1, code2, traitIndex);
        else return mixCodesNormal(code1, code2);
    }

    uint256 public mutateSeed_ = uint256(keccak256("MUTATE"));

    function mixCodesMutatable(uint256 code1, uint256 code2, uint256 traitIndex) public returns (uint256) {
        if (kydyUtil_.getRand(mutateSeed_) % 4 == 0) {
            uint256 result;
            if (code1 % 2 == 1) result = (code1 >> 1) + 0x10;
            else result = (code2 >> 1) + 0x10;

            if (geneRelease_.isCodeReleased(traitIndex, result)) return result;
            else return mixCodesNormal(code1, code2);
        } else {
            return mixCodesNormal(code1, code2);
        }
    }

    uint256 public normalSeed_ = uint256(keccak256("NORMAL"));

    function mixCodesNormal(uint256 code1, uint256 code2) public returns (uint256) {
        if (kydyUtil_.getRand(normalSeed_) % 2 == 0) return code1;
        else return code2;
    }
}
