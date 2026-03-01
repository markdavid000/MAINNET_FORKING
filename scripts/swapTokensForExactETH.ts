const helpers = require("@nomicfoundation/hardhat-network-helpers");
import { ethers } from "hardhat";

const main = async () => {
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(USDCHolder);
  const impersonatedSigner = await ethers.getSigner(USDCHolder);

  const amountOut = ethers.parseEther("0.1");
  const amountInMax = ethers.parseUnits("200", 6);
  const deadline = Math.floor(Date.now() / 1000) + 300;

  const USDC = await ethers.getContractAt(
    "IERC20",
    USDCAddress,
    impersonatedSigner
  );

  const V2_ROUTER = await ethers.getContractAt(
    "IUniswapV2Router",
    UNIRouter,
    impersonatedSigner
  );

  await USDC.approve(UNIRouter, amountInMax);

  const usdcBalBefore = await USDC.balanceOf(impersonatedSigner.address);
  const ethBalBefore = await ethers.provider.getBalance(
    impersonatedSigner.address
  );

  console.log("=================Before======================================");

  console.log(
    "USDC Balance before swapping:",
    ethers.formatUnits(usdcBalBefore, 6)
  );
  console.log(
    "WETH Balance before swapping:",
    ethers.formatEther(ethBalBefore)
  );

  const txn = await V2_ROUTER.swapTokensForExactETH(
    amountOut,
    amountInMax,
    [USDCAddress, WETHAddress],
    impersonatedSigner.address,
    deadline
  );

  await txn.wait();

  const usdcBalAfter = await USDC.balanceOf(impersonatedSigner.address);
  const ethBalAfter = await ethers.provider.getBalance(
    impersonatedSigner.address
  );

  console.log("=================After========================================");

  console.log(
    "USDC Balance after swapping:",
    ethers.formatUnits(usdcBalAfter, 6)
  );
  console.log("WETH Balance after swapping:", ethers.formatEther(ethBalAfter));

  const usdcUsed = usdcBalBefore - usdcBalAfter;
  const newEthBal = ethBalAfter - ethBalBefore;

  console.log(
    "=================Differences========================================"
  );

  console.log("USDC USED: ", ethers.formatUnits(usdcUsed, 6));
  console.log("NEW ETH BALANCE: ", ethers.formatEther(newEthBal));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
