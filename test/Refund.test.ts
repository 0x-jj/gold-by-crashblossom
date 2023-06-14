import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { signBid } from "./helpers/sign";
import { takeSnapshot, revertToSnapshot } from "./helpers/snapshot";
import { increaseTime } from "./helpers/time";
import { DutchAuction, Gold } from "../typechain-types";
import { BigNumber } from "ethers";
import { deployContracts, getMerkleRootWithDiscounts } from "./utils";
import MerkleTree from "merkletreejs";

const toWei = ethers.utils.parseEther;

const START_PRICE = toWei("1.4");
const RESERVED_MINTS = 3;
const MAX_SUPPLY = 10;

const DEV_SPLIT = 140; // 14%
const ARTIST_SPLIT = 650; // 65 %
const DAO_SPLIT = 210; // 21 %

describe.only("DutchAuction", function () {
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
      500,
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
    refundDelayTime = 0;
    startTime = Math.floor(Date.now() / 1000) - 100;
    endTime = startTime + 3 * 3600;
  });

  beforeEach(async () => {
    snapshotId = await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot(snapshotId);
  });

  it("should bid 500 and refund 500 users", async () => {
    await auction
      .connect(admin)
      .setConfig(startAmount, endAmount, limit, refundDelayTime, startTime, endTime);

    const deadline1 = Math.floor(Date.now() / 1000) + 300;
    const qty1 = 1;
    const signers = await ethers.getSigners();

    const inputs = signers.slice(0, 500).map((signer) => ({ address: signer.address, discountBps: 2000 }));
    const { tree, root, getLeaf } = getMerkleRootWithDiscounts(inputs);
    await auction.connect(admin).setDiscountMerkleRoot(root);

    for (let i = 0; i < 500; i++) {
      await makeBid(signers[i], deadline1 + i * 60, qty1, startAmount.mul(qty1));
      if (i % 100 === 0) {
        console.log("bid", i);
      }
    }

    await increaseTime(3600 * 5 + 30 * 60);

    const addresses = inputs.map((input) => input.address);
    const proofs = inputs.map((input) => tree.getHexProof(getLeaf(input.address, input.discountBps)));
    await auction.connect(admin).refundUsers(addresses, proofs, { gasLimit: 30_000_000 });
  });
});
