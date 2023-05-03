import { ethers } from "hardhat";
import zlib from "zlib";
import fs from "fs";

export const stringToBytes = (str: string) => {
  return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(str));
};

export const bytesToString = (str: string) => {
  return ethers.utils.toUtf8String(str);
};

export const emptyBytes = () => {
  return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(""));
};

export const readFile = (path: string) => {
  return fs.readFileSync(path, { encoding: "utf8" });
};

export const writeFile = (path: string, data: any) => {
  fs.writeFileSync(path, data);
};

export const emptyAddress = "0x0000000000000000000000000000000000000000";

export const parseBase64DataURI = (uri: string) => {
  const data = uri.split("base64,")[1];
  const buff = Buffer.from(data, "base64");
  return buff.toString("ascii");
};

export const parseEscapedDataURI = (uri: string) => {
  const data = uri.split("data:")[1].split(",")[1];
  return decodeURIComponent(data);
};

export const chunkSubstr = (str: string, size: number) => {
  return str.split(new RegExp("(.{" + size.toString() + "})")).filter((O) => O);
};

export const toBase64String = (data: any) => {
  return Buffer.from(data).toString("base64");
};

export const toGZIPBase64String = (data: any) => {
  return zlib.gzipSync(data).toString("base64");
};
