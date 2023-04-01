import { getSalesFromTransactionHash } from "../sale_detection";

const hash = process.argv[2]; // e.g. 0x9ee2dc6f298d65ff73120a105d4daf396865c7f611c5d5845749245edd6ae0a6

async function run() {
  const sales = await getSalesFromTransactionHash(hash);
  return sales;
}

run().then(console.log).catch(console.error);
