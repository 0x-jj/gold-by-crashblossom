// Code snippet containing all the JS related to generating random numbers using the token hash as seed and then using it for generating traits

// All path names are stored in a single array. Then we have arrays containing indexes of paths that can be used for specific layers. This eliminates the need to repeat the string name of the path.
let paths = [
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
  "L - send",
];
let path_probabilities = [
  90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90,
  90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90,
  90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90,
  90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90,
  90, 90, 90, 90, 90, 90, 90, 90, 90, 90,
];
let layer_1_indexes = [
  33, 34, 35, 36, 1, 2, 37, 38, 39, 40, 41, 5, 42, 43, 44, 26,
];
let layer_2_indexes = [0, 1, 2, 3, 4, 5, 6, 7];
let layer_3_indexes = [
  0, 13, 3, 4, 7, 10, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55,
];
let layer_4_indexes = [8, 9, 10, 11, 12, 13, 14, 15];
let layer_5_indexes = [
  8, 11, 14, 16, 22, 25, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68,
];
let layer_6_indexes = [16, 17, 18, 19, 20, 21, 22, 23, 24];
let layer_7_indexes = [
  15, 19, 24, 26, 27, 28, 31, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
  81,
];
let layer_8_indexes = [32, 25, 26, 27, 28, 29, 30, 31];
let hodl_layer_indexes = [
  0, 2, 3, 4, 5, 7, 8, 10, 11, 13, 14, 15, 16, 19, 22, 24, 25, 26, 27, 28, 31,
  35, 47, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72,
  73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85,
];
let milestone_layer_indexes = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
];

// number of color chances - index 0 corresponds to 1 color, index 15 to 16 colors
let _number_of_color_chances = [
  10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
];

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
let color_chance = [
  10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
];

function nextInt(seed) {
  seed.current += seed.incrementor;
  return seed.current % 100;
}

function generateNumberOfColours(seed) {
  for (let i = 0; i < _number_of_color_chances.length; i++) {
    let r = nextInt(seed);
    if (r > 100 - _number_of_color_chances[i]) {
      return i + 1;
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
    let while_loop_breaker = 50;
    while (r2 < 100 - color_chance[j] || selected_color_names.includes(c)) {
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
    selected_color_names.push(c);
  }
  let r3 = nextInt(seed);

  selected_color_names[selected_color_names.length - 1] =
    selected_color_names[r3 % selected_color_names.length];

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
        // hodl
        _indexes = hodl_layer_indexes;
      } else if (types[j] == 2) {
        // milestone
        _indexes = milestone_layer_indexes;
      }
      let r = nextInt(seed) % _indexes.length;
      let r2 = nextInt(seed);
      let p = paths[_indexes[r]];
      let while_loop_breaker = 50;
      while (
        selected_layer_paths.includes(p) ||
        r2 < 100 - path_probabilities[i]
      ) {
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
  let token_seed_increment = 1265412365874123;
  let seed_token = 1234567891011123;

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
