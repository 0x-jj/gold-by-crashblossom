import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { signBid } from "./helpers/sign";
import { DutchAuction } from "../typechain-types";
import { deployContracts } from "./utils";
import MerkleTree from "merkletreejs";

const DEV_SPLIT = 140; // 14%
const ARTIST_SPLIT = 650; // 65 %
const DAO_SPLIT = 210; // 21 %

const startAuction = async (auction: DutchAuction) => {
  const [deployer] = await ethers.getSigners();
  const startAmount = ethers.utils.parseEther("2");
  const endAmount = ethers.utils.parseEther("0.2");
  const limit = ethers.utils.parseEther("10");
  const refundDelayTime = 30 * 60;
  const startTime = Math.floor(Date.now() / 1000) - 100;
  const endTime = startTime + 3 * 3600;

  await auction
    .connect(deployer)
    .setConfig(startAmount, endAmount, limit, refundDelayTime, startTime, endTime);

  return {
    startAmount,
    endAmount,
    limit,
    refundDelayTime,
    startTime,
    endTime,
  };
};

const getSignature = async (auction: DutchAuction, account: string, deadline: number, qty: number) => {
  const [, , , signer] = await ethers.getSigners();
  const nonce = await auction.getNonce(account);
  const signature = await signBid(signer, auction.address, {
    account,
    qty,
    nonce,
    deadline,
  });
  return signature;
};

describe("Dutch auction integration tests", function () {
  let merkleTree: MerkleTree;
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  function callFixture(supply = 20) {
    return async function deployFixture() {
      // Contracts are deployed using the first signer/account by default
      const [deployer, alice, bob, signer, treasury, marcia] = await ethers.getSigners();
      const contracts = await deployContracts();

      const GoldContract = await ethers.getContractFactory("Gold");
      const nft = await GoldContract.deploy(
        [deployer.address, alice.address, bob.address],
        [DEV_SPLIT, ARTIST_SPLIT, DAO_SPLIT],
        [deployer.address],
        contracts.wethContract.address,
        contracts.rendererContract.address,
        supply,
        "0x00000000000076A84feF008CDAbe6409d2FE638B"
      );

      merkleTree = contracts.merkleTree.tree;

      const Auction = await ethers.getContractFactory("DutchAuction");
      const auction = await Auction.deploy(
        nft.address,
        signer.address,
        treasury.address,
        contracts.merkleTree.root,
        "0x00000000000076A84feF008CDAbe6409d2FE638B"
      );

      await nft.setMinterAddress(auction.address);

      return { nft, deployer, alice, bob, auction, marcia };
    };
  }

  describe("Integration", function () {
    it("fails when bid after max supply reached out", async function () {
      const { alice, bob, marcia, auction } = await loadFixture(callFixture(3));
      const deadline = Math.floor(Date.now() / 1000) + 1000;

      const { startAmount } = await startAuction(auction);
      const aliceQty = 1;
      const bobQty = 2;
      const marciaQty = 1;
      const aliceSign = getSignature(auction, alice.address, deadline, aliceQty);
      const bobSign = getSignature(auction, bob.address, deadline, bobQty);
      const marciaSign = getSignature(auction, marcia.address, deadline, marciaQty);

      await Promise.all([
        auction.connect(alice).bid(aliceQty, deadline, aliceSign, alice.address, {
          value: startAmount.mul(aliceQty),
        }),
        auction.connect(bob).bid(bobQty, deadline, bobSign, bob.address, { value: startAmount.mul(bobQty) }),
      ]);

      await expect(
        auction.connect(marcia).bid(marciaQty, deadline, marciaSign, marcia.address, {
          value: startAmount.mul(marciaQty),
        })
      ).to.reverted;
    });
    it("fails when sold out and try to get rebate", async function () {
      const { alice, marcia, auction } = await loadFixture(callFixture(3));
      const deadline = Math.floor(Date.now() / 1000) + 1000;

      const { startAmount } = await startAuction(auction);
      const aliceQty = 3;
      const aliceSign = getSignature(auction, alice.address, deadline, aliceQty);

      await auction.connect(alice).bid(aliceQty, deadline, aliceSign, alice.address, {
        value: startAmount.mul(aliceQty + 2),
      });

      await expect(
        auction.connect(marcia).claimRefund(marcia.address, merkleTree.getHexProof(marcia.address))
      ).to.reverted;
    });
    it("fails when sold out and try to withdraw funds if sale not ended", async function () {
      const { deployer, alice, auction } = await loadFixture(callFixture(3));
      const deadline = Math.floor(Date.now() / 1000) + 1000;

      const { startAmount } = await startAuction(auction);
      const aliceQty = 3;
      const aliceSign = getSignature(auction, alice.address, deadline, aliceQty);

      await auction.connect(alice).bid(aliceQty, deadline, aliceSign, alice.address, {
        value: startAmount.mul(aliceQty + 2),
      });

      await expect(auction.connect(deployer).withdrawFunds()).to.reverted;
    });
  });
});
