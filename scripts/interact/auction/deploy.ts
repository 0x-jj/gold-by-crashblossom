import { ethers, network } from "hardhat";
import { getMerkleRootWithDiscounts } from "../../../test/utils";
import * as utilities from "../../utils";

const nftContractAddress = "0xfB55558D5cb40835F6C53C1795D0646a81905D49";
const SIGNER = "0x589b6C421C55260fC5E4117Bd893f57eD7bd44cD";

async function main() {
  const [dev, artist, dao] = await ethers.getSigners();
  const merkleTree = getMerkleRootWithDiscounts([
    {
      address: "0x20Ec68Ba5dC8aF5380BDb37465b3F9BDE75f9635",
      discountBps: 1000,
    },
    {
      address: "0x8A3970A633FFc97E0E3d0400A9Ec0504D6CE1c2B",
      discountBps: 2250,
    },
    {
      address: "0xa9fAa46eC90906B61FF71c8181EFB1a52273a9E6",
      discountBps: 2500,
    },
  ]);

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
  const startAmount = ethers.utils.parseEther("6");
  const endAmount = ethers.utils.parseEther("0.2");
  const limit = ethers.utils.parseEther("1000");
  const refundDelayTime = 2 * 60;
  const startTime = Math.floor(Date.now() / 1000) - 100;
  const endTime = startTime + 1.5 * 3600;

  await auction.setConfig(startAmount, endAmount, limit, refundDelayTime, startTime, endTime);
  await auction.setSignerAddress(SIGNER);

  const nftContract = await ethers.getContractAt("Gold", nftContractAddress);

  await nftContract.setMinterAddress(auction.address);
  console.log("Config, minter, signer are set");
}

main().then(console.log);
