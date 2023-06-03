import { ethers } from "hardhat";

const nftContractAddress = "0x042B683eb6f13E7A76a30Bf31d2C13A1F5b94628";
const rendererAddress = "0x19BE6c85BA2c4Ec301757cf8979584CAa8b99196";
async function main() {
  const renderer = await ethers.getContractAt("GoldRenderer", rendererAddress);
  await renderer.setGoldContract(nftContractAddress);
}

main().then(console.log);
