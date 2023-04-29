// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";

import {SSTORE2} from "./lib/sstore2/SSTORE2.sol";

contract GoldStorage is AccessControl {
  // Storage pointers for the SVG layers
  address[400] public svgLayerPointers;

  // Storage pointer for the artwork script
  address public artScriptPointer;

  // Storage pointer for the trait generation script
  address public traitsScriptPointer;

  constructor(address[] memory admins_) {
    _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    for (uint256 i = 0; i < admins_.length; i++) {
      _grantRole(DEFAULT_ADMIN_ROLE, admins_[i]);
    }
  }

  function setSvgLayer(
    uint8 layerIndex,
    string calldata _data
  ) public onlyRole(DEFAULT_ADMIN_ROLE) {
    svgLayerPointers[layerIndex] = SSTORE2.write(bytes(_data));
  }

  function getSvgLayer(uint8 layerIndex) external view returns (string memory) {
    return string(SSTORE2.read(svgLayerPointers[layerIndex]));
  }

  function setArtScript(
    bytes calldata _data
  ) external onlyRole(DEFAULT_ADMIN_ROLE) {
    artScriptPointer = SSTORE2.write(_data);
  }

  function getArtScript() external view returns (bytes memory) {
    return SSTORE2.read(artScriptPointer);
  }

  function setTraitsScript(
    string calldata _data
  ) external onlyRole(DEFAULT_ADMIN_ROLE) {
    traitsScriptPointer = SSTORE2.write(bytes(_data));
  }

  function getTraitsScript() external view returns (string memory) {
    return string(SSTORE2.read(traitsScriptPointer));
  }
}
