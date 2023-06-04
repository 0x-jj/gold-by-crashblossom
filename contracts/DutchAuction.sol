// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./lib/LinearDutchAuction.sol";
import "@divergencetech/ethier/contracts/utils/DynamicBuffer.sol";
import "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

interface IGold {
  function totalSupply() external view returns (uint256);

  function mint(address to) external;
}

/// @title GoldDutchAuction
/// @author @0x_jj

contract GoldDutchAuction is LinearDutchAuction {
  IGold public gold;

  bytes32 public discountMerkleRoot;

  constructor(
    address[] memory payees,
    uint256[] memory shares,
    address _gold,
    bytes32 _discountMerkleRoot
  )
    LinearDutchAuction(
      LinearDutchAuction.DutchAuctionConfig({
        startPoint: 0, // disabled upon deployment
        startPrice: 4 ether,
        unit: AuctionIntervalUnit.Time,
        decreaseInterval: 300, // 5 minutes
        decreaseSize: 0.2 ether,
        numDecreases: 18
      }),
      0.4 ether,
      Seller.SellerConfig({
        totalInventory: 400,
        maxPerAddress: 0, // unlimited
        maxPerTx: 0, // unlimited
        freeQuota: 0,
        reserveFreeQuota: true,
        lockTotalInventory: true,
        lockFreeQuota: true,
        allowRebates: true
      }),
      payable(0)
    )
  {
    gold = IGold(_gold);
    setBeneficiary(payable(new PaymentSplitter(payees, shares)));
    discountMerkleRoot = _discountMerkleRoot;
  }

  function buy() external payable {
    Seller._purchase(msg.sender, 1);
  }

  function _handlePurchase(address to, uint256 num, bool) internal override {
    for (uint256 i = 0; i < num; i++) {
      gold.mint(to);
    }
  }

  function setDiscountMerkleRoot(bytes32 _discountMerkleRoot)
    external
    onlyOwner
  {
    discountMerkleRoot = _discountMerkleRoot;
  }

  function _applyDiscount(
    address buyer,
    uint256 cost,
    bytes32[] calldata _merkleProof
  ) internal view override returns (uint256) {
    require(discountMerkleRoot != bytes32(0), "Merkle root not set");

    uint256 discountedCost = cost;

    uint16[3] memory discountBps = [2500, 2250, 2000];

    for (uint256 i = 0; i < discountBps.length; i++) {
      bytes32 leaf = keccak256(abi.encodePacked(buyer, discountBps[i]));
      if (MerkleProof.verify(_merkleProof, discountMerkleRoot, leaf)) {
        uint256 discount = (cost * discountBps[i]) / 10000;
        discountedCost = cost - discount;
        break;
      }
    }
     
   return discountedCost;
  }
}
