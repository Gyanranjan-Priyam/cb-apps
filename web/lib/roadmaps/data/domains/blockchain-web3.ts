import type { RoadmapData } from "../../types";

export const blockchainWeb3Roadmap: RoadmapData = {
  id: "blockchain-web3",
  slug: "blockchain-web3",
  title: "Blockchain & Web3",
  description: "Complete, all-in-one guide to Web3 & Smart Contract Engineering. Master Cryptographic Hashing, Proof of Stake Consensus, EVM Architecture & Gas Optimization, Solidity Smart Contracts, Foundry (Forge/Fuzz Testing), DeFi AMMs ($x \\cdot y = k$), Flash Loans, ERC-4337 Account Abstraction, and Zero-Knowledge Proofs without needing external materials.",
  category: "blockchain",
  badgeText: "Decentralized",
  iconName: "Box",
  version: 2,
  isPublished: true,
  nodes: [
    {
      id: "title-node",
      type: "title",
      position: { x: 550, y: 30 },
      data: { label: "Blockchain & Web3 Roadmap" },
    },
    // 1. Blockchain Fundamentals
    {
      id: "blockchain-fundamentals",
      type: "topic",
      position: { x: 550, y: 120 },
      data: {
        label: "Blockchain & Consensus Fundamentals",
        category: "Foundations",
        description: `### ⛓️ Distributed Ledgers & Cryptographic Consensus

How decentralized node networks achieve Byzantine fault tolerance and immutable global state.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 14,
      },
    },
    {
      id: "sub-merkle-hashing",
      type: "subtopic",
      position: { x: 860, y: 100 },
      data: {
        label: "Cryptographic Hashing & Merkle Trees",
        colorKey: "C",
        description: `### 🌲 Merkle Trees & Cryptographic Proof Verification

Verify transaction inclusion in a block in $O(\\log N)$ time without downloading gigabytes of raw block history.

\`\`\`
          [ Root Hash (Block Header) ]
                   /        \\
           [ Hash 0-1 ]   [ Hash 2-3 ]
             /     \\         /     \\
         [ H0 ]   [ H1 ]   [ H2 ]   [ H3 ]
           |        |        |        |
         Tx 0     Tx 1     Tx 2     Tx 3
\`\`\`
`,
      },
    },
    {
      id: "sub-pow-pos-consensus",
      type: "subtopic",
      position: { x: 860, y: 150 },
      data: {
        label: "Proof of Stake (PoS) & Byzantine Fault Tolerance",
        colorKey: "C",
        description: `### 🥩 Ethereum Proof of Stake (Gasper / LMD-GHOST)

- **Validators**: Stake 32 ETH to propose and attest to blocks.
- **Slashing Penalties**: Malicious validators signing two competing blocks at the same epoch height lose up to 100% of their staked ETH.
`,
      },
    },

    // 2. Ethereum Virtual Machine (EVM)
    {
      id: "evm-architecture",
      type: "topic",
      position: { x: 550, y: 320 },
      data: {
        label: "Ethereum & EVM Architecture",
        category: "Virtual Machine",
        description: `### ⚙️ EVM Memory Layout, Gas Mechanics & Account Abstraction

The quasi-Turing complete virtual machine executing decentralized smart contracts.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 16,
      },
    },
    {
      id: "sub-evm-gas-opcodes",
      type: "subtopic",
      position: { x: 240, y: 280 },
      data: {
        label: "EVM Opcodes, Memory, Calldata & Storage",
        colorKey: "C",
        description: `### 💾 EVM Memory Layout & Gas Optimization

- **Storage**: Persistent 32-byte slots ($20,000$ gas for new non-zero slot writes). Pack \`uint128 + uint128\` into single slots to save 50% gas!
- **Memory**: Ephemeral byte array cleared between calls ($3$ gas + quadratic expansion cost).
- **Calldata**: Read-only immutable argument array. Use \`calldata\` instead of \`memory\` for function parameters to save thousands of gas!
`,
      },
    },
    {
      id: "sub-accounts-wallets",
      type: "subtopic",
      position: { x: 240, y: 330 },
      data: {
        label: "EOA vs Smart Contract Accounts (ERC-4337)",
        colorKey: "C",
        description: `### 📱 ERC-4337 Account Abstraction Architecture

- **UserOperation**: Pseudo-transaction object signed by user's passkey / biometrics.
- **Bundler**: Packages UserOperations into standard Ethereum transactions.
- **Paymaster**: Smart contract that sponsors gas fees (allowing users to transact for FREE or pay gas in USDC!).
`,
      },
    },

    // 3. Solidity & Smart Contract Development
    {
      id: "solidity-development",
      type: "topic",
      position: { x: 550, y: 520 },
      data: {
        label: "Solidity & Smart Contract Engineering",
        category: "Smart Contracts",
        description: `### 📜 Solidity 0.8+, ERC Standards & Upgradeable Proxies

Write secure, gas-optimized decentralized code.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-erc-token-standards",
      type: "subtopic",
      position: { x: 860, y: 480 },
      data: {
        label: "Token Standards: ERC-20, ERC-721 & ERC-1155",
        colorKey: "C",
        description: `### 🪙 Production ERC-20 Token Contract in Solidity

\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CodeBreakersToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10 ** 18;

    constructor() ERC20("CodeBreakers Coin", "CBK") Ownable(msg.sender) {
        _mint(msg.sender, 100_000 * 10 ** 18);
    }

    function mintPointsReward(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
}
\`\`\`
`,
      },
    },
    {
      id: "sub-solidity-patterns-yul",
      type: "subtopic",
      position: { x: 860, y: 530 },
      data: {
        label: "Design Patterns, Upgrades & Inline Assembly (Yul)",
        colorKey: "C",
        description: `### 🛡️ Checks-Effects-Interactions (CEI) Pattern

Prevent catastrophic Reentrancy attacks!

\`\`\`solidity
// Vulnerable to reentrancy:
// balances[msg.sender] = 0 happens AFTER transfer!

// SECURE Implementation (CEI):
function withdraw() external {
    // 1. Checks
    uint256 amount = balances[msg.sender];
    require(amount > 0, "No balance");

    // 2. Effects (Update state BEFORE external interaction!)
    balances[msg.sender] = 0;

    // 3. Interactions
    (bool success, ) = payable(msg.sender).call{value: amount}("");
    require(success, "Transfer failed");
}
\`\`\`
`,
      },
    },

    // 4. Developer Tooling: Foundry & Hardhat
    {
      id: "foundry-hardhat-tooling",
      type: "topic",
      position: { x: 550, y: 720 },
      data: {
        label: "Foundry & Hardhat Testing Frameworks",
        category: "Tooling",
        description: `### 🛠️ Foundry Fuzz Testing, Invariant Verification & Viem/Wagmi

Test smart contracts in pure Solidity with property-based fuzzers.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 18,
      },
    },
    {
      id: "sub-foundry-fuzzing",
      type: "subtopic",
      position: { x: 240, y: 680 },
      data: {
        label: "Foundry (Forge, Cast, Anvil) & Fuzz Testing",
        colorKey: "C",
        description: `### 🔨 Foundry Fuzz Test Example in Solidity

\`\`\`solidity
// test/Vault.t.sol
import "forge-std/Test.sol";
import "../src/Vault.sol";

contract VaultTest is Test {
    Vault vault;

    function setUp() public {
        vault = new Vault();
    }

    // Foundry will run this test 10,000 times with random 'amount' values!
    function testFuzz_Deposit(uint256 amount) public {
        vm.assume(amount > 0 && amount <= 1000 ether);
        vm.deal(address(this), amount);

        vault.deposit{value: amount}();
        assertEq(vault.balances(address(this)), amount);
    }
}
\`\`\`
`,
      },
    },
    {
      id: "sub-web3-frontend-viem",
      type: "subtopic",
      position: { x: 240, y: 730 },
      data: {
        label: "Frontend Web3: Wagmi, Viem & RainbowKit",
        colorKey: "C",
        description: `### 🌐 Viem / Wagmi Smart Contract Integration in React

\`\`\`typescript
import { useReadContract, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { ABI } from '@/lib/abi';

export function TokenClaimCard() {
  const { writeContractAsync, isPending } = useWriteContract();

  const handleClaim = async () => {
    await writeContractAsync({
      address: '0x1234567890123456789012345678901234567890',
      abi: ABI,
      functionName: 'claimReward',
      args: [parseEther('50')],
    });
  };

  return <button onClick={handleClaim} disabled={isPending}>Claim 50 CBK</button>;
}
\`\`\`
`,
      },
    },

    // 5. DeFi Protocols & Tokenomics
    {
      id: "defi-protocols",
      type: "topic",
      position: { x: 550, y: 920 },
      data: {
        label: "DeFi Protocols & AMMs (Uniswap / Aave)",
        category: "DeFi",
        description: `### 🏦 Automated Market Makers ($x \\cdot y = k$), Lending & Oracles

Understand decentralized liquidity pools, flash loans, and price feeds.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-amm-uniswap",
      type: "subtopic",
      position: { x: 860, y: 880 },
      data: {
        label: "Constant Product AMMs ($x \\cdot y = k$) & Concentrated Liquidity",
        colorKey: "C",
        description: `### 📈 Constant Product Formula Math

$$x \\cdot y = k$$

- $x$: Token A reserve.
- $y$: Token B reserve.
- When a trader sells $\\Delta x$ tokens, the invariant requires $(x + \\Delta x)(y - \\Delta y) = k$.
- Output token amount: $\\Delta y = \\frac{y \\cdot \\Delta x}{x + \\Delta x}$.
`,
      },
    },
    {
      id: "sub-flashloans-oracles",
      type: "subtopic",
      position: { x: 860, y: 930 },
      data: {
        label: "Chainlink Oracles, Lending Protocols & Flash Loans",
        colorKey: "C",
        description: `### ⚡ Flash Loan Arbitrage Mechanics

Borrow $10,000,000$ with zero collateral as long as the entire borrowed amount + 0.09% fee is returned within the exact same EVM transaction block!
`,
      },
    },

    // 6. Security Auditing & Zero-Knowledge (ZK)
    {
      id: "smart-contract-security-zk",
      type: "topic",
      position: { x: 550, y: 1120 },
      data: {
        label: "Smart Contract Auditing & Zero-Knowledge Proofs",
        category: "Security & Scaling",
        description: `### 🛡️ Slither Audits, Oracle Manipulation & ZK-Rollups (zkSync)

Audit contracts for security flaws and scale transaction throughput with ZK proofs.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-security-auditing",
      type: "subtopic",
      position: { x: 240, y: 1080 },
      data: {
        label: "Security Audits: Slither, Echidna & Attack Vectors",
        colorKey: "C",
        description: `### 🔍 Static Analysis with Slither

\`\`\`bash
# Run Slither static analyzer on Solidity codebase
slither . --detect reentrancy-eth,uninitialized-state,arbitrary-send-erc20
\`\`\`
`,
      },
    },
    {
      id: "sub-zk-rollups-l2",
      type: "subtopic",
      position: { x: 240, y: 1130 },
      data: {
        label: "Layer 2 Scaling: Optimistic & ZK-Rollups (zkSync / Starknet)",
        colorKey: "C",
        description: `### ⚡ Zero-Knowledge Succinct Non-Interactive Arguments (zk-SNARKs)

Compute thousands of off-chain transactions and post a tiny cryptographic proof ($\sim 200\\text{ bytes}$) on Ethereum L1 for instant validity verification!
`,
      },
    },

    // 7. Milestone
    {
      id: "milestone-web3-lead",
      type: "milestone",
      position: { x: 550, y: 1320 },
      data: {
        label: "Certified Blockchain & Smart Contract Architect",
        category: "Milestone",
        description: `### 🎓 Blockchain & Web3 Mastery Attained!

Congratulations! You have mastered the decentralized web3 ecosystem:
- Blockchain cryptography, Merkle proofs, and Proof of Stake consensus.
- EVM architecture, gas optimization, and storage layout.
- Solidity smart contracts, ERC token standards, and upgradeable proxies.
- Testing with Foundry (Forge/Fuzzing) and dApp frontends with Viem/Wagmi.
- DeFi protocols (Uniswap AMM math, Aave lending, Chainlink Oracles).
- Smart contract security auditing and Zero-Knowledge Layer 2 rollups.
`,
        difficulty: "advanced",
        color: "gold",
        status: "not-started",
      },
    },
  ],
  edges: [
    { id: "e-w3-1", source: "blockchain-fundamentals", target: "evm-architecture", type: "interactive" },
    { id: "e-w3-2", source: "evm-architecture", target: "solidity-development", type: "interactive" },
    { id: "e-w3-3", source: "solidity-development", target: "foundry-hardhat-tooling", type: "interactive" },
    { id: "e-w3-4", source: "foundry-hardhat-tooling", target: "defi-protocols", type: "interactive" },
    { id: "e-w3-5", source: "defi-protocols", target: "smart-contract-security-zk", type: "interactive" },
    { id: "e-w3-6", source: "smart-contract-security-zk", target: "milestone-web3-lead", type: "interactive" },

    // Subtopics
    { id: "e-w3-sub-1", source: "blockchain-fundamentals", target: "sub-merkle-hashing" },
    { id: "e-w3-sub-2", source: "blockchain-fundamentals", target: "sub-pow-pos-consensus" },

    { id: "e-w3-sub-3", source: "evm-architecture", target: "sub-evm-gas-opcodes" },
    { id: "e-w3-sub-4", source: "evm-architecture", target: "sub-accounts-wallets" },

    { id: "e-w3-sub-5", source: "solidity-development", target: "sub-erc-token-standards" },
    { id: "e-w3-sub-6", source: "solidity-development", target: "sub-solidity-patterns-yul" },

    { id: "e-w3-sub-7", source: "foundry-hardhat-tooling", target: "sub-foundry-fuzzing" },
    { id: "e-w3-sub-8", source: "foundry-hardhat-tooling", target: "sub-web3-frontend-viem" },

    { id: "e-w3-sub-9", source: "defi-protocols", target: "sub-amm-uniswap" },
    { id: "e-w3-sub-10", source: "defi-protocols", target: "sub-flashloans-oracles" },

    { id: "e-w3-sub-11", source: "smart-contract-security-zk", target: "sub-security-auditing" },
    { id: "e-w3-sub-12", source: "smart-contract-security-zk", target: "sub-zk-rollups-l2" },
  ],
};
