// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Base64} from "solady/src/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {IScriptyBuilder, WrappedScriptRequest} from "./lib/scripty/IScriptyBuilder.sol";

interface IGoldContract {
  struct TokenData {
    uint256 transferCount;
    uint256[200] latestTransferTimestamps;
    uint256 mintTimestamp;
    bytes32 seed;
  }

  // Mapping from token ID to token data
  function tokenData(
    uint256 tokenId
  ) external view returns (uint256, uint256, bytes32);

  function getSelectors() external view returns (string memory, string memory);

  function numberOfBonusPlates(uint256 tokenId) external view returns (uint256);

  function numberOfBonusClusters(
    uint256 tokenId
  ) external view returns (uint256);

  function totalSupply() external view returns (uint256);
}

/// @title GoldRenderer
/// @author @0x_jj
contract GoldRenderer is AccessControl {
  IGoldContract public goldContract;

  address public immutable scriptyStorageAddress;
  address public immutable scriptyBuilderAddress;
  uint256 private bufferSize;

  string public baseImageURI;

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
    uint256 bufferSize_,
    string memory baseImageURI_
  ) {
    _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    for (uint256 i = 0; i < admins_.length; i++) {
      _grantRole(DEFAULT_ADMIN_ROLE, admins_[i]);
    }

    scriptyStorageAddress = _scriptyStorageAddress;
    scriptyBuilderAddress = _scriptyBuilderAddress;
    bufferSize = bufferSize_;
    baseImageURI = baseImageURI_;
  }

  function setGoldContract(
    address _goldContract
  ) public onlyRole(DEFAULT_ADMIN_ROLE) {
    goldContract = IGoldContract(_goldContract);
  }

  function setBaseImageURI(
    string calldata uri
  ) public onlyRole(DEFAULT_ADMIN_ROLE) {
    baseImageURI = uri;
  }

  function getSeedVariables(
    uint256 tokenId
  ) internal view returns (uint256, uint256, uint256) {
    (, uint256 mintTimestamp, bytes32 seed) = goldContract.tokenData(tokenId);
    uint256 seedToken = uint256(seed) % (10 ** 6);
    uint256 tokenSeedIncrement = 999 + tokenId;
    return (seedToken, tokenSeedIncrement, mintTimestamp);
  }

  function getMetadataObject(
    bytes memory animationUrl,
    uint256 tokenId
  ) internal view returns (bytes memory) {
    string memory tid = toString(tokenId);
    return
      abi.encodePacked(
        '{"name":"TEST #',
        tid,
        '", "description":"Test description.",',
        '"external_url": "https://making.gold/gallery/',
        tid,
        '", "image": "',
        baseImageURI,
        tid,
        '.jpg"',
        ', "animation_url":"',
        animationUrl,
        '", "attributes": [',
        getJSONAttributes(generateAllTraits(tokenId)),
        "]}"
      );
  }

  function tokenURI(uint256 tokenId) external view returns (string memory) {
    WrappedScriptRequest[] memory requests = new WrappedScriptRequest[](5);

    (
      uint256 seedToken,
      uint256 tokenSeedIncrement,
      uint256 mintTimestamp
    ) = getSeedVariables(tokenId);
    (
      string memory contractMetricsSelector,
      string memory tokenMetricsSelector
    ) = goldContract.getSelectors();

    requests[0].name = "gold_by_crashblossom_base_v2";
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
      "let O = ",
      toString(tokenId),
      ";",
      "let R = ",
      toString(goldContract.totalSupply()),
      ";",
      "let N = ",
      toString(mintTimestamp),
      ";"
      'let P = "',
      contractMetricsSelector,
      '";',
      'let F = "',
      tokenMetricsSelector,
      '";',
      'let E = "',
      Strings.toHexString(address(goldContract)),
      '";'
    );

    requests[2].name = "gold_by_crashblossom_paths_v2";
    requests[2].wrapType = 2;
    requests[2].contractAddress = scriptyStorageAddress;

    requests[3].name = "gunzipScripts-0.0.1";
    requests[3].wrapType = 0; // <script>[script]</script>
    requests[3].contractAddress = scriptyStorageAddress;

    requests[4].name = "gold_by_crashblossom_main_v2";
    requests[4].wrapType = 0; // <script>[script]</script>
    requests[4].contractAddress = scriptyStorageAddress;

    bytes memory base64EncodedHTMLDataURI = IScriptyBuilder(
      scriptyBuilderAddress
    ).getEncodedHTMLWrapped(
        requests,
        bufferSize + requests[1].scriptContent.length + 17 // "<script>".length + "</script>".length = 17
      );

    return
      string(
        abi.encodePacked(
          "data:application/json;base64,",
          Base64.encode(getMetadataObject(base64EncodedHTMLDataURI, tokenId))
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
    for (uint256 j = 0; j < 300; j++) {
      for (uint256 i = 0; i < _number_of_colors.length; i++) {
        uint256 r = nextInt(seed);
        if (r > 100 - _number_of_color_chances[i]) {
          return _number_of_colors[i];
        }
      }
    }
    return 2;
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
    (uint256 tokenSeed, uint256 tokenSeedIncrement, ) = getSeedVariables(
      tokenId
    );

    uint256 bonusPlateCount = goldContract.numberOfBonusPlates(tokenId);
    uint256 bonusClusterCount = goldContract.numberOfBonusClusters(tokenId);

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
      selectedColours.length + 8 + bonusPlateCount + bonusClusterCount + 1
    );

    uint256 currentIndex = 0;

    allTraits[currentIndex] = Trait({
      typeName: "Palette Count",
      valueName: toString(numberOfColours)
    });

    currentIndex++;

    for (uint256 i = 0; i < 8; i++) {
      allTraits[currentIndex] = Trait({
        typeName: string(
          abi.encodePacked(
            i % 2 == 0 ? "Gold Plate " : "Gold Cluster ",
            toString((i / 2) + 1)
          )
        ),
        valueName: layerPaths[i]
      });
      currentIndex++;
    }

    for (uint256 i = 0; i < bonusPlateCount; i++) {
      allTraits[currentIndex] = Trait({
        typeName: string(abi.encodePacked("Bonus Plate ", toString(i + 1))),
        valueName: layerPaths[i + 8]
      });
      currentIndex++;
    }

    for (uint256 i = 0; i < bonusClusterCount; i++) {
      allTraits[currentIndex] = Trait({
        typeName: string(abi.encodePacked("Bonus Cluster ", toString(i + 1))),
        valueName: layerPaths[i + 16]
      });
      currentIndex++;
    }

    for (uint256 i = 0; i < selectedColours.length; i++) {
      allTraits[currentIndex] = Trait({
        typeName: string(abi.encodePacked("Palette ", toString(i + 1))),
        valueName: selectedColours[i]
      });
      currentIndex++;
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
     3, 36, 42, 23, 11, 34, 35, 37, 38, 39, 2, 41, 43, 14, 40
  ];
  uint256[] internal layer_1_probabilities = [
    20, 18, 17, 15, 15, 10, 10, 10, 10, 10, 7, 7, 6, 5, 5
  ];
  uint256[] internal layer_2_indexes = [3, 4, 1, 5, 6, 0, 2, 7];
  uint256[] internal layer_2_probabilities = [20, 15, 12, 10, 10, 8, 7, 7];
  uint256[] internal layer_3_indexes = [
  10, 50, 13, 47, 49, 4, 46, 45, 1, 51, 52, 0, 5, 7, 48, 53, 6, 44, 54
];
  uint256[] internal layer_3_probabilities = [
  20, 20, 20, 15, 15, 15, 14, 12, 12, 12, 10, 8, 7, 7, 6, 6, 6, 5, 4
];
  uint256[] internal layer_4_indexes = [10, 13, 11, 16, 8, 9, 15, 14, 12];
  uint256[] internal layer_4_probabilities = [20, 20, 15, 15, 10, 10, 10, 5, 4];
  uint256[] internal layer_5_indexes = [
  58, 57, 19, 26, 56, 61, 65, 55, 22, 16, 62, 15, 9, 63, 64, 60, 59, 8, 66
];
  uint256[] layer_5_probabilities = [
  25, 20, 20, 20, 18, 18, 16, 15, 15, 15, 12, 11, 10, 10, 10, 9, 8, 7, 7
];
  uint256[] internal layer_6_indexes = [19, 25, 22, 23, 17, 24, 18, 21, 20];
  uint256[] internal layer_6_probabilities = [20, 20, 15, 15, 10, 10, 4, 3, 2];
  uint256[] internal layer_7_indexes = [
  28, 30, 68, 74, 27, 76, 73, 77, 69, 70, 79, 32, 75, 78, 24, 67, 17, 72, 71
];
  uint256[] internal layer_7_probabilities = [
  20, 20, 18, 17, 16, 16, 15, 15, 13, 12, 12, 11, 10, 10, 9, 7, 7, 7, 6
];
  uint256[] internal layer_8_indexes = [33, 29, 26, 28, 30, 31, 27, 32];
  uint256[] internal layer_8_probabilities = [27, 25, 20, 20, 20, 20, 10, 10];
  uint256[] internal hodl_layer_indexes = [
  58, 3, 10, 13, 19, 26, 28, 30, 61, 68, 74, 65, 27, 76, 11, 49, 4, 22, 16, 73,
  69, 45, 1, 62, 70, 15, 32, 52, 9, 64, 75, 78, 24, 0, 59, 5, 7, 8, 67, 17, 6,
  71
];
  uint256[] internal hodl_probabilities = [
  25, 20, 20, 20, 20, 20, 20, 20, 18, 18, 17, 16, 16, 16, 15, 15, 15, 15, 15,
  15, 13, 12, 12, 12, 12, 11, 11, 10, 10, 10, 10, 10, 9, 8, 8, 7, 7, 7, 7, 7, 6,
  6
];
  uint256[] internal milestone_layer_indexes = [
  33, 29, 3, 10, 13, 19, 26, 28, 30, 31, 4, 11, 16, 22, 1, 5, 6, 8, 9, 15, 17,
  24, 27, 32, 0, 2, 7, 14, 18, 21
];
  uint256[] internal milestone_probabilities = [
  27, 25, 20, 20, 20, 20, 20, 20, 20, 20, 15, 15, 15, 15, 12, 10, 10, 10, 10,
  10, 10, 10, 10, 10, 8, 7, 7, 5, 4, 3
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
