// Activate verbose mode by setting env var `export DEBUG=ck`
const debug = require("debug")("ck");
const BigNumber = require("bignumber.js");

const ETH_STRING = web3.toWei(1, "ether");
const FINNEY_STRING = web3.toWei(1, "finney");
const ETH_BN = new BigNumber(ETH_STRING);
const FINNEY_BN = new BigNumber(FINNEY_STRING);
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

const util = require("./util.js");
// add test wrapper to make tests possible
const KydyCore = artifacts.require("./KydyCoreTest.sol");
const GeneScience = artifacts.require("./GeneScience.sol");
const SaleClockAuction = artifacts.require("./SaleClockAuction.sol");
const SynthesizingClockAuction = artifacts.require("./SynthesizingClockAuction.sol");
const GeneRelease = artifacts.require("./GeneRelease.sol");
const KydyUtil = artifacts.require("./KydyUtil.sol");

contract("KydyCore", function(accounts) {
  // This only runs once across all test suites
  before(() => util.measureGas(accounts));
  after(() => util.measureGas(accounts));
  if (util.isNotFocusTest("core")) return;
  const eq = assert.equal.bind(assert);
  const coo = accounts[0];
  const user1 = accounts[1];
  const user2 = accounts[2];
  const user3 = accounts[3];
  const ceo = accounts[4];
  const cfo = accounts[5];
  const gasPrice = 1e11;
  let coreC;
  let geneScienceContract;
  const logEvents = [];
  const pastEvents = [];
  const auto_birth_fee = 50;
  // timers we get from Kydy contract
  let cooldowns, autoBirthPrice;

  async function deployContract() {
    debug("deploying contract");

    const seconds_per_block = 15;

    coreC = await KydyCore.new();
    // the deployer is the original CEO and can appoint a new one
    await coreC.setCEO(ceo);
    await coreC.setCOO(coo, {from: ceo});
    await coreC.setCFO(cfo, {from: ceo});
    await coreC.setAutoBirthFee(auto_birth_fee);
    // only need to create external contracts once
    if (geneScienceContract === undefined) {
      const kydyUtilContract = await KydyUtil.new();
      const geneReleaseContract = await GeneRelease.new();
      geneScienceContract = await GeneScience.new(kydyUtilContract.address, geneReleaseContract.address);
    }
    await coreC.setGeneScienceAddress(geneScienceContract.address, {
      from: ceo
    });
    // initialize some mock auction contracts
    const synthesizingAuctionContract = await SynthesizingClockAuction.new(
      coreC.address,
      100
    );
    await coreC.setSynthesizingAuctionAddress(synthesizingAuctionContract.address, {
      from: ceo
    });
    const saleAuctionContract = await SaleClockAuction.new(coreC.address, 100);
    await coreC.setSaleAuctionAddress(saleAuctionContract.address, {
      from: ceo
    });
    if (!cooldowns) {
      cooldowns = [];
      for (var i = 0; i <= 13; i++) {
        cooldowns[i] = (await coreC.cooldowns.call(i)).toNumber() / seconds_per_block;
      }
      debug("cooldowns", cooldowns);
    }
    if (!autoBirthPrice) {
      autoBirthPrice = await coreC.autoBirthFee();
    }
    await coreC.unpause({ from: ceo });
    const eventsWatch = coreC.allEvents();
    eventsWatch.watch((err, res) => {
      if (err) return;
      pastEvents.push(res);
      debug(">>", res.event, res.args);
    });
    logEvents.push(eventsWatch);
    coreC._getKydyHelper = async function(id) {
      let attrs = await this.getKydy(id);
      return {
        isGestating: attrs[0],
        isReady: attrs[1],
        cooldownIndex: attrs[2].toNumber(),
        nextActionAt: attrs[3].toNumber(),
        synthesizingWithId: attrs[4].toNumber(),
        birthTime: attrs[5].toNumber(),
        yinId: attrs[6].toNumber(),
        yangId: attrs[7].toNumber(),
        generation: attrs[8].toNumber(),
        genes: attrs[9]
      };
    };
  }

  after(function() {
    logEvents.forEach(ev => ev.stopWatching());
  });

  describe("Initial state", function() {
    before(deployContract);

    it("should own contract", async function() {
      const cooAddress = await coreC.cooAddress();
      eq(cooAddress, coo);

      const nKydys = await coreC.totalSupply();
      eq(nKydys.toNumber(), 0);
    });
  });

  describe("baby kydy creation:", function() {
    before(deployContract);

    it("create a promotional kydys", async function() {
      // kydys with arbitrary genes
      await coreC.createPromoKydy(1000, NULL_ADDRESS, { from: coo });
      await coreC.createPromoKydy(2000, "", { from: coo });
      await coreC.createPromoKydy(3000, "0x0", { from: coo });
      await coreC.createPromoKydy(4000, user2, { from: coo });
      // only coo
      await util.expectThrow(
        coreC.createPromoKydy(5000, user1, { from: user1 })
      );

      const nKydys = await coreC.totalSupply();
      // 4 created
      eq(nKydys.toNumber(), 4);

      eq(coo, await coreC.kydyIndexToOwner(1), "kydy 1");
      eq(coo, await coreC.kydyIndexToOwner(2), "kydy 2");
      eq(coo, await coreC.kydyIndexToOwner(3), "kydy 3");
      eq(user2, await coreC.kydyIndexToOwner(4), "kydy 4");
    });
  });

  describe("NonFungible, EIP-721", function() {
    let kydA, kydB, kydC, kydD;
    before(deployContract);

    it("create a few kydys", async function() {
      // breed 4 kydys
      await coreC.mintKydys(10, 10);
      kydA = 1;
      kydB = 2;
      kydC = 3;
      kydD = 4;
      eq((await coreC.totalSupply()).toNumber(), 10);
    });

    it("approve + transferFrom + ownerOf", async function() {
      await coreC.approve(user1, kydC);
      eq(await coreC.ownerOf(kydC), coo);
      await coreC.transferFrom(coo, user1, kydC, { from: user1 });
      eq(await coreC.ownerOf(kydC), user1);
    });

    it("balanceOf", async function() {
      eq(await coreC.balanceOf(coo), 9);
      eq(await coreC.balanceOf(user1), 1);
      eq(await coreC.balanceOf(user2), 0);
    });
  });

  describe("Synthesizing", function() {
    let kydA, kydB, kydC, kydD, kydE;
    before(deployContract);
    it("create a few kydys", async function() {
      // breed 4 kydys
      await coreC.mintKydys(10, 4, { from: coo });
      kydA = 1;
      kydB = 2;
      kydC = 3;
      kydD = 4;
      // give kydD to user1
      await coreC.transfer(user1, kydD);
      eq(await coreC.kydyIndexToOwner(kydD), user1);
    });

    it("kydy cant synthesize itself", async function() {
      await util.expectThrow(coreC.breedWithAuto(kydA, kydA));
    });

    it("synthesizing is only allowed with due permissions", async function() {
      await util.expectThrow(coreC.breedWithAuto(kydD, kydA), { from: user1 });
      let kydAStats = await coreC._getKydyHelper(kydA);
      let current_block = await util.blockNumber();
      debug("A before breeding:", kydAStats, current_block);
      assert(kydAStats.nextActionAt <= await current_block);
      eq(kydAStats.isReady, true);

      // owner of kydA approves it to synthesize D
      await coreC.approveSynthesizing(user1, kydA);
      await coreC.breedWithAuto(kydD, kydA, { from: user1, value: auto_birth_fee });

      // check kydA stats afterwards
      kydAStats = await coreC._getKydyHelper(kydA);
      debug("kydA after breeding:", kydAStats);
      eq(kydAStats.cooldownIndex, 1);

      current_block = await util.blockNumber();

      assert(kydAStats.nextActionAt > current_block);
      eq(kydAStats.isReady, false);

      // check kydD
      const kydDStats = await coreC._getKydyHelper(kydD);
      debug("D:", kydDStats);
      eq(kydDStats.cooldownIndex, 1);
    });

    it("synthesize has cooldown after synthesizing", async function() {
      await util.expectThrow(coreC.breedWithAuto(kydB, kydA, { from: coo, value: auto_birth_fee }));
      await util.expectThrow(coreC.breedWithAuto(kydA, kydB, { from: coo, value: auto_birth_fee }));
    });

    it("pregnant kydy cant synthesize", async function() {
      await coreC.approveSynthesizing(coo, kydD, { from: user1 });
      await util.expectThrow(coreC.breedWithAuto(kydC, kydD, { from: coo, value: auto_birth_fee }));
    });

    it("allowed user cant re-use the same synthesize permission", async function() {
      await util.mineNBlocks(cooldowns[0]);

      await coreC.giveBirth(kydD);

      // Can't re-use the same synthesize permission again
      await util.expectThrow(coreC.breedWithAuto(kydD, kydA, { from: user1, value: auto_birth_fee }));

      // B from A works because they share the same owner
      await coreC.breedWithAuto(kydB, kydA, { from: coo, value: auto_birth_fee});
    });
  });

  describe("Kydy Breeding:", function() {
    let kydA, kydB, kydC, kydD, kydE, kydF;
    before(deployContract);

    it("create some kydys", async function() {
      // breed 3 genetically diff kydys
      await coreC.mintKydys(10, 1, { from: coo });
      kydA = 1;
      await coreC.mintKydys(100, 1, { from: coo });
      kydB = 2;
      await coreC.mintKydys(1000, 1, { from: coo });
      kydC = 3;
    });

    it("kydA gets pregnant from kydB", async function() {
      // works because they have the same owner
      await coreC.breedWithAuto(kydA, kydB, {value: auto_birth_fee});

      const attr = await coreC._getKydyHelper(kydA);
      eq(attr.isGestating, true);
      assert(attr.nextActionAt != 0);
    });

    it("tries and fails to get kydA pregnant again", async function() {
      await util.expectThrow(coreC.breedWithAuto(kydA, kydC, {value: auto_birth_fee}));
    });

    it("wait kydA be ready to give birth", async function() {
      await util.expectThrow(coreC.giveBirth(kydA));
    });

    it("have kydA give birth to kydD", async function() {
      await util.mineNBlocks(cooldowns[0]);
      await coreC.giveBirth(kydA);
      // will be the last kydy
      kydD = (await coreC.totalSupply()).toNumber();
      let attr = await coreC._getKydyHelper(kydD);
      debug("kydD was born:", attr);
      eq(attr.isGestating, false);
      eq(attr.cooldownIndex, 0);
      eq(attr.nextActionAt, 0);
      eq(attr.synthesizingWithId, 0);
      eq(attr.yinId, 1);
      eq(attr.yangId, 2);
      eq(attr.generation, 1);
      // equation: yin's 10 + yang's 100 / 2 + 1
      // eq(attr.genes.toNumber(), 56);
      const kydDOwner = await coreC.kydyIndexToOwner(kydD);
      eq(kydDOwner, coo);
    });

    it("kydD can breed right after being born", async function() {
      debug("kydD::", await coreC._getKydyHelper(kydD));
      kydDcanBreed = await coreC.isReadyToBreed(kydD);
      eq(kydDcanBreed, true);
    });

    it("kydD can't breed with either parent, but can breed with kydC, who is unrelated", async function() {
      await util.expectThrow(coreC.breedWithAuto(kydD, kydA, {value: auto_birth_fee}));
      await util.expectThrow(coreC.breedWithAuto(kydD, kydB, {value: auto_birth_fee}));
      await util.expectThrow(coreC.breedWithAuto(kydA, kydD, {value: auto_birth_fee}));
      await util.expectThrow(coreC.breedWithAuto(kydB, kydD, {value: auto_birth_fee}));
      await coreC.breedWithAuto(kydD, kydC, {value: auto_birth_fee});

      const attr = await coreC._getKydyHelper(kydD);
      eq(attr.isGestating, true);
      assert(attr.nextActionAt != 0);
    });

    it("test that siblings cant breed", async function() {
      await util.mineNBlocks(cooldowns[1]);
      await coreC.giveBirth(kydD);
      // KydF is children of D with C (we are not testing it)
      const kydE = kydD + 1;
      // A & B have another child
      await coreC.breedWithAuto(kydB, kydA, {value: auto_birth_fee});
      await util.mineNBlocks(cooldowns[1]);
      await coreC.giveBirth(kydB);
      // KydE is children of B & A (just like D)
      kydF = kydE + 1;
      // test the sibling thing
      const canFdoD = await coreC.canBreedWith(kydF, kydD);
      eq(canFdoD, false);
      canDdoF = await coreC.canBreedWith(kydD, kydF);
      eq(canDdoF, false);
      await util.expectThrow(coreC.breedWithAuto(kydF, kydD, {value: auto_birth_fee}));
      await util.expectThrow(coreC.breedWithAuto(kydD, kydF, {value: auto_birth_fee}));
      // just make sure new kydy can do fine with new
    });

    // it("test breedWithAuto still retains the same requirements", async function() {
    //   await util.forwardEVMTime(cooldowns[1]);
    //
    //   await util.expectThrow(coreC.breedWith(kydF, kydD));
    //   await util.expectThrow(coreC.breedWith(kydD, kydF));
    // });

    it("make breedWithAuto happen and check event", async function() {
      // too low fee
      await util.expectThrow(coreC.breedWithAuto(kydB, kydA), {
        value: autoBirthPrice.sub(10)
      });

      await coreC.breedWithAuto(kydB, kydA, { value: autoBirthPrice });
      const start_block = await util.blockNumber();
      await util.sleep(500);

      // event order is not certain, might be any of the last 2
      let ev = pastEvents.pop();
      if (ev.event !== "Pregnant") {
        ev = pastEvents.pop();
      }
      debug("last event ", ev);
      eq(ev.event, "Pregnant");
      eq(ev.args.yinId.toNumber(), kydB);
      debug(
        ev.args.time,
        cooldowns[2],
        start_block.add(cooldowns[2])
        // (await coreC.timeNow()).add(cooldowns[2])
      );
      assert.isTrue(
          (ev.args.cooldownEndBlock.toNumber()).toString() == (await util.blockNumber()).add(cooldowns[2]).toString()
        ||
          ev.args.cooldownEndBlock.toString() == (await util.blockNumber()).add(cooldowns[2]).toString()
      );
    });

    it("test that anyone can give birth to a baby kydy", async function() {
      await util.mineNBlocks(cooldowns[4]);
      await coreC.giveBirth(kydB, { from: user3 });
    });

    // TODO(santony): giveBirth should send ether to the caller address
  });

  describe("Cooldowns progression", function() {
    let kydA, kydB;
    before(deployContract);

    it("create some kydys", async function() {
      // breed 2 genetically diff kydys
      await coreC.mintKydys(32, 2, { from: coo });
      kydA = 1;
      kydB = 2;
    });

    it("Let them breed and give birth", async function() {
      await coreC.breedWithAuto(kydA, kydB, {value: auto_birth_fee});
      await util.expectThrow(coreC.giveBirth(kydA));
      await util.mineNBlocks(cooldowns[0]);
      await coreC.giveBirth(kydA);
    });

    it("kydA can breed again right away", async function() {
      await coreC.breedWithAuto(kydA, kydB, {value: auto_birth_fee});
      // just advancing the first CD is not enough
      // await util.forwardEVMTime(cooldowns[0]);
      await util.mineNBlocks(cooldowns[0]);
      await util.expectThrow(coreC.giveBirth(kydA));
      // await util.forwardEVMTime(cooldowns[1]);
      await util.mineNBlocks(cooldowns[1]);
      await coreC.giveBirth(kydA);
    });

    it("kydB now will be the one pregnant", async function() {
      await coreC.breedWithAuto(kydB, kydA, {value: auto_birth_fee});
      // just advancing the first CD is not enough
      // await util.forwardEVMTime(cooldowns[1]);
      await util.mineNBlocks(cooldowns[1]);
      await util.expectThrow(coreC.giveBirth(kydB));
      // await util.forwardEVMTime(cooldowns[2]);
      await util.mineNBlocks(cooldowns[2]);
      await coreC.giveBirth(kydB);
    });

    // TODO(santony): It takes too long.
    // it("After reaching the limit it stops at max cooldown", async function() {
    //   // await util.forwardEVMTime(cooldowns[3]);
    //   await util.mineNBlocks(cooldowns[3]);
    //   // go over the whole cooldown table
    //   for (var i = 4; i <= cooldowns.length + 1; i++) {
    //     let cooldownPosition = i;
    //     if (cooldownPosition > cooldowns.length - 1)
    //       cooldownPosition = cooldowns.length - 1;
    //     debug("i:", i, cooldownPosition, cooldowns[cooldownPosition]);
    //     await coreC.breedWithAuto(kydB, kydA, {value: auto_birth_fee});
    //     // await util.forwardEVMTime(cooldowns[cooldownPosition]);
    //     await util.mineNBlocks(cooldowns[cooldownPosition]);
    //     await coreC.giveBirth(kydB);
    //   }
    // });
  });

  describe("Roles: CEO + CFO", async function() {
    it("COO try to appoint another COO, but cant", async function() {
      // that is the case because we override OZ ownable function
      await util.expectThrow(coreC.setCOO(user2));
    });
    it("CEO can appoint a CFO", async function() {
      await util.expectThrow(coreC.setCFO(cfo));
      await coreC.setCFO(cfo, { from: ceo });
    });
    it("CEO can appoint another coo", async function() {
      await coreC.setCOO(user1, { from: ceo });
    });
    it("new coo can do things, old coo cant anymore", async function() {
      await util.expectThrow(coreC.mintKydys(10, 1, { from: coo }));
      await coreC.mintKydys(10, 1, { from: user1 });
    });
    it("CEO can appoint another CEO", async function() {
      await util.expectThrow(coreC.setCEO(user2, { from: coo }));
      await coreC.setCEO(user2, { from: ceo });
    });
    it("old CEO cant do anything since they were replaced", async function() {
      await util.expectThrow(coreC.setCEO(user3, { from: ceo }));
      await coreC.setCEO(ceo, { from: user2 });
    });
    it("CFO can drain funds", async function() {
      await coreC.fundMe({ value: web3.toWei(0.05, "ether") });
      const ctoBalance1 = web3.eth.getBalance(cfo);
      debug("cfo balance was", ctoBalance1);
      await coreC.withdrawBalance({ from: cfo });
      const ctoBalance2 = web3.eth.getBalance(cfo);
      debug("cfo balance is ", ctoBalance2);
      assert(ctoBalance2.gt(ctoBalance1));
    });
  });

  describe("Contract Upgrade", function() {
    before(async function redeployContract() {
      await deployContract();
      await coreC.mintKydys(1000, 4, { from: coo });
      await coreC.mintKydys(9000, 2, { from: coo });
      const nKydys = await coreC.totalSupply();
      eq(nKydys.toNumber(), 6);
      await coreC.transfer(user1, 5);
      // have kydy 1 pregnant of kydy 2
      await util.forwardEVMTime(cooldowns[0]);
      await coreC.breedWithAuto(1, 2, {value: auto_birth_fee});
    });

    it("user2 fails to pause contract - not coo", async function() {
      await util.expectThrow(coreC.pause({ from: user2 }));
    });

    it("coo can pause the contract", async function() {
      await coreC.pause({ from: coo });
      const isPaused = await coreC.paused();
      eq(isPaused, true);
    });

    it("functions that alter state can't execute while paused", async function() {
      await util.expectThrow(coreC.transfer(user2, 6));
      await util.expectThrow(coreC.transfer(coo, 3, { from: user1 }));
      await util.expectThrow(coreC.breedWithAuto(1, 2));
    });

    it("can read state of all kydys while paused", async function() {
      const nKydys = await coreC.totalSupply();
      eq(nKydys.toNumber(), 6);
      let attr = await coreC._getKydyHelper(1);
      eq(attr.isGestating, true);
      eq(attr.cooldownIndex, 1);
      assert(attr.nextActionAt > 0);
      eq(attr.synthesizingWithId, 2);
      eq(attr.yinId, 0);
      eq(attr.yangId, 0);
      eq(attr.generation, 0);
      eq(attr.genes.toNumber(), 1000);
    });

    it("unpause", async function() {
      await coreC.unpause({ from: ceo });
      const isPaused = await coreC.paused();
      eq(isPaused, false);
    });

    it("kydy 1 give birth", async function() {
      await util.forwardEVMTime(cooldowns[0]);
      await coreC.giveBirth(1);
      const nKydys = await coreC.totalSupply();
      eq(nKydys.toNumber(), 7);
    });

    it("set new contract address", async function() {
      const coreC2 = await KydyCore.new();
      await util.expectThrow(coreC.setNewAddress(coreC2.address));
      await coreC.pause({ from: ceo });
      // CEO can appoint a new COO even while paused
      await coreC.setCOO(ceo, { from: ceo });
      await coreC.setNewAddress(coreC2.address, { from: ceo });
      const newAddress = await coreC.newContractAddress();
      debug("new contract address is ", newAddress);
      eq(newAddress, coreC2.address);
      // cannot unpause if new contract address is set
      await util.expectThrow(coreC.unpause({ from: ceo }));
    });
  });

  describe("sub contracts", function() {
    before(deployContract);

    it("can't assign an address that isnt Breeding to breeding", async function() {
      await util.expectThrow(coreC.setGeneScienceAddress(NULL_ADDRESS));
    });

    it("can't assign an address that isnt Breeding to breeding 2", async function() {
      await util.expectThrow(coreC.setGeneScienceAddress(user2));
    });

    it("can't assign an address that isnt Breeding to breeding 3", async function() {
      await util.expectThrow(coreC.setGeneScienceAddress(coreC.address));
    });

    it("can set a valid breeding contract", async function() {
      await coreC.mintKydys(777, 8);
      // forward time by 1 minute
      await util.forwardEVMTime(cooldowns[0]);

      const kydyUtilContract = await KydyUtil.new();
      const geneReleaseContract = await GeneRelease.new();
      geneScienceContract = await GeneScience.new(kydyUtilContract.address, geneReleaseContract.address);
      await coreC.setGeneScienceAddress(geneScienceContract.address, {
        from: ceo
      });
    });

    it("everything still works with new breeding contract", async function() {
      await coreC.mintKydys(9999, 2, { from: coo });
      await coreC.breedWithAuto(1, 2, {value: auto_birth_fee});
      const kydA = await coreC._getKydyHelper(1);
      eq(kydA.isGestating, true);
      eq(kydA.cooldownIndex, 1);
    });
  });

  describe("Rescue lost kydys", function() {
    const kydyId1 = 1,
      kydyId2 = 2;
    before(async function() {
      await deployContract();
      await coreC.mintKydys(999, 2, { from: coo });
      await coreC.transfer(coreC.address, kydyId1, { from: coo });
    });

    it("should fail to rescue kydys that aren't owned by the contract", async function() {
      await util.expectThrow(
        coreC.rescueLostKydy(kydyId2, user1, { from: coo })
      );
    });
    it("should fail to rescue kydys if not coo", async function() {
      await util.expectThrow(
        coreC.rescueLostKydy(kydyId1, user1, { from: user1 })
      );
    });
    it("should be able to rescue kydys that are owned by the contract", async function() {
      await coreC.rescueLostKydy(kydyId1, user1, { from: coo });
      const kydy1Owner = await coreC.kydyIndexToOwner(kydyId1);
      eq(kydy1Owner, user1);
    });
  });

  describe("Auction wrapper", function() {
    let saleAuction, synthesizingAuction;
    const kydyId1 = 1,
      kydyId2 = 2,
      kydyId3 = 3;

    before(async function() {
      await deployContract();
      saleAuction = await SaleClockAuction.new(coreC.address, 0);
      synthesizingAuction = await SynthesizingClockAuction.new(coreC.address, 0);
      await coreC.mintKydys(999, 3, { from: coo });
      await coreC.transfer(user1, kydyId2, { from: coo });
      await coreC.transfer(user1, kydyId3, { from: coo });
    });

    it("non-CEO should fail to set auction addresses", async function() {
      await util.expectThrow(
        coreC.setSaleAuctionAddress(saleAuction.address, { from: user1 })
      );
      await util.expectThrow(
        coreC.setSynthesizingAuctionAddress(synthesizingAuction.address, { from: user1 })
      );
    });
    it("CEO should be able to set auction addresses", async function() {
      await coreC.setSaleAuctionAddress(saleAuction.address, { from: ceo });
      await coreC.setSynthesizingAuctionAddress(synthesizingAuction.address, {
        from: ceo
      });
    });
    it("should fail to create sale auction if not cat owner", async function() {
      await util.expectThrow(
        coreC.createSaleAuction(kydyId1, 100, { from: user1 })
      );
    });
    it("should be able to create sale auction", async function() {
      await coreC.createSaleAuction(kydyId1, 100, { from: coo });
      const kydy1Owner = await coreC.ownerOf(kydyId1);
      eq(kydy1Owner, saleAuction.address);
    });
    it("should fail to breed if yang is on sale auction", async function() {
      await util.expectThrow(
        coreC.breedWithAuto(kydyId2, kydyId1, { from: user1 })
      );
    });
    it("should be able to bid on sale auction", async function() {
      const cooBal1 = await web3.eth.getBalance(coo);
      await saleAuction.bid(kydyId1, { from: user1, value: 100 });
      const cooBal2 = await web3.eth.getBalance(coo);
      const kydy1Owner = await coreC.ownerOf(kydyId1);
      eq(kydy1Owner, user1);
      assert(cooBal2.gt(cooBal1));
      // Transfer the kydy back to coo for the rest of the tests
      await coreC.transfer(coo, kydyId1, { from: user1 });
    });
    it("should fail to create synthesizing auction if not cat owner", async function() {
      await util.expectThrow(
        coreC.createSynthesizingAuction(kydyId1, 100, { from: user1 })
      );
    });
    it("should be able to create synthesizing auction", async function() {
      await coreC.createSynthesizingAuction(kydyId1, 100, { from: coo });
      const kydy1Owner = await coreC.ownerOf(kydyId1);
      eq(kydy1Owner, synthesizingAuction.address);
    });
    it("should fail to breed if yang is on synthesizing auction", async function() {
      await util.expectThrow(
        coreC.breedWithAuto(kydyId2, kydyId1, { from: user1 })
      );
    });
    it("should fail to bid on synthesizing auction if yin is in cooldown", async function() {
      // Breed, putting kydy 2 into cooldown
      await coreC.breedWithAuto(kydyId3, kydyId2, { from: user1 , value: auto_birth_fee });
      await util.expectThrow(
        coreC.bidOnSynthesizingAuction(kydyId1, kydyId2, {
          from: user1,
          value: 100 + auto_birth_fee
        })
      );
      // Forward time so cooldowns end before next test
      await util.mineNBlocks(4 * 60);
    });
    it("should be able to bid on synthesizing auction", async function() {
      const cooBal1 = await web3.eth.getBalance(coo);
      await coreC.bidOnSynthesizingAuction(kydyId1, kydyId2, {
        from: user1,
        value: 100 + auto_birth_fee
      });
      const cooBal2 = await web3.eth.getBalance(coo);
      const kydy1Owner = await coreC.ownerOf(kydyId1);
      const kydy2Owner = await coreC.ownerOf(kydyId2);
      eq(kydy1Owner, coo);
      eq(kydy2Owner, user1);
      assert(cooBal2.gt(cooBal1));
      // Forward time so cooldowns end before next test
      await util.mineNBlocks(4 * 60);
      await coreC.giveBirth(kydyId2, { from: user1 });
    });
    it("should be able to cancel a sale auction", async function() {
      await coreC.createSaleAuction(kydyId1, 100, { from: coo });
      await saleAuction.cancelAuction(kydyId1, { from: coo });
      const kydy1Owner = await coreC.ownerOf(kydyId1);
      eq(kydy1Owner, coo);
    });
    it("should be able to cancel a synthesizing auction", async function() {
      await coreC.createSynthesizingAuction(kydyId1, 100, { from: coo });
      await synthesizingAuction.cancelAuction(kydyId1, { from: coo });
      const kydy1Owner = await coreC.ownerOf(kydyId1);
      eq(kydy1Owner, coo);
    });
    // it("should be able to bid on synthesizing auction with autobirth", function(
    //   done
    // ) {
    //   const events = coreC.AutoBirth();
    //   coreC.autoBirthFee().then(autoBirthFee => {
    //     coreC
    //       .createSynthesizingAuction(kydyId1, 100, { from: coo })
    //       .then(() => {
    //         coreC
    //           .bidOnSynthesizingAuction(kydyId1, kydyId2, {
    //             from: user1,
    //             value: autoBirthFee.add(100)
    //           })
    //           .then(() => {
    //             events.get((err, res) => {
    //               assert(!err);
    //               eq(res[0].event, "AutoBirth");
    //               assert(res[0].args.yinId.eq(kydyId2));
    //               done();
    //             });
    //           });
    //       });
    //   });
    // });
  });

  describe("Gen0 Auction", function() {
    let saleAuction, synthesizingAuction;
    const kydyId1 = 1,
      kydyId2 = 2;
    const price = FINNEY_BN.mul(10);

    before(async function() {
      await deployContract();
      saleAuction = await SaleClockAuction.new(coreC.address, 0);
      synthesizingAuction = await SynthesizingClockAuction.new(coreC.address, 0);
      await coreC.setSaleAuctionAddress(saleAuction.address, { from: ceo });
      await coreC.setSynthesizingAuctionAddress(synthesizingAuction.address, {
        from: ceo
      });
    });

    it("should fail to create gen0 auction if not coo", async function() {
      await util.expectThrow(coreC.createGen0Auction(1, { from: user1 }));
    });
    it("should start aveSalePrice at 0", async function() {
      const avePrice = await saleAuction.averageGen0SalePrice();
      assert(avePrice.eq(0));
    });
    it("should be able to create gen0 auction", async function() {
      await coreC.createGen0Auction(1, { from: coo });
      const auction = await saleAuction.getAuction(kydyId1);
      eq(auction[0], coreC.address);
      assert(auction[1].eq(price));
      const gen0CreatedCount = await coreC.gen0CreatedCount();
      eq(gen0CreatedCount, 1);
    });
    it("avePrice should be unchanged (no sale yet)", async function() {
      const avePrice = await saleAuction.averageGen0SalePrice();
      assert(avePrice.eq(0));
      const auction = await saleAuction.getAuction(kydyId1);
    });
    it("should be able to bid on gen0 auction", async function() {
      await saleAuction.bid(kydyId1, { from: user1, value: price });
      const kydy1Owner = await coreC.ownerOf(kydyId1);
      eq(kydy1Owner, user1);
    });
    it("avePrice should be about 1/5 starting price after first sale", async function() {
      const avePrice = await saleAuction.averageGen0SalePrice();
      assert(avePrice.gt(0));
      assert(avePrice.lt(price.div(4)));
    });
    it("avePrice should not be influenced by regular auctions", async function() {
      const avePrice1 = await saleAuction.averageGen0SalePrice();
      await coreC.createSaleAuction(
        kydyId1,
        FINNEY_BN.mul(50),
        { from: user1 }
      );
      await saleAuction.bid(kydyId1, {
        from: user2,
        value: FINNEY_BN.mul(50)
      });
      const avePrice2 = await saleAuction.averageGen0SalePrice();
      assert(avePrice1.eq(avePrice2));
    });
    it("next 3 gen0 auctions should be price", async function() {
      // Create kydy 2-4, all these auctions should have
      // starting price of 10 finney because avePrice*1.5 is
      // still less than starting price
      // (3/5)(3/2)p = (9/10)p < p
      for (let id = 2; id < 5; id++) {
        await coreC.createGen0Auction(1, { from: coo });
        const auction = await saleAuction.getAuction(id);
        assert(auction[1].eq(FINNEY_BN.mul(10)));
        await saleAuction.bid(id, { from: user1, value: FINNEY_BN.mul(10) });
        const avePrice = await saleAuction.averageGen0SalePrice();
      }
    });
    it("gen0 auctions should compute price based on previous sales", async function() {
      // The 5th should have price of > price
      // (4/5)(3/2)p = (12/10)p > p
      await coreC.createGen0Auction(1, { from: coo });
      const auction = await saleAuction.getAuction(5);
      assert(auction[1].gt(price));
    });
  });

  describe("auction withdrawals", function() {
    beforeEach(async function() {
      await deployContract();
      saleAuction = await SaleClockAuction.new(coreC.address, 1000);
      synthesizingAuction = await SynthesizingClockAuction.new(coreC.address, 1000);
      await coreC.setSaleAuctionAddress(saleAuction.address, { from: ceo });
      await coreC.setSynthesizingAuctionAddress(synthesizingAuction.address, {
        from: ceo
      });
      await coreC.setCFO(cfo, { from: ceo });
      // Get some Ether into both sale and synthesizing auctions
      await coreC.mintKydys(1, 2, { from: coo });
      await coreC.createSaleAuction(1, 100000, { from: coo });
      await saleAuction.bid(1, { from: user1, value: 100000 });
      await coreC.createSynthesizingAuction(1, 100000, { from: user1 });
      await coreC.bidOnSynthesizingAuction(1, 2, { from: coo, value: 100000 + auto_birth_fee });
    });

    it("should fail to withdraw as non-coo", async function() {
      util.expectThrow(saleAuction.withdrawBalance({ from: user1 }));
      util.expectThrow(synthesizingAuction.withdrawBalance({ from: user1 }));
    });
    it("should be able to withdraw as coo", async function() {
      const saleBal1 = web3.eth.getBalance(saleAuction.address);
      const synthesizeBal1 = web3.eth.getBalance(synthesizingAuction.address);
      const coreBal1 = web3.eth.getBalance(coreC.address);
      await saleAuction.withdrawBalance({ from: coo });
      await synthesizingAuction.withdrawBalance({ from: coo });
      const saleBal2 = web3.eth.getBalance(saleAuction.address);
      const synthesizeBal2 = web3.eth.getBalance(synthesizingAuction.address);
      const coreBal2 = web3.eth.getBalance(coreC.address);
      assert(
        coreBal1
          .add(saleBal1)
          .add(synthesizeBal1)
          .eq(coreBal2)
      );
      assert(saleBal2.eq(0));
      assert(synthesizeBal2.eq(0));
    });
    it("should fail to withdraw via core as non-COO", async function() {
      util.expectThrow(coreC.withdrawAuctionBalances({ from: cfo }));
    });
    it("should be able to withdraw via core as COO", async function() {
      const saleBal1 = web3.eth.getBalance(saleAuction.address);
      const synthesizeBal1 = web3.eth.getBalance(synthesizingAuction.address);
      const coreBal1 = web3.eth.getBalance(coreC.address);
      await coreC.withdrawAuctionBalances({ from: coo });
      const saleBal2 = web3.eth.getBalance(saleAuction.address);
      const synthesizeBal2 = web3.eth.getBalance(synthesizingAuction.address);
      const coreBal2 = web3.eth.getBalance(coreC.address);
      assert(
        coreBal1
          .add(saleBal1)
          .add(synthesizeBal1)
          .eq(coreBal2)
      );
      assert(saleBal2.eq(0));
      assert(synthesizeBal2.eq(0));
    });
  });
});
