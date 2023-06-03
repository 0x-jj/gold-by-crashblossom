import { expect } from "chai";
import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Gold, GoldDutchAuction, WETH } from "../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { deployOrGetContracts } from "../scripts/utils";

const toWei = ethers.utils.parseEther;

const START_PRICE = toWei("1.4");
const RESERVED_MINTS = 3;
const MAX_SUPPLY = 10;

const DEV_SPLIT = 140; // 14%
const ARTIST_SPLIT = 650; // 65 %
const DAO_SPLIT = 210; // 21 %

const START_TIMESTAMP = 1775526271;

async function deployContracts() {
  const { scriptyStorageContract, scriptyBuilderContract, wethContract } =
    await deployOrGetContracts(network.name);

  const [dev, artist, dao] = await ethers.getSigners();

  await wethContract.mint(dev.address, toWei("1000"));

  const renderer = await ethers.getContractFactory("GoldRenderer");
  const rendererContract = await renderer.deploy(
    [dev.address, artist.address, dao.address],
    scriptyBuilderContract.address,
    scriptyStorageContract.address,
    210000,
    "https://arweave.net/gold/"
  );
  await rendererContract.deployed();
  console.log("Renderer Contract is deployed", rendererContract.address);

  const nftContract = await (
    await ethers.getContractFactory("Gold")
  ).deploy(
    [dev.address, artist.address, dao.address],
    [DEV_SPLIT, ARTIST_SPLIT, DAO_SPLIT],
    [dev.address, artist.address, dao.address],
    wethContract.address,
    rendererContract.address
  );
  await nftContract.deployed();
  console.log("NFT Contract is deployed", nftContract.address);

  rendererContract.setGoldContract(nftContract.address);

  const auctionSale = await ethers.getContractFactory("GoldDutchAuction");

  const auctionContract = await auctionSale.deploy(
    [dev.address, artist.address, dao.address],
    [DEV_SPLIT, ARTIST_SPLIT, DAO_SPLIT],
    nftContract.address
  );
  await nftContract.setSaleAddress(auctionContract.address);

  return { nftContract, rendererContract, auctionContract, wethContract };
}

describe("GOLD sale", async function () {
  let contract: Gold;
  let auctionContract: GoldDutchAuction;
  let deployer: SignerWithAddress;

  beforeEach(async () => {
    await network.provider.send("hardhat_reset");
    const contracts = await deployContracts();
    contract = contracts.nftContract;
    auctionContract = contracts.auctionContract;
    const signers = await ethers.getSigners();
    deployer = signers[0];
  });

  it("Can be deployed", async function () {
    expect(contract).to.be.ok;
  });

  it("Auction::Cannot mint when sale is closed", async function () {
    await contract.setSaleAddress(auctionContract.address);
    await expect(auctionContract.buy()).to.be.revertedWith(
      "LinearDutchAuction: Not started"
    );
  });

  it("Auction::Can start sale and mint", async function () {
    await contract.setSaleAddress(auctionContract.address);
    await auctionContract.setAuctionStartPoint(START_TIMESTAMP);
    await time.increaseTo(START_TIMESTAMP);
    await auctionContract.buy({ value: toWei("4") });
  });

  it("Auction::Cannot mint for lower than the right price", async function () {
    await contract.setSaleAddress(auctionContract.address);
    await auctionContract.setAuctionStartPoint(START_TIMESTAMP);
    await time.increaseTo(START_TIMESTAMP);
    await expect(auctionContract.buy()).to.be.revertedWith(
      "Seller: Costs 4000000000 GWei"
    );
    await time.increaseTo(START_TIMESTAMP + 300);
    await expect(auctionContract.buy()).to.be.revertedWith(
      "Seller: Costs 3800000000 GWei"
    );
  });

  it("Auction::Has the right cost over the course of the sale", async function () {
    await contract.setSaleAddress(auctionContract.address);
    let start = START_TIMESTAMP;
    await auctionContract.setAuctionStartPoint(start);
    await time.increaseTo(start);

    await expect(auctionContract.buy()).to.be.revertedWith(
      "Seller: Costs 4000000000 GWei"
    );

    start += 300;
    await time.increaseTo(start);
    await expect(auctionContract.buy()).to.be.revertedWith(
      "Seller: Costs 3800000000 GWei"
    );

    // TODO: loop and automatically test all the prices
  });

  it("Auction::Never goes below the lowest price", async function () {
    await contract.setSaleAddress(auctionContract.address);
    await auctionContract.setAuctionStartPoint(START_TIMESTAMP);
    await time.increaseTo(START_TIMESTAMP + 300 * 1000);
    await expect(auctionContract.buy()).to.be.revertedWith(
      "Seller: Costs 400000000 GWei"
    );
  });

  it("Auction::Can successfully purchase for lower price", async function () {
    await contract.setSaleAddress(auctionContract.address);
    await auctionContract.setAuctionStartPoint(START_TIMESTAMP);
    await time.increaseTo(START_TIMESTAMP + 300);
    await auctionContract.buy({ value: toWei("3.8") });
    await expect(await contract.ownerOf(0)).to.equal(deployer.address);
  });

  it.skip("Auction::Can successfully purchase and rebate", async function () {
    await contract.setSaleAddress(auctionContract.address);
    await auctionContract.setAuctionStartPoint(START_TIMESTAMP);
    await time.increaseTo(START_TIMESTAMP + 300);
    await auctionContract.buy({ value: toWei("3.8") });

    // Get down to base price
    await time.increaseTo(START_TIMESTAMP + 300 * 1000);
    await auctionContract.buy({ value: toWei("0.4") });

    const refunded = await auctionContract.callStatic.processRebateTo(
      deployer.address
    );
    await expect(refunded.toString()).to.equal(toWei("3.4"));

    // This should currently fail because the contract isnt holding balance
    await auctionContract.processRebateTo(deployer.address);
  });
});

