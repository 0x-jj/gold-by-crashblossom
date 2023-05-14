// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "./lib/LinearDutchAuction.sol";
import "./lib/ERC721.sol";
import {IScriptyBuilder, WrappedScriptRequest} from "./lib/scripty/IScriptyBuilder.sol";

error NotAuthorized();
error MaxSupplyReached();

/// @title Gold
/// @author @0x_jj
contract Gold is ERC721, PaymentSplitter, Ownable {
  using SafeCast for uint256;

  uint256 public totalSupply = 0;
  uint256 public constant MAX_SUPPLY = 700;

  address public sale;

  address public immutable scriptyStorageAddress;
  address public immutable scriptyBuilderAddress;
  uint256 bufferSize;
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
  uint256 private latestWethBalance;
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
    address wethContract_,
    address _scriptyBuilderAddress,
    address _scriptyStorageAddress,
    uint256 bufferSize_
  ) PaymentSplitter(payees, shares) ERC721("GOLD", "GOLD") {
    scriptyStorageAddress = _scriptyStorageAddress;
    scriptyBuilderAddress = _scriptyBuilderAddress;
    wethContract = IERC20(wethContract_);
    bufferSize = bufferSize_;
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

  function tokenURI(
    uint256 tokenId
  ) public view override returns (string memory) {
    WrappedScriptRequest[] memory requests = new WrappedScriptRequest[](4);

    requests[0].name = "gold_crashblossom_base";
    requests[0].wrapType = 0; // <script>[script]</script>
    requests[0].contractAddress = scriptyStorageAddress;

    requests[1].name = "gold_crashblossom_paths";
    requests[1].wrapType = 2;
    requests[1].contractAddress = scriptyStorageAddress;

    requests[2].name = "gunzipScripts-0.0.1";
    requests[2].wrapType = 0; // <script>[script]</script>
    requests[2].contractAddress = scriptyStorageAddress;

    requests[3].name = "gold_crashblossom_main";
    requests[3].wrapType = 0; // <script>[script]</script>
    requests[3].contractAddress = scriptyStorageAddress;

    bytes memory doubleURLEncodedHTMLDataURI = IScriptyBuilder(
      scriptyBuilderAddress
    ).getHTMLWrappedURLSafe(requests, bufferSize);

    return
      string(
        abi.encodePacked(
          "data:application/json,",
          // url encoded once
          // {"name":"GOLD #<tokenId>", "description":"GOLD is an on-chain generative artwork that changes with the market.","animation_url":"
          "%7B%22name%22%3A%22GOLD%20%23",
          toString(tokenId),
          "%22%2C%20%22description%22%3A%22GOLD%20is%20an%20on-chain%20generative%20artwork%20that%20changes%20with%20the%20market.%22%2C%22animation_url%22%3A%22",
          doubleURLEncodedHTMLDataURI,
          // url encoded once
          // "}
          "%22%7D"
        )
      );
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
    uint256 prevBalance = latestWethBalance;
    uint256 currentBalance = wethContract.balanceOf(address(this)) +
      totalReleased(wethContract);

    if (currentBalance > prevBalance) {
      latestWethBalance = currentBalance;
      wethReceipts[wethReceivedCount % HISTORY_LENGTH] = RoyaltyReceipt(
        block.timestamp.toUint64(),
        (currentBalance - prevBalance).toUint192()
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
      block.timestamp.toUint64(),
      msg.value.toUint192()
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

  function toString(uint256 value) internal pure returns (string memory) {
    // Inspired by OraclizeAPI's implementation - MIT licence
    // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

    if (value == 0) {
      return "0";
    }
    uint256 temp = value;
    uint256 digits;
    while (temp != 0) {
      digits++;
      temp /= 10;
    }
    bytes memory buffer = new bytes(digits);
    while (value != 0) {
      digits -= 1;
      buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
      value /= 10;
    }
    return string(buffer);
  }
}
