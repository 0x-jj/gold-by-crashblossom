import { ethers } from "hardhat";
import * as utilities from "../utils";
import path from "path";

const contractAddress = "0x087027C87C116C68EF0158d2487A335705FF4a72";

async function main(storeData?: boolean) {
  const renderer = await ethers.getContractAt("Gold", contractAddress);
  const tokenUri = await renderer.tokenURI(1);

  if (storeData) {
    store(tokenUri);
  }
  return tokenUri;
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
