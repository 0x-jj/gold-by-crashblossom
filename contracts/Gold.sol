// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import {PaymentSplitter} from "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {LinearDutchAuction} from "./lib/LinearDutchAuction.sol";
import {ERC721} from "./lib/ERC721.sol";

error NotAuthorized();
error MaxSupplyReached();
error ClaimingTooEarly();

interface IGoldRenderer {
  function tokenURI(uint256 tokenId) external view returns (string memory);
}

/// @title Gold
/// @author @0x_jj
contract Gold is ERC721, PaymentSplitter, AccessControl, Ownable {
  using SafeCast for uint256;

  uint256 public totalSupply = 0;
  uint256 public constant MAX_SUPPLY = 400;

  address public sale;

  IGoldRenderer public goldRenderer;
  IERC20 public wethContract;

  struct TokenData {
    uint256 transferCount;
    uint256[HISTORY_LENGTH] latestTransferTimestamps;
    uint256 mintTimestamp;
    bytes32 seed;
    address held6MonthsClaimedBy;
    address held12MonthsClaimedBy;
    address held24MonthsClaimedBy;
    address held60MonthsClaimedBy;
    address held120MonthsClaimedBy;
    address held240MonthsClaimedBy;
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

  function claimBonusPlates(uint256 tokenId, uint8 milestone) external {
    if (ownerOf(tokenId) != _msgSender()) revert NotAuthorized();

    uint256 lastTransferTimestamp = latestTransferTimestamp(tokenData[tokenId]);
    uint256 timeSinceLastTransfer = block.timestamp - lastTransferTimestamp;

    if (milestone == 0) {
      if (tokenData[tokenId].held6MonthsClaimedBy != address(0))
        revert NotAuthorized();

      if (timeSinceLastTransfer < 6 * 30 days) revert ClaimingTooEarly();
      tokenData[tokenId].held6MonthsClaimedBy = _msgSender();
    }

    if (milestone == 1) {
      if (tokenData[tokenId].held12MonthsClaimedBy != address(0))
        revert NotAuthorized();

      if (timeSinceLastTransfer < 12 * 30 days) revert ClaimingTooEarly();
      tokenData[tokenId].held12MonthsClaimedBy = _msgSender();
    }

    if (milestone == 2) {
      if (tokenData[tokenId].held24MonthsClaimedBy != address(0))
        revert NotAuthorized();

      if (timeSinceLastTransfer < 24 * 30 days) revert ClaimingTooEarly();
      tokenData[tokenId].held24MonthsClaimedBy = _msgSender();
    }

    if (milestone == 3) {
      if (tokenData[tokenId].held60MonthsClaimedBy != address(0))
        revert NotAuthorized();

      if (timeSinceLastTransfer < 60 * 30 days) revert ClaimingTooEarly();
      tokenData[tokenId].held60MonthsClaimedBy = _msgSender();
    }

    if (milestone == 4) {
      if (tokenData[tokenId].held120MonthsClaimedBy != address(0))
        revert NotAuthorized();

      if (timeSinceLastTransfer < 120 * 30 days) revert ClaimingTooEarly();
      tokenData[tokenId].held120MonthsClaimedBy = _msgSender();
    }

    if (milestone == 5) {
      if (tokenData[tokenId].held240MonthsClaimedBy != address(0))
        revert NotAuthorized();

      if (timeSinceLastTransfer < 240 * 30 days) revert ClaimingTooEarly();
      tokenData[tokenId].held240MonthsClaimedBy = _msgSender();
    }
  }

  function numberOfBonusPlates(uint256 tokenId) public view returns (uint256) {
    uint256 count = 0;
    TokenData memory td = tokenData[tokenId];
    if (td.held6MonthsClaimedBy != address(0)) count++;
    if (td.held12MonthsClaimedBy != address(0)) count++;
    if (td.held24MonthsClaimedBy != address(0)) count++;
    if (td.held60MonthsClaimedBy != address(0)) count++;
    if (td.held120MonthsClaimedBy != address(0)) count++;
    if (td.held240MonthsClaimedBy != address(0)) count++;
    return count;
  }

  function numberOfBonusClusters(
    uint256 tokenId
  ) external view returns (uint256) {
    uint256 count = 0;
    uint256 mintTimestamp = tokenData[tokenId].mintTimestamp;
    if (block.timestamp > (mintTimestamp + (6 * 30 days))) count++;
    if (block.timestamp > (mintTimestamp + (12 * 30 days))) count++;
    if (block.timestamp > (mintTimestamp + (24 * 30 days))) count++;
    if (block.timestamp > (mintTimestamp + (60 * 30 days))) count++;
    if (block.timestamp > (mintTimestamp + (120 * 30 days))) count++;
    if (block.timestamp > (mintTimestamp + (240 * 30 days))) count++;
    return count;
  }

  function mint(address to) public {
    if (totalSupply >= MAX_SUPPLY) revert MaxSupplyReached();
    // TODO: UNCOMMENT - if (_msgSender() != sale) revert NotAuthorized();

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

  // TODO: Remove
  function mintMany(address to, uint256 count) external {
    require(count <= 10, "Can only mint 10 at a time");
    for (uint256 i = 0; i < count; i++) {
      this.mint(to);
    }
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
      stats.latestWethBalance = currentBalance.toUint192();
      wethReceipts[stats.wethReceivedCount % HISTORY_LENGTH] = RoyaltyReceipt(
        block.timestamp.toUint64(),
        (currentBalance - prevBalance).toUint192()
      );
      stats.wethReceivedCount++;

      wethStats = stats;
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
    returns (
      uint256,
      uint256[HISTORY_LENGTH] memory,
      uint256,
      bytes32,
      uint256,
      uint256
    )
  {
    return (
      tokenData[tokenId].transferCount,
      tokenData[tokenId].latestTransferTimestamps,
      tokenData[tokenId].mintTimestamp,
      tokenData[tokenId].seed,
      balanceOf(ownerOf(tokenId)),
      numberOfBonusPlates(tokenId)
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

  function latestTransferTimestamp(
    TokenData memory _tokenData
  ) internal pure returns (uint256) {
    return
      _tokenData.latestTransferTimestamps[
        (_tokenData.transferCount - 1) % HISTORY_LENGTH
      ];
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

  function toHexDigit(uint8 d) internal pure returns (bytes1) {
    if (0 <= d && d <= 9) {
      return bytes1(uint8(bytes1("0")) + d);
    } else if (10 <= uint8(d) && uint8(d) <= 15) {
      return bytes1(uint8(bytes1("a")) + d - 10);
    }
    revert();
  }

  function fromCode(bytes4 code) internal pure returns (string memory) {
    bytes memory result = new bytes(10);
    result[0] = bytes1("0");
    result[1] = bytes1("x");
    for (uint i = 0; i < 4; ++i) {
      result[2 * i + 2] = toHexDigit(uint8(code[i]) / 16);
      result[2 * i + 3] = toHexDigit(uint8(code[i]) % 16);
    }
    return string(result);
  }

  function getSelectors() public pure returns (string memory, string memory) {
    return (
      fromCode(this.getContractMetrics.selector),
      fromCode(this.getTokenMetrics.selector)
    );
  }
}
