import { ethers, network, run } from "hardhat";
import path from "path";
import * as utilities from "./utils";
import { ScriptyStorage } from "../typechain-types";
import { BigNumber } from "ethers";

const waitIfNeeded = async (tx: any) => {
  if (tx.wait) {
    // wait for one confirmation
    await tx.wait(1);
  }
};

const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const addresses = {
  ethereum: {
    ScriptyStorage: "0x096451F43800f207FC32B4FF86F286EdaF736eE3",
    ScriptyBuilder: "0x16b727a2Fc9322C724F4Bc562910c99a5edA5084",
    ETHFSFileStorage: "0xFc7453dA7bF4d0c739C1c53da57b3636dAb0e11e",
    WETH: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",

    ethfs_ContentStore: "0xC6806fd75745bB5F5B32ADa19963898155f9DB91",
    ethfs_FileStore: "0x9746fD0A77829E12F8A9DBe70D7a322412325B91",
  },
  goerli: {
    ScriptyStorage: "0xEA5cD8A8D4eFdA42266E7B9139F8d80915A56daf",
    ScriptyBuilder: "0x610c05bC5739baf4837fF67d5fc5Ab6D9Ee7558D",
    ETHFSFileStorage: "0x70a78d91A434C1073D47b2deBe31C184aA8CA9Fa",
    WETH: "0xBD61e4D2FD100126faFA030eC77E713A1004375D",

    ethfs_ContentStore: "0xED7C16aB4eB4D091F492713e5235Ac93852bc3a0",
    ethfs_FileStore: "0x5E348d0975A920E9611F8140f84458998A53af94",
  },
};

const addressFor = (networkName: string, name: string) => {
  // @ts-ignore
  return addresses[networkName][name];
};

export async function deployOrGetContracts(networkName: string) {
  if (networkName == "hardhat" || networkName == "localhost") {
    const contentStoreContract = await (
      await ethers.getContractFactory("ContentStore")
    ).deploy();
    await contentStoreContract.deployed();
    console.log("ContentStore deployed at", contentStoreContract.address);

    const scriptyStorageContract = await (
      await ethers.getContractFactory("ScriptyStorage")
    ).deploy(contentStoreContract.address);
    await scriptyStorageContract.deployed();
    console.log("ScriptyStorage deployed at", scriptyStorageContract.address);

    const scriptyBuilderContract = await (
      await ethers.getContractFactory("ScriptyBuilder")
    ).deploy();
    await scriptyBuilderContract.deployed();
    console.log("ScriptyBuilder deployed at", scriptyBuilderContract.address);

    const Weth = await ethers.getContractFactory("WETH");
    const wethContract = await Weth.deploy();
    await wethContract.deployed();
    console.log("WETH deployed at", wethContract.address);

    return { scriptyStorageContract, scriptyBuilderContract, wethContract };
  } else {
    const scriptyStorageAddress = addressFor(networkName, "ScriptyStorage");
    const scriptyStorageContract = await ethers.getContractAt(
      "ScriptyStorage",
      scriptyStorageAddress
    );
    console.log("ScriptyStorage is already deployed at", scriptyStorageAddress);

    const scriptyBuilderAddress = addressFor(networkName, "ScriptyBuilder");
    const scriptyBuilderContract = await ethers.getContractAt(
      "ScriptyBuilder",
      scriptyBuilderAddress
    );
    console.log("ScriptyBuilder is already deployed at", scriptyBuilderAddress);

    const wethAddress = addressFor(networkName, "WETH");
    const wethContract = await ethers.getContractAt("WETH", wethAddress);
    console.log("WethContract is already deployed at", wethAddress);

    return { scriptyStorageContract, scriptyBuilderContract, wethContract };
  }
}

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
    await waitIfNeeded(
      await storageContract.createScript(name, utilities.stringToBytes(name))
    );
  }

  // Store each chunk
  // [WARNING]: With big files this can be very costly
  for (let i = 0; i < scriptChunks.length; i++) {
    console.log("chunk head:", scriptChunks[i].slice(0, 10));
    await waitIfNeeded(
      await storageContract.addChunkToScript(
        name,
        utilities.stringToBytes(scriptChunks[i]),
        { gasLimit: 500000000 }
      )
    );
    console.log(
      `${name} chunk #`,
      i + 1,
      "/",
      scriptChunks.length,
      "chunk length: ",
      scriptChunks[i].length
    );
  }
  console.log(`${name} is stored`);
}

const DEV_SPLIT = 140; // 14%
const ARTIST_SPLIT = 650; // 65 %
const DAO_SPLIT = 210; // 21 %

