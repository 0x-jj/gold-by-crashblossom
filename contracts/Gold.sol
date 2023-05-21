// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "./lib/LinearDutchAuction.sol";
import "./lib/ERC721.sol";

error NotAuthorized();
error MaxSupplyReached();

interface IGoldRenderer {
  function tokenURI(uint256 tokenId) external view returns (string memory);
}

/// @title Gold
/// @author @0x_jj
contract Gold is ERC721, PaymentSplitter, AccessControl, Ownable {
  using SafeCast for uint256;

  uint256 public totalSupply = 0;
  uint256 public constant MAX_SUPPLY = 700;

  address public sale;

  IGoldRenderer public goldRenderer;
  IERC20 public wethContract;

  struct TokenData {
    uint256 transferCount;
    uint256[HISTORY_LENGTH] latestTransferTimestamps;
    uint256 mintTimestamp;
    bytes32 seed;
  }

  // Mapping from token ID to token data
  mapping(uint256 => TokenData) public tokenData;

  // Track when we receive royalty payments
  struct RoyaltyReceipt {
    uint64 timestamp;
    uint192 amount;
  }
  uint256 public ethReceivedCount;
  RoyaltyReceipt[HISTORY_LENGTH] public ethReceipts;

  // Track WETH roughly by checking balances between transfers
  struct WethStats {
    uint64 wethReceivedCount;
    uint192 latestWethBalance;
  }
  WethStats private wethStats;
  RoyaltyReceipt[HISTORY_LENGTH] public wethReceipts;

  // Number of transfers that have happened on the contract
  uint256 public transferCount;

  // Timestamp of the last transfer that happened on the contract
  uint256[HISTORY_LENGTH] public latestTransferTimestamps;

  constructor(
    address[] memory payees,
    uint256[] memory shares,
    address[] memory admins_,
    address wethContract_,
    address goldRenderer_
  ) PaymentSplitter(payees, shares) ERC721("GOLD", "GOLD") {
    _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    for (uint256 i = 0; i < admins_.length; i++) {
      _grantRole(DEFAULT_ADMIN_ROLE, admins_[i]);
    }

    wethContract = IERC20(wethContract_);
    goldRenderer = IGoldRenderer(goldRenderer_);
  }

  function setSaleAddress(address _sale) external onlyRole(DEFAULT_ADMIN_ROLE) {
    sale = _sale;
  }

  function setRendererAddress(
    address _renderer
  ) external onlyRole(DEFAULT_ADMIN_ROLE) {
    goldRenderer = IGoldRenderer(_renderer);
  }

  receive() external payable override {
    emit PaymentReceived(_msgSender(), msg.value);
    ethReceipts[ethReceivedCount % HISTORY_LENGTH] = RoyaltyReceipt(
      block.timestamp.toUint64(),
      msg.value.toUint192()
    );
    ethReceivedCount += 1;
  }

  function tokenURI(
    uint256 tokenId
  ) public view override returns (string memory) {
    return goldRenderer.tokenURI(tokenId);
  }

  function mint(address to) external {
    if (totalSupply >= MAX_SUPPLY) revert MaxSupplyReached();
    if (_msgSender() != sale) revert NotAuthorized();

    uint256 tokenId = totalSupply;
    totalSupply++;
    tokenData[tokenId].mintTimestamp = block.timestamp;
    tokenData[tokenId].seed = keccak256(
      abi.encodePacked(
        blockhash(block.number - 1),
        block.number,
        block.timestamp,
        _msgSender(),
        tokenId
      )
    );
    _safeMint(to, tokenId);
  }

  function _afterTokenTransfer(
    address,
    address,
    uint256 tokenId,
    uint256
  ) internal override {
    // Record latest transfer on contract
    latestTransferTimestamps[transferCount % HISTORY_LENGTH] = block.timestamp;

    // Record latest transfer on token. Unordered, to be sorted by timestamp off chain
    tokenData[tokenId].latestTransferTimestamps[
      tokenData[tokenId].transferCount % HISTORY_LENGTH
    ] = block.timestamp;

    // Increase transfer counts on token and contract. Important so that we can correctly write to history arrays in a loop
    tokenData[tokenId].transferCount++;
    transferCount++;

    // Record WETH receipts, if any, attempting to match how we record native ETH receipts
    // We do this by checking the balance of the contract before and after the transfer, taking into account any WETH that has been released to payees
    // Of course this means we don't know when WETH was received multiple times between two transfers occurring, but that's fine, it's just a rough estimate
    WethStats memory stats = wethStats;
    uint256 prevBalance = stats.latestWethBalance;
    uint256 currentBalance = wethContract.balanceOf(address(this)) +
      totalReleased(wethContract);

    if (currentBalance > prevBalance) {
      wethStats.latestWethBalance = currentBalance.toUint192();
      wethReceipts[
        wethStats.wethReceivedCount % HISTORY_LENGTH
      ] = RoyaltyReceipt(
        block.timestamp.toUint64(),
        (currentBalance - prevBalance).toUint192()
      );
      wethStats.wethReceivedCount++;
    }
  }

  function getContractMetrics()
    external
    view
    returns (
      uint256,
      uint256[HISTORY_LENGTH] memory,
      uint256,
      uint256[HISTORY_LENGTH] memory,
      uint256,
      RoyaltyReceipt[HISTORY_LENGTH] memory,
      RoyaltyReceipt[HISTORY_LENGTH] memory
    )
  {
    return (
      approvalCount,
      latestApprovalTimestamps,
      transferCount,
      latestTransferTimestamps,
      getHolderCount(),
      ethReceipts,
      wethReceipts
    );
  }

  function getTokenMetrics(
    uint256 tokenId
  )
    external
    view
    returns (uint256, uint256[HISTORY_LENGTH] memory, uint256, bytes32, uint256)
  {
    return (
      tokenData[tokenId].transferCount,
      tokenData[tokenId].latestTransferTimestamps,
      tokenData[tokenId].mintTimestamp,
      tokenData[tokenId].seed,
      balanceOf(ownerOf(tokenId))
    );
  }

  function getHolderCount() internal view returns (uint256) {
    uint256 count = 0;
    address[MAX_SUPPLY] memory seen;
    for (uint256 i = 0; i < totalSupply; i++) {
      address owner = ownerOf(i);
      if (findElement(seen, owner) == false) {
        count++;
        seen[i] = owner;
      } else {
        seen[i] = address(0);
      }
    }
    return count;
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(ERC721, AccessControl) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  function findElement(
    address[MAX_SUPPLY] memory arr,
    address element
  ) internal pure returns (bool) {
    for (uint256 i = 0; i < arr.length; i++) {
      if (arr[i] == element) {
        return true;
      }
    }
    return false;
  }
}
