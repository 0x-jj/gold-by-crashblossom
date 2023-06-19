import { ethers } from "hardhat";

const nftContractAddress = "0xCcBE56eA12B845A281431290F202196864F2f576";
const rendererAddress = "0xDc49B9D7De7b1B4d6d153d9857b3942Dc4BADDfA";
async function main() {
  const renderer = await ethers.getContractAt("GoldRenderer", rendererAddress);
  await renderer.setGoldContract(nftContractAddress);
}

main().then(console.log);
