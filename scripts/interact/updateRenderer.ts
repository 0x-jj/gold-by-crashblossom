import { ethers } from "hardhat";

const nftContractAddress = "0xbb5af1b6b0efa143ff526af32b8bfbe1eb53b33a";

async function main() {
  const [dev, artist, dao] = await ethers.getSigners();

  const renderer = await ethers.getContractFactory("GoldRenderer");
  const rendererContract = await renderer.deploy(
    [dev.address, artist.address, dao.address],
    "0x610c05bC5739baf4837fF67d5fc5Ab6D9Ee7558D",
    "0xEA5cD8A8D4eFdA42266E7B9139F8d80915A56daf",
    250000,
    "https://arweave.net/gold/"
  );
  const newAddress = rendererContract.address;

  const nftContract = await ethers.getContractAt("Gold", nftContractAddress);
  await nftContract.setRendererAddress(newAddress);
  await rendererContract.setGoldContract(nftContractAddress);

  return newAddress;
}

main().then(console.log);
