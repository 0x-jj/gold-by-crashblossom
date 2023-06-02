import { ethers, run } from "hardhat";
import * as utilities from "../utils";
import path from "path";

const contractAddress = "0x087027C87C116C68EF0158d2487A335705FF4a72";
const rendererAddress = "0x039B0de1A7341F85627F42adEECAb41936Cf9429";
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
