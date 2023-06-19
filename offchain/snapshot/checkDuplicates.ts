import { discounts } from "../discounts";

const seen = new Set();

for (const discount of discounts) {
  if (seen.has(discount.address)) {
    console.log(`Duplicate address: ${discount.address}`);
  }
  seen.add(discount.address);
}
