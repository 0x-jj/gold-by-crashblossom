import { BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { discounts } from "../../../offchain/discounts";
import { getMerkleRootWithDiscounts } from "../../../test/utils";

const emptyProof = ["0x0000000000000000000000000000000000000000000000000000000000000000"];

const merkleTree = getMerkleRootWithDiscounts(discounts);

const auctionAddress = "0x4aC32438ABAfb7f6a2a96EcdEFe1D73cA266EF7E";

const bidFilter = {
  address: auctionAddress,
  topics: ["0x43a38e744536f08873c3f07e3c07fd5ec7024950b6c0bf43d9c0af85330b958c"],
  fromBlock: 9203913,
};

const iface = new Interface(["event Bid(address user, uint32 qty, uint256 price)"]);

type Bid = {
  user: string;
  qty: number;
  price: BigNumber;
};

async function main() {
  const Auction = await ethers.getContractAt("DutchAuction", auctionAddress);
  const logs = await ethers.provider.getLogs(bidFilter);
  const bids: Bid[] = logs.map((log) => {
    const parsed = iface.parseLog(log).args;
    return {
      user: parsed.user,
      qty: parsed.qty,
      price: parsed.price,
    };
  });

  const allAccounts = bids.map((bid) => bid.user);

  console.log(`Total bids: ${bids.length}`);

  const uniqueAccounts = [...new Set(allAccounts)];

  console.log(`Unique accounts: ${uniqueAccounts.length}`);

  const accountsToSend: string[] = [];
  const proofsToSend: string[][] = [];

  uniqueAccounts.forEach((account) => {
    const discountDetails = discounts.find(
      (discount) => discount.address.toLowerCase() === account.toLowerCase()
    );

    let proofToSend;

    if (!discountDetails) {
      proofToSend = emptyProof;
    } else {
      proofToSend = merkleTree.tree.getHexProof(merkleTree.getLeaf(account, discountDetails.discountBps));
    }

    accountsToSend.push(account);
    proofsToSend.push(proofToSend);
  });

  console.log(
    `Accounts receiving discounts: ${proofsToSend.reduce(
      (acc, curr) => acc + (curr === emptyProof ? 0 : 1),
      0
    )}`
  );

  await Auction.refundUsers(accountsToSend, proofsToSend);
}

main();
