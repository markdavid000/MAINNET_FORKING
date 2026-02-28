const helpers = require("@nomicfoundation/hardhat-network-helpers");
import { ethers } from "hardhat";

const main = async () => {
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const ETHWhaleAddress = "0x28C6c06298d514Db089934071355E5743bf21d60";

  await helpers.impersonateAccount(ETHWhaleAddress);

  const signer = await ethers.getSigner(ETHWhaleAddress);

  const usdc = await ethers.getContractAt("IERC20", USDCAddress, signer);
  const router = await ethers.getContractAt(
    "IUniswapV2Router",
    UNIRouter,
    signer
  );

  const amountOut = ethers.parseUnits("10000", 6);
  const deadline = Math.floor(Date.now() / 1000) + 600;

  const usdcBalanceBefore = await usdc.balanceOf(signer.address);
  console.log("USDC BEFORE:", Number(usdcBalanceBefore));

  const tx = await router.swapETHForExactTokens(
    amountOut,
    [WETHAddress, USDCAddress],
    signer.address,
    deadline,
    { value: ethers.parseEther("10") }
  );

  await tx.wait();

  const usdcBalanceAfter = await usdc.balanceOf(signer.address);
  console.log("USDC AFTER:", Number(usdcBalanceAfter));

  const newUsdcValue = Number(usdcBalanceAfter - usdcBalanceBefore);
  console.log("NEW USDC BALANCE: ", ethers.formatUnits(newUsdcValue, 6));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
