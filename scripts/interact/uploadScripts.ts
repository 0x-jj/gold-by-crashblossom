import { ethers } from "hardhat";
import path from "path";
import * as utilities from "../utils";
import { ScriptyStorage } from "../../typechain-types";
import { BigNumber } from "ethers";

const scriptyStorage = "0xEA5cD8A8D4eFdA42266E7B9139F8d80915A56daf";

const waitIfNeeded = async (tx: any) => {
  if (tx.wait) {
    // wait for one confirmation
    await tx.wait(1);
  }
};

async function storeScript(
  storageContract: ScriptyStorage,
  name: string,
  filePath: string,
  compress = false
) {
  // Check if script is already stored
  const storedScript = await storageContract.scripts(name);
  if (storedScript.size.gt(BigNumber.from(0))) {
    console.log(`${name} is already stored`);
    return;
  }

  // Grab file and break into chunks that SSTORE2 can handle
  let script = utilities.readFile(path.join(__dirname, filePath));

  if (compress) {
    script = utilities.toGZIPBase64String(script);
  }

  const scriptChunks = utilities.chunkSubstr(script, 24575);

  if (storedScript.owner === ethers.constants.AddressZero) {
    // First create the script in the storage contract
    await waitIfNeeded(await storageContract.createScript(name, utilities.stringToBytes(name)));
  }

  // Store each chunk
  for (let i = 0; i < scriptChunks.length; i++) {
    console.log("chunk head:", scriptChunks[i].slice(0, 10));
    await waitIfNeeded(
      await storageContract.addChunkToScript(name, utilities.stringToBytes(scriptChunks[i]))
    );
    console.log(`${name} chunk #`, i + 1, "/", scriptChunks.length, "chunk length: ", scriptChunks[i].length);
  }
  console.log(`${name} is stored`);
}

async function main() {
  const scriptyStorageContract = await ethers.getContractAt("ScriptyStorage", scriptyStorage);

  await storeScript(scriptyStorageContract, "crashblossom_gold_base", "../scripts/goldBase.js");

  await storeScript(scriptyStorageContract, "crashblossom_gold_paths", "../scripts/paths.js", true);

  await storeScript(scriptyStorageContract, "crashblossom_gold_main", "../scripts/main.js");
}

main();
