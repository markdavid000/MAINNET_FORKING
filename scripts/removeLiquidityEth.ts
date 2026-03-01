const helpers = require("@nomicfoundation/hardhat-network-helpers");
import { ethers } from "hardhat";

const main = async () => {
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const USDCWETHPairAddress = "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc";
  const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(USDCHolder);
  const impersonatedSigner = await ethers.getSigner(USDCHolder);

  const amountTokenDesired = ethers.parseUnits("400", 6);
  const amountTokenMin = ethers.parseUnits("390", 6);
  const amountETHMin = ethers.parseEther("0.05");
  const amountETHDesired = ethers.parseEther("0.2");
  const deadline = Math.floor(Date.now() / 1000) + 300;

  const USDC = await ethers.getContractAt(
    "IERC20",
    USDCAddress,
    impersonatedSigner
  );

  const LPToken = await ethers.getContractAt(
    "IERC20",
    USDCWETHPairAddress,
    impersonatedSigner
  );

  const ROUTER = await ethers.getContractAt(
    "IUniswapV2Router",
    UNIRouter,
    impersonatedSigner
  );

  await USDC.approve(UNIRouter, amountTokenDesired);

  const addLiquidityEthTx = await ROUTER.addLiquidityETH(
    USDCAddress,
    amountTokenDesired,
    amountTokenMin,
    amountETHMin,
    impersonatedSigner.address,
    deadline,
    { value: amountETHDesired }
  );
  await addLiquidityEthTx.wait();

  console.log("Liquidity added. LP tokens acquired.");

  const lpBalBefore = await LPToken.balanceOf(impersonatedSigner.address);
  const liquidityToRemove = lpBalBefore / BigInt(2);

  const amountTokenMinRemove = ethers.parseUnits("1", 6);
  const amountETHMinRemove = ethers.parseEther("0.001");

  await LPToken.approve(UNIRouter, liquidityToRemove);

  const usdcBalBefore = await USDC.balanceOf(impersonatedSigner.address);
  const ethBalBefore = await ethers.provider.getBalance(
    impersonatedSigner.address
  );

  console.log(
    "=================Before========================================"
  );
  console.log(
    "USDC Balance before removing liquidity:",
    ethers.formatUnits(usdcBalBefore, 18)
  );
  console.log(
    "ETH Balance before removing liquidity:",
    ethers.formatEther(ethBalBefore)
  );
  console.log(
    "LP Token Balance before removing liquidity:",
    ethers.formatUnits(lpBalBefore, 18)
  );

  const removeLiquidityTx = await ROUTER.removeLiquidityETH(
    USDCAddress,
    liquidityToRemove,
    amountTokenMinRemove,
    amountETHMinRemove,
    impersonatedSigner.address,
    deadline
  );
  await removeLiquidityTx.wait();

  const usdcBalAfter = await USDC.balanceOf(impersonatedSigner.address);
  const ethBalAfter = await ethers.provider.getBalance(
    impersonatedSigner.address
  );
  const lpBalAfter = await LPToken.balanceOf(impersonatedSigner.address);

  console.log("=================After========================================");
  console.log(
    "USDC Balance after removing liquidity:",
    ethers.formatUnits(usdcBalAfter, 18)
  );
  console.log(
    "ETH Balance after removing liquidity:",
    ethers.formatEther(ethBalAfter)
  );
  console.log(
    "LP Token Balance after removing liquidity:",
    ethers.formatUnits(lpBalAfter, 18)
  );
  console.log("Liquidity removed successfully!");
  console.log("=========================================================");

  const usdcReceived = usdcBalAfter - usdcBalBefore;
  const ethReceived = ethBalAfter - ethBalBefore;
  const lpBurned = lpBalBefore - lpBalAfter;
  console.log("USDC RECEIVED:", ethers.formatUnits(usdcReceived, 18));
  console.log("ETH RECEIVED:", ethers.formatEther(ethReceived));
  console.log("LP BURNED:", ethers.formatUnits(lpBurned, 18));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
