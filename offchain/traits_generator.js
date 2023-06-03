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
  3, 36, 42, 23, 11, 34, 35, 37, 38, 39, 2, 41, 43, 14, 40,
];
let layer_1_probabilities = [
  20, 18, 17, 15, 15, 10, 10, 10, 10, 10, 7, 7, 6, 5, 5,
];
let layer_2_indexes = [3, 4, 1, 5, 6, 0, 2, 7];
let layer_2_probabilities = [20, 15, 12, 10, 10, 8, 7, 7];
let layer_3_indexes = [
  10, 50, 13, 47, 49, 4, 46, 45, 1, 51, 52, 0, 5, 7, 48, 53, 6, 44, 54,
];
let layer_3_probabilities = [
  20, 20, 20, 15, 15, 15, 14, 12, 12, 12, 10, 8, 7, 7, 6, 6, 6, 5, 4,
];
let layer_4_indexes = [10, 13, 11, 16, 8, 9, 15, 14, 12];
let layer_4_probabilities = [20, 20, 15, 15, 10, 10, 10, 5, 4];
let layer_5_indexes = [
  58, 57, 19, 26, 56, 61, 65, 55, 22, 16, 62, 15, 9, 63, 64, 60, 59, 8, 66,
];
let layer_5_probabilities = [
  25, 20, 20, 20, 18, 18, 16, 15, 15, 15, 12, 11, 10, 10, 10, 9, 8, 7, 7,
];
let layer_6_indexes = [19, 25, 22, 23, 17, 24, 18, 21, 20];
let layer_6_probabilities = [20, 20, 15, 15, 10, 10, 4, 3, 2];
let layer_7_indexes = [
  28, 30, 68, 74, 27, 76, 73, 77, 69, 70, 79, 32, 75, 78, 24, 67, 17, 72, 71,
];
let layer_7_probabilities = [
  20, 20, 18, 17, 16, 16, 15, 15, 13, 12, 12, 11, 10, 10, 9, 7, 7, 7, 6,
];
let layer_8_indexes = [33, 29, 26, 28, 30, 31, 27, 32];
let layer_8_probabilities = [27, 25, 20, 20, 20, 20, 10, 10];
let hodl_layer_indexes = [
  58, 3, 10, 13, 19, 26, 28, 30, 61, 68, 74, 65, 27, 76, 11, 49, 4, 22, 16, 73,
  69, 45, 1, 62, 70, 15, 32, 52, 9, 64, 75, 78, 24, 0, 59, 5, 7, 8, 67, 17, 6,
  71,
];
let hodl_probabilities = [
  25, 20, 20, 20, 20, 20, 20, 20, 18, 18, 17, 16, 16, 16, 15, 15, 15, 15, 15,
  15, 13, 12, 12, 12, 12, 11, 11, 10, 10, 10, 10, 10, 9, 8, 8, 7, 7, 7, 7, 7, 6,
  6,
];
let milestone_layer_indexes = [
  33, 29, 3, 10, 13, 19, 26, 28, 30, 31, 4, 11, 16, 22, 1, 5, 6, 8, 9, 15, 17,
  24, 27, 32, 0, 2, 7, 14, 18, 21,
];
let milestone_probabilities = [
  27, 25, 20, 20, 20, 20, 20, 20, 20, 20, 15, 15, 15, 15, 12, 10, 10, 10, 10,
  10, 10, 10, 10, 10, 8, 7, 7, 5, 4, 3,
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
  for (let j = 0; j < 300; j++) {
    for (let i = 0; i < _number_of_colors.length; i++) {
      let r = nextInt(seed);
      if (r > 100 - _number_of_color_chances[i]) {
        return _number_of_colors[i];
      }
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
  let token_seed_increment = 999;
  let seed_token = 588839;

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
