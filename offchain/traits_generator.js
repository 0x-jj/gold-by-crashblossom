// Code snippet containing all the JS related to generating random numbers using the token hash as seed and then using it for generating traits

// All path names are stored in a single array. Then we have arrays containing indexes of paths that can be used for specific layers. This eliminates the need to repeat the string name of the path.
let paths = [
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
  "L - footprint large",
];
let layer_1_indexes = [
  34, 35, 2, 36, 3, 23, 11, 37, 38, 14, 39, 40, 41, 42, 43,
];
let layer_1_probabilities = [
  10, 10, 7, 18, 20, 15, 15, 10, 10, 5, 10, 5, 7, 17, 6,
];
let layer_2_indexes = [0, 1, 2, 3, 4, 5, 6, 7];
let layer_2_probabilities = [8, 12, 7, 20, 15, 10, 10, 7];
let layer_3_indexes = [
  44, 45, 0, 46, 1, 47, 10, 48, 49, 50, 13, 4, 5, 51, 52, 53, 6, 7, 54,
];
let layer_3_probabilities = [
  5, 12, 8, 14, 12, 15, 20, 6, 15, 20, 20, 15, 7, 12, 10, 6, 6, 7, 4,
];
let layer_4_indexes = [8, 9, 10, 11, 12, 13, 14, 15, 16];
let layer_4_probabilities = [10, 10, 20, 15, 4, 20, 5, 10, 15];
let layer_5_indexes = [
  8, 55, 56, 57, 9, 19, 26, 22, 58, 59, 60, 15, 61, 62, 63, 16, 64, 65, 66,
];
let layer_5_probabilities = [
  7, 15, 18, 20, 10, 20, 20, 15, 25, 8, 9, 11, 18, 12, 10, 15, 10, 16, 7,
];
let layer_6_indexes = [17, 18, 19, 20, 21, 22, 23, 24, 25];
let layer_6_probabilities = [10, 4, 20, 2, 3, 15, 15, 10, 20];
let layer_7_indexes = [
  67, 32, 68, 17, 69, 27, 70, 28, 71, 72, 24, 73, 30, 74, 75, 76, 77, 78, 79,
];
let layer_7_probabilities = [
  7, 11, 18, 7, 13, 16, 12, 20, 6, 7, 9, 15, 20, 17, 10, 16, 15, 10, 12,
];
let layer_8_indexes = [26, 27, 28, 29, 30, 31, 32, 33];
let layer_8_probabilities = [20, 10, 20, 25, 20, 20, 10, 27];
let hodl_layer_indexes = [
  3, 11, 45, 0, 1, 10, 49, 13, 4, 5, 52, 6, 7, 8, 9, 19, 26, 22, 58, 59, 15, 61,
  62, 16, 64, 65, 67, 32, 68, 17, 69, 27, 70, 28, 71, 24, 73, 30, 74, 75, 76,
  78,
];
let hodl_probabilities = [
  20, 15, 12, 8, 12, 20, 15, 20, 15, 7, 10, 6, 7, 7, 10, 20, 20, 15, 25, 8, 11,
  18, 12, 15, 10, 16, 7, 11, 18, 7, 13, 16, 12, 20, 6, 9, 15, 20, 17, 10, 16,
  10,
];
let milestone_layer_indexes = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24,
  26, 27, 28, 29, 30, 31, 32, 33,
];
let milestone_probabilities = [
  8, 12, 7, 20, 15, 10, 10, 7, 10, 10, 20, 15, 20, 5, 10, 15, 10, 4, 20, 3, 15,
  10, 20, 10, 20, 25, 20, 20, 10, 27,
];

// number of color chances
let _number_of_colors = [1, 8, 16, 2, 3, 4];
let _number_of_color_chances = [5, 5, 5, 20, 50, 10];

// The names of all color schemes
let color_names = [
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
  "cannes",
];
let color_chance = [40, 30, 20, 10, 8, 7, 5, 4, 3, 5, 5, 12, 6, 5, 7, 4, 5];

function nextInt(seed) {
  seed.current = (1664525 * seed.current + seed.incrementor) % 89652912;
  return seed.current % 101;
}

function generateNumberOfColours(seed) {
  for (let i = 0; i < _number_of_colors.length; i++) {
    let r = nextInt(seed);
    if (r > 100 - _number_of_color_chances[i]) {
      return _number_of_colors[i];
    }
  }
  return 2; // if nothing else was selected we default to 2 colors
}

function generateColourNames(numberOfColours, seed) {
  let selected_color_names = [];

  for (let i = 0; i < numberOfColours; i++) {
    let r = nextInt(seed);
    let r2 = nextInt(seed);
    let j = r % color_chance.length;
    let c = color_names[j];
    let while_loop_breaker = 300;
    while (r2 < 100 - color_chance[j] || selected_color_names.includes(c)) {
      r = nextInt(seed);
      r2 = nextInt(seed);
      j = r % color_chance.length;
      c = color_names[j];
      if (while_loop_breaker <= 0) {
        console.log("break");
        break;
      } else {
        while_loop_breaker--;
      } // not needed for the JS but may be good idea in Solidity version
    }
    selected_color_names.push(c);
  }

  return selected_color_names;
}

function generateLayerPaths(seed) {
  let selected_layer_paths = [];
  let types = [0, 1, 2];

  for (let j = 0; j < types.length; j++) {
    for (let i = 0; i < 8; i++) {
      let _indexes;
      if (types[j] == 0) {
        // regular
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
        // hodl
        _indexes = hodl_layer_indexes;
        _probabilities = hodl_probabilities;
      } else if (types[j] == 2) {
        // milestone
        _indexes = milestone_layer_indexes;
        _probabilities = milestone_probabilities;
      }
      let r = nextInt(seed) % _indexes.length;
      let r2 = nextInt(seed);
      let p = paths[_indexes[r]];
      let while_loop_breaker = 300;
      while (selected_layer_paths.includes(p) || r2 < 100 - _probabilities[i]) {
        if (while_loop_breaker <= 0) {
          console.log("break");
          break;
        } else {
          while_loop_breaker--;
        }
        r = nextInt(seed) % _indexes.length;
        r2 = nextInt(seed);
        p = paths[_indexes[r]];
      }
      selected_layer_paths.push(p);
    }
  }
  return selected_layer_paths;
}

function getAllTraits() {
  let token_seed_increment = 4545;
  let seed_token = 896529;

  let seed = { current: seed_token, incrementor: token_seed_increment };

  let number_of_colors_to_use = generateNumberOfColours(seed);
  let selected_color_palettes = generateColourNames(
    number_of_colors_to_use,
    seed
  );
  let layer_paths = generateLayerPaths(seed);

  console.log("number_of_colors_to_use:", number_of_colors_to_use);
  console.log("selected_color_palettes:", selected_color_palettes);
  console.log("layer_paths:", layer_paths);
}

getAllTraits();
