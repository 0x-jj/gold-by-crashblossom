import { BigNumber, BigNumberish } from "ethers";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import { ethers, network } from "hardhat";
import { deployOrGetContracts } from "../scripts/utils";

export async function timeTravel(duration: BigNumberish) {
  if (!BigNumber.isBigNumber(duration)) {
    duration = BigNumber.from(duration);
  }

  if (duration.isNegative()) throw Error(`Cannot increase time by a negative amount (${duration})`);
  await ethers.provider.send("evm_increaseTime", [duration.toNumber()]);
  await advanceBlock();
}

export async function advanceBlock() {
  return ethers.provider.send("evm_mine", []);
}

export function getMerkleRoot(addresses: string[]) {
  const hashes = addresses.map((addr) => keccak256(ethers.utils.getAddress(addr)));

  const tree = new MerkleTree(hashes, keccak256, {
    sortPairs: true,
  });

  return { tree, root: tree.getHexRoot() };
}

export function getMerkleRootWithDiscounts(addresses: { address: string; discountBps: number }[]) {
  const getLeaf = (addy: string, bps: number) => {
    return ethers.utils.solidityKeccak256(
      ["address", "uint16"],
      [ethers.utils.getAddress(addy), String(bps)]
    );
  };
  const hashes = addresses.map((data) => getLeaf(data.address, data.discountBps));

  const tree = new MerkleTree(hashes, keccak256, {
    sortPairs: true,
  });

  return { tree, root: tree.getHexRoot(), getLeaf };
}

export function getStringOfNKilobytes(n: number) {
  return "0".repeat(n * 1024);
}

const toWei = ethers.utils.parseEther;

const START_PRICE = toWei("1.4");
const RESERVED_MINTS = 3;
const MAX_SUPPLY = 10;

const DEV_SPLIT = 140; // 14%
const ARTIST_SPLIT = 650; // 65 %
const DAO_SPLIT = 210; // 21 %

export async function deployContracts() {
  const { scriptyStorageContract, scriptyBuilderContract, wethContract } = await deployOrGetContracts(
    network.name
  );

  const [dev, artist, dao] = await ethers.getSigners();

  await wethContract.mint(dev.address, toWei("1000"));

  const renderer = await ethers.getContractFactory("GoldRenderer");
  const rendererContract = await renderer.deploy(
    [dev.address, artist.address, dao.address],
    scriptyBuilderContract.address,
    scriptyStorageContract.address,
    210000,
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
    rendererContract.address,
    20,
    "0x00000000000076A84feF008CDAbe6409d2FE638B"
  );
  await nftContract.deployed();
  console.log("NFT Contract is deployed", nftContract.address);

  rendererContract.setGoldContract(nftContract.address);

  const merkleTree = getMerkleRootWithDiscounts([{ address: dev.address, discountBps: 2000 }]);

  return { nftContract, rendererContract, wethContract, merkleTree };
}
