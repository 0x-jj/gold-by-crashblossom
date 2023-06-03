// SPDX-License-Identifier: MIT
// Copyright (c) 2021 the ethier authors (github.com/divergencetech/ethier)
pragma solidity >=0.8.0 <0.9.0;

import "@divergencetech/ethier/contracts/utils/Monotonic.sol";
import "@divergencetech/ethier/contracts/utils/OwnerPausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "hardhat/console.sol";

/**
@notice An abstract contract providing the _purchase() function to:
 - Enforce per-wallet / per-transaction limits
 - Calculate required cost, forwarding to a beneficiary, and refunding extra
 */
abstract contract Seller is OwnerPausable, ReentrancyGuard {
  using Address for address payable;
  using Monotonic for Monotonic.Increaser;
  using Strings for uint256;
  using SafeCast for uint256;

  /**
    @dev Note that the address limits are vulnerable to wallet farming.
    @param maxPerAddress Unlimited if zero.
    @param maxPerTex Unlimited if zero.
    @param freeQuota Maximum number that can be purchased free of charge by
    the contract owner.
    @param reserveFreeQuota Whether to excplitly reserve the freeQuota amount
    and not let it be eroded by regular purchases.
    @param lockFreeQuota If true, calls to setSellerConfig() will ignore changes
    to freeQuota. Can be locked after initial setting, but not unlocked. This
    allows a contract owner to commit to a maximum number of reserved items.
    @param lockTotalInventory Similar to lockFreeQuota but applied to
    totalInventory.
    */
  struct SellerConfig {
    uint256 totalInventory;
    uint256 maxPerAddress;
    uint256 maxPerTx;
    uint248 freeQuota;
    bool reserveFreeQuota;
    bool lockFreeQuota;
    bool lockTotalInventory;
    bool allowRebates;
  }

  struct Receipt {
    uint232 netPosted;
    uint24 numPurchased;
  }
  mapping(address => Receipt) public receipts;
  uint256 public latestPurchasePrice;
  event ReceiptUpdated(
    address indexed recipient,
    uint256 numPurchased,
    uint256 netPosted
  );
  event RebateProcessed(address indexed recipient, uint256 amount);
  event RevenueWithdrawn();

  constructor(SellerConfig memory config, address payable _beneficiary) {
    setSellerConfig(config);
    setBeneficiary(_beneficiary);
  }

  /// @notice Configuration of purchase limits.
  SellerConfig public sellerConfig;

  /// @notice Sets the seller config.
  function setSellerConfig(SellerConfig memory config) public onlyOwner {
    require(
      config.totalInventory >= config.freeQuota,
      "Seller: excessive free quota"
    );
    require(
      config.totalInventory >= _totalSold.current(),
      "Seller: inventory < already sold"
    );
    require(
      config.freeQuota >= purchasedFreeOfCharge.current(),
      "Seller: free quota < already used"
    );

    // Overriding the in-memory fields before copying the whole struct, as
    // against writing individual fields, gives a greater guarantee of
    // correctness as the code is simpler to read.
    if (sellerConfig.lockTotalInventory) {
      config.lockTotalInventory = true;
      config.totalInventory = sellerConfig.totalInventory;
    }
    if (sellerConfig.lockFreeQuota) {
      config.lockFreeQuota = true;
      config.freeQuota = sellerConfig.freeQuota;
    }
    sellerConfig = config;
  }

  /// @notice Recipient of revenues.
  address payable public beneficiary;

  /// @notice Sets the recipient of revenues.
  function setBeneficiary(address payable _beneficiary) public onlyOwner {
    beneficiary = _beneficiary;
  }

  /**
    @dev Must return the current cost of a batch of items. This may be constant
    or, for example, decreasing for a Dutch auction or increasing for a bonding
    curve.
    @param n The number of items being purchased.
    @param metadata Arbitrary data, propagated by the call to _purchase() that
    can be used to charge different prices. This value is a uint256 instead of
    bytes as this allows simple passing of a set cost (see
    ArbitraryPriceSeller).
     */
  function cost(
    uint256 n,
    uint256 metadata
  ) public view virtual returns (uint256);

  /**
    @dev Called by both _purchase() and purchaseFreeOfCharge() after all limits
    have been put in place; must perform all contract-specific sale logic, e.g.
    ERC721 minting. When _handlePurchase() is called, the value returned by
    Seller.totalSold() will be the POST-purchase amount to allow for the
    checks-effects-interactions (ECI) pattern as _handlePurchase() may include
    an interaction. _handlePurchase() MUST itself implement the CEI pattern.
    @param to The recipient of the item(s).
    @param n The number of items allowed to be purchased, which MAY be less than
    to the number passed to _purchase() but SHALL be greater than zero.
    @param freeOfCharge Indicates that the call originated from
    purchaseFreeOfCharge() and not _purchase().
    */
  function _handlePurchase(
    address to,
    uint256 n,
    bool freeOfCharge
  ) internal virtual;

  /**
    @notice Tracks total number of items sold by this contract, including those
    purchased free of charge by the contract owner.
     */
  Monotonic.Increaser private _totalSold;

  /// @notice Returns the total number of items sold by this contract.
  function totalSold() public view returns (uint256) {
    return _totalSold.current();
  }

  /**
    @notice Tracks the number of items already bought by an address, regardless
    of transferring out (in the case of ERC721).
    @dev This isn't public as it may be skewed due to differences in msg.sender
    and tx.origin, which it treats in the same way such that
    sum(_bought)>=totalSold().
     */
  mapping(address => uint256) private _bought;

  /**
    @notice Returns min(n, max(extra items addr can purchase)) and reverts if 0.
    @param zeroMsg The message with which to revert on 0 extra.
     */
  function _capExtra(
    uint256 n,
    address addr,
    string memory zeroMsg
  ) internal view returns (uint256) {
    uint256 extra = sellerConfig.maxPerAddress - _bought[addr];
    if (extra == 0) {
      revert(string(abi.encodePacked("Seller: ", zeroMsg)));
    }
    return Math.min(n, extra);
  }

  /// @notice Emitted when a buyer is refunded.
  event Refund(address indexed buyer, uint256 amount);

  /// @notice Emitted on all purchases of non-zero amount.
  event Revenue(uint256 numPurchased, uint256 amount);

  /// @notice Tracks number of items purchased free of charge.
  Monotonic.Increaser private purchasedFreeOfCharge;

  /// @notice Number of times a non-zero amount was paid for a purchase.
  uint256 public numSettleableInvocations;

  /**
    @notice Allows the contract owner to purchase without payment, within the
    quota enforced by the SellerConfig.
     */
  function purchaseFreeOfCharge(
    address to,
    uint256 n
  ) public onlyOwner whenNotPaused {
    /**
     * ##### CHECKS
     */

    uint256 freeQuota = sellerConfig.freeQuota;
    n = Math.min(n, freeQuota - purchasedFreeOfCharge.current());
    require(n > 0, "Seller: Free quota exceeded");

    uint256 totalInventory = sellerConfig.totalInventory;
    n = Math.min(n, totalInventory - _totalSold.current());
    require(n > 0, "Seller: Sold out");

    /**
     * ##### EFFECTS
     */
    _totalSold.add(n);
    purchasedFreeOfCharge.add(n);

    /**
     * ##### INTERACTIONS
     */
    _handlePurchase(to, n, true);
    assert(_totalSold.current() <= totalInventory);
    assert(purchasedFreeOfCharge.current() <= freeQuota);
  }

  /**
    @notice Convenience function for calling _purchase() with empty costMetadata
    when unneeded.
     */
  function _purchase(address to, uint256 requested) internal virtual {
    _purchase(to, requested, 0);
  }

  /**
    @notice Enforces all purchase limits (counts and costs) before calling
    _handlePurchase().
    @param to The final recipient of the item(s).
    @param requested The number of items requested for purchase, which MAY be
    reduced when passed to _handlePurchase().
    @param costMetadata Arbitrary data, propagated in the call to cost(), to be
    optionally used in determining the price.
     */
  function _purchase(
    address to,
    uint256 requested,
    uint256 costMetadata
  ) internal nonReentrant whenNotPaused {
    /**
     * ##### CHECKS
     */
    SellerConfig memory config = sellerConfig;

    uint256 n = config.maxPerTx == 0
      ? requested
      : Math.min(requested, config.maxPerTx);

    uint256 maxAvailable;
    uint256 sold;

    if (config.reserveFreeQuota) {
      maxAvailable = config.totalInventory - config.freeQuota;
      sold = _totalSold.current() - purchasedFreeOfCharge.current();
    } else {
      maxAvailable = config.totalInventory;
      sold = _totalSold.current();
    }

    n = Math.min(n, maxAvailable - sold);
    require(n > 0, "Seller: Sold out");

    if (config.maxPerAddress > 0) {
      bool alsoLimitSender = _msgSender() != to;
      // solhint-disable-next-line avoid-tx-origin
      bool alsoLimitOrigin = tx.origin != _msgSender() && tx.origin != to;

      n = _capExtra(n, to, "Buyer limit");
      if (alsoLimitSender) {
        n = _capExtra(n, _msgSender(), "Sender limit");
      }
      if (alsoLimitOrigin) {
        // solhint-disable-next-line avoid-tx-origin
        n = _capExtra(n, tx.origin, "Origin limit");
      }

      _bought[to] += n;
      if (alsoLimitSender) {
        _bought[_msgSender()] += n;
      }
      if (alsoLimitOrigin) {
        // solhint-disable-next-line avoid-tx-origin
        _bought[tx.origin] += n;
      }
    }

    uint256 _cost = cost(n, costMetadata);
    if (msg.value < _cost) {
      revert(
        string(
          abi.encodePacked("Seller: Costs ", (_cost / 1e9).toString(), " GWei")
        )
      );
    }

    /**
     * ##### EFFECTS
     */
    _totalSold.add(n);
    assert(_totalSold.current() <= config.totalInventory);

    Receipt storage receipt = receipts[_msgSender()];
    uint256 netPosted = receipt.netPosted + _cost;
    uint256 numPurchased = receipt.numPurchased + 1;

    receipt.netPosted = uint232(netPosted);
    receipt.numPurchased = uint24(numPurchased);

    // emit event indicating new receipt state
    emit ReceiptUpdated(_msgSender(), numPurchased, netPosted);

    if (_cost > 0) {
      latestPurchasePrice = _cost;
      numSettleableInvocations += 1;

      emit Revenue(n, _cost);
    }

    /**
     * ##### INTERACTIONS
     */

    // As _handlePurchase() is often an ERC721 safeMint(), it constitutes an
    // interaction.
    _handlePurchase(to, n, false);

    if (msg.value > _cost) {
      address payable reimburse = payable(_msgSender());
      uint256 refund = msg.value - _cost;

      // Using Address.sendValue() here would mask the revertMsg upon
      // reentrancy, but we want to expose it to allow for more precise
      // testing. This otherwise uses the exact same pattern as
      // Address.sendValue().
      // solhint-disable-next-line avoid-low-level-calls
      (bool success, bytes memory returnData) = reimburse.call{value: refund}(
        ""
      );
      // Although `returnData` will have a spurious prefix, all we really
      // care about is that it contains the ReentrancyGuard reversion
      // message so we can check in the tests.
      require(success, string(returnData));

      emit Refund(reimburse, refund);
    }
  }

  /**
   * @notice Refunds the sender's payment above current settled price.
   * The current settled price is the the price paid
   * for the most recently purchased token.
   * This function is callable at any point, but is expected to typically be
   * called after auction has sold out above base price or after the auction
   * has been purchased at base price. This minimizes the amount of gas
   * required to send all funds.
   */
  function processRebate() public nonReentrant returns (uint256) {
    require(sellerConfig.allowRebates, "Rebates not allowed");
    address payable _to = payable(_msgSender());

    Receipt storage receipt = receipts[_to];
    uint256 numPurchased = receipt.numPurchased;
    // CHECKS
    // input validation
    require(_to != address(0), "No claiming to the zero address");
    // require that a user has purchased at least one token on this project
    require(numPurchased > 0, "No purchases made by this address");
    // get the latestPurchasePrice, which returns the sellout price if the
    // auction sold out before reaching base price, or returns the base
    // price if auction has reached base price and artist has withdrawn
    // revenues.
    // @dev if user is eligible for a reclaiming, they have purchased a
    // token, therefore we are guaranteed to have a populated
    // latestPurchasePrice

    // EFFECTS
    // calculate the excess funds amount
    uint256 requiredAmountPosted = numPurchased * latestPurchasePrice;
    uint256 excessPosted = receipt.netPosted - requiredAmountPosted;

    // update Receipt in storage
    receipt.netPosted = requiredAmountPosted.toUint232();
    // emit event indicating new receipt state and the rebate amount
    emit ReceiptUpdated(_to, numPurchased, requiredAmountPosted);
    emit RebateProcessed(_to, excessPosted);

    // INTERACTIONS
    bool success_;
    (success_, ) = _to.call{value: excessPosted}("");
    require(success_, "Rebate failed");

    return excessPosted;
  }
}
