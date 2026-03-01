const helpers = require("@nomicfoundation/hardhat-network-helpers");
import { ethers } from "hardhat";

const main = async () => {
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(USDCHolder);
  const impersonatedSigner = await ethers.getSigner(USDCHolder);

  const amountOut = ethers.parseUnits("100", 18);
  const amountInMax = ethers.parseUnits("120", 6);
  const deadline = Math.floor(Date.now() / 1000) + 300;

  const USDC = await ethers.getContractAt(
    "IERC20",
    USDCAddress,
    impersonatedSigner
  );

  const DAI = await ethers.getContractAt(
    "IERC20",
    DAIAddress,
    impersonatedSigner
  );

  const V2_ROUTER = await ethers.getContractAt(
    "IUniswapV2Router",
    UNIRouter,
    impersonatedSigner
  );

  await USDC.approve(UNIRouter, amountInMax);

  const usdcBalBefore = await USDC.balanceOf(impersonatedSigner.address);
  const daiBalBefore = await DAI.balanceOf(impersonatedSigner.address);

  console.log("=================Before======================================");

  console.log(
    "USDC Balance before swapping:",
    ethers.formatUnits(usdcBalBefore, 6)
  );
  console.log(
    "DAI Balance before swapping:",
    ethers.formatUnits(daiBalBefore, 18)
  );

  const txn = await V2_ROUTER.swapTokensForExactTokens(
    amountInMax,
    amountOut,
    [USDCAddress, DAIAddress],
    impersonatedSigner.address,
    deadline
  );

  await txn.wait();

  const usdcBalAfter = await USDC.balanceOf(impersonatedSigner.address);
  const daiBalAfter = await DAI.balanceOf(impersonatedSigner.address);

  console.log("=================After========================================");

  console.log(
    "USDC Balance after swapping:",
    ethers.formatUnits(usdcBalAfter, 6)
  );
  console.log(
    "DAI Balance after swapping:",
    ethers.formatUnits(daiBalAfter, 18)
  );

  const usdcUsed = usdcBalBefore - usdcBalAfter;
  const newDaiVal = daiBalAfter - daiBalBefore;

  console.log(
    "=================Differences========================================"
  );

  console.log("USDC USED: ", ethers.formatUnits(usdcUsed, 6));
  console.log("NEW DAI BALANCE: ", ethers.formatUnits(newDaiVal, 18));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
