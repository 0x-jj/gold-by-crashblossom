import { Interface } from "ethers/lib/utils";
import { providers } from "ethers";
import { ethers } from "hardhat";
import axios from "axios";

const provider = new providers.JsonRpcProvider(
  `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`
);

const iface = new Interface([
  "function totalSupply() view returns (uint256)",

  "function ownerOf(uint256 tokenId) view returns (address)",
]);

export async function getAllOwnersOnContract(contractAddress: string, totalSupply: number) {
  const contract = new ethers.Contract(contractAddress, iface, provider);

  console.log(`Total supply: ${totalSupply} for ${contractAddress}`);

  const owners = [];

  for (let i = 0; i < totalSupply; i++) {
    console.log(`Getting owner of ${i} for ${contractAddress}`);
    const owner = await contract.ownerOf(i);
    owners.push(owner);
  }

  return owners;
}

export async function getAllOwnersOnContractTokenIds(contractAddress: string, tokenIds: string[]) {
  if (contractAddress === "0x495f947276749Ce646f68AC8c248420045cb7b5e") {
    return getOsOwners(contractAddress, tokenIds);
  }

  const contract = new ethers.Contract(contractAddress, iface, provider);
  const owners = [];

  for (const tokenId of tokenIds) {
    console.log(`Getting owner of ${tokenId} for ${contractAddress}`);

    const owner = await contract.ownerOf(tokenId);
    owners.push(owner);
  }

  return owners;
}

async function getOsOwners(contractAddress: string, tokenIds: string[]) {
  const owners = [];
  for (const tokenId of tokenIds) {
    const owner = await axios.get(
      `https://api.reservoir.tools/owners/v2?token=${contractAddress}%3A${tokenId}`
    );
    owners.push(owner.data.owners[0].address);
  }
  return owners;
}
