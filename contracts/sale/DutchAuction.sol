// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../lib/LinearDutchAuction.sol";
import "@divergencetech/ethier/contracts/utils/DynamicBuffer.sol";
import "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IGold {
  function totalSupply() external view returns (uint256);

  function mint(address to) external;
}

/// @title GoldDutchAuction
/// @author @0x_jj

contract GoldDutchAuction is LinearDutchAuction {
  IGold public gold;

  struct Receipt {
    // max uint232 allows for > 1e51 ETH (much more than max supply)
    uint232 netPosted;
    // max uint24 still allows for > max project supply of 1 million tokens
    uint24 numPurchased;
  }

  constructor(
    address[] memory payees,
    uint256[] memory shares,
    address _gold
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
        totalInventory: 500,
        maxPerAddress: 0, // unlimited
        maxPerTx: 0, // unlimited
        freeQuota: 0,
        reserveFreeQuota: true,
        lockTotalInventory: true,
        lockFreeQuota: true
      }),
      payable(0)
    )
  {
    gold = IGold(_gold);
    setBeneficiary(payable(new PaymentSplitter(payees, shares)));
  }

  function buy() external payable {
    Seller._purchase(msg.sender, 1);
  }

  function _handlePurchase(address to, uint256 num, bool) internal override {
    for (uint256 i = 0; i < num; i++) {
      gold.mint(to);
    }
  }
}
