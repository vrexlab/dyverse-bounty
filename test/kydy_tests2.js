const debug = require("debug")("ck");

const KydyCore = artifacts.require('./KydyCoreTest.sol');
const SaleClockAuction = artifacts.require("./SaleClockAuction.sol");
const SynthesizingClockAuction = artifacts.require("./SynthesizingClockAuction.sol");
const ClockAuction = artifacts.require("./ClockAuction.sol");
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

const round = function(number, precision) {
    const factor = Math.pow(10, precision);
    const tempNumber = number * factor;
    const roundedTempNumber = Math.round(tempNumber);
    return roundedTempNumber / factor;
};

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

    it("approveSynthesizing + withdrawAuctionBalances method", async () => {

        const KydyC = await KydyCore.new();
        await KydyC.setCEO(ceo);
        await KydyC.setCOO(coo, {from: ceo});

        await KydyC.setAutoBirthFee(auto_birth_fee, {from: coo});

        // initialize some mock auction contracts
        const synthesizingAuctionContract = await SynthesizingClockAuction.new(KydyC.address, 100);
        await KydyC.setSynthesizingAuctionAddress(synthesizingAuctionContract.address, {
            from: ceo
        });

        const saleAuctionContract = await SaleClockAuction.new(KydyC.address, 800);
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

        await KydyC.createPromoKydy(1, user1, {from: coo}); //id=1
        await KydyC.createPromoKydy(1, user2, {from: coo}); //id=2

        // must be issued from the owner, which is user1
        await util.expectThrow(
            KydyC.approveSynthesizing(user2, 1)
        );

        //ok
        await KydyC.approveSynthesizing(user2, 1, {from: user1});

        await KydyC.breedWithAuto(2, 1, {from: user2, value: auto_birth_fee});

        // checking that it worked and new kydy is born
        util.mineNBlocks(4);
        await KydyC.giveBirth(2);

        eq((await KydyC.balanceOf(user1)).toNumber(), 1);
        eq((await KydyC.balanceOf(user2)).toNumber(), 2);

        const saleBal1 = web3.eth.getBalance(saleAuctionContract.address).toNumber();
        const coreBal1 = web3.eth.getBalance(KydyC.address).toNumber();
        
        eq(saleBal1, 0);
        eq(coreBal1, 0);

        await KydyC.createSaleAuction(1, 10000, {from: user1});

        eq((await KydyC.balanceOf(user1)).toNumber(), 0);

        await saleAuctionContract.bid(1, {from: user2, value: 10000});

        const saleBal2 = web3.eth.getBalance(saleAuctionContract.address).toNumber();
        const coreBal2 = web3.eth.getBalance(KydyC.address).toNumber();

        eq(saleBal2, 800);
        eq(coreBal2, 0);


        // only coo can do it
        await util.expectThrow(
            KydyC.withdrawAuctionBalances()
        );

        //ok
        await KydyC.withdrawAuctionBalances({from:coo});

        const saleBal3 = web3.eth.getBalance(saleAuctionContract.address).toNumber();
        const coreBal3 = web3.eth.getBalance(KydyC.address).toNumber();

        eq(saleBal3, 0);
        eq(coreBal3, 800);
    });

    it("setNewAddress method", async () => {

        const KydyC = await KydyCore.new();
        await KydyC.setCEO(ceo);
        await KydyC.setCOO(coo, {from: ceo});

        // initialize some mock auction contracts
        const synthesizingAuctionContract = await SynthesizingClockAuction.new(KydyC.address, 100);
        await KydyC.setSynthesizingAuctionAddress(synthesizingAuctionContract.address, {
            from: ceo
        });

        const saleAuctionContract = await SaleClockAuction.new(KydyC.address, 800);
        await KydyC.setSaleAuctionAddress(saleAuctionContract.address, {
            from: ceo
        });

        const kydyUtilContract = await KydyUtil.new();
        const geneReleaseContract = await GeneRelease.new();
        const geneScienceContract = await GeneScience.new(kydyUtilContract.address, geneReleaseContract.address);

        await KydyC.setGeneScienceAddress(geneScienceContract.address, {
            from: ceo
        });

        // only by ceo
        await util.expectThrow(
            KydyC.setNewAddress(geneScienceContract.address)
        );

        //ok
        await KydyC.setNewAddress(geneScienceContract.address, {from: ceo});

        // not possible to unpause the contract anymore
        await util.expectThrow(
            KydyC.unpause({from:ceo})
        );

    });

    it("function() + getKydy method", async () => {

        const KydyC = await KydyCore.new();
        await KydyC.setCEO(ceo);
        await KydyC.setCOO(coo, {from: ceo});

        // initialize some mock auction contracts
        const synthesizingAuctionContract = await SynthesizingClockAuction.new(KydyC.address, 100);
        await KydyC.setSynthesizingAuctionAddress(synthesizingAuctionContract.address, {
            from: ceo
        });

        const saleAuctionContract = await SaleClockAuction.new(KydyC.address, 800);
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

        await KydyC.createPromoKydy(334, user1, {from: coo}); //id=1

        // function() only accepts money from auction contracts
        await util.expectThrow(
            KydyC.getKydy(1, {from: user1, value:50})
        );

        const kydy_info = await KydyC.getKydy(1, {from: user1});

        eq(kydy_info[8].toNumber(), 0); // generation should be 0
        eq(kydy_info[9].toNumber(), 334); // genes should be 334
    });

    it("onlyOwner + transferOwnership + whenPaused + whenNotPaused + pause + unpause method", async () => {

        const KydyC = await KydyCore.new();
        await KydyC.setCEO(ceo);
        await KydyC.setCOO(coo, {from: ceo});

        // initialize some mock auction contracts
        const synthesizingAuctionContract = await SynthesizingClockAuction.new(KydyC.address, 100);
        await KydyC.setSynthesizingAuctionAddress(synthesizingAuctionContract.address, {
            from: ceo
        });

        const saleAuctionContract = await SaleClockAuction.new(KydyC.address, 800, {from: ceo});
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

        let owner = await saleAuctionContract.owner();
        eq(owner, ceo);

        // only owner can do this
        await util.expectThrow(
            saleAuctionContract.transferOwnership(default_user)
        );

        //ok
        await saleAuctionContract.transferOwnership(default_user, {from: ceo});

        owner = await saleAuctionContract.owner();
        eq(owner, default_user);


        let paused = await saleAuctionContract.paused();
        assert.isFalse(paused);

        // can only work when paused
        await util.expectThrow(
            saleAuctionContract.unpause({from: default_user})
        );

        //ok
        await saleAuctionContract.pause({from: default_user})
        paused = await saleAuctionContract.paused();
        assert.isTrue(paused);

        // can only work when unpaused
        await util.expectThrow(
            saleAuctionContract.pause({from: default_user})
        );

        //ok
        await saleAuctionContract.unpause({from: default_user})
        paused = await saleAuctionContract.paused();
        assert.isFalse(paused);

    });


    it("averageGen0SalePrice method", async () => {

        const KydyC = await KydyCore.new();
        await KydyC.setCEO(ceo);
        await KydyC.setCOO(coo, {from: ceo});

        // initialize some mock auction contracts
        const synthesizingAuctionContract = await SynthesizingClockAuction.new(KydyC.address, 100);
        await KydyC.setSynthesizingAuctionAddress(synthesizingAuctionContract.address, {
            from: ceo
        });

        const saleAuctionContract = await SaleClockAuction.new(KydyC.address, 800, {from: ceo});
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

        // creating 6 gen0 kydys on auction
        await KydyC.createGen0Auction(1, {from: coo}); //id=1
        await KydyC.createGen0Auction(2, {from: coo}); //id=2
        await KydyC.createGen0Auction(3, {from: coo}); //id=3
        await KydyC.createGen0Auction(4, {from: coo}); //id=4
        await KydyC.createGen0Auction(5, {from: coo}); //id=5
        await KydyC.createGen0Auction(6, {from: coo}); //id=6


        let avg_g0_price = await saleAuctionContract.averageGen0SalePrice();

        eq(0, avg_g0_price.toNumber());

        // bidding all 5 kydys, unfortunately the averageGen0SalePrice only works from 5+ gen0 kydys sold
        await saleAuctionContract.bid(1, {from: user1, value: web3.toWei(10, "finney")});
        await saleAuctionContract.bid(2, {from: user1, value: web3.toWei(10, "finney")});
        await saleAuctionContract.bid(3, {from: user1, value: web3.toWei(10, "finney")});
        await saleAuctionContract.bid(4, {from: user1, value: web3.toWei(10, "finney")});
        await saleAuctionContract.bid(5, {from: user1, value: web3.toWei(10, "finney")});

        avg_g0_price = await saleAuctionContract.averageGen0SalePrice();

        eq(web3.toWei(10, "finney"), round(avg_g0_price.toNumber(), -14));

        await saleAuctionContract.bid(6, {from: user1, value: web3.toWei(10, "finney")});

        eq(web3.toWei(10, "finney"), round(avg_g0_price.toNumber(), -14));

        // it's no longer on auction
        await util.expectThrow(
            saleAuctionContract.bid(5, {from: user1, value: web3.toWei(10, "finney")})
        );

        eq((await KydyC.balanceOf(user1)).toNumber(), 6);
    });


    it("cancelAuction + getAuction + getCurrentPrice method", async () => {

        const KydyC = await KydyCore.new();
        await KydyC.setCEO(ceo);
        await KydyC.setCOO(coo, {from: ceo});

        // initialize some mock auction contracts
        const synthesizingAuctionContract = await SynthesizingClockAuction.new(KydyC.address, 100);
        await KydyC.setSynthesizingAuctionAddress(synthesizingAuctionContract.address, {
            from: ceo
        });

        const saleAuctionContract = await SaleClockAuction.new(KydyC.address, 800, {from: ceo});
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

        await KydyC.createPromoKydy(1, user1, {from: coo}); //id=1
        eq((await KydyC.balanceOf(user1)).toNumber(), 1);

        // must be on auction
        await util.expectThrow(
            saleAuctionContract.cancelAuction(1, {from: user1})
        );

        await KydyC.createSaleAuction(1, 20, {from: user1});
        eq((await KydyC.balanceOf(user1)).toNumber(), 0);

        // only owner can do
        await util.expectThrow(
            saleAuctionContract.cancelAuction(1)
        );
        await KydyC.createGen0Auction(1, {from: coo}); //id=1

        //ok
        await saleAuctionContract.cancelAuction(1, {from: user1});
        eq((await KydyC.balanceOf(user1)).toNumber(), 1);


        // testing getAuction
        await KydyC.createSaleAuction(1, 20, {from: user1});
        const sAuc = await saleAuctionContract.getAuction(1);

        eq(sAuc[0], user1);
        eq(sAuc[1], 20);

        //testing getCurrentPrice
        let sPrice = await saleAuctionContract.getCurrentPrice(1);
        eq(sPrice.toNumber(), 20);

        util.forwardEVMTime(3600);
        sPrice = await saleAuctionContract.getCurrentPrice(1);
        eq(sPrice.toNumber(), 20);
    });


});
