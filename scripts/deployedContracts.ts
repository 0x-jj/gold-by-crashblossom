import path from "path";
import * as utilities from "./utils";

export const getContractAddresses = () => {
  const data = utilities.readFile(path.join(__dirname, "../deployment.json"));
  return JSON.parse(data);
};

const addresses = getContractAddresses();

export const addressFor = (networkName: string, name: string) => {
  return addresses[networkName][name];
};
