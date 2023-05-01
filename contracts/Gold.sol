// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./lib/LinearDutchAuction.sol";
import "./lib/ERC721.sol";

import "./Storage.sol";

error NotAuthorized();
error MaxSupplyReached();

/// @title Gold
/// @author @0x_jj
contract Gold is ERC721, PaymentSplitter, Ownable {
  string private baseURI_ = "https://www.gold.xyz/api/token/metadata/";

  uint256 public totalSupply = 0;
  uint256 public constant MAX_SUPPLY = 700;

  address public sale;

  GoldStorage public storageContract;
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
    uint256 timestamp;
    uint256 amount;
  }
  uint256 public ethReceivedCount;
  RoyaltyReceipt[HISTORY_LENGTH] public ethReceipts;

  // Track WETH roughly by checking balances between transfers
  uint256[HISTORY_LENGTH] public wethBalanceHistory;
  RoyaltyReceipt[HISTORY_LENGTH] public wethReceipts;
  uint256 public wethReceivedCount;

  // Number of transfers that have happened on the contract
  uint256 public transferCount;

  // Timestamp of the last transfer that happened on the contract
  uint256[HISTORY_LENGTH] public latestTransferTimestamps;

  constructor(
    address[] memory payees,
    uint256[] memory shares,
    address[] memory admins_,
    address wethContract_
  ) PaymentSplitter(payees, shares) ERC721("GOLD", "GOLD") {
    storageContract = new GoldStorage(admins_);
    wethContract = IERC20(wethContract_);
  }

  function setSaleAddress(address _sale) external onlyOwner {
    sale = _sale;
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

  function _baseURI() internal view override returns (string memory) {
    return baseURI_;
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
    uint256 prevIndex = wethReceivedCount == 0
      ? 0
      : (wethReceivedCount - 1) % HISTORY_LENGTH;
    uint256 index = wethReceivedCount % HISTORY_LENGTH;
    uint256 prevBalance = wethBalanceHistory[prevIndex];
    uint256 currentBalance = wethContract.balanceOf(address(this)) +
      totalReleased(wethContract);
    if (currentBalance > prevBalance) {
      wethBalanceHistory[index] = currentBalance;
      wethReceipts[index] = RoyaltyReceipt(
        block.timestamp,
        currentBalance - prevBalance
      );
      wethReceivedCount++;
    }
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(ERC721) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  receive() external payable override {
    emit PaymentReceived(_msgSender(), msg.value);
    ethReceipts[ethReceivedCount % HISTORY_LENGTH] = RoyaltyReceipt(
      block.timestamp,
      msg.value
    );
    ethReceivedCount += 1;
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
    returns (uint256, uint256[HISTORY_LENGTH] memory, uint256, bytes32)
  {
    return (
      tokenData[tokenId].transferCount,
      tokenData[tokenId].latestTransferTimestamps,
      tokenData[tokenId].mintTimestamp,
      tokenData[tokenId].seed
    );
  }
}
