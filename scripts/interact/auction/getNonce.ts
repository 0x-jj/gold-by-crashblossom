import { ethers } from "hardhat";

const contractAddress = "0x7c9a6400878E1F12aAfa76d4A9e05190909E378C";
const addy = "0x20Ec68Ba5dC8aF5380BDb37465b3F9BDE75f9635";
async function main() {
  const auction = await ethers.getContractAt("DutchAuction", contractAddress);
  const nonce = await auction.getNonce(addy);
  return nonce;
}

main().then(console.log);
