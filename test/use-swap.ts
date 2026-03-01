import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";

const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const DAIHolder = "0x28C6c06298d514Db089934071355E5743bf21d60";
const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

async function deployFixture() {
  const UseSwap = await ethers.getContractFactory("UseSwap");
  const useSwap = await UseSwap.deploy(UNIRouter);

  const dai = await ethers.getContractAt("IERC20", DAIAddress);
  const usdc = await ethers.getContractAt("IERC20", USDCAddress);
  const weth = await ethers.getContractAt("IERC20", WETHAddress);

  return { useSwap, dai, usdc, weth };
}

describe("UseSwap Tests", () => {
  it("should handleSwap (swapTokensForExactTokens)", async () => {
    const { useSwap, usdc } = await loadFixture(deployFixture);

    const usdcSigner = await ethers.getImpersonatedSigner(USDCHolder);

    const amountInMax = ethers.parseUnits("1000", 6);
    const amountOut = ethers.parseUnits("100", 18);

    await usdc.connect(usdcSigner).approve(useSwap.target, amountInMax);

    const path = [USDCAddress, DAIAddress];

    await expect(
      useSwap
        .connect(usdcSigner)
        .handleSwap(
          amountOut,
          amountInMax,
          path,
          usdcSigner.address,
          Math.floor(Date.now() / 1000) + 300
        )
    ).to.not.be.reverted;

    expect(await useSwap.swapCount()).to.equal(1);
  });

  it("should handleSwapToken (swapExactTokensForTokens)", async () => {
    const { useSwap, usdc } = await loadFixture(deployFixture);

    const usdcSigner = await ethers.getImpersonatedSigner(USDCHolder);

    const amountIn = ethers.parseUnits("500", 6);
    const amountOutMin = ethers.parseUnits("490", 18);

    await usdc.connect(usdcSigner).approve(useSwap.target, amountIn);

    const path = [USDCAddress, DAIAddress];

    await expect(
      useSwap
        .connect(usdcSigner)
        .handleSwapToken(
          amountIn,
          amountOutMin,
          path,
          usdcSigner.address,
          Math.floor(Date.now() / 1000) + 300
        )
    ).to.not.be.reverted;

    expect(await useSwap.swapCountToken()).to.equal(1);
  });

  it("should add liquidity with handleAddLiquidity", async () => {
    const { useSwap, dai, usdc } = await loadFixture(deployFixture);

    const usdcSigner = await ethers.getImpersonatedSigner(USDCHolder);
    const daiSigner = await ethers.getImpersonatedSigner(DAIHolder);

    const amountADesired = ethers.parseUnits("1000", 6);
    const amountBDesired = ethers.parseUnits("1000", 18);

    await usdc.connect(usdcSigner).approve(useSwap.target, amountADesired);
    await dai.connect(daiSigner).approve(useSwap.target, amountBDesired);

    await dai.connect(daiSigner).transfer(usdcSigner.address, amountBDesired);
    await dai.connect(usdcSigner).approve(useSwap.target, amountBDesired);

    await expect(
      useSwap
        .connect(usdcSigner)
        .handleAddLiquidity(
          USDCAddress,
          DAIAddress,
          amountADesired,
          amountBDesired,
          0,
          0,
          usdcSigner.address,
          Math.floor(Date.now() / 1000) + 300
        )
    ).to.not.be.reverted;

    expect(await useSwap.liquidityCount()).to.equal(1);
  });
});
