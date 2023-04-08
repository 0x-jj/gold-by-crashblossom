// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./lib/LinearDutchAuction.sol";
import "./lib/ERC721.sol";

error NotAuthorized();
error MaxSupplyReached();

/// @title Gold
/// @author @0x_jj
contract Gold is ERC721, PaymentSplitter, AccessControl, Ownable {
  string private baseURI_ = "https://www.gold.xyz/api/token/metadata/";

  uint256 public totalSupply = 0;
  uint256 public constant MAX_SUPPLY = 700;

  address public sale;

  struct TokenData {
    uint256 transferCount;
    uint256 lastTransferTimestamp;
    uint256 gasUsed;
  }

  // Mapping from token ID to token data
  mapping(uint256 => TokenData) public tokenData;

  // Amount of ETH received by the contract ever
  uint256 public totalEthReceived;

  // Number of transfers that have happened on the contract
  uint256 public transferCount;

  // Timestamp of the last transfer that happened on the contract
  uint256 public lastTransferTimestamp;

  // SVG layers
  string[22] public layers;

  constructor(
    address[] memory payees,
    uint256[] memory shares,
    address[] memory admins_
  ) PaymentSplitter(payees, shares) ERC721("GOLD", "GOLD") {
    _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    for (uint256 i = 0; i < admins_.length; i++) {
      _grantRole(DEFAULT_ADMIN_ROLE, admins_[i]);
    }
  }

  function setSaleAddress(address _sale) external onlyRole(DEFAULT_ADMIN_ROLE) {
    sale = _sale;
  }

  function setLayer(
    uint8 index,
    string memory data
  ) external onlyRole(DEFAULT_ADMIN_ROLE) {
    layers[index] = data;
  }

  function mint(address to) external {
    if (totalSupply >= MAX_SUPPLY) revert MaxSupplyReached();
    if (_msgSender() != sale) revert NotAuthorized();

    uint256 tokenId = totalSupply;
    totalSupply++;
    _safeMint(to, tokenId);
  }

  function _baseURI() internal view override returns (string memory) {
    return baseURI_;
  }

  function _beforeTokenTransfer(
    address,
    address,
    uint256 tokenId,
    uint256
  ) internal override {
    tokenData[tokenId].gasUsed += gasleft();
  }

  function _afterTokenTransfer(
    address from,
    address,
    uint256 tokenId,
    uint256
  ) internal override {
    if (from != address(0)) {
      tokenData[tokenId].transferCount++;
      transferCount++;
    }

    lastTransferTimestamp = block.timestamp;

    tokenData[tokenId].lastTransferTimestamp = block.timestamp;
    tokenData[tokenId].gasUsed -= gasleft();
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(ERC721, AccessControl) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  receive() external payable override {
    emit PaymentReceived(_msgSender(), msg.value);
    totalEthReceived += msg.value;
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
    returns (uint256, uint256, uint256, uint256, uint256, uint256)
  {
    return (
      approvalCount,
      lastApprovalTimestamp,
      transferCount,
      lastTransferTimestamp,
      totalEthReceived,
      getHolderCount()
    );
  }

  function getTokenMetrics(
    uint256 tokenId
  ) external view returns (uint256, uint256, uint256) {
    return (
      tokenData[tokenId].transferCount,
      tokenData[tokenId].lastTransferTimestamp,
      tokenData[tokenId].gasUsed
    );
  }
}
