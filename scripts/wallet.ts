import { ethers } from "ethers";

console.log("Public", ethers.Wallet.createRandom().publicKey);
console.log("Private", ethers.Wallet.createRandom().privateKey);
