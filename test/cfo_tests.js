const KydyCore = artifacts.require('./KydyCoreTest.sol');
const SaleClockAuction = artifacts.require("./SaleClockAuction.sol");
const SynthesizingClockAuction = artifacts.require("./SynthesizingClockAuction.sol");
const GeneScience = artifacts.require("./GeneScience.sol");
const GeneRelease = artifacts.require("./GeneRelease.sol");
const KydyUtil = artifacts.require("./KydyUtil.sol");
const util = require("./util.js");

const auto_birth_fee = 50;
const synth_auction_price = 200;

contract("KydyCore", (accounts) => {
  const eq = assert.equal.bind(assert);

  describe("Pregnant Kydys", function () {
    before(async () => {
      ceo = accounts[0];
      coo = accounts[0];
      cfo = accounts[1];

      KC = await KydyCore.new({ from: ceo });

      await KC.setCOO(coo, { from: ceo });
      await KC.setCFO(cfo, { from: ceo });
      await KC.setAutoBirthFee(auto_birth_fee);

      const synthesizingAuctionContract = await SynthesizingClockAuction.new(KC.address, 100);
      await KC.setSynthesizingAuctionAddress(synthesizingAuctionContract.address, {
        from: ceo
      });

      const saleAuctionContract = await SaleClockAuction.new(KC.address, 800);
      await KC.setSaleAuctionAddress(saleAuctionContract.address, {
        from: ceo
      });

      const kydyUtilContract = await KydyUtil.new();
      const geneReleaseContract = await GeneRelease.new();
      const geneScienceContract = await GeneScience.new(kydyUtilContract.address, geneReleaseContract.address);

      await KC.setGeneScienceAddress(geneScienceContract.address, {
        from: ceo
      });

      await KC.unpause({ from: ceo });

      // breed 10 kydys
      await KC.mintKydys(10, 10);
      kydA = 1;
      kydB = 2;
      kydC = 3;
      kydD = 4;
    })

    it("Withdraw balance from empty contract", async () => {
      const initial_bal = await util.getBalance(KC.address);

      await KC.withdrawBalance({ from: cfo });

      const after_bal = await util.getBalance(KC.address);

      eq(initial_bal.toNumber(), after_bal.toNumber());
    });

    it("Create a synthesizing auction and try withdrawal", async () => {
      const initial_bal = await util.getBalance(KC.address);

      await KC.createSynthesizingAuction(kydA, synth_auction_price);

      await KC.withdrawBalance({ from: cfo });

      const after_bal = await util.getBalance(KC.address);

      eq(initial_bal.toNumber(), after_bal.toNumber());
    })

    it("Bid Synthesizing and withdraw", async () => {
      await KC.bidOnSynthesizingAuction(kydA, kydC, { value: synth_auction_price + auto_birth_fee });

      // We now have 1 pregnant Kydy and 200 Wei
      const initial_bal = await util.getBalance(KC.address);
      eq(initial_bal.toNumber(), auto_birth_fee);

      // withdraws 0 because there is a pregnant kydy
      await KC.withdrawBalance({ from: cfo })

      const after_bal = await util.getBalance(KC.address);
      eq(after_bal.toNumber(), auto_birth_fee);
    });

    it("GiveBirth and check balance == 0", async () => {
      const initial_bal = await util.getBalance(KC.address);

      util.mineNBlocks(4);

      await KC.giveBirth(kydC);

      const after_bal = await util.getBalance(KC.address);
      eq(after_bal.toNumber(), 0);
    });
  });
});
