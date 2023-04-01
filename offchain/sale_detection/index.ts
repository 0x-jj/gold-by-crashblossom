import { StaticJsonRpcProvider } from "@ethersproject/providers";
import {
  ALCHEMY_API_URL,
  goldAddress,
  saleEventSignatures,
  seaportAddress,
  seaportContractInterface,
} from "./data";
import { AddressZero } from "@ethersproject/constants";
import { formatEther } from "ethers/lib/utils";
import { deriveBasicSale } from "./parser";

const node = new StaticJsonRpcProvider(ALCHEMY_API_URL, "mainnet");

export async function getSalesFromTransactionHash(transactionHash: string) {
  const receipt = await node.getTransactionReceipt(transactionHash);
  const transactionLogs = receipt.logs;

  const contractInteractedWith = receipt.to?.toLowerCase();

  if (!contractInteractedWith || contractInteractedWith !== seaportAddress) {
    console.log(
      `Transaction ${transactionHash} is not a sale we are interested in`
    );
    return;
  }

  const sales: { price: string; tokenId: string }[] = [];

  for (const log of transactionLogs) {
    const logAddress = log.address.toLowerCase();
    const isASaleLog =
      logAddress === seaportAddress &&
      saleEventSignatures.includes(log.topics[0]);

    if (isASaleLog) {
      const parsedLog = seaportContractInterface.parseLog(log);
      const offer = parsedLog.args["offer"];
      const consideration = parsedLog.args["consideration"];
      const sale = deriveBasicSale(offer, consideration);

      if (!sale || sale.contract.toLowerCase() !== goldAddress) {
        continue;
      }

      if (
        sale.paymentToken !== AddressZero &&
        sale.paymentToken !== "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
      ) {
        console.log(`Sale ${transactionHash} is not in a supported currency`);
        continue;
      }

      sales.push({
        price: formatEther(sale.price),
        tokenId: sale.tokenId,
      });
    }
  }

  return sales;
}
