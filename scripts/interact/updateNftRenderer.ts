import { ethers } from "hardhat";

const nftContractAddress = "0x23be477e1558bc46374410239277e245ddadbe21";
const newRenderer = "0x688D87454DC4e19Cd767939DB700Eb5Ed1Da2B1d";

async function main() {
  const nftContract = await ethers.getContractAt("Gold", nftContractAddress);
  await nftContract.setRendererAddress(newRenderer);
}

main().then(console.log);
