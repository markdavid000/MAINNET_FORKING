import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("Uniswap V2 Router – Mainnet Fork (loadFixture)", function () {
  const ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

  const USDC_HOLDER = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
  const DAI_HOLDER = "0x075e72a5eDf65F0A5f44699c7654C1a76941Ddc8";

  const USDC_ETH_PAIR = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc";
  const USDC_DAI_PAIR = "0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5";

  async function deployContractInstances() {
    const router = await ethers.getContractAt("IUniswapV2Router", ROUTER);
    const usdc = await ethers.getContractAt("IERC20", USDC);
    const dai = await ethers.getContractAt("IERC20", DAI);
    const weth = await ethers.getContractAt("IERC20", WETH);

    return { router, usdc, dai, weth };
  }

  it("should swapTokensForExactETH", async () => {
    const { router, usdc } = await loadFixture(deployContractInstances);

    await helpers.impersonateAccount(USDC_HOLDER);
    const signer = await ethers.getSigner(USDC_HOLDER);

    const amountOut = ethers.parseEther("0.5");
    const amountInMax = ethers.parseUnits("2000", 6);

    await usdc.connect(signer).approve(ROUTER, amountInMax);

    const ethBefore = await signer.provider!.getBalance(signer.address);

    await router
      .connect(signer)
      .swapTokensForExactETH(
        amountOut,
        amountInMax,
        [USDC, WETH],
        signer.address,
        Math.floor(Date.now() / 1000) + 300
      );

    const ethAfter = await signer.provider!.getBalance(signer.address);
    expect(ethAfter).to.be.gt(ethBefore);
  });

  it("should swapETHForExactTokens", async () => {
    const { router, usdc } = await loadFixture(deployContractInstances);

    await helpers.impersonateAccount(USDC_HOLDER);
    const signer = await ethers.getSigner(USDC_HOLDER);

    const usdcBefore = await usdc.balanceOf(signer.address);
    const outUSDC = ethers.parseUnits("200", 6);

    await router
      .connect(signer)
      .swapETHForExactTokens(
        outUSDC,
        [WETH, USDC],
        signer.address,
        Math.floor(Date.now() / 1000) + 300,
        { value: ethers.parseEther("2") }
      );

    const usdcAfter = await usdc.balanceOf(signer.address);
    expect(usdcAfter).to.be.gt(usdcBefore);
  });

  it("should swapExactETHForTokens", async () => {
    const { router, dai } = await loadFixture(deployContractInstances);

    await helpers.impersonateAccount(USDC_HOLDER);
    const signer = await ethers.getSigner(USDC_HOLDER);

    const daiBefore = await dai.balanceOf(signer.address);

    await router
      .connect(signer)
      .swapExactETHForTokens(
        1,
        [WETH, DAI],
        signer.address,
        Math.floor(Date.now() / 1000) + 300,
        { value: ethers.parseEther("1") }
      );

    const daiAfter = await dai.balanceOf(signer.address);
    expect(daiAfter).to.be.gt(daiBefore);
  });

  it("should addLiquidityETH", async () => {
    const { router, usdc } = await loadFixture(deployContractInstances);

    await helpers.impersonateAccount(USDC_HOLDER);
    const signer = await ethers.getSigner(USDC_HOLDER);

    const amountUSDC = ethers.parseUnits("2000", 6);
    await usdc.connect(signer).approve(ROUTER, amountUSDC);

    const usdcBefore = await usdc.balanceOf(signer.address);

    await router
      .connect(signer)
      .addLiquidityETH(
        USDC,
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

    await helpers.impersonateAccount(USDC_HOLDER);
    const usdcSigner = await ethers.getSigner(USDC_HOLDER);

    await helpers.impersonateAccount(DAI_HOLDER);
    const daiSigner = await ethers.getSigner(DAI_HOLDER);

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

    await usdc.connect(usdcSigner).approve(ROUTER, amountUSDC);
    await dai.connect(usdcSigner).approve(ROUTER, amountDAI);

    await router
      .connect(usdcSigner)
      .addLiquidity(
        USDC,
        DAI,
        amountUSDC,
        amountDAI,
        0,
        0,
        usdcSigner.address,
        Math.floor(Date.now() / 1000) + 600
      );

    const lp = await ethers.getContractAt(
      "IUniswapV2Pair",
      USDC_DAI_PAIR,
      usdcSigner
    );

    const liquidity = await lp.balanceOf(usdcSigner.address);
    const removeAmount = liquidity / 2n;

    await lp.approve(ROUTER, removeAmount);

    await router
      .connect(usdcSigner)
      .removeLiquidity(
        USDC,
        DAI,
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

    await helpers.impersonateAccount(USDC_HOLDER);
    const signer = await ethers.getSigner(USDC_HOLDER);

    await deployer.sendTransaction({
      to: signer.address,
      value: ethers.parseEther("5"),
    });

    const amountUSDC = ethers.parseUnits("2000", 6);
    await usdc.connect(signer).approve(ROUTER, amountUSDC);

    await router
      .connect(signer)
      .addLiquidityETH(
        USDC,
        amountUSDC,
        0,
        0,
        signer.address,
        Math.floor(Date.now() / 1000) + 600,
        { value: ethers.parseEther("1") }
      );

    const lp = await ethers.getContractAt(
      "IUniswapV2Pair",
      USDC_ETH_PAIR,
      signer
    );
    const liquidity = await lp.balanceOf(signer.address);

    const removeAmount = liquidity / 2n;

    await lp.approve(ROUTER, removeAmount);

    await router
      .connect(signer)
      .removeLiquidityETH(
        USDC,
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

    await helpers.impersonateAccount(USDC_HOLDER);
    const whale = await ethers.getSigner(USDC_HOLDER);

    const amountUSDC = ethers.parseUnits("2000", 6);
    await usdc.connect(whale).transfer(deployer.address, amountUSDC);

    const usdcDeployer = await ethers.getContractAt("IERC20", USDC, deployer);
    const routerDeployer = await ethers.getContractAt(
      "IUniswapV2Router",
      ROUTER,
      deployer
    );

    await usdcDeployer.approve(ROUTER, amountUSDC);

    await routerDeployer.addLiquidityETH(
      USDC,
      amountUSDC,
      0,
      0,
      deployer.address,
      Math.floor(Date.now() / 1000) + 300,
      { value: ethers.parseEther("1") }
    );

    const lp = await ethers.getContractAt(
      "IUniswapV2Pair",
      USDC_ETH_PAIR,
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
      verifyingContract: USDC_ETH_PAIR,
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
      spender: ROUTER,
      value: removeAmount,
      nonce,
      deadline,
    };

    const sig = await deployer.signTypedData(domain, types, message);
    const { v, r, s } = ethers.Signature.from(sig);

    await routerDeployer.removeLiquidityETHWithPermit(
      USDC,
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
