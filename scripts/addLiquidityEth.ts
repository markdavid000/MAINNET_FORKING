const helpers = require("@nomicfoundation/hardhat-network-helpers");
import { ethers } from "hardhat";

const main = async () => {
  const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(USDCHolder);
  const impersonatedSigner = await ethers.getSigner(USDCHolder);

  const amountTokenDesired = ethers.parseUnits("600", 6);
  const amountTokenMin = ethers.parseUnits("400", 6);
  const amountETHMin = ethers.parseEther("0.05");
  const amountETHDesired = ethers.parseEther("0.2");
  const deadline = Math.floor(Date.now() / 1000) + 300;

  const USDC = await ethers.getContractAt(
    "IERC20",
    USDCAddress,
    impersonatedSigner
  );

  const ROUTER = await ethers.getContractAt(
    "IUniswapV2Router",
    UNIRouter,
    impersonatedSigner
  );

  await USDC.approve(UNIRouter, amountTokenDesired);

  const usdcBalBefore = await USDC.balanceOf(impersonatedSigner.address);
  const ethBalBefore = await ethers.provider.getBalance(
    impersonatedSigner.address
  );

  console.log(
    "=================Before========================================"
  );
  console.log(
    "USDC Balance before adding liquidity:",
    ethers.formatUnits(usdcBalBefore, 18)
  );
  console.log(
    "ETH Balance before adding liquidity:",
    ethers.formatEther(ethBalBefore)
  );

  const tx = await ROUTER.addLiquidityETH(
    USDCAddress,
    amountTokenDesired,
    amountTokenMin,
    amountETHMin,
    impersonatedSigner.address,
    deadline,
    { value: amountETHDesired }
  );
  await tx.wait();

  const usdcBalAfter = await USDC.balanceOf(impersonatedSigner.address);
  const ethBalAfter = await ethers.provider.getBalance(
    impersonatedSigner.address
  );

  console.log("=================After========================================");
  console.log(
    "USDC Balance after adding liquidity:",
    ethers.formatUnits(usdcBalAfter, 18)
  );
  console.log(
    "ETH Balance after adding liquidity:",
    ethers.formatEther(ethBalAfter)
  );
  console.log("Liquidity added successfully!");
  console.log("=========================================================");

  const usdcUsed = usdcBalBefore - usdcBalAfter;
  const ethUsed = ethBalBefore - ethBalAfter;
  console.log("USDC USED:", ethers.formatUnits(usdcUsed, 18));
  console.log("ETH USED:", ethers.formatEther(ethUsed));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
