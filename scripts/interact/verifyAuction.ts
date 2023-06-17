import { ethers, run, network } from "hardhat";
import * as utilities from "../utils";
import path from "path";
import { getMerkleRootWithDiscounts } from "../../test/utils";

const contractAddress = "0x282f7fFF971AAf234293f8C7657363842C6b20df";
const nftAddress = "0x23bE477e1558bc46374410239277e245dDadBE21";

async function main() {
  const [dev, artist, dao] = await ethers.getSigners();
  const merkleTree = getMerkleRootWithDiscounts([{ address: dev.address, discountBps: 2000 }]);

  const contract = await ethers.getContractAt("DutchAuction", contractAddress);

  await run("verify:verify", {
    address: contract.address,
    constructorArguments: [
      nftAddress,
      dev.address,
      dao.address,
      merkleTree.root,

      utilities.addressFor(network.name, "DelegateCash"),
    ],
  });
}

main().then(console.log);
