import fs from "fs";
import { parse } from "csv/sync";
import path from "path";

async function main() {
  const info: { percent: string; address: string }[] = parse(
    fs.readFileSync(path.resolve(__dirname, "others.csv")),
    {
      delimiter: ",",
      columns: true,
      skip_empty_lines: true,
    }
  );

  const results = [];
  for (const i of info) {
    results.push({
      address: i.address,
      discountBps: Number(i.percent) * 100,
    });
  }

  fs.writeFileSync("othersSnapshot.json", JSON.stringify(results, null, 2));

  console.log(info[0]);
}

main();
