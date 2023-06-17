import { ethers, run, network } from "hardhat";
import * as utilities from "../utils";
import path from "path";

const contractAddress = "0x23bE477e1558bc46374410239277e245dDadBE21";
const rendererAddress = "0xcDc5e4e3b0A118de6253546D36609eF1221432e3";
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
