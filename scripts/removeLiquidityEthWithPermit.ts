const helpers = require("@nomicfoundation/hardhat-network-helpers");
import { ethers } from "hardhat";

const main = async () => {
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const USDCWETHPairAddress = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc";
  const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  const [deployer] = await ethers.getSigners();

  await helpers.impersonateAccount(USDCHolder);
  const impersonatedSigner = await ethers.getSigner(USDCHolder);

  await deployer.sendTransaction({
    to: impersonatedSigner.address,
    value: ethers.parseEther("5"),
  });

  const amountUSDC = ethers.parseUnits("100", 6);
  const amountTokenMin = ethers.parseUnits("90", 6);
  const amountETHMin = ethers.parseEther("0.05");
  const amountETHDesired = ethers.parseEther("0.2");
  const deadline = Math.floor(Date.now() / 1000) + 300;

  const USDC = await ethers.getContractAt(
    "IERC20",
    USDCAddress,
    impersonatedSigner
  );
  const LPToken = await ethers.getContractAt(
    "IUniswapV2Pair",
    USDCWETHPairAddress,
    impersonatedSigner
  );
  const ROUTER = await ethers.getContractAt(
    "IUniswapV2Router",
    UNIRouter,
    impersonatedSigner
  );

  await USDC.connect(impersonatedSigner).transfer(deployer.address, amountUSDC);

  await USDC.connect(deployer).approve(UNIRouter, amountUSDC);

  const addTx = await ROUTER.connect(deployer).addLiquidityETH(
    USDCAddress,
    amountUSDC,
    amountTokenMin,
    amountETHMin,
    deployer.address,
    deadline,
    { value: amountETHDesired }
  );
  await addTx.wait();

  console.log("Liquidity added. LP tokens acquired by deployer.");

  const lpBalBefore = await LPToken.balanceOf(deployer.address);
  console.log("LP balance after add:", ethers.formatUnits(lpBalBefore, 18));

  const liquidityToRemove = lpBalBefore / BigInt(2);

  const amountTokenMinRemove = ethers.parseUnits("1", 6);
  const amountETHMinRemove = ethers.parseEther("0.001");
  const approveMax = false;

  const nonce = await LPToken.nonces(deployer.address);
  const pairName = await LPToken.name();

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

  const permitValue = {
    owner: deployer.address,
    spender: UNIRouter,
    value: liquidityToRemove,
    nonce: nonce,
    deadline: deadline,
  };

  const signature = await deployer.signTypedData(domain, types, permitValue);
  const { v, r, s } = ethers.Signature.from(signature);

  const usdcBalBefore = await USDC.balanceOf(deployer.address);
  const ethBalBefore = await ethers.provider.getBalance(deployer.address);

  console.log(
    "=================Before========================================"
  );
  console.log(
    "USDC Balance before removing liquidity:",
    ethers.formatUnits(usdcBalBefore, 6)
  );
  console.log(
    "ETH Balance before removing liquidity:",
    ethers.formatEther(ethBalBefore)
  );
  console.log(
    "LP Token Balance before removing liquidity:",
    ethers.formatUnits(lpBalBefore, 18)
  );

  const removeLiquidityEthWithPermitTx = await ROUTER.connect(
    deployer
  ).removeLiquidityETHWithPermit(
    USDCAddress,
    liquidityToRemove,
    amountTokenMinRemove,
    amountETHMinRemove,
    deployer.address,
    deadline,
    approveMax,
    v,
    r,
    s
  );
  await removeLiquidityEthWithPermitTx.wait();

  const usdcBalAfter = await USDC.balanceOf(deployer.address);
  const ethBalAfter = await ethers.provider.getBalance(deployer.address);
  const lpBalAfter = await LPToken.balanceOf(deployer.address);

  console.log("=================After========================================");
  console.log(
    "USDC Balance after removing liquidity:",
    ethers.formatUnits(usdcBalAfter, 6)
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
  console.log("USDC RECEIVED:", ethers.formatUnits(usdcReceived, 6));
  console.log("ETH RECEIVED:", ethers.formatEther(ethReceived));
  console.log("LP BURNED:", ethers.formatUnits(lpBurned, 18));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
