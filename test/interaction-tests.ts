import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("Interaction Tests", function () {
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

  const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
  const DAIHolder = "0x28C6c06298d514Db089934071355E5743bf21d60";

  const USDCWETHPairAddress = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc";
  const USDCDAIPairAddress = "0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5";

  async function deployContractInstances() {
    const router = await ethers.getContractAt("IUniswapV2Router", UNIRouter);
    const usdc = await ethers.getContractAt("IERC20", USDCAddress);
    const dai = await ethers.getContractAt("IERC20", DAIAddress);
    const weth = await ethers.getContractAt("IERC20", WETHAddress);

    return { router, usdc, dai, weth };
  }

  it("should swapTokensForExactETH", async () => {
    const { router, usdc } = await loadFixture(deployContractInstances);

    await helpers.impersonateAccount(USDCHolder);
    const signer = await ethers.getSigner(USDCHolder);

    const amountOut = ethers.parseEther("0.5");
    const amountInMax = ethers.parseUnits("2000", 6);

    await usdc.connect(signer).approve(UNIRouter, amountInMax);

    const ethBefore = await signer.provider!.getBalance(signer.address);

    await router
      .connect(signer)
      .swapTokensForExactETH(
        amountOut,
        amountInMax,
        [USDCAddress, WETHAddress],
        signer.address,
        Math.floor(Date.now() / 1000) + 300
      );

    const ethAfter = await signer.provider!.getBalance(signer.address);
    expect(ethAfter).to.be.gt(ethBefore);
  });

  it("should swapETHForExactTokens", async () => {
    const { router, usdc } = await loadFixture(deployContractInstances);

    await helpers.impersonateAccount(USDCHolder);
    const signer = await ethers.getSigner(USDCHolder);

    const usdcBefore = await usdc.balanceOf(signer.address);
    const amountOut = ethers.parseUnits("200", 6);

    await router
      .connect(signer)
      .swapETHForExactTokens(
        amountOut,
        [WETHAddress, USDCAddress],
        signer.address,
        Math.floor(Date.now() / 1000) + 300,
        { value: ethers.parseEther("2") }
      );

    const usdcAfter = await usdc.balanceOf(signer.address);
    expect(usdcAfter).to.be.gt(usdcBefore);
  });

  it("should swapExactETHForTokens", async () => {
    const { router, dai } = await loadFixture(deployContractInstances);

    await helpers.impersonateAccount(USDCHolder);
    const signer = await ethers.getSigner(USDCHolder);

    const daiBefore = await dai.balanceOf(signer.address);

    await router
      .connect(signer)
      .swapExactETHForTokens(
        1,
        [WETHAddress, DAIAddress],
        signer.address,
        Math.floor(Date.now() / 1000) + 300,
        { value: ethers.parseEther("1") }
      );

    const daiAfter = await dai.balanceOf(signer.address);
    expect(daiAfter).to.be.gt(daiBefore);
  });

  it("should addLiquidityETH", async () => {
    const { router, usdc } = await loadFixture(deployContractInstances);

    await helpers.impersonateAccount(USDCHolder);
    const signer = await ethers.getSigner(USDCHolder);

    const amountUSDC = ethers.parseUnits("2000", 6);
    await usdc.connect(signer).approve(UNIRouter, amountUSDC);

    const usdcBefore = await usdc.balanceOf(signer.address);

    await router
      .connect(signer)
      .addLiquidityETH(
        USDCAddress,
        amountUSDC,
        0,
        0,
        signer.address,
        Math.floor(Date.now() / 1000) + 600,
        { value: ethers.parseEther("1") }
      );

    const usdcAfter = await usdc.balanceOf(signer.address);
    expect(usdcAfter).to.be.lt(usdcBefore);
  });

  it("should removeLiquidity", async () => {
    const { router, usdc, dai } = await loadFixture(deployContractInstances);

    const [deployer] = await ethers.getSigners();

    await helpers.impersonateAccount(USDCHolder);
    const usdcSigner = await ethers.getSigner(USDCHolder);

    await helpers.impersonateAccount(DAIHolder);
    const daiSigner = await ethers.getSigner(DAIHolder);

    await deployer.sendTransaction({
      to: usdcSigner.address,
      value: ethers.parseEther("10"),
    });
    await deployer.sendTransaction({
      to: daiSigner.address,
      value: ethers.parseEther("10"),
    });

    const amountUSDC = ethers.parseUnits("10000", 6);
    const amountDAI = ethers.parseUnits("10000", 18);

    await dai.connect(daiSigner).transfer(usdcSigner.address, amountDAI);

    await usdc.connect(usdcSigner).approve(UNIRouter, amountUSDC);
    await dai.connect(usdcSigner).approve(UNIRouter, amountDAI);

    await router
      .connect(usdcSigner)
      .addLiquidity(
        USDCAddress,
        DAIAddress,
        amountUSDC,
        amountDAI,
        0,
        0,
        usdcSigner.address,
        Math.floor(Date.now() / 1000) + 600
      );

    const lp = await ethers.getContractAt(
      "IUniswapV2Pair",
      USDCDAIPairAddress,
      usdcSigner
    );

    const liquidity = await lp.balanceOf(usdcSigner.address);
    const removeAmount = liquidity / 2n;

    await lp.approve(UNIRouter, removeAmount);

    await router
      .connect(usdcSigner)
      .removeLiquidity(
        USDCAddress,
        DAIAddress,
        removeAmount,
        0,
        0,
        usdcSigner.address,
        Math.floor(Date.now() / 1000) + 600
      );

    expect(await lp.balanceOf(usdcSigner.address)).to.be.lt(liquidity);
  });

  it("should removeLiquidityETH", async () => {
    const { router, usdc } = await loadFixture(deployContractInstances);

    const [deployer] = await ethers.getSigners();

    await helpers.impersonateAccount(USDCHolder);
    const signer = await ethers.getSigner(USDCHolder);

    await deployer.sendTransaction({
      to: signer.address,
      value: ethers.parseEther("5"),
    });

    const amountUSDC = ethers.parseUnits("2000", 6);
    await usdc.connect(signer).approve(UNIRouter, amountUSDC);

    await router
      .connect(signer)
      .addLiquidityETH(
        USDCAddress,
        amountUSDC,
        0,
        0,
        signer.address,
        Math.floor(Date.now() / 1000) + 600,
        { value: ethers.parseEther("1") }
      );

    const lp = await ethers.getContractAt(
      "IUniswapV2Pair",
      USDCWETHPairAddress,
      signer
    );
    const liquidity = await lp.balanceOf(signer.address);

    const removeAmount = liquidity / 2n;

    await lp.approve(UNIRouter, removeAmount);

    await router
      .connect(signer)
      .removeLiquidityETH(
        USDCAddress,
        removeAmount,
        0,
        0,
        signer.address,
        Math.floor(Date.now() / 1000) + 300
      );

    expect(await lp.balanceOf(signer.address)).to.be.lt(liquidity);
  });

  it("should removeLiquidityETHWithPermit", async () => {
    const { usdc } = await loadFixture(deployContractInstances);

    const [deployer] = await ethers.getSigners();

    await helpers.impersonateAccount(USDCHolder);
    const whale = await ethers.getSigner(USDCHolder);

    const amountUSDC = ethers.parseUnits("2000", 6);
    await usdc.connect(whale).transfer(deployer.address, amountUSDC);

    const usdcDeployer = await ethers.getContractAt(
      "IERC20",
      USDCAddress,
      deployer
    );
    const routerDeployer = await ethers.getContractAt(
      "IUniswapV2Router",
      UNIRouter,
      deployer
    );

    await usdcDeployer.approve(UNIRouter, amountUSDC);

    await routerDeployer.addLiquidityETH(
      USDCAddress,
      amountUSDC,
      0,
      0,
      deployer.address,
      Math.floor(Date.now() / 1000) + 300,
      { value: ethers.parseEther("1") }
    );

    const lp = await ethers.getContractAt(
      "IUniswapV2Pair",
      USDCWETHPairAddress,
      deployer
    );
    const liquidity = await lp.balanceOf(deployer.address);
    const removeAmount = liquidity / 2n;

    const deadline = Math.floor(Date.now() / 1000) + 600;
    const nonce = await lp.nonces(deployer.address);
    const pairName = await lp.name();

    const domain = {
      name: pairName,
      version: "1",
      chainId: 1,
      verifyingContract: USDCWETHPairAddress,
    };

    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const message = {
      owner: deployer.address,
      spender: UNIRouter,
      value: removeAmount,
      nonce,
      deadline,
    };

    const sig = await deployer.signTypedData(domain, types, message);
    const { v, r, s } = ethers.Signature.from(sig);

    await routerDeployer.removeLiquidityETHWithPermit(
      USDCAddress,
      removeAmount,
      0,
      0,
      deployer.address,
      deadline,
      false,
      v,
      r,
      s
    );

    expect(await lp.balanceOf(deployer.address)).to.be.lt(liquidity);
  });
});
