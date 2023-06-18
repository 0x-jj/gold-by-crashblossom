import { ethers } from "hardhat";

const nftContractAddress = "0x7D96270c72BAD83E1c9F35cdbfcf67E9c38dA309";

const newTimestamp = 1687032863;
async function main() {
  const Nft = await ethers.getContractAt("Gold", nftContractAddress);
  await Nft.setBaseTimestamp(newTimestamp);
  console.log("Base timestamp set to", newTimestamp);
}

main();
