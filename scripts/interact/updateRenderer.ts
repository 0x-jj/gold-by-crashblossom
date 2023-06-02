import { ethers } from "hardhat";


const nftContractAddress = "0x087027C87C116C68EF0158d2487A335705FF4a72";

async function main() {
  const [dev, artist, dao] = await ethers.getSigners();

  const renderer = await ethers.getContractFactory("GoldRenderer");
  const rendererContract = await renderer.deploy(
    [dev.address, artist.address, dao.address],
    "0x610c05bC5739baf4837fF67d5fc5Ab6D9Ee7558D",
    "0xEA5cD8A8D4eFdA42266E7B9139F8d80915A56daf",
    250000
  );
  const newAddress = rendererContract.address;

  const nftContract = await ethers.getContractAt("Gold", nftContractAddress);
  await nftContract.setRendererAddress(newAddress);

  return newAddress;
}

main().then(console.log);
