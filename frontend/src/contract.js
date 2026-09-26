import { ethers } from "ethers";
import SupplyChain from "./SupplyChain.json";

const contractAddress =
  "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";

const metamaskInstallUrl =
  "https://metamask.io/download.html";

export const getContract = async () => {
  if (typeof window === "undefined") {
    return null;
  }

  const ethereum = window.ethereum;

  if (!ethereum) {
    const install = window.confirm(
      "MetaMask is not installed. Would you like to open the MetaMask download page?"
    );

    if (install) {
      window.open(metamaskInstallUrl, "_blank");
    }

    return null;
  }

  if (!ethereum.request) {
    alert(
      "MetaMask provider does not support requests."
    );

    return null;
  }

  try {
    // IMPORTANT:
    // Do NOT call eth_requestAccounts here.
    // This function only reads the account already selected
    // in MetaMask.
    const accounts = await ethereum.request({
      method: "eth_accounts",
    });

    if (!accounts || accounts.length === 0) {
      return null;
    }

    const provider =
      new ethers.BrowserProvider(ethereum);

    const signer =
      await provider.getSigner(accounts[0]);

    return new ethers.Contract(
      contractAddress,
      SupplyChain.abi,
      signer
    );

  } catch (err) {
    console.error(
      "Failed to create contract:",
      err
    );

    return null;
  }
};

export { contractAddress };