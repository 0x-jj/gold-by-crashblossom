// From https://github.com/reservoirprotocol/indexer/blob/main/packages/sdk/src/seaport-base/exchange.ts
import { BigNumber } from "@ethersproject/bignumber";

export enum ItemType {
  NATIVE,
  ERC20,
  ERC721,
  ERC1155,
  ERC721_WITH_CRITERIA,
  ERC1155_WITH_CRITERIA,
}

export type SpentItem = {
  itemType: ItemType;
  token: string;
  identifier: string;
  amount: string;
};

export type ReceivedItem = {
  itemType: ItemType;
  token: string;
  identifier: string;
  amount: string;
  recipient: string;
};

const lc = (x: string) => x?.toLowerCase();
const n = (x: any) => (x ? Number(x) : x);
const s = (x: any) => (x ? String(x) : x);

export function deriveBasicSale(
  spentItems: SpentItem[],
  receivedItems: ReceivedItem[]
) {
  // Normalize
  const nSpentItems: SpentItem[] = [];
  for (const spentItem of spentItems) {
    nSpentItems.push({
      itemType: n(spentItem.itemType),
      token: lc(spentItem.token),
      identifier: s(spentItem.identifier),
      amount: s(spentItem.amount),
    });
  }
  const nReceivedItems: ReceivedItem[] = [];
  for (const receivedItem of receivedItems) {
    nReceivedItems.push({
      itemType: n(receivedItem.itemType),
      token: lc(receivedItem.token),
      identifier: s(receivedItem.identifier),
      amount: s(receivedItem.amount),
      recipient: lc(receivedItem.recipient),
    });
  }

  try {
    if (nSpentItems.length === 1) {
      if (nSpentItems[0].itemType >= 2) {
        // Listing got filled

        const mainConsideration = nReceivedItems[0];
        if (mainConsideration.itemType >= 2) {
          throw new Error("Not a basic sale");
        }

        // Keep track of any "false" consideration items and remove them from price computation
        const falseReceivedItemsIndexes: number[] = [];
        let recipientOverride: string | undefined;
        for (let i = 1; i < nReceivedItems.length; i++) {
          if (
            nReceivedItems[i].itemType == nSpentItems[0].itemType &&
            nReceivedItems[i].token == nSpentItems[0].token &&
            nReceivedItems[i].identifier == nSpentItems[0].identifier
          ) {
            recipientOverride = nReceivedItems[i].recipient;
            falseReceivedItemsIndexes.push(i);
          } else if (
            nReceivedItems[i].itemType !== mainConsideration.itemType ||
            nReceivedItems[i].token !== mainConsideration.token
          ) {
            throw new Error("Not a basic sale");
          }
        }

        return {
          // To cover the generic `matchOrders` case
          recipientOverride,
          contract: nSpentItems[0].token,
          tokenId: nSpentItems[0].identifier,
          amount: nSpentItems[0].amount,
          paymentToken: mainConsideration.token,
          price: nReceivedItems
            .filter((_, i) => !falseReceivedItemsIndexes.includes(i))
            .map((c) => BigNumber.from(c.amount))
            .reduce((a, b) => a.add(b))
            .toString(),
          side: "sell",
        };
      } else {
        // Bid got filled

        const mainConsideration = nReceivedItems[0];
        if (mainConsideration.itemType < 2) {
          throw new Error("Not a basic sale");
        }

        for (let i = 1; i < nReceivedItems.length; i++) {
          if (
            nReceivedItems[i].itemType !== nSpentItems[0].itemType ||
            nReceivedItems[i].token !== nSpentItems[0].token
          ) {
            throw new Error("Not a basic sale");
          }
        }

        return {
          recipientOverride: undefined,
          contract: mainConsideration.token,
          tokenId: mainConsideration.identifier,
          amount: mainConsideration.amount,
          paymentToken: nSpentItems[0].token,
          price: nSpentItems[0].amount,
          side: "buy",
        };
      }
    }
  } catch {
    return undefined;
  }
}
