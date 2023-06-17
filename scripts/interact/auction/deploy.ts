import { ethers, network } from "hardhat";
import { getMerkleRootWithDiscounts } from "../../../test/utils";
import * as utilities from "../../utils";
import { discounts } from "../../../offchain/discounts";

const nftContractAddress = "0x23bE477e1558bc46374410239277e245dDadBE21";
const SIGNER = "0x589b6C421C55260fC5E4117Bd893f57eD7bd44cD";

async function main() {
  const [dev, artist, dao] = await ethers.getSigners();
  const merkleTree = getMerkleRootWithDiscounts(discounts);

  const Auction = await ethers.getContractFactory("DutchAuction");
  const auction = await Auction.deploy(
    nftContractAddress,
    dev.address,
    dao.address,
    merkleTree.root,
    network.name === "hardhat"
      ? "0x00000000000076a84fef008cdabe6409d2fe638b"
      : utilities.addressFor(network.name, "DelegateCash")
  );
  console.log("Auction Contract is deployed", auction.address);
  const startAmount = ethers.utils.parseEther("3");
  const endAmount = ethers.utils.parseEther("0.01");
  const limit = ethers.utils.parseEther("10");
  const refundDelayTime = 2 * 60;
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
