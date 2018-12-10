const debug = require("debug")("ck");

const KydyCore = artifacts.require('./KydyCoreTest.sol');
const SaleClockAuction = artifacts.require("./SaleClockAuction.sol");
const SynthesizingClockAuction = artifacts.require("./SynthesizingClockAuction.sol");
const GeneScience = artifacts.require("./GeneScience.sol");
const GeneRelease = artifacts.require("./GeneRelease.sol");
const KydyUtil = artifacts.require("./KydyUtil.sol");

let coo;
let user1;
let user2;
let user3;
let ceo;
let cfo;
let default_user;

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

const util = require("./util.js");

const eq = assert.equal.bind(assert);


contract("KydyCore", (accounts) => {
    const eq = assert.equal.bind(assert);


    before(async () => {
        default_user = accounts[0];
        user1 = accounts[1];
        user2 = accounts[2];
        user3 = accounts[3];
        coo = accounts[4];
        cfo = accounts[5];
        ceo = accounts[6];

        auto_birth_fee = 50;
    });

    it("COO is not null", async () => {

        assert.isFalse(NULL_ADDRESS === coo);
    });

    it("CEO and COO is correct", async () => {

        const KydyC = await KydyCore.new();
        await KydyC.setCEO(ceo);

        const ceoAddress = await KydyC.ceoAddress();

        assert.isTrue(ceoAddress === ceo);

        await KydyC.setCOO(coo, {from: ceo});
        const cooAddress = await KydyC.cooAddress();
        assert.isTrue(cooAddress === coo);

    });


    it("createPromoKydy + balanceOf + totalSupply method", async () => {

        const KydyC = await KydyCore.new();
        await KydyC.setCEO(ceo);
        await KydyC.setCOO(coo, {from: ceo});

        eq((await KydyC.balanceOf(user1)).toNumber(), 0);

        await KydyC.createPromoKydy(1,user1, {from: coo});

        eq((await KydyC.balanceOf(user1)).toNumber(), 1);

        eq((await KydyC.totalSupply()).toNumber(), 1);
    });

    it("unpause + createGen0Auction + transfer + ownerOf method", async () => {

        const KydyC = await KydyCore.new();
        await KydyC.setCEO(ceo);
        await KydyC.setCOO(coo, {from: ceo});

        // initialize some mock auction contracts
        const synthesizingAuctionContract = await SynthesizingClockAuction.new(KydyC.address, 100);
        await KydyC.setSynthesizingAuctionAddress(synthesizingAuctionContract.address, {
            from: ceo
        });
        const saleAuctionContract = await SaleClockAuction.new(KydyC.address, 100);
        await KydyC.setSaleAuctionAddress(saleAuctionContract.address, {
            from: ceo
        });

        const kydyUtilContract = await KydyUtil.new();
        const geneReleaseContract = await GeneRelease.new();
        const geneScienceContract = await GeneScience.new(kydyUtilContract.address, geneReleaseContract.address);

        await KydyC.setGeneScienceAddress(geneScienceContract.address, {
            from: ceo
        });

        // testing unpause

        await KydyC.unpause({from:ceo});

        // testing createGen0Auction

        await KydyC.createGen0Auction(2, {from: coo});

        eq((await KydyC.totalSupply()).toNumber(), 1);

        await KydyC.createPromoKydy(1, user1, {from: coo});

        eq((await KydyC.totalSupply()).toNumber(), 2);

        // testing transfer

        eq((await KydyC.balanceOf(user1)).toNumber(), 1);

        eq((await KydyC.balanceOf(user2)).toNumber(), 0);

        await KydyC.transfer(user2, 2, {from: user1});

        eq((await KydyC.balanceOf(user1)).toNumber(), 0);

        eq((await KydyC.balanceOf(user2)).toNumber(), 1);

        eq((await KydyC.ownerOf(2)), user2);

    });



    it("setGeneScienceAddress + setSaleAuctionAddress + setSynthesizingAuctionAddress + createSaleAuction + bid method", async () => {

        const KydyC = await KydyCore.new();
        await KydyC.setCEO(ceo);
        await KydyC.setCOO(coo, {from: ceo});

        // initialize some mock auction contracts
        //testing setSynthesizingAuctionAddress
        const synthesizingAuctionContract = await SynthesizingClockAuction.new(KydyC.address, 100);
        await KydyC.setSynthesizingAuctionAddress(synthesizingAuctionContract.address, {
            from: ceo
        });

        eq(await KydyC.synthesizingAuction(), await synthesizingAuctionContract.address);

        //testing setSaleAuctionAddress
        const saleAuctionContract = await SaleClockAuction.new(KydyC.address, 100);
        await KydyC.setSaleAuctionAddress(saleAuctionContract.address, {
            from: ceo
        });

        eq(await KydyC.saleAuction(), await saleAuctionContract.address);

        // testing setGeneScienceAddress
        const kydyUtilContract = await KydyUtil.new();
        const geneReleaseContract = await GeneRelease.new();
        const geneScienceContract = await GeneScience.new(kydyUtilContract.address, geneReleaseContract.address);
        await KydyC.setGeneScienceAddress(geneScienceContract.address, {
            from: ceo
        });

        eq(await KydyC.geneScience(), await geneScienceContract.address);

        await KydyC.unpause({from:ceo});

        await KydyC.createPromoKydy(1, user1, {from: coo});

        eq((await KydyC.totalSupply()).toNumber(), 1);

        await KydyC.createSaleAuction(1, 20, {from: user1});

        eq((await KydyC.balanceOf(user1)).toNumber(), 0);

        //createSaleAuction
        await saleAuctionContract.bid(1, {from: user2, value: 20});

        eq((await KydyC.balanceOf(user2)).toNumber(), 1);


    });

    it("pause + setCFO + withdrawBalance method", async () => {

        const KydyC = await KydyCore.new();
        await KydyC.setCEO(ceo);
        await KydyC.setCOO(coo, {from: ceo});

        // initialize some mock auction contracts
        const synthesizingAuctionContract = await SynthesizingClockAuction.new(KydyC.address, 100);
        await KydyC.setSynthesizingAuctionAddress(synthesizingAuctionContract.address, {
            from: ceo
        });

        const saleAuctionContract = await SaleClockAuction.new(KydyC.address, 100);
        await KydyC.setSaleAuctionAddress(saleAuctionContract.address, {
            from: ceo
        });

        const kydyUtilContract = await KydyUtil.new();
        const geneReleaseContract = await GeneRelease.new();
        const geneScienceContract = await GeneScience.new(kydyUtilContract.address, geneReleaseContract.address);

        await KydyC.setGeneScienceAddress(geneScienceContract.address, {
            from: ceo
        });

        // testing pause
        await KydyC.unpause({from:ceo});
        await KydyC.pause({from:ceo});
        await KydyC.unpause({from:ceo});

        await KydyC.setCFO(cfo, {from: ceo});

        const ctoBalance1 = web3.eth.getBalance(cfo).toNumber();

        await KydyC.fundMe({ value: web3.toWei(0.05, "ether") });

        await KydyC.withdrawBalance({from: cfo});

        const ctoBalance2 = web3.eth.getBalance(cfo).toNumber();

        assert.isTrue(ctoBalance2 > ctoBalance1);

    });

    it("test expectThrow + approve + transferFrom method", async () => {

        const KydyC = await KydyCore.new();
        await KydyC.setCEO(ceo);
        await KydyC.setCOO(coo, {from: ceo});

        // initialize some mock auction contracts
        const synthesizingAuctionContract = await SynthesizingClockAuction.new(KydyC.address, 100);
        await KydyC.setSynthesizingAuctionAddress(synthesizingAuctionContract.address, {
            from: ceo
        });

        const saleAuctionContract = await SaleClockAuction.new(KydyC.address, 100);
        await KydyC.setSaleAuctionAddress(saleAuctionContract.address, {
            from: ceo
        });

        const kydyUtilContract = await KydyUtil.new();
        const geneReleaseContract = await GeneRelease.new();
        const geneScienceContract = await GeneScience.new(kydyUtilContract.address, geneReleaseContract.address);

        await KydyC.setGeneScienceAddress(geneScienceContract.address, {
            from: ceo
        });

        // testing expect throw

        await util.expectThrow(
            KydyC.pause({from:ceo})
        );

        //generating a kydy
        await KydyC.unpause({from:ceo});

        await KydyC.createPromoKydy(1, user1, {from: coo});

        eq((await KydyC.balanceOf(user1)).toNumber(), 1);
        eq((await KydyC.balanceOf(user2)).toNumber(), 0);

        // approve can only be issued from user1
        await util.expectThrow(
            KydyC.approve(user2, 1, {from: user2})
        );

        // this needs to work
        await KydyC.approve(user2, 1, {from: user1});

        // transferFrom will now work from user2, now that it's been approved
        await KydyC.transferFrom(user1, user2, 1, {from: user2});

        eq((await KydyC.balanceOf(user1)).toNumber(), 0);
        eq((await KydyC.balanceOf(user2)).toNumber(), 1);


    });

    it("rescueLostKydy + isReadyToBreed + breedWith method", async () => {

        const KydyC = await KydyCore.new();
        await KydyC.setCEO(ceo);
        await KydyC.setCOO(coo, {from: ceo});

        // initialize some mock auction contracts
        const synthesizingAuctionContract = await SynthesizingClockAuction.new(KydyC.address, 100);
        await KydyC.setSynthesizingAuctionAddress(synthesizingAuctionContract.address, {
            from: ceo
        });

        const saleAuctionContract = await SaleClockAuction.new(KydyC.address, 100);
        await KydyC.setSaleAuctionAddress(saleAuctionContract.address, {
            from: ceo
        });

        const kydyUtilContract = await KydyUtil.new();
        const geneReleaseContract = await GeneRelease.new();
        const geneScienceContract = await GeneScience.new(kydyUtilContract.address, geneReleaseContract.address);

        await KydyC.setGeneScienceAddress(geneScienceContract.address, {
            from: ceo
        });

        await KydyC.unpause({from:ceo});

        await KydyC.createPromoKydy(1, user1, {from: coo});

        eq((await KydyC.balanceOf(user1)).toNumber(), 1);
        eq((await KydyC.balanceOf(user2)).toNumber(), 0);

        // testing rescueLostKydy

        // not owned by contract
        await util.expectThrow(
            KydyC.rescueLostKydy(1, user2)
        );

        await KydyC.transfer(KydyC.address, 1, {from: user1});

        // not done by coo
        await util.expectThrow(
            KydyC.rescueLostKydy(1, user2)
        );

        //should be ok
        await KydyC.rescueLostKydy(1, user2, {from: coo});

        eq((await KydyC.balanceOf(user1)).toNumber(), 0);
        eq((await KydyC.balanceOf(user2)).toNumber(), 1);


        // isReadyToBreed test
        assert.isTrue(await KydyC.isReadyToBreed(1));

        await KydyC.createPromoKydy(1, user2, {from: coo});

        await KydyC.breedWithAuto(1, 2, {from: user2, value: web3.toWei(2, "finney")});

        assert.isFalse(await KydyC.isReadyToBreed(1));

    });


    it("canBreedWith + setAutoBirthFee + breedWithAuto method", async () => {

        const KydyC = await KydyCore.new();
        await KydyC.setCEO(ceo);
        await KydyC.setCOO(coo, {from: ceo});

        // initialize some mock auction contracts
        const synthesizingAuctionContract = await SynthesizingClockAuction.new(KydyC.address, 100);
        await KydyC.setSynthesizingAuctionAddress(synthesizingAuctionContract.address, {
            from: ceo
        });

        const saleAuctionContract = await SaleClockAuction.new(KydyC.address, 100);
        await KydyC.setSaleAuctionAddress(saleAuctionContract.address, {
            from: ceo
        });

        const kydyUtilContract = await KydyUtil.new();
        const geneReleaseContract = await GeneRelease.new();
        const geneScienceContract = await GeneScience.new(kydyUtilContract.address, geneReleaseContract.address);

        await KydyC.setGeneScienceAddress(geneScienceContract.address, {
            from: ceo
        });

        await KydyC.unpause({from:ceo});

        await KydyC.createPromoKydy(1, user2, {from: coo});
        await KydyC.createPromoKydy(1, user2, {from: coo});

        eq((await KydyC.balanceOf(user2)).toNumber(), 2);

        assert.isTrue(await KydyC.canBreedWith(1, 2));

        assert.isFalse(await KydyC.canBreedWith(1, 1));


        // not done by coo
        await util.expectThrow(
            KydyC.setAutoBirthFee(50)
        );

        //ok
        await KydyC.setAutoBirthFee(50, {from:coo});

        // no money sent to cover the auto birth fee
        await util.expectThrow(
            KydyC.breedWithAuto(1, 2, {from: user2})
        );

        // not sent from user2
        await util.expectThrow(
            KydyC.breedWithAuto(1, 2, {value: 50})
        );

        //ok
        await KydyC.breedWithAuto(1, 2, {from: user2, value: 50});
        assert.isFalse(await KydyC.isReadyToBreed(1));

    });


    it("giveBirth + createSynthesizingAuction + bidOnSynthesizingAuction method", async () => {

        const KydyC = await KydyCore.new();
        await KydyC.setCEO(ceo);
        await KydyC.setCOO(coo, {from: ceo});

        await KydyC.setAutoBirthFee(auto_birth_fee, {from: coo});

        // initialize some mock auction contracts
        const synthesizingAuctionContract = await SynthesizingClockAuction.new(KydyC.address, 100);
        await KydyC.setSynthesizingAuctionAddress(synthesizingAuctionContract.address, {
            from: ceo
        });

        const saleAuctionContract = await SaleClockAuction.new(KydyC.address, 100);
        await KydyC.setSaleAuctionAddress(saleAuctionContract.address, {
            from: ceo
        });

        const kydyUtilContract = await KydyUtil.new();
        const geneReleaseContract = await GeneRelease.new();
        const geneScienceContract = await GeneScience.new(kydyUtilContract.address, geneReleaseContract.address);

        await KydyC.setGeneScienceAddress(geneScienceContract.address, {
            from: ceo
        });

        await KydyC.unpause({from:ceo});

        await KydyC.createPromoKydy(1, user2, {from: coo});
        await KydyC.createPromoKydy(1, user2, {from: coo});

        eq((await KydyC.balanceOf(user2)).toNumber(), 2);

        await KydyC.breedWithAuto(1, 2, {from: user2, value: auto_birth_fee});

        // requires cooldown
        await util.expectThrow(
            KydyC.giveBirth(1)
        );

        // Promo Kydys are Gen0. So they need only 4 blocks to be mined.
        util.mineNBlocks(4);

        //ok now
        await KydyC.giveBirth(1);

        eq((await KydyC.balanceOf(user2)).toNumber(), 3);

        //Synthesizing tests
        await KydyC.createPromoKydy(1, user1, {from: coo});
        eq((await KydyC.balanceOf(user1)).toNumber(), 1);

        // must be issued from the owner, which is user1
        await util.expectThrow(
            KydyC.createSynthesizingAuction(4, 50)
        );

        await KydyC.createSynthesizingAuction(4, 50, {from:user1});

        // must be issued from the owner of Yin, which is user2
        await util.expectThrow(
            KydyC.bidOnSynthesizingAuction(4, 3, {value: 50 + auto_birth_fee})
        );

        // must pay up
        await util.expectThrow(
            KydyC.bidOnSynthesizingAuction(4, 3, {from: user2})
        );

        // ok
        await KydyC.bidOnSynthesizingAuction(4, 3, {from: user2, value: 50 + auto_birth_fee})

        // checking that it worked and new kydy is born
        // Promo Kydys are Gen0. So they need only 4 blocks to be mined.
        util.mineNBlocks(4);
        await KydyC.giveBirth(3);

        eq((await KydyC.balanceOf(user1)).toNumber(), 1);
        eq((await KydyC.balanceOf(user2)).toNumber(), 4);
    });


});
