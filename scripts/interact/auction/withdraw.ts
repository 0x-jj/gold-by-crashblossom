import { ethers } from "hardhat";

const contractAddress = "0x1a8e7571983c60a93ec1a9366662970f95c80690";

async function main() {
  const auction = await ethers.getContractAt("DutchAuction", contractAddress);
  await auction.withdrawFunds();
}

main().then(console.log);
