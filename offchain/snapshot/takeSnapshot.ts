import { allowlistTokens, recallOwners, additionalDiscounts, tenPercenters } from "./allowlist";
import { getAllOwnersOnContract, getAllOwnersOnContractTokenIds } from "./utils";
import { ethers } from "hardhat";
import fs from "fs";

const getDiscountBps = (holding: number) => {
  if (holding >= 3) return 2500;
  if (holding >= 2) return 2250;
  if (holding >= 1) return 2000;
  throw new Error("Invalid holding");
};

const getHoldingFromDiscountBps = (discountBps: number) => {
  if (discountBps === 2500) return 3;
  if (discountBps === 2250) return 2;
  if (discountBps === 2000) return 1;
  throw new Error("Invalid discount bps");
};

async function main() {
  const ownerCounts: Record<string, number> = {};

  for (const recallOwner of recallOwners) {
    const formattedAddress = ethers.utils.getAddress(recallOwner);
    ownerCounts[formattedAddress] = (ownerCounts[formattedAddress] ?? 0) + getHoldingFromDiscountBps(2000);
  }

  for (const { address, bps } of additionalDiscounts) {
    const formattedAddress = ethers.utils.getAddress(address);
    ownerCounts[formattedAddress] = (ownerCounts[formattedAddress] ?? 0) + getHoldingFromDiscountBps(bps);
  }

  for (const { type, contract, tokenIds, totalSupply } of allowlistTokens) {
    const owners =
      type === "ALL"
        ? await getAllOwnersOnContract(contract, totalSupply!)
        : await getAllOwnersOnContractTokenIds(contract, tokenIds!);

    for (const owner of owners) {
      const formattedAddress = ethers.utils.getAddress(owner);

      if (!ownerCounts[formattedAddress]) {
        ownerCounts[formattedAddress] = 0;
      }

      ownerCounts[formattedAddress]++;
    }
  }

  const addressesWithBps = Object.entries(ownerCounts).map(([address, holding]) => ({
    address,
    discountBps: getDiscountBps(holding),
  }));

  for (const address of tenPercenters) {
    const formattedAddress = ethers.utils.getAddress(address);
    if (ownerCounts[formattedAddress]) {
      continue;
    } else {
      addressesWithBps.push({
        address: formattedAddress,
        discountBps: 1000,
      });
    }
  }

  console.log("Writing json");
  fs.writeFileSync("snapshot.json", JSON.stringify(addressesWithBps, null, 2));

  console.log("Writing csv");
  fs.appendFileSync("snapshot.csv", "address,discountPct\n");
  for (const { address, discountBps } of addressesWithBps) {
    fs.appendFileSync("snapshot.csv", `${address},${discountBps / 100}\n`);
  }
}

main().then(console.log);
