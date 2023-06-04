import { BigNumber, BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

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

export function getMerkleRootWithDiscounts(
  addresses: {address: string, discountBps: number}[],
) {
  const hashes = addresses.map((data) =>
    ethers.utils.solidityKeccak256(
      ["address", "uint16"],
      [ethers.utils.getAddress(data.address), String(data.discountBps)]
    )
  );

  const tree = new MerkleTree(hashes, keccak256, {
    sortPairs: true,
  });

  return { tree, root: tree.getHexRoot() };
}

export function getStringOfNKilobytes(n: number) {
  return "0".repeat(n * 1024);
}