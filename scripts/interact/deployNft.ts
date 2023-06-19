import { ethers, run } from "hardhat";

const maxSupply = 500;
const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const rendererAddress = "";
const admin = "0x20Ec68Ba5dC8aF5380BDb37465b3F9BDE75f9635";

const secondaryMarketSplits = [
  { address: "0x589b6C421C55260fC5E4117Bd893f57eD7bd44cD", split: 100 },
  { address: "0x589b6C421C55260fC5E4117Bd893f57eD7bd44cD", split: 620 },
  { address: "0x589b6C421C55260fC5E4117Bd893f57eD7bd44cD", split: 250 },
  { address: "0x589b6C421C55260fC5E4117Bd893f57eD7bd44cD", split: 30 },
];

const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

async function main() {
  const nftContract = await (
    await ethers.getContractFactory("Gold")
  ).deploy(
    secondaryMarketSplits.map((s) => s.address),
    secondaryMarketSplits.map((s) => s.split),
    [admin],
    wethAddress,
    rendererAddress,
    maxSupply,
    "0x00000000000076a84fef008cdabe6409d2fe638b"
  );

  await nftContract.deployed();
  console.log(`NFT contract is deployed at ${nftContract.address}`);

  console.log("Waiting for 30 seconds for etherscan to index the contract");
  await delay(30000);

  console.log("Sending contract for verification");
  await run("verify:verify", {
    address: nftContract.address,
    constructorArguments: [
      secondaryMarketSplits.map((s) => s.address),
      secondaryMarketSplits.map((s) => s.split),
      [admin],
      wethAddress,
      rendererAddress,
      maxSupply,
      "0x00000000000076a84fef008cdabe6409d2fe638b",
    ],
  });
}

main().then(console.log);
