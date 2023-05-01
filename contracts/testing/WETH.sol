// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WETH is ERC20 {
  constructor() ERC20("Wrapped Ether", "WETH") {}

  function mint(address to, uint256 amt) public {
    _mint(to, amt);
  }
}
