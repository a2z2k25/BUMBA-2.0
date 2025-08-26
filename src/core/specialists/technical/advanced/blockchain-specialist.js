const UnifiedSpecialistBase = require('../../unified-specialist-base');
/**
 * BUMBA Blockchain Specialist
 * Expert in blockchain development, smart contracts, DeFi, and Web3 technologies
 */

const SpecialistBase = require('../../specialist-base');

class BlockchainSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'Blockchain Specialist',
      expertise: ['Blockchain Development', 'Smart Contracts', 'DeFi', 'Web3', 'Ethereum', 'Solidity'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are a blockchain development expert specializing in:
        - Smart contract development and auditing
        - Decentralized application (dApp) architecture
        - DeFi protocol design and implementation
        - Blockchain integration and Web3 development
        - Security best practices and vulnerability assessment
        - Token economics and governance mechanisms
        - Cross-chain interoperability solutions
        - Blockchain scalability and optimization
        Always prioritize security, gas optimization, and decentralization principles.`
    });

    this.capabilities = {
      smartContracts: true,
      dappDevelopment: true,
      defiProtocols: true,
      web3Integration: true,
      securityAudit: true,
      tokenomics: true,
      crossChain: true,
      scalability: true
    };
  }

  async developBlockchainSolution(context) {
    const analysis = await this.analyze(context);
    
    return {
      architecture: this.designBlockchainArchitecture(analysis),
      smartContracts: this.implementSmartContracts(analysis),
      frontend: this.buildWeb3Frontend(analysis),
      security: this.auditSecurity(analysis)
    };
  }

  designBlockchainArchitecture(analysis) {
    return `# Blockchain Architecture Design for ${analysis.projectName || 'DApp'}

## Architecture Overview

### Blockchain Technology Stack
\`\`\`
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   React/    │  │   Web3.js/  │  │    Wallet       │  │
│  │   Next.js   │  │   Ethers.js │  │  Integration    │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                      Web3 Calls
                           │
┌─────────────────────────────────────────────────────────┐
│                  Smart Contract Layer                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Business  │  │   Access    │  │    Governance   │  │
│  │    Logic    │  │   Control   │  │    Contracts    │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                    Blockchain Calls
                           │
┌─────────────────────────────────────────────────────────┐
│                   Blockchain Layer                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Ethereum   │  │   Polygon   │  │     Layer 2     │  │
│  │  Mainnet    │  │   Mumbai    │  │   Solutions     │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                      Off-Chain
                           │
┌─────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │    IPFS     │  │   Oracle    │  │     Backend     │  │
│  │   Storage   │  │  Services   │  │    Services     │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
\`\`\`

### Smart Contract Architecture Pattern
\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title Core Business Logic Contract
 * @dev Implements main business logic with security patterns
 */
contract CoreContract is ReentrancyGuard, AccessControl, Pausable {
    using SafeMath for uint256;
    
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    // State variables
    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowances;
    
    // Events
    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    modifier validAddress(address addr) {
        require(addr != address(0), "Invalid address");
        _;
    }
    
    modifier sufficientBalance(address account, uint256 amount) {
        require(balances[account] >= amount, "Insufficient balance");
        _;
    }
    
    function transfer(
        address to,
        uint256 amount
    )
        external
        nonReentrant
        whenNotPaused
        validAddress(to)
        sufficientBalance(msg.sender, amount)
        returns (bool)
    {
        _transfer(msg.sender, to, amount);
        return true;
    }
    
    function _transfer(address from, address to, uint256 amount) internal {
        balances[from] = balances[from].sub(amount);
        balances[to] = balances[to].add(amount);
        emit Transfer(from, to, amount);
    }
    
    // Emergency functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}

/**
 * @title Proxy Pattern for Upgradability
 */
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract UpgradeableCore is Initializable, UUPSUpgradeable, CoreContract {
    function initialize() public initializer {
        __UUPSUpgradeable_init();
        // Initialize state variables
    }
    
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(ADMIN_ROLE)
    {}
    
    function version() public pure returns (string memory) {
        return "1.0.0";
    }
}
\`\`\`

### DeFi Protocol Architecture
\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Decentralized Exchange Protocol
 * @dev Automated Market Maker implementation
 */
contract DEXProtocol is ReentrancyGuard, AccessControl {
    using SafeMath for uint256;
    
    struct Pool {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalSupply;
        uint256 kLast;
    }
    
    mapping(bytes32 => Pool) public pools;
    mapping(address => mapping(bytes32 => uint256)) public liquidity;
    
    uint256 public constant MINIMUM_LIQUIDITY = 10**3;
    uint256 public constant FEE_RATE = 997; // 0.3% fee
    
    event PoolCreated(address indexed tokenA, address indexed tokenB, bytes32 poolId);
    event LiquidityAdded(address indexed provider, bytes32 poolId, uint256 amountA, uint256 amountB);
    event Swap(address indexed trader, bytes32 poolId, uint256 amountIn, uint256 amountOut);
    
    function createPool(
        address tokenA,
        address tokenB
    ) external returns (bytes32 poolId) {
        require(tokenA != tokenB, "Identical tokens");
        require(tokenA != address(0) && tokenB != address(0), "Zero address");
        
        // Order tokens
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        poolId = keccak256(abi.encodePacked(token0, token1));
        
        require(pools[poolId].tokenA == address(0), "Pool exists");
        
        pools[poolId] = Pool({
            tokenA: token0,
            tokenB: token1,
            reserveA: 0,
            reserveB: 0,
            totalSupply: 0,
            kLast: 0
        });
        
        emit PoolCreated(token0, token1, poolId);
    }
    
    function addLiquidity(
        bytes32 poolId,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) external nonReentrant returns (uint256 amountA, uint256 amountB, uint256 liquidityMinted) {
        Pool storage pool = pools[poolId];
        require(pool.tokenA != address(0), "Pool not found");
        
        if (pool.reserveA == 0 && pool.reserveB == 0) {
            // First liquidity provision
            amountA = amountADesired;
            amountB = amountBDesired;
        } else {
            // Calculate optimal amounts
            uint256 amountBOptimal = quote(amountADesired, pool.reserveA, pool.reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "Insufficient B amount");
                amountA = amountADesired;
                amountB = amountBOptimal;
            } else {
                uint256 amountAOptimal = quote(amountBDesired, pool.reserveB, pool.reserveA);
                require(amountAOptimal <= amountADesired && amountAOptimal >= amountAMin, "Insufficient A amount");
                amountA = amountAOptimal;
                amountB = amountBDesired;
            }
        }
        
        // Transfer tokens
        IERC20(pool.tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(pool.tokenB).transferFrom(msg.sender, address(this), amountB);
        
        // Calculate liquidity to mint
        if (pool.totalSupply == 0) {
            liquidityMinted = Math.sqrt(amountA.mul(amountB)).sub(MINIMUM_LIQUIDITY);
            liquidity[address(this)][poolId] = MINIMUM_LIQUIDITY; // Lock minimum liquidity
        } else {
            liquidityMinted = Math.min(
                amountA.mul(pool.totalSupply) / pool.reserveA,
                amountB.mul(pool.totalSupply) / pool.reserveB
            );
        }
        
        require(liquidityMinted > 0, "Insufficient liquidity minted");
        
        // Update pool state
        pool.reserveA = pool.reserveA.add(amountA);
        pool.reserveB = pool.reserveB.add(amountB);
        pool.totalSupply = pool.totalSupply.add(liquidityMinted);
        liquidity[msg.sender][poolId] = liquidity[msg.sender][poolId].add(liquidityMinted);
        
        emit LiquidityAdded(msg.sender, poolId, amountA, amountB);
    }
    
    function swapExactTokensForTokens(
        bytes32 poolId,
        uint256 amountIn,
        uint256 amountOutMin,
        bool tokenAForB
    ) external nonReentrant returns (uint256 amountOut) {
        Pool storage pool = pools[poolId];
        require(pool.tokenA != address(0), "Pool not found");
        
        (uint256 reserveIn, uint256 reserveOut) = tokenAForB
            ? (pool.reserveA, pool.reserveB)
            : (pool.reserveB, pool.reserveA);
        
        amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        require(amountOut >= amountOutMin, "Insufficient output amount");
        
        // Transfer tokens
        address tokenIn = tokenAForB ? pool.tokenA : pool.tokenB;
        address tokenOut = tokenAForB ? pool.tokenB : pool.tokenA;
        
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).transfer(msg.sender, amountOut);
        
        // Update reserves
        if (tokenAForB) {
            pool.reserveA = pool.reserveA.add(amountIn);
            pool.reserveB = pool.reserveB.sub(amountOut);
        } else {
            pool.reserveB = pool.reserveB.add(amountIn);
            pool.reserveA = pool.reserveA.sub(amountOut);
        }
        
        emit Swap(msg.sender, poolId, amountIn, amountOut);
    }
    
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "Insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 amountInWithFee = amountIn.mul(FEE_RATE);
        uint256 numerator = amountInWithFee.mul(reserveOut);
        uint256 denominator = reserveIn.mul(1000).add(amountInWithFee);
        amountOut = numerator / denominator;
    }
    
    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) public pure returns (uint256 amountB) {
        require(amountA > 0, "Insufficient amount");
        require(reserveA > 0 && reserveB > 0, "Insufficient liquidity");
        amountB = amountA.mul(reserveB) / reserveA;
    }
}
\`\`\`

### Cross-Chain Bridge Architecture
\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Cross-Chain Bridge Contract
 * @dev Enables token transfers between different blockchains
 */
contract CrossChainBridge is ReentrancyGuard, AccessControl {
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant BRIDGE_OPERATOR_ROLE = keccak256("BRIDGE_OPERATOR_ROLE");
    
    struct BridgeTransaction {
        uint256 amount;
        address token;
        address sender;
        address recipient;
        uint256 targetChainId;
        uint256 nonce;
        bool executed;
        uint256 validatorCount;
    }
    
    mapping(bytes32 => BridgeTransaction) public bridgeTransactions;
    mapping(bytes32 => mapping(address => bool)) public validatorSignatures;
    mapping(address => uint256) public nonces;
    mapping(uint256 => bool) public supportedChains;
    
    uint256 public requiredValidators;
    uint256 public bridgeFee;
    
    event BridgeInitiated(
        bytes32 indexed txHash,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 targetChainId
    );
    
    event BridgeCompleted(bytes32 indexed txHash);
    
    constructor(uint256 _requiredValidators, uint256 _bridgeFee) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        requiredValidators = _requiredValidators;
        bridgeFee = _bridgeFee;
    }
    
    function initiateBridge(
        address token,
        uint256 amount,
        address recipient,
        uint256 targetChainId
    ) external payable nonReentrant {
        require(supportedChains[targetChainId], "Unsupported target chain");
        require(msg.value >= bridgeFee, "Insufficient bridge fee");
        require(amount > 0, "Amount must be greater than 0");
        
        // Lock tokens
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        // Generate transaction hash
        uint256 nonce = nonces[msg.sender]++;
        bytes32 txHash = keccak256(
            abi.encodePacked(
                msg.sender,
                recipient,
                token,
                amount,
                targetChainId,
                nonce,
                block.chainid
            )
        );
        
        bridgeTransactions[txHash] = BridgeTransaction({
            amount: amount,
            token: token,
            sender: msg.sender,
            recipient: recipient,
            targetChainId: targetChainId,
            nonce: nonce,
            executed: false,
            validatorCount: 0
        });
        
        emit BridgeInitiated(txHash, msg.sender, recipient, amount, targetChainId);
    }
    
    function validateBridge(
        bytes32 txHash
    ) external onlyRole(VALIDATOR_ROLE) {
        require(!validatorSignatures[txHash][msg.sender], "Already validated");
        require(!bridgeTransactions[txHash].executed, "Already executed");
        
        validatorSignatures[txHash][msg.sender] = true;
        bridgeTransactions[txHash].validatorCount++;
        
        // Execute if enough validators
        if (bridgeTransactions[txHash].validatorCount >= requiredValidators) {
            _executeBridge(txHash);
        }
    }
    
    function _executeBridge(bytes32 txHash) internal {
        BridgeTransaction storage tx = bridgeTransactions[txHash];
        tx.executed = true;
        
        // Release tokens to recipient
        IERC20(tx.token).transfer(tx.recipient, tx.amount);
        
        emit BridgeCompleted(txHash);
    }
    
    function addSupportedChain(uint256 chainId) external onlyRole(BRIDGE_OPERATOR_ROLE) {
        supportedChains[chainId] = true;
    }
    
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(token).transfer(msg.sender, amount);
    }
}
\`\`\`

## Governance and DAO Architecture

### Governance Token Contract
\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Governance Token
 * @dev ERC20 token with voting capabilities for DAO governance
 */
contract GovernanceToken is ERC20, ERC20Votes, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) EIP712(name, "1") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _mint(msg.sender, initialSupply);
    }
    
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
    
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }
    
    function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }
    
    function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
}

/**
 * @title DAO Governor Contract
 * @dev Governance contract for decentralized decision making
 */
import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

contract DAOGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    constructor(
        IVotes _token,
        TimelockController _timelock,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumPercentage
    )
        Governor("DAO Governor")
        GovernorSettings(_votingDelay, _votingPeriod, _proposalThreshold)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorumPercentage)
        GovernorTimelockControl(_timelock)
    {}
    
    function votingDelay() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }
    
    function votingPeriod() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }
    
    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }
    
    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }
    
    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }
    
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }
    
    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
\`\`\`

This comprehensive blockchain architecture provides enterprise-grade patterns for building secure, scalable decentralized applications with proper governance mechanisms.`;
  }

  implementSmartContracts(analysis) {
    return `# Smart Contract Implementation Guide

## Advanced Smart Contract Patterns

### Factory Pattern Implementation
\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Clone Factory Pattern
 * @dev Gas-efficient contract deployment using minimal proxy pattern
 */
import "@openzeppelin/contracts/proxy/Clones.sol";

contract TokenFactory {
    using Clones for address;
    
    address public immutable tokenImplementation;
    
    mapping(address => address[]) public userTokens;
    address[] public allTokens;
    
    event TokenCreated(
        address indexed creator,
        address indexed token,
        string name,
        string symbol
    );
    
    constructor() {
        tokenImplementation = address(new TokenImplementation());
    }
    
    function createToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) external returns (address token) {
        // Deploy minimal proxy
        token = tokenImplementation.clone();
        
        // Initialize the token
        TokenImplementation(token).initialize(
            name,
            symbol,
            initialSupply,
            msg.sender
        );
        
        // Track deployments
        userTokens[msg.sender].push(token);
        allTokens.push(token);
        
        emit TokenCreated(msg.sender, token, name, symbol);
    }
    
    function getUserTokens(address user) external view returns (address[] memory) {
        return userTokens[user];
    }
    
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }
}

/**
 * @title Token Implementation
 * @dev Implementation contract for minimal proxy pattern
 */
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract TokenImplementation is ERC20Upgradeable, OwnableUpgradeable {
    bool private initialized;
    
    modifier initializer() {
        require(!initialized, "Already initialized");
        initialized = true;
        _;
    }
    
    function initialize(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) external initializer {
        __ERC20_init(name, symbol);
        __Ownable_init();
        
        _mint(owner, initialSupply);
        _transferOwnership(owner);
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
\`\`\`

### Diamond Pattern for Modularity
\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Diamond Storage Pattern
 * @dev Modular smart contract architecture using facets
 */
library LibDiamond {
    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256("diamond.standard.diamond.storage");
    
    struct FacetAddressAndPosition {
        address facetAddress;
        uint96 functionSelectorPosition;
    }
    
    struct FacetFunctionSelectors {
        bytes4[] functionSelectors;
        uint256 facetAddressPosition;
    }
    
    struct DiamondStorage {
        mapping(bytes4 => FacetAddressAndPosition) selectorToFacetAndPosition;
        mapping(address => FacetFunctionSelectors) facetFunctionSelectors;
        address[] facetAddresses;
        mapping(bytes4 => bool) supportedInterfaces;
        address contractOwner;
    }
    
    function diamondStorage() internal pure returns (DiamondStorage storage ds) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }
    
    event DiamondCut(IDiamondCut.FacetCut[] _diamondCut, address _init, bytes _calldata);
    
    function setContractOwner(address _newOwner) internal {
        DiamondStorage storage ds = diamondStorage();
        address previousOwner = ds.contractOwner;
        ds.contractOwner = _newOwner;
        emit OwnershipTransferred(previousOwner, _newOwner);
    }
    
    function contractOwner() internal view returns (address contractOwner_) {
        contractOwner_ = diamondStorage().contractOwner;
    }
    
    function enforceIsContractOwner() internal view {
        require(msg.sender == diamondStorage().contractOwner, "LibDiamond: Must be contract owner");
    }
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    function diamondCut(
        IDiamondCut.FacetCut[] memory _diamondCut,
        address _init,
        bytes memory _calldata
    ) internal {
        for (uint256 facetIndex; facetIndex < _diamondCut.length; facetIndex++) {
            IDiamondCut.FacetCutAction action = _diamondCut[facetIndex].action;
            if (action == IDiamondCut.FacetCutAction.Add) {
                addFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);
            } else if (action == IDiamondCut.FacetCutAction.Replace) {
                replaceFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);
            } else if (action == IDiamondCut.FacetCutAction.Remove) {
                removeFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);
            } else {
                revert("LibDiamondCut: Incorrect FacetCutAction");
            }
        }
        emit DiamondCut(_diamondCut, _init, _calldata);
        initializeDiamondCut(_init, _calldata);
    }
    
    function addFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {
        require(_functionSelectors.length > 0, "LibDiamondCut: No selectors in facet to cut");
        DiamondStorage storage ds = diamondStorage();        
        require(_facetAddress != address(0), "LibDiamondCut: Add facet can't be address(0)");
        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);
        
        if (selectorPosition == 0) {
            addFacet(ds, _facetAddress);            
        }
        
        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
            bytes4 selector = _functionSelectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            require(oldFacetAddress == address(0), "LibDiamondCut: Can't add function that already exists");
            addFunction(ds, selector, selectorPosition, _facetAddress);
            selectorPosition++;
        }
    }
    
    function replaceFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {
        require(_functionSelectors.length > 0, "LibDiamondCut: No selectors in facet to cut");
        DiamondStorage storage ds = diamondStorage();
        require(_facetAddress != address(0), "LibDiamondCut: Add facet can't be address(0)");
        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);
        
        if (selectorPosition == 0) {
            addFacet(ds, _facetAddress);
        }
        
        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
            bytes4 selector = _functionSelectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            require(oldFacetAddress != _facetAddress, "LibDiamondCut: Can't replace function with same function");
            removeFunction(ds, oldFacetAddress, selector);
            addFunction(ds, selector, selectorPosition, _facetAddress);
            selectorPosition++;
        }
    }
    
    function removeFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {
        require(_functionSelectors.length > 0, "LibDiamondCut: No selectors in facet to cut");
        DiamondStorage storage ds = diamondStorage();
        require(_facetAddress == address(0), "LibDiamondCut: Remove facet address must be address(0)");
        
        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
            bytes4 selector = _functionSelectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            removeFunction(ds, oldFacetAddress, selector);
        }
    }
    
    function addFacet(DiamondStorage storage ds, address _facetAddress) internal {
        enforceHasContractCode(_facetAddress, "LibDiamondCut: New facet has no code");
        ds.facetFunctionSelectors[_facetAddress].facetAddressPosition = ds.facetAddresses.length;
        ds.facetAddresses.push(_facetAddress);
    }    
    
    function addFunction(DiamondStorage storage ds, bytes4 _selector, uint96 _selectorPosition, address _facetAddress) internal {
        ds.selectorToFacetAndPosition[_selector].functionSelectorPosition = _selectorPosition;
        ds.facetFunctionSelectors[_facetAddress].functionSelectors.push(_selector);
        ds.selectorToFacetAndPosition[_selector].facetAddress = _facetAddress;
    }
    
    function removeFunction(DiamondStorage storage ds, address _facetAddress, bytes4 _selector) internal {        
        require(_facetAddress != address(0), "LibDiamondCut: Can't remove function that doesn't exist");
        
        uint256 selectorPosition = ds.selectorToFacetAndPosition[_selector].functionSelectorPosition;
        uint256 lastSelectorPosition = ds.facetFunctionSelectors[_facetAddress].functionSelectors.length - 1;
        
        if (selectorPosition != lastSelectorPosition) {
            bytes4 lastSelector = ds.facetFunctionSelectors[_facetAddress].functionSelectors[lastSelectorPosition];
            ds.facetFunctionSelectors[_facetAddress].functionSelectors[selectorPosition] = lastSelector;
            ds.selectorToFacetAndPosition[lastSelector].functionSelectorPosition = uint96(selectorPosition);
        }
        
        ds.facetFunctionSelectors[_facetAddress].functionSelectors.pop();
        delete ds.selectorToFacetAndPosition[_selector];
        
        if (lastSelectorPosition == 0) {
            uint256 lastFacetAddressPosition = ds.facetAddresses.length - 1;
            uint256 facetAddressPosition = ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;
            if (facetAddressPosition != lastFacetAddressPosition) {
                address lastFacetAddress = ds.facetAddresses[lastFacetAddressPosition];
                ds.facetAddresses[facetAddressPosition] = lastFacetAddress;
                ds.facetFunctionSelectors[lastFacetAddress].facetAddressPosition = facetAddressPosition;
            }
            ds.facetAddresses.pop();
            delete ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;
        }
    }
    
    function initializeDiamondCut(address _init, bytes memory _calldata) internal {
        if (_init == address(0)) {
            require(_calldata.length == 0, "LibDiamondCut: _init is address(0) but_calldata is not empty");
        } else {
            require(_calldata.length > 0, "LibDiamondCut: _calldata is empty but _init is not address(0)");
            if (_init != address(this)) {
                enforceHasContractCode(_init, "LibDiamondCut: _init address has no code");
            }
            (bool success, bytes memory error) = _init.delegatecall(_calldata);
            if (!success) {
                if (error.length > 0) {
                    assembly {
                        let returndata_size := mload(error)
                        revert(add(32, error), returndata_size)
                    }
                } else {
                    revert("LibDiamondCut: _init function reverted");
                }
            }
        }
    }
    
    function enforceHasContractCode(address _contract, string memory _errorMessage) internal view {
        uint256 contractSize;
        assembly {
            contractSize := extcodesize(_contract)
        }
        require(contractSize > 0, _errorMessage);
    }
}
\`\`\`

### Advanced DeFi Strategies
\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Yield Farming Contract
 * @dev Advanced yield farming with compound rewards
 */
contract YieldFarm is ReentrancyGuard, AccessControl {
    using SafeMath for uint256;
    
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 pendingRewards;
        uint256 lastDepositTime;
    }
    
    struct PoolInfo {
        IERC20 lpToken;
        uint256 allocPoint;
        uint256 lastRewardBlock;
        uint256 accRewardPerShare;
        uint256 depositFeeBP;
        uint256 totalDeposited;
    }
    
    IERC20 public rewardToken;
    uint256 public rewardPerBlock;
    uint256 public startBlock;
    uint256 public bonusEndBlock;
    uint256 public constant BONUS_MULTIPLIER = 2;
    uint256 public totalAllocPoint = 0;
    uint256 public constant MAX_DEPOSIT_FEE = 500; // 5%
    
    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    mapping(address => bool) public poolExists;
    
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    
    constructor(
        IERC20 _rewardToken,
        uint256 _rewardPerBlock,
        uint256 _startBlock,
        uint256 _bonusEndBlock
    ) {
        rewardToken = _rewardToken;
        rewardPerBlock = _rewardPerBlock;
        startBlock = _startBlock;
        bonusEndBlock = _bonusEndBlock;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }
    
    function add(
        uint256 _allocPoint,
        IERC20 _lpToken,
        uint256 _depositFeeBP,
        bool _withUpdate
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_depositFeeBP <= MAX_DEPOSIT_FEE, "Deposit fee too high");
        require(!poolExists[address(_lpToken)], "Pool already exists");
        
        if (_withUpdate) {
            massUpdatePools();
        }
        
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accRewardPerShare: 0,
            depositFeeBP: _depositFeeBP,
            totalDeposited: 0
        }));
        
        poolExists[address(_lpToken)] = true;
    }
    
    function set(
        uint256 _pid,
        uint256 _allocPoint,
        uint256 _depositFeeBP,
        bool _withUpdate
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_depositFeeBP <= MAX_DEPOSIT_FEE, "Deposit fee too high");
        
        if (_withUpdate) {
            massUpdatePools();
        }
        
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(_allocPoint);
        poolInfo[_pid].allocPoint = _allocPoint;
        poolInfo[_pid].depositFeeBP = _depositFeeBP;
    }
    
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
        if (_to <= bonusEndBlock) {
            return _to.sub(_from).mul(BONUS_MULTIPLIER);
        } else if (_from >= bonusEndBlock) {
            return _to.sub(_from);
        } else {
            return bonusEndBlock.sub(_from).mul(BONUS_MULTIPLIER).add(_to.sub(bonusEndBlock));
        }
    }
    
    function pendingReward(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accRewardPerShare = pool.accRewardPerShare;
        uint256 lpSupply = pool.totalDeposited;
        
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 reward = multiplier.mul(rewardPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            accRewardPerShare = accRewardPerShare.add(reward.mul(1e12).div(lpSupply));
        }
        
        return user.amount.mul(accRewardPerShare).div(1e12).sub(user.rewardDebt).add(user.pendingRewards);
    }
    
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }
    
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        
        uint256 lpSupply = pool.totalDeposited;
        if (lpSupply == 0 || pool.allocPoint == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 reward = multiplier.mul(rewardPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
        
        pool.accRewardPerShare = pool.accRewardPerShare.add(reward.mul(1e12).div(lpSupply));
        pool.lastRewardBlock = block.number;
    }
    
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePool(_pid);
        
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accRewardPerShare).div(1e12).sub(user.rewardDebt);
            if (pending > 0) {
                user.pendingRewards = user.pendingRewards.add(pending);
            }
        }
        
        if (_amount > 0) {
            pool.lpToken.transferFrom(address(msg.sender), address(this), _amount);
            
            if (pool.depositFeeBP > 0) {
                uint256 depositFee = _amount.mul(pool.depositFeeBP).div(10000);
                pool.lpToken.transfer(address(this), depositFee);
                user.amount = user.amount.add(_amount.sub(depositFee));
                pool.totalDeposited = pool.totalDeposited.add(_amount.sub(depositFee));
            } else {
                user.amount = user.amount.add(_amount);
                pool.totalDeposited = pool.totalDeposited.add(_amount);
            }
        }
        
        user.rewardDebt = user.amount.mul(pool.accRewardPerShare).div(1e12);
        user.lastDepositTime = block.timestamp;
        
        emit Deposit(msg.sender, _pid, _amount);
    }
    
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "Insufficient balance");
        
        updatePool(_pid);
        
        uint256 pending = user.amount.mul(pool.accRewardPerShare).div(1e12).sub(user.rewardDebt);
        if (pending > 0) {
            user.pendingRewards = user.pendingRewards.add(pending);
        }
        
        if (_amount > 0) {
            user.amount = user.amount.sub(_amount);
            pool.totalDeposited = pool.totalDeposited.sub(_amount);
            pool.lpToken.transfer(address(msg.sender), _amount);
        }
        
        user.rewardDebt = user.amount.mul(pool.accRewardPerShare).div(1e12);
        
        emit Withdraw(msg.sender, _pid, _amount);
    }
    
    function harvest(uint256 _pid) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePool(_pid);
        
        uint256 pending = user.amount.mul(pool.accRewardPerShare).div(1e12).sub(user.rewardDebt);
        pending = pending.add(user.pendingRewards);
        
        if (pending > 0) {
            user.pendingRewards = 0;
            safeRewardTransfer(msg.sender, pending);
        }
        
        user.rewardDebt = user.amount.mul(pool.accRewardPerShare).div(1e12);
        
        emit Harvest(msg.sender, _pid, pending);
    }
    
    function emergencyWithdraw(uint256 _pid) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        uint256 amount = user.amount;
        
        user.amount = 0;
        user.rewardDebt = 0;
        user.pendingRewards = 0;
        pool.totalDeposited = pool.totalDeposited.sub(amount);
        
        pool.lpToken.transfer(address(msg.sender), amount);
        emit EmergencyWithdraw(msg.sender, _pid, amount);
    }
    
    function safeRewardTransfer(address _to, uint256 _amount) internal {
        uint256 rewardBal = rewardToken.balanceOf(address(this));
        bool transferSuccess = false;
        
        if (_amount > rewardBal) {
            transferSuccess = rewardToken.transfer(_to, rewardBal);
        } else {
            transferSuccess = rewardToken.transfer(_to, _amount);
        }
        
        require(transferSuccess, "Transfer failed");
    }
}
\`\`\`

### Flash Loan Implementation
\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Flash Loan Contract
 * @dev Provides uncollateralized loans that must be repaid in the same transaction
 */
interface IERC3156FlashBorrower {
    function onFlashLoan(
        address initiator,
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external returns (bytes32);
}

interface IERC3156FlashLender {
    function maxFlashLoan(address token) external view returns (uint256);
    function flashFee(address token, uint256 amount) external view returns (uint256);
    function flashLoan(
        IERC3156FlashBorrower receiver,
        address token,
        uint256 amount,
        bytes calldata data
    ) external returns (bool);
}

contract FlashLender is IERC3156FlashLender, ReentrancyGuard, AccessControl {
    using SafeMath for uint256;
    
    bytes32 public constant CALLBACK_SUCCESS = keccak256("ERC3156FlashBorrower.onFlashLoan");
    
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public flashFeeRate; // Fee rate in basis points
    mapping(address => uint256) public maxLoanAmount;
    
    uint256 public constant MAX_FEE_RATE = 100; // 1%
    
    event FlashLoan(
        address indexed borrower,
        address indexed token,
        uint256 amount,
        uint256 fee
    );
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    function addSupportedToken(
        address token,
        uint256 feeRate,
        uint256 maxAmount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(feeRate <= MAX_FEE_RATE, "Fee rate too high");
        
        supportedTokens[token] = true;
        flashFeeRate[token] = feeRate;
        maxLoanAmount[token] = maxAmount;
    }
    
    function maxFlashLoan(address token) external view override returns (uint256) {
        if (!supportedTokens[token]) {
            return 0;
        }
        
        uint256 balance = IERC20(token).balanceOf(address(this));
        uint256 maxAmount = maxLoanAmount[token];
        
        return balance < maxAmount ? balance : maxAmount;
    }
    
    function flashFee(address token, uint256 amount) public view override returns (uint256) {
        require(supportedTokens[token], "Token not supported");
        return amount.mul(flashFeeRate[token]).div(10000);
    }
    
    function flashLoan(
        IERC3156FlashBorrower receiver,
        address token,
        uint256 amount,
        bytes calldata data
    ) external override nonReentrant returns (bool) {
        require(supportedTokens[token], "Token not supported");
        require(amount <= this.maxFlashLoan(token), "Amount exceeds max loan");
        
        uint256 fee = flashFee(token, amount);
        uint256 balanceBefore = IERC20(token).balanceOf(address(this));
        
        // Transfer the loan amount to the borrower
        IERC20(token).transfer(address(receiver), amount);
        
        // Call the borrower's callback function
        bytes32 result = receiver.onFlashLoan(msg.sender, token, amount, fee, data);
        require(result == CALLBACK_SUCCESS, "Callback failed");
        
        // Verify repayment
        uint256 balanceAfter = IERC20(token).balanceOf(address(this));
        require(balanceAfter >= balanceBefore.add(fee), "Loan not repaid");
        
        emit FlashLoan(msg.sender, token, amount, fee);
        
        return true;
    }
    
    function withdrawFees(address token, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(token).transfer(msg.sender, amount);
    }
}

/**
 * @title Flash Loan Arbitrage Example
 * @dev Example implementation of flash loan for arbitrage
 */
contract FlashLoanArbitrage is IERC3156FlashBorrower, ReentrancyGuard {
    using SafeMath for uint256;
    
    IERC3156FlashLender public lender;
    
    struct ArbitrageParams {
        address tokenA;
        address tokenB;
        address exchangeA;
        address exchangeB;
        uint256 minProfit;
    }
    
    constructor(address _lender) {
        lender = IERC3156FlashLender(_lender);
    }
    
    function executeArbitrage(
        address token,
        uint256 amount,
        ArbitrageParams memory params
    ) external {
        bytes memory data = abi.encode(params);
        lender.flashLoan(this, token, amount, data);
    }
    
    function onFlashLoan(
        address initiator,
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external override returns (bytes32) {
        require(msg.sender == address(lender), "Invalid lender");
        require(initiator == address(this), "Invalid initiator");
        
        ArbitrageParams memory params = abi.decode(data, (ArbitrageParams));
        
        // Perform arbitrage logic
        uint256 profit = performArbitrage(token, amount, params);
        require(profit >= params.minProfit, "Insufficient profit");
        
        // Repay the flash loan
        uint256 totalRepayment = amount.add(fee);
        IERC20(token).transfer(address(lender), totalRepayment);
        
        return keccak256("ERC3156FlashBorrower.onFlashLoan");
    }
    
    function performArbitrage(
        address token,
        uint256 amount,
        ArbitrageParams memory params
    ) internal returns (uint256 profit) {
        // 1. Swap tokens on exchange A
        uint256 amountOut = swapOnExchange(params.exchangeA, token, params.tokenA, amount);
        
        // 2. Swap back on exchange B
        uint256 finalAmount = swapOnExchange(params.exchangeB, params.tokenA, token, amountOut);
        
        // 3. Calculate profit
        profit = finalAmount > amount ? finalAmount.sub(amount) : 0;
    }
    
    function swapOnExchange(
        address exchange,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal returns (uint256 amountOut) {
        // Implementation depends on the specific DEX
        // This is a simplified example
        return amountIn; // Placeholder
    }
}
\`\`\`

This comprehensive smart contract implementation guide provides advanced patterns for building secure, efficient, and scalable blockchain applications.`;
  }

  buildWeb3Frontend(analysis) {
    return `# Web3 Frontend Development Guide

## Web3 Integration Architecture

### React + Web3 Setup with Modern Hooks
\`\`\`javascript
// Web3 Provider Setup
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';

const Web3Context = createContext();

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: process.env.REACT_APP_INFURA_ID,
      rpc: {
        1: process.env.REACT_APP_MAINNET_RPC,
        4: process.env.REACT_APP_RINKEBY_RPC,
        137: process.env.REACT_APP_POLYGON_RPC,
      },
    },
  },
};

const web3Modal = new Web3Modal({
  network: 'mainnet',
  cacheProvider: true,
  providerOptions,
});

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const web3Provider = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(web3Provider);
      const signer = provider.getSigner();
      const account = await signer.getAddress();
      const network = await provider.getNetwork();

      setProvider(provider);
      setSigner(signer);
      setAccount(account);
      setChainId(network.chainId);

      // Listen for account changes
      web3Provider.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAccount(accounts[0]);
        }
      });

      // Listen for chain changes
      web3Provider.on('chainChanged', (chainId) => {
        setChainId(parseInt(chainId, 16));
      });

      // Listen for provider disconnection
      web3Provider.on('disconnect', () => {
        disconnect();
      });

    } catch (error) {
      setError(error.message);
      console.error('Connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await web3Modal.clearCachedProvider();
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setError(null);
  }, []);

  const switchNetwork = useCallback(async (targetChainId) => {
    if (!provider) return;

    try {
      await provider.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: \`0x\${targetChainId.toString(16)}\` }],
      });
    } catch (error) {
      if (error.code === 4902) {
        // Network not added to wallet
        await addNetwork(targetChainId);
      } else {
        throw error;
      }
    }
  }, [provider]);

  const addNetwork = useCallback(async (chainId) => {
    const networkConfigs = {
      137: {
        chainId: '0x89',
        chainName: 'Polygon Mainnet',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
        rpcUrls: ['https://polygon-rpc.com/'],
        blockExplorerUrls: ['https://polygonscan.com/'],
      },
      80001: {
        chainId: '0x13881',
        chainName: 'Mumbai Testnet',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
        rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
        blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
      },
    };

    const config = networkConfigs[chainId];
    if (!config) throw new Error('Unsupported network');

    await provider.provider.request({
      method: 'wallet_addEthereumChain',
      params: [config],
    });
  }, [provider]);

  // Auto-connect if previously connected
  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connect();
    }
  }, [connect]);

  const value = {
    account,
    provider,
    signer,
    chainId,
    isConnecting,
    error,
    connect,
    disconnect,
    switchNetwork,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
\`\`\`

### Smart Contract Interaction Hooks
\`\`\`javascript
// Custom hooks for contract interaction
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './Web3Provider';

export const useContract = (address, abi) => {
  const { provider, signer } = useWeb3();
  const [contract, setContract] = useState(null);

  useEffect(() => {
    if (provider && address && abi) {
      const contractInstance = new ethers.Contract(
        address,
        abi,
        signer || provider
      );
      setContract(contractInstance);
    }
  }, [provider, signer, address, abi]);

  return contract;
};

export const useContractRead = (contract, method, args = [], options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { watch = true, enabled = true } = options;

  const fetch = useCallback(async () => {
    if (!contract || !method || !enabled) return;

    try {
      setLoading(true);
      setError(null);
      const result = await contract[method](...args);
      setData(result);
    } catch (err) {
      setError(err);
      console.error('Contract read error:', err);
    } finally {
      setLoading(false);
    }
  }, [contract, method, JSON.stringify(args), enabled]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (watch && contract && method) {
      // Set up event listeners for automatic updates
      const filter = contract.filters[method.replace('get', '').replace('read', '')];
      if (filter) {
        contract.on(filter, fetch);
        return () => contract.off(filter, fetch);
      }
    }
  }, [watch, contract, method, fetch]);

  return { data, loading, error, refetch: fetch };
};

export const useContractWrite = (contract, method) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const write = useCallback(async (args = [], overrides = {}) => {
    if (!contract || !method) {
      throw new Error('Contract or method not available');
    }

    try {
      setLoading(true);
      setError(null);
      setTxHash(null);

      const tx = await contract[method](...args, overrides);
      setTxHash(tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      return receipt;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract, method]);

  return { write, loading, error, txHash };
};

// Token interaction hooks
export const useTokenBalance = (tokenAddress, userAddress) => {
  const { provider } = useWeb3();
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!provider || !tokenAddress || !userAddress) return;

    try {
      setLoading(true);
      
      if (tokenAddress === ethers.constants.AddressZero) {
        // ETH balance
        const balance = await provider.getBalance(userAddress);
        setBalance(ethers.utils.formatEther(balance));
      } else {
        // ERC20 token balance
        const contract = new ethers.Contract(
          tokenAddress,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        const balance = await contract.balanceOf(userAddress);
        setBalance(ethers.utils.formatEther(balance));
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('0');
    } finally {
      setLoading(false);
    }
  }, [provider, tokenAddress, userAddress]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, refetch: fetchBalance };
};

export const useTokenApproval = (tokenAddress, spenderAddress) => {
  const { account, signer } = useWeb3();
  const [allowance, setAllowance] = useState('0');
  const [approving, setApproving] = useState(false);

  const contract = useContract(tokenAddress, [
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
  ]);

  const checkAllowance = useCallback(async () => {
    if (!contract || !account || !spenderAddress) return;

    try {
      const allowance = await contract.allowance(account, spenderAddress);
      setAllowance(ethers.utils.formatEther(allowance));
    } catch (error) {
      console.error('Error checking allowance:', error);
    }
  }, [contract, account, spenderAddress]);

  const approve = useCallback(async (amount) => {
    if (!contract || !spenderAddress) return;

    try {
      setApproving(true);
      const tx = await contract.approve(
        spenderAddress,
        ethers.utils.parseEther(amount.toString())
      );
      await tx.wait();
      await checkAllowance();
      return tx;
    } catch (error) {
      console.error('Approval error:', error);
      throw error;
    } finally {
      setApproving(false);
    }
  }, [contract, spenderAddress, checkAllowance]);

  useEffect(() => {
    checkAllowance();
  }, [checkAllowance]);

  return { allowance, approve, approving, refetch: checkAllowance };
};
\`\`\`

### DeFi Components
\`\`\`javascript
// DEX Swap Component
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../hooks/useWeb3';
import { useContract, useContractWrite } from '../hooks/useContract';
import { useTokenBalance, useTokenApproval } from '../hooks/useToken';

const DEX_ABI = [
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, bytes32 poolId, bool tokenAForB) external returns (uint256)',
  'function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256)',
  'function pools(bytes32) public view returns (address tokenA, address tokenB, uint256 reserveA, uint256 reserveB, uint256 totalSupply, uint256 kLast)',
];

const SwapComponent = ({ dexAddress, poolId }) => {
  const { account } = useWeb3();
  const [fromToken, setFromToken] = useState('');
  const [toToken, setToToken] = useState('');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [loading, setLoading] = useState(false);

  const dexContract = useContract(dexAddress, DEX_ABI);
  const { write: swap, loading: swapping } = useContractWrite(dexContract, 'swapExactTokensForTokens');

  const { balance: fromBalance } = useTokenBalance(fromToken, account);
  const { allowance, approve, approving } = useTokenApproval(fromToken, dexAddress);

  const calculateOutput = async (inputAmount) => {
    if (!dexContract || !inputAmount || !poolId) return;

    try {
      setLoading(true);
      const pool = await dexContract.pools(poolId);
      const amountOut = await dexContract.getAmountOut(
        ethers.utils.parseEther(inputAmount),
        pool.reserveA,
        pool.reserveB
      );
      setToAmount(ethers.utils.formatEther(amountOut));
    } catch (error) {
      console.error('Error calculating output:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!fromAmount || !toAmount) return;

    try {
      const amountIn = ethers.utils.parseEther(fromAmount);
      const amountOutMin = ethers.utils.parseEther(
        (parseFloat(toAmount) * (1 - slippage / 100)).toString()
      );

      // Check if approval is needed
      if (parseFloat(allowance) < parseFloat(fromAmount)) {
        await approve(fromAmount);
      }

      // Execute swap
      await swap([amountIn, amountOutMin, poolId, true]);
      
      // Reset form
      setFromAmount('');
      setToAmount('');
    } catch (error) {
      console.error('Swap error:', error);
    }
  };

  useEffect(() => {
    if (fromAmount) {
      calculateOutput(fromAmount);
    }
  }, [fromAmount]);

  return (
    <div className="swap-container">
      <h2>Token Swap</h2>
      
      <div className="swap-form">
        <div className="token-input">
          <label>From</label>
          <input
            type="text"
            placeholder="Token Address"
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value)}
          />
          <input
            type="number"
            placeholder="Amount"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
          />
          <span>Balance: {fromBalance}</span>
        </div>

        <div className="token-input">
          <label>To</label>
          <input
            type="text"
            placeholder="Token Address"
            value={toToken}
            onChange={(e) => setToToken(e.target.value)}
          />
          <input
            type="number"
            placeholder="Amount"
            value={toAmount}
            readOnly
          />
        </div>

        <div className="slippage-control">
          <label>Slippage Tolerance: {slippage}%</label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={slippage}
            onChange={(e) => setSlippage(parseFloat(e.target.value))}
          />
        </div>

        <button
          onClick={handleSwap}
          disabled={!fromAmount || !toAmount || swapping || approving || loading}
          className="swap-button"
        >
          {approving ? 'Approving...' : swapping ? 'Swapping...' : 'Swap'}
        </button>
      </div>
    </div>
  );
};

// Yield Farming Component
const YieldFarmComponent = ({ farmAddress, poolId }) => {
  const { account } = useWeb3();
  const [stakeAmount, setStakeAmount] = useState('');
  const [pendingRewards, setPendingRewards] = useState('0');
  const [stakedAmount, setStakedAmount] = useState('0');

  const farmContract = useContract(farmAddress, [
    'function userInfo(uint256, address) view returns (uint256 amount, uint256 rewardDebt, uint256 pendingRewards, uint256 lastDepositTime)',
    'function pendingReward(uint256, address) view returns (uint256)',
    'function deposit(uint256, uint256)',
    'function withdraw(uint256, uint256)',
    'function harvest(uint256)',
  ]);

  const { write: deposit, loading: depositing } = useContractWrite(farmContract, 'deposit');
  const { write: withdraw, loading: withdrawing } = useContractWrite(farmContract, 'withdraw');
  const { write: harvest, loading: harvesting } = useContractWrite(farmContract, 'harvest');

  const fetchUserInfo = async () => {
    if (!farmContract || !account) return;

    try {
      const [userInfo, pending] = await Promise.all([
        farmContract.userInfo(poolId, account),
        farmContract.pendingReward(poolId, account),
      ]);

      setStakedAmount(ethers.utils.formatEther(userInfo.amount));
      setPendingRewards(ethers.utils.formatEther(pending));
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const handleDeposit = async () => {
    if (!stakeAmount) return;

    try {
      await deposit([poolId, ethers.utils.parseEther(stakeAmount)]);
      setStakeAmount('');
      await fetchUserInfo();
    } catch (error) {
      console.error('Deposit error:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!stakedAmount) return;

    try {
      await withdraw([poolId, ethers.utils.parseEther(stakedAmount)]);
      await fetchUserInfo();
    } catch (error) {
      console.error('Withdraw error:', error);
    }
  };

  const handleHarvest = async () => {
    try {
      await harvest([poolId]);
      await fetchUserInfo();
    } catch (error) {
      console.error('Harvest error:', error);
    }
  };

  useEffect(() => {
    fetchUserInfo();
    const interval = setInterval(fetchUserInfo, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [farmContract, account, poolId]);

  return (
    <div className="yield-farm">
      <h2>Yield Farm</h2>
      
      <div className="farm-stats">
        <div className="stat">
          <label>Staked Amount</label>
          <span>{stakedAmount}</span>
        </div>
        <div className="stat">
          <label>Pending Rewards</label>
          <span>{pendingRewards}</span>
        </div>
      </div>

      <div className="farm-actions">
        <div className="stake-section">
          <input
            type="number"
            placeholder="Amount to stake"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
          />
          <button onClick={handleDeposit} disabled={depositing}>
            {depositing ? 'Staking...' : 'Stake'}
          </button>
        </div>

        <div className="action-buttons">
          <button 
            onClick={handleWithdraw} 
            disabled={withdrawing || parseFloat(stakedAmount) === 0}
          >
            {withdrawing ? 'Withdrawing...' : 'Withdraw All'}
          </button>
          
          <button 
            onClick={handleHarvest} 
            disabled={harvesting || parseFloat(pendingRewards) === 0}
          >
            {harvesting ? 'Harvesting...' : 'Harvest'}
          </button>
        </div>
      </div>
    </div>
  );
};

export { SwapComponent, YieldFarmComponent };
\`\`\`

### Web3 State Management with Redux Toolkit
\`\`\`javascript
// Web3 Redux Slice
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ethers } from 'ethers';

// Async thunks
export const connectWallet = createAsyncThunk(
  'web3/connectWallet',
  async (_, { rejectWithValue }) => {
    try {
      if (!window.ethereum) {
        throw new Error('Wallet not found');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      
      const signer = provider.getSigner();
      const account = await signer.getAddress();
      const network = await provider.getNetwork();
      
      return {
        account,
        chainId: network.chainId,
        provider: provider,
        signer: signer,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const switchNetwork = createAsyncThunk(
  'web3/switchNetwork',
  async (chainId, { rejectWithValue }) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: \`0x\${chainId.toString(16)}\` }],
      });
      return chainId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTokenBalance = createAsyncThunk(
  'web3/fetchTokenBalance',
  async ({ tokenAddress, userAddress }, { getState, rejectWithValue }) => {
    try {
      const { web3 } = getState();
      const { provider } = web3;
      
      if (!provider) throw new Error('Provider not available');

      let balance;
      if (tokenAddress === ethers.constants.AddressZero) {
        balance = await provider.getBalance(userAddress);
      } else {
        const contract = new ethers.Contract(
          tokenAddress,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        balance = await contract.balanceOf(userAddress);
      }

      return {
        tokenAddress,
        balance: ethers.utils.formatEther(balance),
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const web3Slice = createSlice({
  name: 'web3',
  initialState: {
    account: null,
    chainId: null,
    provider: null,
    signer: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    balances: {},
    transactions: [],
  },
  reducers: {
    disconnect: (state) => {
      state.account = null;
      state.chainId = null;
      state.provider = null;
      state.signer = null;
      state.isConnected = false;
      state.balances = {};
      state.error = null;
    },
    addTransaction: (state, action) => {
      state.transactions.unshift(action.payload);
    },
    updateTransaction: (state, action) => {
      const { hash, status } = action.payload;
      const transaction = state.transactions.find(tx => tx.hash === hash);
      if (transaction) {
        transaction.status = status;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(connectWallet.pending, (state) => {
        state.isConnecting = true;
        state.error = null;
      })
      .addCase(connectWallet.fulfilled, (state, action) => {
        state.isConnecting = false;
        state.isConnected = true;
        state.account = action.payload.account;
        state.chainId = action.payload.chainId;
        state.provider = action.payload.provider;
        state.signer = action.payload.signer;
      })
      .addCase(connectWallet.rejected, (state, action) => {
        state.isConnecting = false;
        state.error = action.payload;
      })
      .addCase(switchNetwork.fulfilled, (state, action) => {
        state.chainId = action.payload;
      })
      .addCase(fetchTokenBalance.fulfilled, (state, action) => {
        const { tokenAddress, balance } = action.payload;
        state.balances[tokenAddress] = balance;
      });
  },
});

export const { disconnect, addTransaction, updateTransaction, clearError } = web3Slice.actions;
export default web3Slice.reducer;

// Custom hooks for Redux
import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';

export const useWeb3Redux = () => {
  const dispatch = useDispatch();
  const web3State = useSelector(state => state.web3);

  const connect = useCallback(() => {
    dispatch(connectWallet());
  }, [dispatch]);

  const disconnectWallet = useCallback(() => {
    dispatch(disconnect());
  }, [dispatch]);

  const switchToNetwork = useCallback((chainId) => {
    dispatch(switchNetwork(chainId));
  }, [dispatch]);

  const getTokenBalance = useCallback((tokenAddress, userAddress) => {
    dispatch(fetchTokenBalance({ tokenAddress, userAddress }));
  }, [dispatch]);

  return {
    ...web3State,
    connect,
    disconnect: disconnectWallet,
    switchNetwork: switchToNetwork,
    getTokenBalance,
  };
};
\`\`\`

This comprehensive Web3 frontend implementation provides modern, production-ready patterns for building decentralized applications with React and Web3 technologies.`;
  }

  auditSecurity(analysis) {
    return `# Blockchain Security Audit Framework

## Smart Contract Security Checklist

### Common Vulnerabilities and Mitigations

#### 1. Reentrancy Attacks
\`\`\`solidity
// VULNERABLE CODE
contract VulnerableBank {
    mapping(address => uint256) public balances;
    
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");
        
        // VULNERABILITY: External call before state update
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        balances[msg.sender] = 0; // Too late!
    }
}

// SECURE CODE
contract SecureBank {
    mapping(address => uint256) public balances;
    bool private locked;
    
    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }
    
    function withdraw() external nonReentrant {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");
        
        // Update state BEFORE external call
        balances[msg.sender] = 0;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}

// BEST PRACTICE: Use OpenZeppelin's ReentrancyGuard
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SecureBankOZ is ReentrancyGuard {
    mapping(address => uint256) public balances;
    
    function withdraw() external nonReentrant {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");
        
        balances[msg.sender] = 0;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
\`\`\`

#### 2. Integer Overflow/Underflow
\`\`\`solidity
// VULNERABLE CODE (Solidity < 0.8.0)
contract VulnerableToken {
    mapping(address => uint256) public balances;
    
    function transfer(address to, uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // VULNERABILITY: Potential overflow
        balances[to] += amount;
        balances[msg.sender] -= amount;
    }
}

// SECURE CODE (Solidity >= 0.8.0 or SafeMath)
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SecureToken {
    using SafeMath for uint256;
    mapping(address => uint256) public balances;
    
    function transfer(address to, uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[to] = balances[to].add(amount);
        balances[msg.sender] = balances[msg.sender].sub(amount);
    }
}

// MODERN SOLIDITY (0.8.0+) - Built-in overflow protection
contract ModernToken {
    mapping(address => uint256) public balances;
    
    function transfer(address to, uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // Automatic overflow/underflow protection
        balances[to] += amount;
        balances[msg.sender] -= amount;
    }
}
\`\`\`

#### 3. Access Control Vulnerabilities
\`\`\`solidity
// VULNERABLE CODE
contract VulnerableContract {
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    // VULNERABILITY: No access control
    function setOwner(address newOwner) external {
        owner = newOwner;
    }
    
    // VULNERABILITY: tx.origin instead of msg.sender
    function adminFunction() external {
        require(tx.origin == owner, "Not owner");
        // Critical function
    }
}

// SECURE CODE
import "@openzeppelin/contracts/access/AccessControl.sol";

contract SecureContract is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Not admin");
        _;
    }
    
    function adminFunction() external onlyAdmin {
        // Critical function with proper access control
    }
    
    function grantOperatorRole(address account) external onlyAdmin {
        _grantRole(OPERATOR_ROLE, account);
    }
}
\`\`\`

#### 4. Front-Running Protection
\`\`\`solidity
// VULNERABLE CODE
contract VulnerableDEX {
    mapping(bytes32 => Pool) public pools;
    
    function swap(
        bytes32 poolId,
        uint256 amountIn,
        uint256 minAmountOut
    ) external {
        // VULNERABILITY: No protection against front-running
        uint256 amountOut = calculateAmountOut(poolId, amountIn);
        require(amountOut >= minAmountOut, "Slippage too high");
        
        executeSwap(poolId, amountIn, amountOut);
    }
}

// SECURE CODE
contract SecureDEX {
    mapping(bytes32 => Pool) public pools;
    mapping(address => uint256) public nonces;
    
    function swap(
        bytes32 poolId,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 deadline,
        uint256 nonce,
        bytes calldata signature
    ) external {
        require(block.timestamp <= deadline, "Transaction expired");
        require(nonces[msg.sender] == nonce, "Invalid nonce");
        
        // Verify signature to prevent transaction replay
        bytes32 hash = keccak256(abi.encodePacked(
            msg.sender,
            poolId,
            amountIn,
            minAmountOut,
            deadline,
            nonce
        ));
        
        require(verifySignature(hash, signature, msg.sender), "Invalid signature");
        
        nonces[msg.sender]++;
        
        uint256 amountOut = calculateAmountOut(poolId, amountIn);
        require(amountOut >= minAmountOut, "Slippage too high");
        
        executeSwap(poolId, amountIn, amountOut);
    }
    
    function verifySignature(
        bytes32 hash,
        bytes memory signature,
        address signer
    ) internal pure returns (bool) {
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\\x19Ethereum Signed Message:\\n32", hash)
        );
        
        return recoverSigner(ethSignedMessageHash, signature) == signer;
    }
    
    function recoverSigner(
        bytes32 hash,
        bytes memory signature
    ) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        return ecrecover(hash, v, r, s);
    }
}
\`\`\`

#### 5. Oracle Manipulation Protection
\`\`\`solidity
// VULNERABLE CODE
contract VulnerablePriceConsumer {
    AggregatorV3Interface internal priceFeed;
    
    function getLatestPrice() public view returns (int) {
        (, int price,,,) = priceFeed.latestRoundData();
        return price; // VULNERABILITY: No validation
    }
}

// SECURE CODE
contract SecurePriceConsumer {
    AggregatorV3Interface internal priceFeed;
    uint256 public constant PRICE_PRECISION = 1e8;
    uint256 public constant MAX_PRICE_DEVIATION = 10; // 10%
    uint256 public constant HEARTBEAT = 3600; // 1 hour
    
    struct PriceData {
        uint256 price;
        uint256 timestamp;
        uint256 roundId;
    }
    
    PriceData public lastValidPrice;
    
    function getSecurePrice() public view returns (uint256) {
        (
            uint80 roundId,
            int256 price,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        
        require(price > 0, "Invalid price");
        require(updatedAt > 0, "Round not complete");
        require(block.timestamp - updatedAt < HEARTBEAT, "Price too old");
        require(answeredInRound >= roundId, "Stale price");
        
        uint256 currentPrice = uint256(price);
        
        // Check for extreme price movements
        if (lastValidPrice.timestamp > 0) {
            uint256 priceChange = currentPrice > lastValidPrice.price
                ? ((currentPrice - lastValidPrice.price) * 100) / lastValidPrice.price
                : ((lastValidPrice.price - currentPrice) * 100) / lastValidPrice.price;
            
            require(priceChange <= MAX_PRICE_DEVIATION, "Price deviation too high");
        }
        
        return currentPrice;
    }
    
    function updateValidPrice() external {
        uint256 price = getSecurePrice();
        (uint80 roundId,,, uint256 updatedAt,) = priceFeed.latestRoundData();
        
        lastValidPrice = PriceData({
            price: price,
            timestamp: updatedAt,
            roundId: roundId
        });
    }
    
    // Use multiple oracle sources for additional security
    mapping(address => bool) public authorizedOracles;
    mapping(address => uint256) public oraclePrices;
    uint256 public constant MIN_ORACLES = 3;
    
    function getMultiOraclePrice() external view returns (uint256) {
        uint256[] memory prices = new uint256[](MIN_ORACLES);
        uint256 validPrices = 0;
        
        // Collect prices from multiple oracles
        for (uint256 i = 0; i < MIN_ORACLES; i++) {
            // Implementation to fetch from different oracles
            // prices[validPrices++] = getOraclePrice(i);
        }
        
        require(validPrices >= MIN_ORACLES, "Insufficient oracle data");
        
        // Return median price to avoid manipulation
        return getMedian(prices);
    }
    
    function getMedian(uint256[] memory prices) internal pure returns (uint256) {
        // Sort prices and return median
        for (uint256 i = 0; i < prices.length - 1; i++) {
            for (uint256 j = 0; j < prices.length - i - 1; j++) {
                if (prices[j] > prices[j + 1]) {
                    uint256 temp = prices[j];
                    prices[j] = prices[j + 1];
                    prices[j + 1] = temp;
                }
            }
        }
        
        return prices[prices.length / 2];
    }
}
\`\`\`

### Automated Security Testing Framework
\`\`\`javascript
// Security testing with Hardhat and Chai
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Security Tests", function () {
  let contract;
  let owner;
  let attacker;
  let user;

  beforeEach(async function () {
    [owner, attacker, user] = await ethers.getSigners();
    
    const Contract = await ethers.getContractFactory("SecureContract");
    contract = await Contract.deploy();
    await contract.deployed();
  });

  describe("Reentrancy Protection", function () {
    it("Should prevent reentrancy attacks", async function () {
      // Deploy attacker contract
      const AttackerContract = await ethers.getContractFactory("ReentrancyAttacker");
      const attackerContract = await AttackerContract.deploy(contract.address);
      
      // Fund the main contract
      await owner.sendTransaction({
        to: contract.address,
        value: ethers.utils.parseEther("10")
      });
      
      // Fund attacker's balance
      await contract.connect(attacker).deposit({ value: ethers.utils.parseEther("1") });
      
      // Attempt reentrancy attack
      await expect(
        attackerContract.connect(attacker).attack()
      ).to.be.revertedWith("Reentrant call");
    });
  });

  describe("Access Control", function () {
    it("Should restrict admin functions to admin role", async function () {
      await expect(
        contract.connect(attacker).adminFunction()
      ).to.be.revertedWith("Not admin");
    });
    
    it("Should allow admin to grant roles", async function () {
      await contract.connect(owner).grantOperatorRole(user.address);
      expect(await contract.hasRole(await contract.OPERATOR_ROLE(), user.address)).to.be.true;
    });
  });

  describe("Integer Overflow Protection", function () {
    it("Should prevent overflow in arithmetic operations", async function () {
      const maxUint256 = ethers.BigNumber.from("2").pow(256).sub(1);
      
      await expect(
        contract.connect(user).add(maxUint256, 1)
      ).to.be.revertedWith("Arithmetic operation underflowed or overflowed");
    });
  });

  describe("Input Validation", function () {
    it("Should validate address parameters", async function () {
      await expect(
        contract.connect(owner).setAddress(ethers.constants.AddressZero)
      ).to.be.revertedWith("Invalid address");
    });
    
    it("Should validate amount parameters", async function () {
      await expect(
        contract.connect(user).transfer(user.address, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("Oracle Price Manipulation", function () {
    it("Should reject stale price data", async function () {
      // Mock old timestamp
      await network.provider.send("evm_increaseTime", [7200]); // 2 hours
      await network.provider.send("evm_mine");
      
      await expect(
        contract.getSecurePrice()
      ).to.be.revertedWith("Price too old");
    });
    
    it("Should reject extreme price deviations", async function () {
      // Mock price with extreme deviation
      await expect(
        contract.updatePriceWithDeviation(ethers.utils.parseEther("1000")) // 10x price increase
      ).to.be.revertedWith("Price deviation too high");
    });
  });

  describe("Front-running Protection", function () {
    it("Should require valid signature for sensitive operations", async function () {
      const message = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256", "uint256"],
          [user.address, 100, 0]
        )
      );
      
      const invalidSignature = await attacker.signMessage(ethers.utils.arrayify(message));
      
      await expect(
        contract.connect(user).secureSwap(100, 90, 0, invalidSignature)
      ).to.be.revertedWith("Invalid signature");
    });
  });
});

// Gas optimization tests
describe("Gas Optimization Tests", function () {
  it("Should use minimal gas for common operations", async function () {
    const tx = await contract.connect(user).optimizedTransfer(
      user.address,
      ethers.utils.parseEther("1")
    );
    
    const receipt = await tx.wait();
    expect(receipt.gasUsed).to.be.below(50000); // Set reasonable gas limit
  });
});

// Fuzzing tests
describe("Fuzzing Tests", function () {
  it("Should handle random inputs safely", async function () {
    for (let i = 0; i < 100; i++) {
      const randomAmount = ethers.BigNumber.from(
        ethers.utils.randomBytes(32)
      ).mod(ethers.utils.parseEther("1000"));
      
      try {
        await contract.connect(user).fuzzTest(randomAmount);
      } catch (error) {
        // Expected to fail for some inputs, but should not crash
        expect(error.message).to.not.include("VM Exception");
      }
    }
  });
});
\`\`\`

### Security Audit Tools Integration
\`\`\`bash
#!/bin/bash
# security-audit.sh - Comprehensive security audit script

echo "🔍 Starting comprehensive security audit..."

# Static analysis with Slither
echo "Running Slither static analysis..."
slither . --json slither-report.json

# Mythril symbolic execution
echo "Running Mythril analysis..."
myth analyze contracts/*.sol --output-dir mythril-reports

# Echidna property-based testing
echo "Running Echidna fuzzing..."
echidna-test contracts/SecurityTest.sol --contract SecurityTest --output-format json

# Gas optimization analysis
echo "Analyzing gas optimization..."
hardhat test --gas-report

# Dependency vulnerability scan
echo "Scanning dependencies..."
npm audit --audit-level moderate

# Custom security checks
echo "Running custom security checks..."

# Check for common vulnerabilities
grep -r "tx.origin" contracts/ && echo "🟠️  Warning: tx.origin usage found"
grep -r "block.timestamp" contracts/ && echo "🟠️  Warning: timestamp dependence found"
grep -r "blockhash" contracts/ && echo "🟠️  Warning: blockhash usage found"

# Check for proper access controls
grep -r "onlyOwner" contracts/ || echo "🟠️  Warning: No onlyOwner modifier found"
grep -r "require.*msg.sender" contracts/ || echo "🟠️  Warning: No msg.sender checks found"

# Check for reentrancy protection
grep -r "nonReentrant" contracts/ || echo "🟠️  Warning: No reentrancy protection found"

# Generate final report
echo "📊 Generating security audit report..."
node scripts/generate-audit-report.js

echo "🏁 Security audit completed. Check audit-report.html for results."
\`\`\`

### Security Best Practices Checklist
\`\`\`markdown
# Smart Contract Security Checklist

## Pre-Development
- [ ] Define security requirements and threat model
- [ ] Choose appropriate development framework (Hardhat, Foundry)
- [ ] Set up automated security testing pipeline
- [ ] Plan for upgradability and emergency procedures

## Development Phase
- [ ] Use established patterns (OpenZeppelin contracts)
- [ ] Implement proper access controls
- [ ] Add reentrancy protection where needed
- [ ] Validate all inputs and parameters
- [ ] Use SafeMath or Solidity 0.8+ for arithmetic
- [ ] Implement circuit breakers/pause mechanisms
- [ ] Add comprehensive events for transparency
- [ ] Follow checks-effects-interactions pattern

## Testing Phase
- [ ] Write comprehensive unit tests
- [ ] Implement property-based testing (Echidna)
- [ ] Test edge cases and failure scenarios
- [ ] Perform gas optimization analysis
- [ ] Test with different user roles and permissions
- [ ] Simulate attack scenarios

## Pre-Deployment
- [ ] Conduct static analysis (Slither, Mythril)
- [ ] Perform external security audit
- [ ] Test on testnet with realistic scenarios
- [ ] Verify contract source code
- [ ] Set up monitoring and alerting
- [ ] Prepare incident response plan

## Post-Deployment
- [ ] Monitor contract behavior and events
- [ ] Set up anomaly detection
- [ ] Maintain bug bounty program
- [ ] Regular security reviews and updates
- [ ] Community security engagement
- [ ] Document known limitations and risks

## Emergency Procedures
- [ ] Circuit breaker activation process
- [ ] Multi-sig wallet procedures
- [ ] Emergency contact protocols
- [ ] Communication plan for users
- [ ] Recovery and mitigation strategies
\`\`\`

This comprehensive security audit framework ensures robust protection against common and advanced blockchain vulnerabilities while maintaining usability and efficiency.`;
  }

  async troubleshoot(issue) {
    const solutions = {
      smart_contract_bugs: [
        'Conduct thorough static analysis with Slither and Mythril',
        'Implement comprehensive test coverage including edge cases',
        'Use formal verification tools for critical functions',
        'Perform external security audits before mainnet deployment',
        'Follow established patterns from OpenZeppelin library'
      ],
      gas_optimization: [
        'Use events instead of storage for data that doesn\'t need on-chain access',
        'Pack struct variables efficiently to minimize storage slots',
        'Use constant and immutable variables where possible',
        'Optimize loop operations and avoid unnecessary iterations',
        'Consider layer 2 solutions for high-frequency operations'
      ],
      oracle_issues: [
        'Implement multiple oracle sources with median price calculation',
        'Add time-based validation for price staleness',
        'Set reasonable price deviation thresholds',
        'Use chainlink price feeds with proper validation',
        'Implement circuit breakers for extreme price movements'
      ],
      frontend_integration: [
        'Handle wallet connection errors gracefully',
        'Implement proper loading states for blockchain operations',
        'Add transaction status monitoring and user feedback',
        'Cache blockchain data appropriately to reduce RPC calls',
        'Implement proper error handling for failed transactions'
      ],
      scalability_concerns: [
        'Consider layer 2 solutions like Polygon or Arbitrum',
        'Implement state channels for high-frequency interactions',
        'Use batch operations to reduce individual transaction costs',
        'Optimize smart contract architecture for gas efficiency',
        'Consider hybrid on-chain/off-chain architectures'
      ]
    };
    
    return solutions[issue.type] || ['Review blockchain best practices and security documentation'];
  }
}

module.exports = BlockchainSpecialist;