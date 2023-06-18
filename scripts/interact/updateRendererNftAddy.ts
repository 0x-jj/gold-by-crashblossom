import { ethers } from "hardhat";

const nftContractAddress = "0x23be477e1558bc46374410239277e245ddadbe21";
const rendererAddress = "0x688D87454DC4e19Cd767939DB700Eb5Ed1Da2B1d";
async function main() {
  const renderer = await ethers.getContractAt("GoldRenderer", rendererAddress);
  await renderer.setGoldContract(nftContractAddress);
}

main().then(console.log);
