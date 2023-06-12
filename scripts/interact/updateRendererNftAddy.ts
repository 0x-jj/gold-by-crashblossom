import { ethers } from "hardhat";

const nftContractAddress = "0x6A7bFAAe99d1F5E39fc8fc6b0dA731513F634BD1";
const rendererAddress = "0x31136443E66ecd52d7f0a48c8b89522Fea128FD5";
async function main() {
  const renderer = await ethers.getContractAt("GoldRenderer", rendererAddress);
  await renderer.setGoldContract(nftContractAddress);
}

main().then(console.log);
