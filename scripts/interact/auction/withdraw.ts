import { ethers } from "hardhat";

const contractAddress = "0x3aA7c9A56F90b73bF3583AD3F4c47BFC1BA2781B";

async function main() {
  const auction = await ethers.getContractAt("DutchAuction", contractAddress);
  await auction.withdrawFunds();
}

main().then(console.log);
