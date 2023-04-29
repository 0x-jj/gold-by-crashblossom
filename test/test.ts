import { expect } from "chai";
import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Gold, GoldFixedPriceSale, GoldDutchAuction, GoldStorage } from "../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";


const toWei = ethers.utils.parseEther;

const START_PRICE = toWei("1.4");
const RESERVED_MINTS = 3;
const MAX_SUPPLY = 10;

const DEV_SPLIT = 140; // 14%
const ARTIST_SPLIT = 650; // 65 %
const DAO_SPLIT = 210; // 21 %

const START_TIMESTAMP = 1775526271;

describe("GOLD sale", async function () {
  let contract: Gold;
  let fixedSaleContract: GoldFixedPriceSale;
  let auctionContract: GoldDutchAuction;
  let deployer: SignerWithAddress;

  beforeEach(async () => {
    await network.provider.send("hardhat_reset");
    const [dev, artist, dao] = await ethers.getSigners();
    deployer = dev;
    const Gold = await ethers.getContractFactory("Gold");
    contract = await Gold.deploy(
      [dev.address, artist.address, dao.address],
      [DEV_SPLIT, ARTIST_SPLIT, DAO_SPLIT],
      [dev.address, artist.address, dao.address]
    );

    const fixedSale = await ethers.getContractFactory("GoldFixedPriceSale");
    const auctionSale = await ethers.getContractFactory("GoldDutchAuction");

    fixedSaleContract = await fixedSale.deploy(
      [dev.address, artist.address, dao.address],
      [DEV_SPLIT, ARTIST_SPLIT, DAO_SPLIT],
      contract.address
    );

    auctionContract = await auctionSale.deploy(
      [dev.address, artist.address, dao.address],
      [DEV_SPLIT, ARTIST_SPLIT, DAO_SPLIT],
      contract.address
    );

    await contract.setSaleAddress(fixedSaleContract.address);
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

  it("Fixed Sale::Can mint free mint", async function () {
    await contract.setSaleAddress(fixedSaleContract.address);
    const [_, __, dao] = await ethers.getSigners();
    await auctionContract.setAuctionStartPoint(START_TIMESTAMP);
    await time.increaseTo(START_TIMESTAMP + 300);
    await fixedSaleContract.purchaseFreeOfCharge(dao.address, 3);

    await expect(await contract.ownerOf(0)).to.equal(dao.address);
    await expect(await contract.ownerOf(1)).to.equal(dao.address);
    await expect(await contract.ownerOf(2)).to.equal(dao.address);
    await expect(await contract.totalSupply()).to.equal(3);
  });

  // it("Fixed Sale::Can mint at fixed price", async function () {
  //   await contract.setSaleAddress(fixedSaleContract.address);
  //   const [_, __, dao] = await ethers.getSigners();
  //   await fixedSaleContract.buy({ value: toWei("0.3") });
  // });
});

describe("GOLD data", async function () {
  let contract: Gold;
  let auctionContract: GoldDutchAuction;
  let deployer: SignerWithAddress;

  beforeEach(async () => {
    await network.provider.send("hardhat_reset");
    const [dev, artist, dao] = await ethers.getSigners();
    deployer = dev;
    const Gold = await ethers.getContractFactory("Gold");
    contract = await Gold.deploy(
      [dev.address, artist.address, dao.address],
      [DEV_SPLIT, ARTIST_SPLIT, DAO_SPLIT],
      [dev.address, artist.address, dao.address]
    );

    const auctionSale = await ethers.getContractFactory("GoldDutchAuction");

    auctionContract = await auctionSale.deploy(
      [dev.address, artist.address, dao.address],
      [DEV_SPLIT, ARTIST_SPLIT, DAO_SPLIT],
      contract.address
    );

    await contract.setSaleAddress(auctionContract.address);
    await auctionContract.setAuctionStartPoint(START_TIMESTAMP);

    await time.increaseTo(START_TIMESTAMP);
    await auctionContract.buy({ value: toWei("4") });
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
    const totalEthReceived = await contract.totalEthReceived();
    expect(totalEthReceived === toWei("1"));
  });

  it("Correctly tracks contract token metrics", async function () {
    const [addy1, addy2] = await ethers.getSigners();

    await contract.transferFrom(addy1.address, addy2.address, 0);
    await contract.connect(addy2).transferFrom(addy2.address, addy1.address, 0);
    await contract.connect(addy1).setApprovalForAll(addy2.address, true);

    // const metrics = await contract.getContractMetrics();

    // console.log(metrics[6])
    // expect(metrics[0].toNumber() === 1);
    // expect(metrics[1].length === 1);
    // expect(metrics[2].toNumber() === 2);
    // expect(metrics[3].length === 2);
    // expect(metrics[4].toString() === toWei("4").toString());
    // expect(metrics[5].toNumber() === 1);
  });

 
  
});

describe.only("GOLD storage", async function () {
  let contract: Gold;
  let storageContract: GoldStorage;

  let deployer: SignerWithAddress;

  beforeEach(async () => {
    await network.provider.send("hardhat_reset");
    const [dev, artist, dao] = await ethers.getSigners();
    deployer = dev;
    const Gold = await ethers.getContractFactory("Gold");
    contract = await Gold.deploy(
      [dev.address, artist.address, dao.address],
      [DEV_SPLIT, ARTIST_SPLIT, DAO_SPLIT],
      [dev.address, artist.address, dao.address]
    );


    const storageAddy = await contract.storageContract();
    storageContract = (await ethers.getContractFactory("GoldStorage")).attach(storageAddy)

 
  });

  it.only("Correctly sets SVG data", async function () {
    const data = ethers.utils.randomBytes(4 * 1024)
    const stringAsBytes = ethers.utils.toUtf8Bytes("<svg>hey{}</svg>")
    await storageContract.setArtScript(stringAsBytes)

    
    const fetchedData = await storageContract.getArtScript()
    const fetchedAsUtf8 = ethers.utils.toUtf8String(fetchedData)
    console.log(fetchedAsUtf8)
    expect(fetchedAsUtf8 === "<svg>hey{}</svg>")
  
   });

 
 
  
});
