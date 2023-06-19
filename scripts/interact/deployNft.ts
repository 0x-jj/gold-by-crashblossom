import { ethers, run } from "hardhat";

const maxSupply = 500;
const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const rendererAddress = "0xDc49B9D7De7b1B4d6d153d9857b3942Dc4BADDfA";
const admin = "0x20Ec68Ba5dC8aF5380BDb37465b3F9BDE75f9635";

const secondaryMarketSplits = [
  { address: "0xB28B71C694F53C7CfEA8dffDC85733237e0C981e", split: 33 },
  { address: "0x65C7432E6662A96f4e999603991d5E929E57f60A", split: 53 },
  { address: "0x134309c4cf57BfA43EF66bF20bD0EEcCDEb2D80c", split: 10 },
  { address: "0x06CB0A03C2518873BeFC6BC257CBf4C438D14b4A", split: 4 },
];

const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

async function main() {
  const nftContract = await (
    await ethers.getContractFactory("Gold")
  ).deploy(
    secondaryMarketSplits.map((s) => ethers.utils.getAddress(s.address)),
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
      secondaryMarketSplits.map((s) => ethers.utils.getAddress(s.address)),
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
