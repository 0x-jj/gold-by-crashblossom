// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/access/AccessControl.sol";
import "solady/src/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import {IScriptyBuilder, WrappedScriptRequest} from "./lib/scripty/IScriptyBuilder.sol";

interface IGoldContract {
  struct TokenData {
    uint256 transferCount;
    uint256[30] latestTransferTimestamps;
    uint256 mintTimestamp;
    bytes32 seed;
  }

  // Mapping from token ID to token data
  function tokenData(
    uint256 tokenId
  ) external view returns (uint256, uint256, bytes32);

  function getSelectors() external view returns (string memory, string memory);
}

/// @title GoldRenderer
/// @author @0x_jj
contract GoldRenderer is AccessControl {
  IGoldContract public goldContract;

  address public immutable scriptyStorageAddress;
  address public immutable scriptyBuilderAddress;
  uint256 private bufferSize;

  struct Seed {
    uint256 current;
    uint256 incrementor;
  }

  struct Trait {
    string typeName;
    string valueName;
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
  ) internal view returns (uint256, uint256) {
    (, , bytes32 seed) = goldContract.tokenData(tokenId);
    uint256 seedToken = uint256(seed) % (10 ** 6);
    uint256 tokenSeedIncrement = 999 + tokenId;
    return (seedToken, tokenSeedIncrement);
  }

  function tokenURI(uint256 tokenId) external view returns (string memory) {
    WrappedScriptRequest[] memory requests = new WrappedScriptRequest[](5);

    (uint256 seedToken, uint256 tokenSeedIncrement) = getSeedVariables(tokenId);
    (
      string memory contractMetricsSelector,
      string memory tokenMetricsSelector
    ) = goldContract.getSelectors();

    requests[0].name = "gold_by_crashblossom_base";
    requests[0].wrapType = 0; // <script>[script]</script>
    requests[0].contractAddress = scriptyStorageAddress;

    requests[1].wrapType = 0; // <script>[script]</script>
    requests[1].scriptContent = abi.encodePacked(
      "let u = ",
      toString(seedToken),
      ";",
      "let s = ",
      toString(tokenSeedIncrement),
      ";",
      "let F = ",
      toString(tokenId),
      ";",
      "let q = ",
      toString(1686791700), // TODO: remove hardcode
      ";"
      'let j = "',
      contractMetricsSelector,
      '";',
      'let P = "',
      tokenMetricsSelector,
      '";',
      'let E = "',
      Strings.toHexString(address(goldContract)),
      '";'
    );

    requests[2].name = "gold_by_crashblossom_paths";
    requests[2].wrapType = 2;
    requests[2].contractAddress = scriptyStorageAddress;

    requests[3].name = "gunzipScripts-0.0.1";
    requests[3].wrapType = 0; // <script>[script]</script>
    requests[3].contractAddress = scriptyStorageAddress;

    requests[4].name = "gold_by_crashblossom_main";
    requests[4].wrapType = 0; // <script>[script]</script>
    requests[4].contractAddress = scriptyStorageAddress;

    bytes memory base64EncodedHTMLDataURI = IScriptyBuilder(
      scriptyBuilderAddress
    ).getEncodedHTMLWrapped(
        requests,
        bufferSize + requests[1].scriptContent.length + 17 // "<script>".length + "</script>".length = 17
      );

    bytes memory metadata = abi.encodePacked(
      '{"name":"TEST #',
      toString(tokenId),
      '", "description":"Test description.","animation_url":"',
      base64EncodedHTMLDataURI,
      '", "attributes": [',
      getJSONAttributes(generateAllTraits(tokenId)),
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
    seed.current = (1664525 * seed.current + seed.incrementor) % 89652912;
    return seed.current % 101;
  }

  function generateNumberOfColours(
    Seed memory seed
  ) public view returns (uint256) {
    for (uint256 i = 0; i < _number_of_colors.length; i++) {
      uint256 r = nextInt(seed);
      if (r > 100 - _number_of_color_chances[i]) {
        return _number_of_colors[i];
      }
    }
    return 2; // if nothing else was selected we default to 2 colors
  }

  function generateColourNames(
    uint256 numberOfColours,
    Seed memory seed
  ) public view returns (string[] memory) {
    string[] memory selectedColorNames = new string[](numberOfColours);
    for (uint256 i = 0; i < numberOfColours; i++) {
      uint256 r = nextInt(seed);

      uint256 r2 = nextInt(seed);

      uint256 j = r % color_chance.length;
      string memory c = color_names[j];
      uint256 while_loop_breaker = 300;
      while (r2 < 100 - color_chance[j] || findElement(selectedColorNames, c)) {
        r = nextInt(seed);
        r2 = nextInt(seed);
        j = r % color_chance.length;
        c = color_names[j];
        if (while_loop_breaker <= 0) {
          break;
        } else {
          while_loop_breaker--;
        }
      }
      selectedColorNames[i] = c;
    }

    return selectedColorNames;
  }

  function generateLayerPaths(
    Seed memory seed
  ) public view returns (string[] memory) {
    string[] memory selected_layer_paths = new string[](24);
    uint8[3] memory types = [0, 1, 2];
    uint256[] memory _probabilities;
    uint256 count = 0;
    for (uint256 j = 0; j < types.length; j++) {
      for (uint256 i = 0; i < 8; i++) {
        uint256[] memory _indexes;
        if (types[j] == 0) {
          if (i == 0) {
            _indexes = layer_1_indexes;
            _probabilities = layer_1_probabilities;
          } else if (i == 1) {
            _indexes = layer_2_indexes;
            _probabilities = layer_2_probabilities;
          } else if (i == 2) {
            _indexes = layer_3_indexes;
            _probabilities = layer_3_probabilities;
          } else if (i == 3) {
            _indexes = layer_4_indexes;
            _probabilities = layer_4_probabilities;
          } else if (i == 4) {
            _indexes = layer_5_indexes;
            _probabilities = layer_5_probabilities;
          } else if (i == 5) {
            _indexes = layer_6_indexes;
            _probabilities = layer_6_probabilities;
          } else if (i == 6) {
            _indexes = layer_7_indexes;
            _probabilities = layer_7_probabilities;
          } else if (i == 7) {
            _indexes = layer_8_indexes;
            _probabilities = layer_8_probabilities;
          }
        } else if (types[j] == 1) {
          _indexes = hodl_layer_indexes;
          _probabilities = hodl_probabilities;
        } else if (types[j] == 2) {
          _indexes = milestone_layer_indexes;
          _probabilities = milestone_probabilities;
        }
        uint256 r = nextInt(seed) % _indexes.length;
        uint256 r2 = nextInt(seed);
        string memory p = paths[_indexes[r]];
        uint256 while_loop_breaker = 300;
        while (
          findElement(selected_layer_paths, p) || r2 < 100 - _probabilities[i]
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

  function generateAllTraits(
    uint256 tokenId
  ) public view returns (Trait[] memory) {
    (uint256 tokenSeed, uint256 tokenSeedIncrement) = getSeedVariables(tokenId);

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
    "LS - range",
    "LS - splash",
    "LS - plane",
    "LS - streetlight",
    "LS - glass",
    "LS - left",
    "LS - right",
    "LS - map",
    "LS - fracture",
    "LS - liquid",
    "LS - mosaic",
    "LS - cumulus",
    "S - recall fragment",
    "LS - pointer",
    "LS - cliff",
    "LS - hill",
    "LS - city",
    "LS - sign",
    "S - ship",
    "LS - plus",
    "S - recall flock",
    "S - bug",
    "LS - honeycomb",
    "L - ice large",
    "LS - path",
    "S - footprint small",
    "LS - planet",
    "LS - logo",
    "LS - multiplier",
    "S - fragment",
    "LS - stratus",
    "S - flock",
    "LS - river",
    "S - candle",
    "L - girder",
    "L - elevation",
    "L - urban",
    "L - plan",
    "L - floor",
    "L - ruin",
    "L - corridor",
    "L - wall ",
    "L - pie chart",
    "L - house",
    "L - pod",
    "L - ceiling",
    "L - window displaced",
    "L - modern",
    "L - blueprint",
    "L - road",
    "L - bell curve",
    "L - beam thick",
    "L - perspective",
    "L - flame",
    "L - window pane",
    "L - window poly",
    "L - window frame",
    "L - frame",
    "L - future",
    "L - body",
    "L - beam medium",
    "L - head",
    "L - rural",
    "L - beam thin",
    "L - ripple",
    "L - brain",
    "L - flame high",
    "L - foothill",
    "L - mnemonic",
    "L - jet",
    "L - mountain",
    "L - rockies",
    "L - fingerprint",
    "L - haze",
    "L - skeleton",
    "L - skyline",
    "L - comic",
    "L - ribbon",
    "L - wave",
    "L - footprint large"
  ];

  uint256[] internal layer_1_indexes = [
    34,
    35,
    2,
    36,
    3,
    23,
    11,
    37,
    38,
    14,
    39,
    40,
    41,
    42,
    43
  ];
  uint256[] internal layer_1_probabilities = [
    10,
    10,
    7,
    18,
    20,
    15,
    15,
    10,
    10,
    5,
    10,
    5,
    7,
    17,
    6
  ];
  uint256[] internal layer_2_indexes = [0, 1, 2, 3, 4, 5, 6, 7];
  uint256[] internal layer_2_probabilities = [8, 12, 7, 20, 15, 10, 10, 7];
  uint256[] internal layer_3_indexes = [
    44,
    45,
    0,
    46,
    1,
    47,
    10,
    48,
    49,
    50,
    13,
    4,
    5,
    51,
    52,
    53,
    6,
    7,
    54
  ];
  uint256[] internal layer_3_probabilities = [
    5,
    12,
    8,
    14,
    12,
    15,
    20,
    6,
    15,
    20,
    20,
    15,
    7,
    12,
    10,
    6,
    6,
    7,
    4
  ];
  uint256[] internal layer_4_indexes = [8, 9, 10, 11, 12, 13, 14, 15, 16];
  uint256[] internal layer_4_probabilities = [10, 10, 20, 15, 4, 20, 5, 10, 15];
  uint256[] internal layer_5_indexes = [
    8,
    55,
    56,
    57,
    9,
    19,
    26,
    22,
    58,
    59,
    60,
    15,
    61,
    62,
    63,
    16,
    64,
    65,
    66
  ];
  uint256[] layer_5_probabilities = [
    7,
    15,
    18,
    20,
    10,
    20,
    20,
    15,
    25,
    8,
    9,
    11,
    18,
    12,
    10,
    15,
    10,
    16,
    7
  ];
  uint256[] internal layer_6_indexes = [17, 18, 19, 20, 21, 22, 23, 24, 25];
  uint256[] internal layer_6_probabilities = [10, 4, 20, 2, 3, 15, 15, 10, 20];
  uint256[] internal layer_7_indexes = [
    67,
    32,
    68,
    17,
    69,
    27,
    70,
    28,
    71,
    72,
    24,
    73,
    30,
    74,
    75,
    76,
    77,
    78,
    79
  ];
  uint256[] internal layer_7_probabilities = [
    7,
    11,
    18,
    7,
    13,
    16,
    12,
    20,
    6,
    7,
    9,
    15,
    20,
    17,
    10,
    16,
    15,
    10,
    12
  ];
  uint256[] internal layer_8_indexes = [26, 27, 28, 29, 30, 31, 32, 33];
  uint256[] internal layer_8_probabilities = [20, 10, 20, 25, 20, 20, 10, 27];
  uint256[] internal hodl_layer_indexes = [
    3,
    11,
    45,
    0,
    1,
    10,
    49,
    13,
    4,
    5,
    52,
    6,
    7,
    8,
    9,
    19,
    26,
    22,
    58,
    59,
    15,
    61,
    62,
    16,
    64,
    65,
    67,
    32,
    68,
    17,
    69,
    27,
    70,
    28,
    71,
    24,
    73,
    30,
    74,
    75,
    76,
    78
  ];
  uint256[] internal hodl_probabilities = [
    20,
    15,
    12,
    8,
    12,
    20,
    15,
    20,
    15,
    7,
    10,
    6,
    7,
    7,
    10,
    20,
    20,
    15,
    25,
    8,
    11,
    18,
    12,
    15,
    10,
    16,
    7,
    11,
    18,
    7,
    13,
    16,
    12,
    20,
    6,
    9,
    15,
    20,
    17,
    10,
    16,
    10
  ];
  uint256[] internal milestone_layer_indexes = [
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
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    21,
    22,
    24,
    26,
    27,
    28,
    29,
    30,
    31,
    32,
    33
  ];
  uint256[] internal milestone_probabilities = [
    8,
    12,
    7,
    20,
    15,
    10,
    10,
    7,
    10,
    10,
    20,
    15,
    20,
    5,
    10,
    15,
    10,
    4,
    20,
    3,
    15,
    10,
    20,
    10,
    20,
    25,
    20,
    20,
    10,
    27
  ];

  // number of color chances
  uint256[] internal _number_of_colors = [1, 8, 16, 2, 3, 4];
  uint256[] internal _number_of_color_chances = [5, 5, 5, 20, 50, 10];

  // The names of all color schemes
  string[] internal color_names = [
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
  uint256[] internal color_chance = [
    40,
    30,
    20,
    10,
    8,
    7,
    5,
    4,
    3,
    5,
    5,
    12,
    6,
    5,
    7,
    4,
    5
  ];
}