describe("GOLD data", async function () {
  let contract: Gold;
  let deployer: SignerWithAddress;
  let wethContract: WETH;

  beforeEach(async () => {
    await network.provider.send("hardhat_reset");
    const contracts = await deployContracts();
    contract = contracts.nftContract;
    wethContract = contracts.wethContract;
    const signers = await ethers.getSigners();
    deployer = signers[0];

    await contract.setSaleAddress(contracts.auctionContract.address);
    await contracts.auctionContract.setAuctionStartPoint(START_TIMESTAMP);

    await time.increaseTo(START_TIMESTAMP);
    await contracts.auctionContract.buy({ value: toWei("4") });
  });

  it("Correctly tracks token metrics", async function () {
    const [addy1, addy2] = await ethers.getSigners();
    await contract.transferFrom(addy1.address, addy2.address, 0);
    await contract.connect(addy2).transferFrom(addy2.address, addy1.address, 0);
    const tokenData = await contract.tokenData(0);

    expect(tokenData.transferCount.toNumber() === 2);
  });

  it("Correctly tracks eth received", async function () {
    await deployer.sendTransaction({
      to: contract.address,
      value: toWei("1"),
    });
    const ethReceipts = (await contract.getContractMetrics())[5];
    expect(ethReceipts[0].amount.toString()).to.equal(toWei("1").toString());
  });

  it("Correctly tracks wrapped eth received", async function () {
    const [addy1, addy2] = await ethers.getSigners();

    // Send in 1 WETH, then make an NFT transfer so we can record the WETH
    await wethContract.transfer(contract.address, toWei("1"));
    await contract.transferFrom(addy1.address, addy2.address, 0);
    await contract.connect(addy2).transferFrom(addy2.address, addy1.address, 0);

    // Check we received it and marked it correctly
    const wethReceipts = (await contract.getContractMetrics())[6];
    expect(wethReceipts[0].amount.toString()).to.equal(toWei("1").toString());

    // Send in 2 WETH, then make an NFT transfer so we can record the WETH
    await wethContract.transfer(contract.address, toWei("2"));
    await contract.transferFrom(addy1.address, addy2.address, 0);
    const wethReceipts2 = (await contract.getContractMetrics())[6];

    // Check we received it and marked it correctly, and the original receipt is still there
    expect(wethReceipts2[0].amount.toString()).to.equal(toWei("1").toString());
    expect(wethReceipts2[1].amount.toString()).to.equal(toWei("2").toString());

    // Withdraw some WETH so the balance is lowered
    await contract["release(address,address)"](
      wethContract.address,
      deployer.address
    );

    // Ensure the weth balance is actually lowered. We sent in 3, balance should be lower than 3
    const wethBal = await wethContract.balanceOf(contract.address);
    expect(wethBal.toString()).to.not.equal(toWei("3").toString());

    // Send in more WETH check that the receipt value is still correct despite having withdrawn
    await wethContract.transfer(contract.address, toWei("5"));
    await contract.connect(addy2).transferFrom(addy2.address, addy1.address, 0);
    const wethReceipts3 = (await contract.getContractMetrics())[6];
    expect(wethReceipts3[0].amount.toString()).to.equal(toWei("1").toString());
    expect(wethReceipts3[1].amount.toString()).to.equal(toWei("2").toString());
    expect(wethReceipts3[2].amount.toString()).to.equal(toWei("5").toString());
  });

  it("Correctly tracks transfers, approvals and holder count", async function () {
    const [addy1, addy2] = await ethers.getSigners();

    await contract.transferFrom(addy1.address, addy2.address, 0);
    await contract.connect(addy2).transferFrom(addy2.address, addy1.address, 0);
    await contract.connect(addy1).setApprovalForAll(addy2.address, true);

    const metrics = await contract.getContractMetrics();

    // Approval info - single approval
    expect(metrics[0].toNumber()).to.equal(1);
    expect(metrics[1][0]).to.not.equal(0);

    // Transfer info - 2 transfers plus 1 mint
    expect(metrics[2].toNumber()).to.equal(3);
    expect(metrics[3][0]).to.not.equal(0);

    // Holder count - 1 holder
    expect(metrics[4].toString()).to.equal("1");
  });
});
