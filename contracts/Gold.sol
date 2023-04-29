// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./lib/LinearDutchAuction.sol";
import "./lib/ERC721.sol";

import "./Storage.sol";

error NotAuthorized();
error MaxSupplyReached();

/// @title Gold
/// @author @0x_jj
contract Gold is ERC721, PaymentSplitter, AccessControl, Ownable {
  string private baseURI_ = "https://www.gold.xyz/api/token/metadata/";

  uint256 public totalSupply = 0;
  uint256 public constant MAX_SUPPLY = 700;

  address public sale;

  GoldStorage public storageContract;

  struct TokenData {
    uint256 transferCount;
    uint256[HISTORY_LENGTH] latestTransferTimestamps;
    uint256 mintTimestamp;
    bytes32 seed;
  }

  // Mapping from token ID to token data
  mapping(uint256 => TokenData) public tokenData;

  // Amount of ETH received by the contract ever
  uint256 public totalEthReceived;

  // Amount of ETH received by the contract the last 2 occasions, to compare if it went up or down
  uint256 public latestEthReceived;
  uint256 public previousEthReceived;

  // Number of transfers that have happened on the contract
  uint256 public transferCount;

  // Timestamp of the last transfer that happened on the contract
  uint256[HISTORY_LENGTH] public latestTransferTimestamps;

  constructor(
    address[] memory payees,
    uint256[] memory shares,
    address[] memory admins_
  ) PaymentSplitter(payees, shares) ERC721("GOLD", "GOLD") {
    _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    for (uint256 i = 0; i < admins_.length; i++) {
      _grantRole(DEFAULT_ADMIN_ROLE, admins_[i]);
    }
    storageContract = new GoldStorage(admins_);
  }

  function setSaleAddress(address _sale) external onlyRole(DEFAULT_ADMIN_ROLE) {
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
    tokenData[tokenId].transferCount++;
    transferCount++;

    latestTransferTimestamps[transferCount % HISTORY_LENGTH] = block.timestamp;

    tokenData[tokenId].latestTransferTimestamps[
      tokenData[tokenId].transferCount % HISTORY_LENGTH
    ] = block.timestamp;
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(ERC721, AccessControl) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  receive() external payable override {
    emit PaymentReceived(_msgSender(), msg.value);
    totalEthReceived += msg.value;
    previousEthReceived = latestEthReceived;
    latestEthReceived = msg.value;
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
      uint256,
      bool
    )
  {
    return (
      approvalCount,
      latestApprovalTimestamps,
      transferCount,
      latestTransferTimestamps,
      totalEthReceived,
      getHolderCount(),
      latestEthReceived > previousEthReceived
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
