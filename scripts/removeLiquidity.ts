const helpers = require("@nomicfoundation/hardhat-network-helpers");
import { ethers } from "hardhat";

const main = async () => {
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const USDCDAIPairAddress = "0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5";
  const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(USDCHolder);
  const impersonatedSigner = await ethers.getSigner(USDCHolder);

  const amountUSDC = ethers.parseUnits("10000", 6);
  const amountDAI = ethers.parseUnits("10000", 18);
  const amountUSDCMin = ethers.parseUnits("9000", 6);
  const amountDAIMin = ethers.parseUnits("9000", 18);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

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

  const LPToken = await ethers.getContractAt(
    "IERC20",
    USDCDAIPairAddress,
    impersonatedSigner
  );

  const ROUTER = await ethers.getContractAt(
    "IUniswapV2Router",
    UNIRouter,
    impersonatedSigner
  );

  await USDC.approve(UNIRouter, amountUSDC);
  await DAI.approve(UNIRouter, amountDAI);

  const addLiquidityTx = await ROUTER.addLiquidity(
    USDCAddress,
    DAIAddress,
    amountUSDC,
    amountDAI,
    amountUSDCMin,
    amountDAIMin,
    impersonatedSigner.address,
    deadline
  );
  await addLiquidityTx.wait();

  console.log("Liquidity added. LP tokens acquired.");

  const lpBalBefore = await LPToken.balanceOf(impersonatedSigner.address);
  const liquidityToRemove = lpBalBefore / BigInt(10);

  const amountUSDCMinRemove = ethers.parseUnits("1", 6);
  const amountDAIMinRemove = ethers.parseUnits("1", 18);

  await LPToken.approve(UNIRouter, liquidityToRemove);

  const usdcBalBefore = await USDC.balanceOf(impersonatedSigner.address);
  const daiBalBefore = await DAI.balanceOf(impersonatedSigner.address);

  console.log(
    "=================Before========================================"
  );
  console.log(
    "USDC Balance before removing liquidity:",
    ethers.formatUnits(usdcBalBefore, 6)
  );
  console.log(
    "DAI Balance before removing liquidity:",
    ethers.formatUnits(daiBalBefore, 18)
  );
  console.log(
    "LP Token Balance before removing liquidity:",
    ethers.formatUnits(lpBalBefore, 18)
  );

  const tx = await ROUTER.removeLiquidity(
    USDCAddress,
    DAIAddress,
    liquidityToRemove,
    amountUSDCMinRemove,
    amountDAIMinRemove,
    impersonatedSigner.address,
    deadline
  );
  await tx.wait();

  const usdcBalAfter = await USDC.balanceOf(impersonatedSigner.address);
  const daiBalAfter = await DAI.balanceOf(impersonatedSigner.address);
  const lpBalAfter = await LPToken.balanceOf(impersonatedSigner.address);

  console.log("=================After========================================");
  console.log(
    "USDC Balance after removing liquidity:",
    ethers.formatUnits(usdcBalAfter, 6)
  );
  console.log(
    "DAI Balance after removing liquidity:",
    ethers.formatUnits(daiBalAfter, 18)
  );
  console.log(
    "LP Token Balance after removing liquidity:",
    ethers.formatUnits(lpBalAfter, 18)
  );
  console.log("Liquidity removed successfully!");
  console.log("=========================================================");

  const usdcReceived = usdcBalAfter - usdcBalBefore;
  const daiReceived = daiBalAfter - daiBalBefore;
  const lpBurned = lpBalBefore - lpBalAfter;
  console.log("USDC RECEIVED:", ethers.formatUnits(usdcReceived, 6));
  console.log("DAI RECEIVED:", ethers.formatUnits(daiReceived, 18));
  console.log("LP BURNED:", ethers.formatUnits(lpBurned, 18));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
