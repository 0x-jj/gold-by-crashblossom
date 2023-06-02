import { ethers } from "hardhat";

const nftContractAddress = "0x087027C87C116C68EF0158d2487A335705FF4a72";
const rendererAddress = "0x4123B9f4521e49E919D9aad0610344B8c0afac91";
async function main() {
  const renderer = await ethers.getContractAt("GoldRenderer", rendererAddress);
  await renderer.setGoldContract(nftContractAddress);
}

main().then(console.log);
