import { expect } from "chai";
import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Gold, WETH } from "../typechain-types";
import { deployContracts } from "./utils";

const toWei = ethers.utils.parseEther;

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
    await contract.mint(deployer.address);
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
    await contract["release(address,address)"](wethContract.address, deployer.address);

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

    // Transfer info - 2 transfers
    expect(metrics[2].toNumber()).to.equal(2);
    expect(metrics[3][0]).to.not.equal(0);

    // Holder count - 1 holder
    expect(metrics[4].toString()).to.equal("1");
  });
});
