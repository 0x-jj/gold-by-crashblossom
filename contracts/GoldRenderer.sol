// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/access/AccessControl.sol";
import "solady/src/utils/Base64.sol";

import {IScriptyBuilder, WrappedScriptRequest} from "./lib/scripty/IScriptyBuilder.sol";

interface IGoldContract {}

/// @title GoldRenderer
/// @author @0x_jj
contract GoldRenderer is AccessControl {
  IGoldContract public goldContract;

  address public immutable scriptyStorageAddress;
  address public immutable scriptyBuilderAddress;
  uint256 private bufferSize;

  string public callCode = "0x3bc5de30";

  struct Seed {
    uint256 current;
    uint256 incrementor;
  }

  struct Trait {
    string typeName;
    string valueName;
  }

  struct Traits {
    uint256 numberOfColours;
    string[] colourNames;
    string[] layerPaths;
  }

  constructor(
    address[] memory admins_,
    address _scriptyBuilderAddress,
    address _scriptyStorageAddress,
    uint256 bufferSize_
  ) {
    _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    for (uint256 i = 0; i < admins_.length; i++) {
      _grantRole(DEFAULT_ADMIN_ROLE, admins_[i]);
    }

    scriptyStorageAddress = _scriptyStorageAddress;
    scriptyBuilderAddress = _scriptyBuilderAddress;
    bufferSize = bufferSize_;
  }

  function setGoldContract(
    address _goldContract
  ) public onlyRole(DEFAULT_ADMIN_ROLE) {
    goldContract = IGoldContract(_goldContract);
  }

  function getSeedVariables(
    uint256 tokenId
  ) public view returns (uint256, uint256) {
    return (12345678, 12654123);
  }

  function setCallCode(
    string calldata callCode_
  ) external onlyRole(DEFAULT_ADMIN_ROLE) {
    callCode = callCode_;
  }

  function tokenURI(uint256 tokenId) public view returns (string memory) {
    WrappedScriptRequest[] memory requests = new WrappedScriptRequest[](5);

    (uint256 seedToken, uint256 tokenSeedIncrement) = getSeedVariables(tokenId);

    requests[0].name = "gold_crashblossom_base";
    requests[0].wrapType = 0; // <script>[script]</script>
    requests[0].contractAddress = scriptyStorageAddress;

    requests[1].wrapType = 0; // <script>[script]</script>
    requests[1].scriptContent = abi.encodePacked(
      "let seedToken = ",
      toString(seedToken),
      ";",
      "let tokenSeedIncrement = ",
      toString(tokenSeedIncrement),
      ";"
      "let callCode = ",
      callCode,
      ";"
    );

    requests[2].name = "gold_crashblossom_paths";
    requests[2].wrapType = 2;
    requests[2].contractAddress = scriptyStorageAddress;

    requests[3].name = "gunzipScripts-0.0.1";
    requests[3].wrapType = 0; // <script>[script]</script>
    requests[3].contractAddress = scriptyStorageAddress;

    requests[4].name = "gold_crashblossom_main";
    requests[4].wrapType = 0; // <script>[script]</script>
    requests[4].contractAddress = scriptyStorageAddress;

    bytes memory base64EncodedHTMLDataURI = IScriptyBuilder(
      scriptyBuilderAddress
    ).getEncodedHTMLWrapped(
        requests,
        bufferSize + requests[1].scriptContent.length + 17 // "<script>".length + "</script>".length = 17
      );

    Trait[] memory allTraits = generateAllTraits();

    bytes memory metadata = abi.encodePacked(
      '{"name":"GOLD #',
      toString(tokenId),
      '", "description":"GOLD is an on-chain generative artwork that changes with the market.","animation_url":"',
      base64EncodedHTMLDataURI,
      '", "attributes": [',
      getJSONAttributes(allTraits),
      "]}"
    );

    return
      string(
        abi.encodePacked(
          "data:application/json;base64,",
          Base64.encode(metadata)
        )
      );
  }

  function getJSONAttributes(
    Trait[] memory allTraits
  ) internal pure returns (string memory) {
    string memory attributes;
    uint256 i;
    uint256 length = allTraits.length;
    unchecked {
      do {
        attributes = string(
          abi.encodePacked(
            attributes,
            getJSONTraitItem(allTraits[i], i == length - 1)
          )
        );
      } while (++i < length);
    }
    return attributes;
  }

  function getJSONTraitItem(
    Trait memory trait,
    bool lastItem
  ) internal pure returns (string memory) {
    return
      string(
        abi.encodePacked(
          '{"trait_type": "',
          trait.typeName,
          '", "value": "',
          trait.valueName,
          '"}',
          lastItem ? "" : ","
        )
      );
  }

  function nextInt(Seed memory seed) internal pure returns (uint256) {
    seed.current += seed.incrementor;
    return seed.current % 100;
  }

  function generateNumberOfColours(
    Seed memory seed
  ) public view returns (uint256) {
    for (uint256 i = 0; i < _number_of_color_chances.length; i++) {
      uint256 r = nextInt(seed);
      if (r > 100 - _number_of_color_chances[i]) {
        return i + 1;
      }
    }
    return 2; // if nothing else was selected we default to 2 colors
  }

  function generateColourNames(
    uint256 numberOfColours,
    Seed memory seed
  ) public view returns (string[] memory) {
    string[] memory selectedColorNames = new string[](numberOfColours + 1); // +1 to also store the background colour
    for (uint256 i = 0; i < numberOfColours; i++) {
      uint256 r = nextInt(seed);

      uint256 r2 = nextInt(seed);

      uint256 j = r % color_chance.length;
      string memory c = color_names[j];
      uint256 while_loop_breaker = 50;
      while (r2 < 100 - color_chance[j] || findElement(selectedColorNames, c)) {
        r = nextInt(seed);
        r2 = nextInt(seed);
        j = r % color_chance.length;
        c = color_names[j];
        if (while_loop_breaker <= 0) {
          break;
        } else {
          while_loop_breaker--;
        } // not needed for the JS but may be good idea in Solidity version
      }
      selectedColorNames[i] = c;
    }
    uint256 r3 = nextInt(seed);

    selectedColorNames[selectedColorNames.length - 1] = selectedColorNames[
      r3 % numberOfColours
    ]; // Add the background colour

    return selectedColorNames;
  }

  function generateLayerPaths(
    Seed memory seed
  ) public view returns (string[] memory) {
    string[] memory selected_layer_paths = new string[](24);
    uint8[3] memory types = [0, 1, 2];
    uint256 count = 0;
    for (uint256 j = 0; j < types.length; j++) {
      for (uint256 i = 0; i < 8; i++) {
        uint256[] memory _indexes;
        if (types[j] == 0) {
          if (i == 0) {
            _indexes = layer_1_indexes;
          } else if (i == 1) {
            _indexes = layer_2_indexes;
          } else if (i == 2) {
            _indexes = layer_3_indexes;
          } else if (i == 3) {
            _indexes = layer_4_indexes;
          } else if (i == 4) {
            _indexes = layer_5_indexes;
          } else if (i == 5) {
            _indexes = layer_6_indexes;
          } else if (i == 6) {
            _indexes = layer_7_indexes;
          } else if (i == 7) {
            _indexes = layer_8_indexes;
          }
        } else if (types[j] == 1) {
          _indexes = hodl_layer_indexes;
        } else if (types[j] == 2) {
          _indexes = milestone_layer_indexes;
        }
        uint256 r = nextInt(seed) % _indexes.length;
        uint256 r2 = nextInt(seed);
        string memory p = paths[_indexes[r]];
        uint256 while_loop_breaker = 50;
        while (
          findElement(selected_layer_paths, p) ||
          r2 < 100 - path_probabilities[i]
        ) {
          if (while_loop_breaker <= 0) {
            break;
          } else {
            while_loop_breaker--;
          }
          r = nextInt(seed) % _indexes.length;
          r2 = nextInt(seed);
          p = paths[_indexes[r]];
        }
        selected_layer_paths[count] = p;
        count++;
      }
    }
    return selected_layer_paths;
  }

  function generateAllTraits() public view returns (Trait[] memory) {
    uint256 tokenSeedIncrement = 12654123;
    uint256 tokenSeed = 12345678;

    Seed memory seed = Seed({
      current: tokenSeed,
      incrementor: tokenSeedIncrement
    });

    uint256 numberOfColours = generateNumberOfColours(seed);
    string[] memory selectedColours = generateColourNames(
      numberOfColours,
      seed
    );
    string[] memory layerPaths = generateLayerPaths(seed);

    Trait[] memory allTraits = new Trait[](
      selectedColours.length + layerPaths.length
    );

    for (uint256 i = 0; i < selectedColours.length; i++) {
      allTraits[i] = Trait({
        typeName: string(abi.encodePacked("Colour ", toString(i + 1))),
        valueName: selectedColours[i]
      });
    }

    for (uint256 i = 0; i < layerPaths.length; i++) {
      allTraits[i + selectedColours.length] = Trait({
        typeName: string(abi.encodePacked("Layer ", toString(i + 1))),
        valueName: layerPaths[i]
      });
    }

    return allTraits;
  }

  function stringEq(
    string memory a,
    string memory b
  ) internal pure returns (bool result) {
    assembly {
      result := eq(
        keccak256(add(a, 0x20), mload(a)),
        keccak256(add(b, 0x20), mload(b))
      )
    }
  }

  function findElement(
    string[] memory arr,
    string memory element
  ) internal pure returns (bool) {
    for (uint256 i = 0; i < arr.length; i++) {
      if (stringEq(arr[i], element)) {
        return true;
      }
    }
    return false;
  }

  function findElement(
    uint[] memory arr,
    uint element
  ) internal pure returns (bool) {
    for (uint256 i = 0; i < arr.length; i++) {
      if (arr[i] == element) {
        return true;
      }
    }
    return false;
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

  string[] public paths = [
    "LS - jut right",
    "LS - plane",
    "LS - streetlight",
    "LS - flame 2",
    "LS - glass",
    "LS - chart medium",
    "LS - splash",
    "LS - jut left",
    "LS - city",
    "S - recall1",
    "LS clouds2",
    "LS - hill",
    "LS - cliff edge",
    "LS - mosaic",
    "LS - liquid",
    "LS - pointer",
    "LS - hexagon",
    "S - footprint",
    "S - space sign",
    "LS - road",
    "S - tile",
    "S - ice",
    "LS - +",
    "S - recall2",
    "LS - sign",
    "LS - planet",
    "LS - cloud",
    "LS - ribbon2",
    "LS - triangle",
    "S - fragment",
    "S - flock",
    "LS - X",
    "S - candle",
    "L - girder",
    "L - urban",
    "L - ice",
    "L - floor",
    "L - ruin",
    "L - corridor",
    "L - semicircle",
    "L - distressed",
    "L - wall ",
    "L - house",
    "L - road2",
    "L - elevation",
    "L - pod",
    "L - window 2",
    "L - ceiling",
    "L - modern",
    "L - blueprint",
    "L - bell curve",
    "LS - cliff",
    "L - beam thick",
    "L - window displaced",
    "L - flame",
    "L - perspective",
    "L - brain",
    "L - beam thin",
    "L - rural",
    "L - frame",
    "L - head",
    "L - wave 2",
    "L - body",
    "L - flame 3",
    "L - future",
    "L - window frame",
    "L - beam medium",
    "LS - fracture",
    "L - window poly",
    "L - footprint",
    "L - comic",
    "L - skyline",
    "L - skeleton",
    "L - chart low",
    "L - flame3",
    "L - wave 3",
    "L - mountain",
    "L - water jet",
    "L - wave 1",
    "L - ribbon",
    "L - future2",
    "L - chart high",
    "L - sale",
    "L - approval",
    "L - flip",
    "L - send"
  ];

  uint256[] public path_probabilities = [
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90,
    90
  ];
  uint256[] public layer_1_indexes = [
    33,
    34,
    35,
    36,
    1,
    2,
    37,
    38,
    39,
    40,
    41,
    5,
    42,
    43,
    44,
    26
  ];
  uint256[] public layer_2_indexes = [0, 1, 2, 3, 4, 5, 6, 7];
  uint256[] public layer_3_indexes = [
    0,
    13,
    3,
    4,
    7,
    10,
    45,
    46,
    47,
    48,
    49,
    50,
    51,
    52,
    53,
    54,
    55
  ];
  uint256[] public layer_4_indexes = [8, 9, 10, 11, 12, 13, 14, 15];
  uint256[] public layer_5_indexes = [
    8,
    11,
    14,
    16,
    22,
    25,
    56,
    57,
    58,
    59,
    60,
    61,
    62,
    63,
    64,
    65,
    66,
    67,
    68
  ];
  uint256[] public layer_6_indexes = [16, 17, 18, 19, 20, 21, 22, 23, 24];
  uint256[] public layer_7_indexes = [
    15,
    19,
    24,
    26,
    27,
    28,
    31,
    69,
    70,
    71,
    72,
    73,
    74,
    75,
    76,
    77,
    78,
    79,
    80,
    81
  ];
  uint256[] public layer_8_indexes = [32, 25, 26, 27, 28, 29, 30, 31];
  uint256[] public hodl_layer_indexes = [
    0,
    2,
    3,
    4,
    5,
    7,
    8,
    10,
    11,
    13,
    14,
    15,
    16,
    19,
    22,
    24,
    25,
    26,
    27,
    28,
    31,
    35,
    47,
    56,
    57,
    58,
    59,
    60,
    61,
    62,
    63,
    64,
    65,
    66,
    67,
    68,
    69,
    70,
    71,
    72,
    73,
    74,
    75,
    76,
    77,
    78,
    79,
    80,
    81,
    82,
    83,
    84,
    85
  ];
  uint256[] public milestone_layer_indexes = [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
    32
  ];

  // number of color chances - index 0 corresponds to 1 color, index 15 to 16 colors
  uint256[] public _number_of_color_chances = [
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10
  ];

  // The names of all color schemes
  string[] public color_names = [
    "goldenhour",
    "dawn",
    "ibiza",
    "southbeach",
    "mist",
    "dusk",
    "platinum",
    "palladium",
    "rhodium",
    "ipanema",
    "malibu",
    "night",
    "maldives",
    "venicebeach",
    "sunset",
    "vegas",
    "cannes"
  ];
  uint256[] public color_chance = [
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10
  ];
}
