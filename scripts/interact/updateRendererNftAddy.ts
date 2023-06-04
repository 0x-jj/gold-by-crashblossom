import { ethers } from "hardhat";

const nftContractAddress = "0x549F085763C9f18d4CD327882D845c016F7D4357";
const rendererAddress = "0x94f97608D15cD14b517525858B8B32Bb618A495F";
async function main() {
  const renderer = await ethers.getContractAt("GoldRenderer", rendererAddress);
  await renderer.setGoldContract(nftContractAddress);
}

main().then(console.log);
