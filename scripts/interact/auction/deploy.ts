import { ethers, network } from "hardhat";
import { getMerkleRootWithDiscounts } from "../../../test/utils";
import * as utilities from "../../utils";
import { discounts } from "../../../offchain/discounts";

const nftContractAddress = "0xA2B0Eddf6021AE5dB359068eD1926cFc4Aa6f15e";
const SIGNER = "0x589b6C421C55260fC5E4117Bd893f57eD7bd44cD";

async function main() {
  const [dev, artist, dao, dev2] = await ethers.getSigners();
  const merkleTree = getMerkleRootWithDiscounts(discounts);

  const paymentSplitter = await ethers.getContractFactory("PaymentSplitter");
  const ps = await paymentSplitter.deploy(
    [dev.address, artist.address, dao.address, dev2.address],
    [100, 620, 250, 30]
  );
  console.log(`PaymentSplitter is deployed at ${ps.address}`);

  const Auction = await ethers.getContractFactory("DutchAuction");
  const auction = await Auction.deploy(
    nftContractAddress,
    dev.address,
    ps.address,
    merkleTree.root,
    network.name === "hardhat"
      ? "0x00000000000076a84fef008cdabe6409d2fe638b"
      : utilities.addressFor(network.name, "DelegateCash")
  );
  console.log("Auction Contract is deployed", auction.address);
  const startAmount = ethers.utils.parseEther("8");
  const endAmount = ethers.utils.parseEther("0.1");
  const limit = ethers.utils.parseEther("10");
  const refundDelayTime = 1;
  const startTime = Math.floor(Date.now() / 1000) - 100;
  // const endTime = startTime + 8 * 3600;
  const endTime = startTime + 10 * 60;
  await auction.setConfig(startAmount, endAmount, limit, refundDelayTime, startTime, endTime);
  await auction.setSignerAddress(SIGNER);

  const nftContract = await ethers.getContractAt("Gold", nftContractAddress);

  await nftContract.setMinterAddress(auction.address);
  console.log("Config, minter, signer are set");
}

main().then(console.log);
