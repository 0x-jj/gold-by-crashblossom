import { ethers } from "hardhat";
import * as utilities from "../utils";
import path from "path";

const nftContractAddress = "0x549F085763C9f18d4CD327882D845c016F7D4357";

async function main(storeData?: boolean) {
  const nft = await ethers.getContractAt("Gold", nftContractAddress);
  const tokenUri = await nft.tokenURI(0);

  if (storeData) {
    store(tokenUri);
  }
  return tokenUri.split(0, 10);
}

function store(tokenURI: string) {
  const tokenURIDecoded = utilities.parseBase64DataURI(tokenURI);
  console.log("Decoded token URI");
  const tokenURIJSONDecoded = JSON.parse(tokenURIDecoded);
  console.log("Parsed decoded token URI");
  const animationURL = utilities.parseBase64DataURI(
    tokenURIJSONDecoded.animation_url
  );
  console.log("Parsed animation url");

  utilities.writeFile(path.join(__dirname, "output", "tokenURI.txt"), tokenURI);
  utilities.writeFile(
    path.join(__dirname, "output", "output.html"),
    animationURL
  );
  utilities.writeFile(
    path.join(__dirname, "output", "metadata.json"),
    tokenURIDecoded
  );
}

main(true).then(console.log);
