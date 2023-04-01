import abi from "./abis/seaport.json";
import { ethers } from "ethers";

export const ALCHEMY_API_URL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
export const seaportAddress = "0x00000000000001ad428e4906ae43d8f9852d0dd6";
export const seaportContractInterface = new ethers.utils.Interface(abi);
export const saleEventSignatures = [
  "0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31", // OrderFulfilled (Opensea Seaport)
];
export const goldAddress = "0xd774557b647330c91bf44cfeab205095f7e6c367"; // (this is actually the Nakamigos address, for testing) https://opensea.io/collection/nakamigos