async function main() {
  console.log("");
  console.log("----------------------------------");
  console.log("Running deployment script");
  console.log("----------------------------------");

  const [dev, artist, dao] = await ethers.getSigners();

  // Deploy or use already deployed contracts depending on the network that script runs on
  console.log("Deploying contracts");
  console.log("Network name:", network.name);
  console.log("Deployer:", dev.address);

  const { scriptyStorageContract, scriptyBuilderContract, wethContract } =
    await deployOrGetContracts(network.name);

  await storeScript(
    scriptyStorageContract,
    "gold_by_crashblossom_base",
    "scripts/goldBase.js"
  );

  await storeScript(
    scriptyStorageContract,
    "gold_by_crashblossom_paths",
    "scripts/paths.js",
    true
  );

  await storeScript(
    scriptyStorageContract,
    "gunzipScripts-0.0.1",
    "scripts/gunzipScripts-0.0.1.js"
  );

  await storeScript(
    scriptyStorageContract,
    "gold_by_crashblossom_main",
    "scripts/main.js"
  );

  const scriptRequests = [
    {
      name: "gold_by_crashblossom_base",
      contractAddress: scriptyStorageContract.address,
      contractData: 0,
      wrapType: 0,
      wrapPrefix: utilities.emptyBytes(),
      wrapSuffix: utilities.emptyBytes(),
      scriptContent: utilities.emptyBytes(),
    },
    {
      name: "gold_by_crashblossom_paths",
      contractAddress: scriptyStorageContract.address,
      contractData: 0,
      wrapType: 2,
      wrapPrefix: utilities.emptyBytes(),
      wrapSuffix: utilities.emptyBytes(),
      scriptContent: utilities.emptyBytes(),
    },
    {
      name: "gunzipScripts-0.0.1",
      contractAddress: scriptyStorageContract.address,
      contractData: 0,
      wrapType: 0,
      wrapPrefix: utilities.emptyBytes(),
      wrapSuffix: utilities.emptyBytes(),
      scriptContent: utilities.emptyBytes(),
    },
    {
      name: "gold_by_crashblossom_main",
      contractAddress: scriptyStorageContract.address,
      contractData: 0,
      wrapType: 0,
      wrapPrefix: utilities.emptyBytes(),
      wrapSuffix: utilities.emptyBytes(),
      scriptContent: utilities.emptyBytes(),
    },
  ];

  const rawBufferSize =
    await scriptyBuilderContract.getBufferSizeForHTMLWrapped(
      // @ts-ignore
      scriptRequests
    );
  console.log("Buffer size:", rawBufferSize);

  const renderer = await ethers.getContractFactory("GoldRenderer");
  const rendererContract = await renderer.deploy(
    [dev.address, artist.address, dao.address],
    scriptyBuilderContract.address,
    scriptyStorageContract.address,
    rawBufferSize,
    "https://arweave.net/gold/"
  );
  await rendererContract.deployed();
  console.log("Renderer Contract is deployed", rendererContract.address);

  const nftContract = await (
    await ethers.getContractFactory("Gold")
  ).deploy(
    [dev.address, artist.address, dao.address],
    [DEV_SPLIT, ARTIST_SPLIT, DAO_SPLIT],
    [dev.address, artist.address, dao.address],
    wethContract.address,
    rendererContract.address
  );
  await nftContract.deployed();
  console.log("NFT Contract is deployed", nftContract.address);

  // const sale = await ethers.getContractFactory("GoldDutchAuction");
  // const saleContract = await sale.deploy(
  //   [dev.address, artist.address, dao.address],
  //   [DEV_SPLIT, ARTIST_SPLIT, DAO_SPLIT],
  //   nftContract.address
  // );
  // console.log("Sale Contract is deployed", saleContract.address);

  // await nftContract.setSaleAddress(saleContract.address);
  await rendererContract.setGoldContract(nftContract.address);

  await nftContract.mint(dev.address);
  console.log("Minted 1 NFT");

  const tokenURI = await nftContract.tokenURI(0);
  console.log("Got token URI");
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

  // Verify contracts if network is goerli
  if (network.name == "goerli") {
    console.log("Waiting a little bytecode index on Etherscan");
    await delay(30000);

    await run("verify:verify", {
      address: nftContract.address,
      constructorArguments: [
        [dev.address, artist.address, dao.address],
        [DEV_SPLIT, ARTIST_SPLIT, DAO_SPLIT],
        [dev.address, artist.address, dao.address],
        wethContract.address,
        rendererContract.address,
      ],
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
