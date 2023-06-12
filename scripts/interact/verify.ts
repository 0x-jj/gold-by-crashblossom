import { ethers, run, network } from "hardhat";
import * as utilities from "../utils";
import path from "path";

const contractAddress = "0x6A7bFAAe99d1F5E39fc8fc6b0dA731513F634BD1";
const rendererAddress = "0x31136443E66ecd52d7f0a48c8b89522Fea128FD5";
const wethAddress = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
const DEV_SPLIT = 140; // 14%
const ARTIST_SPLIT = 650; // 65 %
const DAO_SPLIT = 210; // 21 %
const SUPPLY = 500;

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
      SUPPLY,
      utilities.addressFor(network.name, "DelegateCash"),
    ],
  });
}

main().then(console.log);
