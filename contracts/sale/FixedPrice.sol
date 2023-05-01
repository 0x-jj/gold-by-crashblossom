// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../lib/FixedPriceSeller.sol";
import "@divergencetech/ethier/contracts/utils/DynamicBuffer.sol";
import "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

interface IGold {
  function totalSupply() external view returns (uint256);

  function mint(address to) external;
}

error InvalidProof();

/// @title GoldDutchAuction
/// @author @0x_jj

contract GoldFixedPriceSale is FixedPriceSeller {
  IGold public gold;
  bytes32 public merkleRoot;

  constructor(
    address[] memory payees,
    uint256[] memory shares,
    address _gold
  )
    FixedPriceSeller(
      0.4 ether,
      Seller.SellerConfig({
        totalInventory: 200,
        maxPerAddress: 0, // unlimited
        maxPerTx: 0, // unlimited
        freeQuota: 30,
        reserveFreeQuota: true,
        lockTotalInventory: true,
        lockFreeQuota: true,
        allowRebates: false
      }),
      payable(0)
    )
  {
    gold = IGold(_gold);
    setBeneficiary(payable(new PaymentSplitter(payees, shares)));
  }

  function buy(bytes32[] calldata _proof) external payable {
    bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
    if (!MerkleProof.verify(_proof, merkleRoot, leaf)) revert InvalidProof();

    Seller._purchase(msg.sender, 1);
  }

  function _handlePurchase(address to, uint256 num, bool) internal override {
    for (uint256 i = 0; i < num; i++) {
      gold.mint(to);
    }
  }

  function setMerkleRoot(bytes32 root) external onlyOwner {
    merkleRoot = root;
  }
}
