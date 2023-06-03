import { ethers, run } from "hardhat";
import * as utilities from "../utils";
import path from "path";

const contractAddress = "0x549F085763C9f18d4CD327882D845c016F7D4357";
const rendererAddress = "0x0c4Ac984842cf24a71fb8DF162E28C38f74D91eC";
const wethAddress = "0xBD61e4D2FD100126faFA030eC77E713A1004375D";
const DEV_SPLIT = 140; // 14%
const ARTIST_SPLIT = 650; // 65 %
const DAO_SPLIT = 210; // 21 %

async function main() {
  const contract = await ethers.getContractAt("Gold", contractAddress);
  const [dev, artist, dao] = await ethers.getSigners();

  await run("verify:verify", {
    address: contract.address,
    constructorArguments: [
      [dev.address, artist.address, dao.address],
      [DEV_SPLIT, ARTIST_SPLIT, DAO_SPLIT],
      [dev.address, artist.address, dao.address],
      wethAddress,
      rendererAddress,
    ],
  });
}

main().then(console.log);
