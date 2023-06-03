import { ethers } from "hardhat";

const nftContractAddress = "0xbb5af1b6b0efa143ff526af32b8bfbe1eb53b33a";
const rendererAddress = "0x4d3E1A7B7059526674C97bf6836bEa3508638B07";
async function main() {
  const renderer = await ethers.getContractAt("GoldRenderer", rendererAddress);
  await renderer.setGoldContract(nftContractAddress);
}

main().then(console.log);
