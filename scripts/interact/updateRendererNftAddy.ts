import { ethers } from "hardhat";

const nftContractAddress = "0x93915aB036eF65C990fe54080380404ef050E1b1";
const rendererAddress = "0xfa7D118266BE91DFCd336Efe2C55981083a3D14d";
async function main() {
  const renderer = await ethers.getContractAt("GoldRenderer", rendererAddress);
  await renderer.setGoldContract(nftContractAddress);
}

main().then(console.log);
