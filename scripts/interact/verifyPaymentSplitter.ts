import { ethers, run } from "hardhat";

const contractAddress = "0x92FA340B4cB4537f4DcE8AC0036406a85875bC69";

async function main() {
  const contract = await ethers.getContractAt("PaymentSplitter", contractAddress);
  const [dev, artist, dao, dev2] = await ethers.getSigners();

  await run("verify:verify", {
    address: contract.address,
    constructorArguments: [
      [dev.address, artist.address, dao.address, dev2.address],
      [100, 620, 250, 30],
    ],
  });
}

main().then(console.log);
