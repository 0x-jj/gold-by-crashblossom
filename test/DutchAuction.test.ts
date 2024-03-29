import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { signBid } from "./helpers/sign";
import { takeSnapshot, revertToSnapshot } from "./helpers/snapshot";
import { increaseTime } from "./helpers/time";
import { DutchAuction, Gold } from "../typechain-types";
import { BigNumber } from "ethers";
import { deployContracts } from "./utils";
import MerkleTree from "merkletreejs";

const toWei = ethers.utils.parseEther;

const START_PRICE = toWei("1.4");
const RESERVED_MINTS = 3;
const MAX_SUPPLY = 10;

const DEV_SPLIT = 140; // 14%
const ARTIST_SPLIT = 650; // 65 %
const DAO_SPLIT = 210; // 21 %

describe("DutchAuction", function () {
  let nft: Gold;
  let auction: DutchAuction;
  let admin: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let signer: SignerWithAddress;
  let treasury: SignerWithAddress;
  let defaultAdminRole: string;
  let startAmount: BigNumber;
  let endAmount: BigNumber;
  let limit: BigNumber;
  let refundDelayTime: number;
  let startTime: number;
  let endTime: number;
  let snapshotId: number;
  let merkleTree: MerkleTree;

  const getSignature = async (account: string, deadline: number, qty: number) => {
    const nonce = await auction.getNonce(account);
    const signature = await signBid(signer, auction.address, {
      account,
      qty,
      nonce,
      deadline,
    });
    return signature;
  };

  const makeBid = async (
    user: SignerWithAddress,
    deadline: number,
    qty: number,
    value: BigNumber,
    returnPrice = false
  ) => {
    const signature = await getSignature(user.address, deadline, qty);
    const tx = await auction.connect(user).bid(qty, deadline, signature, user.address, { value });

    if (returnPrice) {
      const receipt = await tx.wait();
      const event = receipt?.events?.find((event) => event.event === "Bid");
      const finalPrice = event?.args?.price;
      return finalPrice;
    }
  };

  before("Deploy", async () => {
    [admin, alice, bob, signer, treasury] = await ethers.getSigners();

    const contracts = await deployContracts();
    nft = contracts.nftContract;
    const wethContract = contracts.wethContract;
    merkleTree = contracts.merkleTree.tree;
    const GoldContract = await ethers.getContractFactory("Gold");
    nft = await GoldContract.deploy(
      [admin.address, alice.address, bob.address],
      [DEV_SPLIT, ARTIST_SPLIT, DAO_SPLIT],
      [admin.address],
      wethContract.address,
      contracts.rendererContract.address,
      20,
      "0x00000000000076A84feF008CDAbe6409d2FE638B"
    );

    const Auction = await ethers.getContractFactory("DutchAuction");
    auction = await Auction.deploy(
      nft.address,
      signer.address,
      treasury.address,
      contracts.merkleTree.root,
      "0x00000000000076A84feF008CDAbe6409d2FE638B"
    );

    await nft.connect(admin).setMinterAddress(auction.address);

    defaultAdminRole = await auction.DEFAULT_ADMIN_ROLE();

    startAmount = ethers.utils.parseEther("2");
    endAmount = ethers.utils.parseEther("0.2");
    limit = ethers.utils.parseEther("10");
    refundDelayTime = 30 * 60;
    startTime = Math.floor(Date.now() / 1000) - 100;
    endTime = startTime + 3 * 3600;
  });

  beforeEach(async () => {
    snapshotId = await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot(snapshotId);
  });

  describe("Set Config", () => {
    it("should fail to set config as non-admin", async () => {
      await expect(
        auction.connect(alice).setConfig(startAmount, endAmount, limit, refundDelayTime, startTime, endTime)
      ).to.be.revertedWith(
        `AccessControl: account ${alice.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
    });

    it("should fail to set config when startTime is 0", async () => {
      await expect(
        auction.connect(admin).setConfig(startAmount, endAmount, limit, refundDelayTime, 0, endTime)
      )
        .to.be.revertedWithCustomError(auction, "InvalidStartEndTime")
        .withArgs(0, endTime);
    });

    it("should fail to set config when startTime >= endTime", async () => {
      await expect(
        auction.connect(admin).setConfig(startAmount, endAmount, limit, refundDelayTime, endTime, endTime)
      )
        .to.be.revertedWithCustomError(auction, "InvalidStartEndTime")
        .withArgs(endTime, endTime);
    });

    it("should fail to set config when startAmount is 0", async () => {
      await expect(
        auction.connect(admin).setConfig(0, endAmount, limit, refundDelayTime, startTime, endTime)
      ).to.be.revertedWithCustomError(auction, "InvalidAmountInWei");
    });

    it("should fail to set config when limit is 0", async () => {
      await expect(
        auction.connect(admin).setConfig(startAmount, endAmount, 0, refundDelayTime, startTime, endTime)
      ).to.be.revertedWithCustomError(auction, "InvalidAmountInWei");
    });

    it("should fail to set config when startAmount <= endAmount", async () => {
      await expect(
        auction.connect(admin).setConfig(startAmount, startAmount, limit, refundDelayTime, startTime, endTime)
      ).to.be.revertedWithCustomError(auction, "InvalidAmountInWei");
    });

    it("should set config", async () => {
      await auction
        .connect(admin)
        .setConfig(startAmount, endAmount, limit, refundDelayTime, startTime, endTime);
      const config = await auction.getConfig();
      expect(config.startAmountInWei).to.be.eq(startAmount);
      expect(config.endAmountInWei).to.be.eq(endAmount);
      expect(config.limitInWei).to.be.eq(limit);
      expect(config.refundDelayTime).to.be.eq(refundDelayTime);
      expect(config.startTime).to.be.eq(startTime);
      expect(config.endTime).to.be.eq(endTime);
    });

    it("should fail to set config when auction is started", async () => {
      await auction
        .connect(admin)
        .setConfig(startAmount, endAmount, limit, refundDelayTime, startTime, endTime);
      await expect(
        auction.connect(admin).setConfig(startAmount, endAmount, limit, refundDelayTime, startTime, endTime)
      ).to.be.revertedWithCustomError(auction, "ConfigAlreadySet");
    });
  });

  describe("setNftContractAddress", function () {
    it("should set the NFT contract address", async function () {
      const newAddress = "0x1234567890123456789012345678901234567890";
      await expect(auction.connect(admin).setNftContractAddress(newAddress)).to.not.be.reverted;
      expect(await auction.nftContractAddress()).to.equal(newAddress);
    });

    it("should revert if called by non-admin", async function () {
      const newAddress = "0x1234567890123456789012345678901234567890";
      await expect(auction.connect(alice).setNftContractAddress(newAddress)).to.be.revertedWith(
        /AccessControl/
      );
    });

    it("should revert if new address is zero", async function () {
      await expect(
        auction.connect(admin).setNftContractAddress(ethers.constants.AddressZero)
      ).to.be.revertedWith(/zero address not allowed/);
    });
  });

  describe("setSigner", function () {
    it("should set the signer address", async function () {
      const newAddress = "0x1234567890123456789012345678901234567890";
      await expect(auction.connect(admin).setSignerAddress(newAddress)).to.not.be.reverted;
      expect(await auction.signerAddress()).to.equal(newAddress);
    });

    it("should revert if called by non-admin", async function () {
      const newAddress = "0x1234567890123456789012345678901234567890";
      await expect(auction.connect(alice).setSignerAddress(newAddress)).to.be.revertedWith(/AccessControl/);
    });

    it("should revert if new address is zero", async function () {
      await expect(auction.connect(admin).setSignerAddress(ethers.constants.AddressZero)).to.be.revertedWith(
        /zero address not allowed/
      );
    });
  });

  describe("Set Treasury", () => {
    it("should fail to set treasury as non-admin", async () => {
      await expect(auction.connect(alice).setTreasuryAddress(bob.address)).to.be.revertedWith(
        `AccessControl: account ${alice.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
    });

    it("should revert if new address is zero", async function () {
      await expect(
        auction.connect(admin).setTreasuryAddress(ethers.constants.AddressZero)
      ).to.be.revertedWith(/zero address not allowed/);
    });

    it("should set treasury", async () => {
      await auction.connect(admin).setTreasuryAddress(bob.address);
      expect(await auction.treasuryAddress()).to.be.eq(bob.address);
    });
  });

  describe("Pause/Unpause", () => {
    it("should fail pause the contract as non-admin", async () => {
      await expect(auction.connect(alice).pause()).to.be.revertedWith(
        `AccessControl: account ${alice.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
    });

    it("should pause the contract", async () => {
      await auction.connect(admin).pause();
      expect(await auction.paused()).to.be.eq(true);
    });

    it("should fail unpause the contract as non-admin", async () => {
      await expect(auction.connect(alice).unpause()).to.be.revertedWith(
        `AccessControl: account ${alice.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
    });

    it("should pause the contract", async () => {
      await auction.connect(admin).pause();
      await auction.connect(admin).unpause();
      expect(await auction.paused()).to.be.eq(false);
    });
  });

  describe("Get current price", () => {
    it("should return start amount before auction starts", async () => {
      const newStartTime = Math.floor(Date.now() / 1000) + 1000;
      await auction
        .connect(admin)
        .setConfig(startAmount, endAmount, limit, refundDelayTime, newStartTime, endTime);

      expect(await auction.getCurrentPriceInWei()).to.be.eq(startAmount);
    });

    it("should return end amount after auction ends", async () => {
      await auction
        .connect(admin)
        .setConfig(startAmount, endAmount, limit, refundDelayTime, startTime, endTime);
      await increaseTime(3 * 3600);

      expect(await auction.getCurrentPriceInWei()).to.be.eq(endAmount);
    });
  });

  describe("Bid", () => {
    it("should fail to bid when config is not set", async () => {
      const deadline = Math.floor(Date.now() / 1000) + 1000;
      const qty = 5;
      const signature = await getSignature(alice.address, deadline, qty);
      await expect(
        auction.connect(alice).bid(qty, deadline, signature, alice.address, { value: startAmount.mul(qty) })
      ).to.be.revertedWithCustomError(auction, "ConfigNotSet");
    });

    it("should fail to bid before auction starts", async () => {
      const newStartTime = Math.floor(Date.now() / 1000) + 1000;
      await auction
        .connect(admin)
        .setConfig(startAmount, endAmount, limit, refundDelayTime, newStartTime, endTime);

      const deadline = Math.floor(Date.now() / 1000) + 300;
      const qty = 5;
      const signature = await getSignature(alice.address, deadline, qty);
      await expect(auction.connect(alice).bid(qty, deadline, signature, alice.address, { value: 0 }))
        .to.be.revertedWithCustomError(auction, "InvalidStartEndTime")
        .withArgs(newStartTime, endTime);
    });

    describe("When config is set", () => {
      beforeEach(async () => {
        await auction
          .connect(admin)
          .setConfig(startAmount, endAmount, limit, refundDelayTime, startTime, endTime);
      });

      it("should fail to bid when nft contract paused", async () => {
        await nft.connect(admin).pause();
        const deadline = Math.floor(Date.now() / 1000) + 1000;
        const qty = 5;
        const signature = await getSignature(alice.address, deadline, qty);
        await expect(
          auction.connect(alice).bid(qty, deadline, signature, alice.address, { value: startAmount.mul(qty) })
        ).to.be.revertedWith("Pausable: paused");
      });

      it("should fail to bid when paused", async () => {
        await auction.connect(admin).pause();
        const deadline = Math.floor(Date.now() / 1000) + 1000;
        const qty = 5;
        const signature = await getSignature(alice.address, deadline, qty);
        await expect(
          auction.connect(alice).bid(qty, deadline, signature, alice.address, { value: startAmount.mul(qty) })
        ).to.be.revertedWith("Pausable: paused");
      });

      it("should fail to bid when deadline is expired", async () => {
        const deadline = Math.floor(Date.now() / 1000) - 1000;
        const qty = 5;
        const signature = await getSignature(alice.address, deadline, qty);
        await expect(
          auction.connect(alice).bid(qty, deadline, signature, alice.address, { value: startAmount.mul(qty) })
        )
          .to.be.revertedWithCustomError(auction, "BidExpired")
          .withArgs(deadline);
      });

      it("should fail to bid when signature is invalid", async () => {
        const deadline = Math.floor(Date.now() / 1000) + 300;
        const qty = 5;
        const signature = await getSignature(bob.address, deadline, qty);
        await expect(
          auction.connect(alice).bid(qty, deadline, signature, alice.address, { value: startAmount.mul(qty) })
        ).to.be.revertedWithCustomError(auction, "InvalidSignature");
      });

      it("should fail to bid when insufficient eth is sent", async () => {
        const deadline = Math.floor(Date.now() / 1000) + 300;
        const qty = 5;
        const signature = await getSignature(alice.address, deadline, qty);
        await expect(
          auction.connect(alice).bid(qty, deadline, signature, alice.address, { value: 0 })
        ).to.be.revertedWithCustomError(auction, "NotEnoughValue");
      });

      it("should fail to bid 0 quantity", async () => {
        const deadline = Math.floor(Date.now() / 1000) + 300;
        const qty = 0;
        const signature = await getSignature(alice.address, deadline, qty);
        await expect(
          auction.connect(alice).bid(qty, deadline, signature, alice.address, { value: startAmount.mul(qty) })
        ).to.be.revertedWithCustomError(auction, "InvalidQuantity");
      });

      it("should bid", async () => {
        const deadline = Math.floor(Date.now() / 1000) + 300;
        const nonce = await auction.getNonce(alice.address);
        const qty = 5;
        const signature = await getSignature(alice.address, deadline, qty);
        const tx = await auction
          .connect(alice)
          .bid(qty, deadline, signature, alice.address, { value: startAmount.mul(qty) });

        await expect(tx).to.emit(auction, "Bid");
        expect(await nft.balanceOf(alice.address)).to.be.eq(qty);
        expect(await auction.getNonce(alice.address)).to.be.eq(nonce.add(1));
      });

      it("should bid more than twice before limit reached", async () => {
        const deadline = Math.floor(Date.now() / 1000) + 3 * 3600;
        const value = startAmount.mul(5);
        await increaseTime(3600);
        await makeBid(alice, deadline, 5, value); // 1.4 x 5 = 7
        await increaseTime(30 * 60);
        await makeBid(alice, deadline, 2, value); // 1.1 x 2 = 2.2
        await increaseTime(30 * 60);
        await makeBid(alice, deadline, 1, value); // 0.8 x 1 = 0.8
      });

      it("should fail to bid when nft total supply reached", async () => {
        const deadline = Math.floor(Date.now() / 1000) + 3 * 3600;
        const value = startAmount.mul(5);
        await increaseTime(3600 * 2);
        await makeBid(alice, deadline, 10, value); // 0.8 x 10 = 8
        await makeBid(bob, deadline, 10, value); // 0.8 x 10 = 8
        const signature = await getSignature(alice.address, deadline, 1);

        await expect(
          auction.connect(alice).bid(1, deadline, signature, alice.address, { value })
        ).to.be.revertedWithCustomError(auction, "MaxSupplyReached");
      });

      it("should fail to bid when limit reached", async () => {
        const deadline = Math.floor(Date.now() / 1000) + 3 * 3600;
        const value = startAmount.mul(5);
        await increaseTime(3600);
        await makeBid(alice, deadline, 5, value); // 1.4 x 5 = 7
        await increaseTime(40 * 60);
        await makeBid(alice, deadline, 3, value); // 1 x 3 = 3
        await increaseTime(30 * 60);
        const signature = await getSignature(alice.address, deadline, 2);
        await expect(
          auction.connect(alice).bid(2, deadline, signature, alice.address, { value })
        ).to.be.revertedWithCustomError(auction, "PurchaseLimitReached");
      });

      it("should fail to purchase more than limit", async () => {
        const deadline = Math.floor(Date.now() / 1000) + 300;
        let nonce = await auction.getNonce(alice.address);
        let qty = 5;
        let signature = await signBid(signer, auction.address, {
          account: alice.address,
          qty,
          nonce,
          deadline,
        });
        await auction
          .connect(alice)
          .bid(qty, deadline, signature, alice.address, { value: startAmount.mul(qty) });

        nonce = await auction.getNonce(alice.address);
        qty = 1;
        signature = await signBid(signer, auction.address, {
          account: alice.address,
          qty,
          nonce,
          deadline,
        });
        await expect(
          auction.connect(alice).bid(qty, deadline, signature, alice.address, { value: startAmount.mul(qty) })
        ).to.be.revertedWithCustomError(auction, "PurchaseLimitReached");
      });

      it("should fail to bid when auction is ended", async () => {
        const deadline = Math.floor(Date.now() / 1000) + 300;
        const qty = 5;
        const signature = await getSignature(alice.address, deadline, qty);
        await increaseTime(3 * 3600);
        await expect(auction.connect(alice).bid(qty, deadline, signature, alice.address, { value: 0 }))
          .to.be.revertedWithCustomError(auction, "InvalidStartEndTime")
          .withArgs(startTime, endTime);
      });

      it("should bid and getUserData returns properly", async () => {
        const deadline = Math.floor(Date.now() / 1000) + 300;
        const qty = 5;
        const signature = await getSignature(alice.address, deadline, qty);
        const tx = await auction
          .connect(alice)
          .bid(qty, deadline, signature, alice.address, { value: startAmount.mul(qty) });

        await expect(tx).to.emit(auction, "Bid");
        const receipt = await tx.wait();
        const event = receipt?.events?.find((event) => event.event === "Bid");
        const finalPrice = event?.args?.price;
        const userData = await auction.getUserData(alice.address);

        expect(userData.contribution).to.eq(finalPrice.mul(qty));
        expect(userData.tokensBidded).to.eq(qty);
        expect(userData.refundClaimed).to.be.false;
      });

      it("should bid twice and getUserData returns properly", async () => {
        const deadline = Math.floor(Date.now() / 1000) + 3 * 3600;
        const value = startAmount.mul(5);
        const qty1 = 5;
        const qty2 = 2;
        await increaseTime(3600);
        const finalPrice1 = await makeBid(alice, deadline, qty1, value, true); // 1.4 x 5 = 7
        await increaseTime(30 * 60);
        const finalPrice2 = await makeBid(alice, deadline, qty2, value, true); // 1.1 x 2 = 2.2
        const userData = await auction.getUserData(alice.address);

        expect(userData.contribution).to.eq(finalPrice1.mul(qty1).add(finalPrice2.mul(qty2)));
        expect(userData.tokensBidded).to.eq(qty1 + qty2);
        expect(userData.refundClaimed).to.be.false;
      });
    });
  });

  describe("Claim More NFTs", () => {
    it("should fail to claim nfts when config is not set", async () => {
      await expect(auction.connect(alice).claimTokens(2, alice.address)).to.be.revertedWithCustomError(
        auction,
        "ConfigNotSet"
      );
    });

    describe("When config is set", () => {
      beforeEach(async () => {
        await auction
          .connect(admin)
          .setConfig(startAmount, endAmount, limit, refundDelayTime, startTime, endTime);

        const deadline = Math.floor(Date.now() / 1000) + 300;
        const qty = 3;
        await makeBid(alice, deadline, qty, startAmount.mul(qty));
      });

      it("should fail to claim nfts when paused", async () => {
        await auction.connect(admin).pause();
        await expect(auction.connect(alice).claimTokens(2, alice.address)).to.be.revertedWith(
          "Pausable: paused"
        );
      });

      it("should fail to claim nfts when there are nothing to claim", async () => {
        await expect(auction.connect(alice).claimTokens(2, alice.address)).to.be.revertedWithCustomError(
          auction,
          "NothingToClaim"
        );
      });

      it("should claim nfts - less than claimable", async () => {
        await increaseTime(2 * 3600);

        const tx = await auction.connect(alice).claimTokens(2, alice.address);
        await expect(tx).to.emit(auction, "Claim").withArgs(alice.address, 2);
      });

      it("should claim nfts - more than claimable", async () => {
        await increaseTime(3600);

        const tx = await auction.connect(alice).claimTokens(5, alice.address);
        await expect(tx).to.emit(auction, "Claim").withArgs(alice.address, 1);
      });

      it("should claim nfts and claim again later", async () => {
        await increaseTime(3600);
        await auction.connect(alice).claimTokens(5, alice.address);
        await increaseTime(3600);
        await auction.connect(alice).claimTokens(2, alice.address);
      });
    });
  });

  describe.skip("Claim Refund", () => {
    it("should fail to claim refund when config is not set", async () => {
      await expect(
        auction.connect(alice).claimRefund(alice.address, merkleTree.getHexProof(alice.address))
      ).to.be.revertedWithCustomError(auction, "ConfigNotSet");
    });

    describe("When config is set", () => {
      beforeEach(async () => {
        await auction
          .connect(admin)
          .setConfig(startAmount, endAmount, limit, refundDelayTime, startTime, endTime);

        const deadline1 = Math.floor(Date.now() / 1000) + 300;
        const qty1 = 5;
        await makeBid(alice, deadline1, qty1, startAmount.mul(qty1));

        await increaseTime(3600);

        const deadline2 = deadline1 + 3600;
        const qty2 = 3;
        await makeBid(bob, deadline2, qty2, startAmount.mul(qty2));
      });

      it("should fail to claim refund when paused", async () => {
        await auction.connect(admin).pause();
        await expect(
          auction.connect(alice).claimRefund(alice.address, merkleTree.getHexProof(admin.address))
        ).to.be.revertedWith("Pausable: paused");
      });

      it("should fail to claim refund before the auction is ended", async () => {
        await expect(
          auction.connect(alice).claimRefund(alice.address, merkleTree.getHexProof(alice.address))
        ).to.be.revertedWithCustomError(auction, "ClaimRefundNotReady");
      });

      it("should claim refund after the auction is ended and refundDelayTime passed", async () => {
        await increaseTime(3600 * 2 + 30 * 60);

        const beforeAliceBalance = await ethers.provider.getBalance(alice.address);
        const beforeBobBalance = await ethers.provider.getBalance(bob.address);
        const tx1 = await auction
          .connect(alice)
          .claimRefund(alice.address, merkleTree.getHexProof(alice.address));
        await auction.connect(bob).claimRefund(bob.address, merkleTree.getHexProof(bob.address));
        await expect(tx1).to.emit(auction, "ClaimRefund");
        const afterAliceBalance = await ethers.provider.getBalance(alice.address);
        const afterBobBalance = await ethers.provider.getBalance(bob.address);
        expect(afterAliceBalance).to.be.closeTo(
          beforeAliceBalance.add(startAmount.sub(endAmount).div(3).mul(5)),
          ethers.utils.parseEther("0.1")
        );
        expect(afterBobBalance).to.be.closeTo(beforeBobBalance, ethers.utils.parseEther("0.1"));
      });

      it("should fail to claim refund twice", async () => {
        await increaseTime(3600 * 2 + 30 * 60);

        await auction.connect(alice).claimRefund(alice.address, merkleTree.getHexProof(alice.address));
        await auction.connect(bob).claimRefund(bob.address, merkleTree.getHexProof(bob.address));

        await expect(
          auction.connect(alice).claimRefund(alice.address, merkleTree.getHexProof(alice.address))
        ).to.be.revertedWithCustomError(auction, "UserAlreadyClaimed");
        await expect(
          auction.connect(bob).claimRefund(bob.address, merkleTree.getHexProof(bob.address))
        ).to.be.revertedWithCustomError(auction, "UserAlreadyClaimed");
      });
    });
  });

  describe("Admin Refund Users", () => {
    it("should fail to claim refund when config is not set", async () => {
      await expect(
        auction
          .connect(admin)
          .refundUsers(
            [alice.address, bob.address],
            [merkleTree.getHexProof(alice.address), merkleTree.getHexProof(bob.address)]
          )
      ).to.be.revertedWithCustomError(auction, "ConfigNotSet");
    });

    describe("When config is set", () => {
      beforeEach(async () => {
        await auction
          .connect(admin)
          .setConfig(startAmount, endAmount, limit, refundDelayTime, startTime, endTime);

        const deadline1 = Math.floor(Date.now() / 1000) + 300;
        const qty1 = 5;
        await makeBid(alice, deadline1, qty1, startAmount.mul(qty1));

        await increaseTime(3600);

        const deadline2 = deadline1 + 3600;
        const qty2 = 3;
        await makeBid(bob, deadline2, qty2, startAmount.mul(qty2));
      });

      it("should fail to refund users as non-admin", async () => {
        await expect(
          auction.connect(alice).refundUsers([bob.address], [merkleTree.getHexProof(bob.address)])
        ).to.be.revertedWith(
          `AccessControl: account ${alice.address.toLowerCase()} is missing role ${defaultAdminRole}`
        );
      });

      it("should fail to refund users when paused", async () => {
        await auction.connect(admin).pause();
        await expect(
          auction
            .connect(admin)
            .refundUsers(
              [alice.address, bob.address],
              [merkleTree.getHexProof(alice.address), merkleTree.getHexProof(bob.address)]
            )
        ).to.be.revertedWith("Pausable: paused");
      });

      it.skip("should fail to refund users before the auction is ended", async () => {
        await expect(
          auction
            .connect(admin)
            .refundUsers(
              [alice.address, bob.address],
              [merkleTree.getHexProof(alice.address), merkleTree.getHexProof(bob.address)]
            )
        ).to.be.revertedWithCustomError(auction, "ClaimRefundNotReady");
      });

      it("should refund users after the auction is ended and refundDelayTime passed", async () => {
        await increaseTime(3600 * 2 + 30 * 60);

        const beforeAliceBalance = await ethers.provider.getBalance(alice.address);
        const beforeBobBalance = await ethers.provider.getBalance(bob.address);
        const tx = await auction
          .connect(admin)
          .refundUsers(
            [alice.address, bob.address],
            [merkleTree.getHexProof(alice.address), merkleTree.getHexProof(bob.address)]
          );
        await expect(tx).to.emit(auction, "ClaimRefund");
        const afterAliceBalance = await ethers.provider.getBalance(alice.address);
        const afterBobBalance = await ethers.provider.getBalance(bob.address);
        expect(afterAliceBalance).to.be.closeTo(
          beforeAliceBalance.add(startAmount.sub(endAmount).div(3).mul(5)),
          ethers.utils.parseEther("0.1")
        );
        expect(afterBobBalance).to.be.closeTo(beforeBobBalance, ethers.utils.parseEther("0.1"));
      });

      it("should fail to refund users twice", async () => {
        await increaseTime(3600 * 2 + 30 * 60);

        await auction
          .connect(admin)
          .refundUsers(
            [alice.address, bob.address],
            [merkleTree.getHexProof(alice.address), merkleTree.getHexProof(bob.address)]
          );

        await expect(
          auction
            .connect(admin)
            .refundUsers(
              [alice.address, bob.address],
              [merkleTree.getHexProof(alice.address), merkleTree.getHexProof(bob.address)]
            )
        ).to.be.revertedWithCustomError(auction, "UserAlreadyClaimed");
      });
    });
  });

  describe("Withdraw Funds", () => {
    let contractBalanceBefore = BigNumber.from(0);
    beforeEach(async () => {
      contractBalanceBefore = await ethers.provider.getBalance(auction.address);
      await auction
        .connect(admin)
        .setConfig(startAmount, endAmount, limit, refundDelayTime, startTime, endTime);
      const deadline1 = Math.floor(Date.now() / 1000) + 300;
      const qty1 = 5;
      await makeBid(alice, deadline1, qty1, startAmount.mul(qty1));

      await increaseTime(3600);

      const deadline2 = deadline1 + 3600;
      const qty2 = 3;
      await makeBid(bob, deadline2, qty2, startAmount.mul(qty2));
    });

    it("should fail to withdraw funds when auction is not ended", async () => {
      await expect(auction.connect(admin).withdrawFunds()).to.be.revertedWithCustomError(auction, "NotEnded");
    });

    it("should fail to withdraw funds as non-admin", async () => {
      await increaseTime(2 * 3600);
      await expect(auction.connect(alice).withdrawFunds()).to.be.revertedWith(
        `AccessControl: account ${alice.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
    });

    it("should withdraw funds", async () => {
      await increaseTime(2 * 3600);
      const beforeBalance = await ethers.provider.getBalance(treasury.address);
      const auctionBalance = await ethers.provider.getBalance(auction.address);
      await auction.connect(admin).withdrawFunds();
      const afterBalance = await ethers.provider.getBalance(treasury.address);
      expect(afterBalance).to.be.closeTo(beforeBalance.add(auctionBalance), ethers.utils.parseEther("0.01"));
    });

    it("should have 0 eth after withdraw funds and refund users", async () => {
      await increaseTime(3600 * 2 + 30 * 60);
      const tx = await auction
        .connect(admin)
        .refundUsers(
          [alice.address, bob.address],
          [merkleTree.getHexProof(alice.address), merkleTree.getHexProof(bob.address)]
        );
      await expect(tx).to.emit(auction, "ClaimRefund");

      await auction.connect(admin).withdrawFunds();
      const afterBalance = await ethers.provider.getBalance(auction.address);
      expect(afterBalance).to.be.eq(contractBalanceBefore);
    });
  });
});
