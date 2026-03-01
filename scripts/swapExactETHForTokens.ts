const helpers = require("@nomicfoundation/hardhat-network-helpers");
import { ethers } from "hardhat";

const main = async () => {
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const USDCHolder = "0x28C6c06298d514Db089934071355E5743bf21d60";

  await helpers.impersonateAccount(USDCHolder);
  const impersonatedSigner = await ethers.getSigner(USDCHolder);

  const amountOutMin = ethers.parseUnits("199", 6);
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

  const ethBalBefore = await ethers.provider.getBalance(
    impersonatedSigner.address
  );
  const usdcBalBefore = await USDC.balanceOf(impersonatedSigner.address);

  console.log("=================Before======================================");

  console.log(
    "WETH Balance before swapping:",
    ethers.formatEther(ethBalBefore)
  );
  console.log(
    "USDC Balance before swapping:",
    ethers.formatUnits(usdcBalBefore, 6)
  );

  const txn = await V2_ROUTER.swapExactETHForTokens(
    amountOutMin,
    [WETHAddress, USDCAddress],
    impersonatedSigner.address,
    deadline,
    {
      value: ethers.parseEther("0.1"),
    }
  );

  await txn.wait();

  const ethBalAfter = await ethers.provider.getBalance(
    impersonatedSigner.address
  );
  const usdcBalAfter = await USDC.balanceOf(impersonatedSigner.address);

  console.log("=================After========================================");

  console.log("WETH Balance after swapping:", ethers.formatEther(ethBalAfter));
  console.log(
    "USDC Balance after swapping:",
    ethers.formatUnits(usdcBalAfter, 6)
  );

  const newEthBal = ethBalBefore - ethBalAfter;
  const usdcUsed = usdcBalAfter - usdcBalBefore;

  console.log(
    "=================Differences========================================"
  );

  console.log("ETH USED: ", ethers.formatEther(newEthBal));
  console.log("NEW USDC BALANCE: ", ethers.formatUnits(usdcUsed, 6));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
