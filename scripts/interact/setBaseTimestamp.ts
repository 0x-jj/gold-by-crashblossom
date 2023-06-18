import { ethers } from "hardhat";

const nftContractAddress = "0x23be477e1558bc46374410239277e245ddadbe21";

const newTimestamp = 1687032863;
async function main() {
  const Nft = await ethers.getContractAt("Gold", nftContractAddress);
  await Nft.setBaseTimestamp(newTimestamp);
  console.log("Base timestamp set to", newTimestamp);
}

main();
