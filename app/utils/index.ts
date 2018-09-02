import { showShortToastAndroid } from "./errorHandler";
import Web3 from "web3";

export const MBits = 16;

export const truncateAddress = address =>
  `${address.substring(0, 10)}...${address.substring(address.length - 4)}`;

export const getAddressFromQRCode = (data: string, web3: Web3) => {
  const splits = data.split(":");

  if (splits[0] !== "ethereum" || !web3.utils.isAddress(splits[1])) {
    showShortToastAndroid("Invalid ethereum address");
    return;
  }

  return splits[1];
};

export const maxTransferValue = () => Math.pow(2, MBits / 2);
