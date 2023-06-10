// Code snippet containing all the JS related to generating random numbers using the token hash as seed and then using it for generating traits

// All path names are stored in a single array. Then we have arrays containing indexes of paths that can be used for specific layers. This eliminates the need to repeat the string name of the path.
let paths = [
  "range",
  "splash",
  "plane",
  "streetlight",
  "glass",
  "left",
  "right",
  "map",
  "fracture",
  "liquid",
  "mosaic",
  "cumulus",
  "recall fragment",
  "pointer",
  "cliff",
  "hill",
  "city",
  "sign",
  "ship",
  "plus",
  "recall flock",
  "bug",
  "honeycomb",
  "ice large",
  "path",
  "footprint small",
  "planet",
  "logo",
  "multiplier",
  "fragment",
  "stratus",
  "flock",
  "river",
  "candle",
  "girder",
  "elevation",
  "urban",
  "plan",
  "floor",
  "ruin",
  "corridor",
  "wall ",
  "pie chart",
  "house",
  "pod",
  "ceiling",
  "window displaced",
  "modern",
  "blueprint",
  "road",
  "bell curve",
  "beam thick",
  "perspective",
  "flame",
  "window pane",
  "window poly",
  "window frame",
  "frame",
  "future",
  "body",
  "beam medium",
  "head",
  "rural",
  "beam thin",
  "ripple",
  "brain",
  "flame high",
  "foothill",
  "mnemonic",
  "jet",
  "mountain",
  "rockies",
  "fingerprint",
  "haze",
  "skeleton",
  "skyline",
  "comic",
  "ribbon",
  "wave",
  "footprint large",
  "ice small",
];
let layer_1_indexes = [
  11, 34, 35, 2, 37, 38, 39, 40, 41, 43, 14, 23, 36, 3, 42,
];
let layer_1_probabilities = [2, 4, 4, 4, 4, 4, 4, 4, 4, 4, 6, 11, 15, 15, 15];
let layer_2_indexes = [0, 7, 2, 6, 5, 1, 3, 4];
let layer_2_probabilities = [2, 7, 10, 10, 12, 14, 20, 25];
let layer_3_indexes = [
  0, 54, 44, 45, 46, 48, 5, 53, 6, 7, 4, 51, 52, 47, 10, 50, 13, 1, 49,
];
let layer_3_probabilities = [
  2, 2, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 7, 7, 7, 8, 10, 10,
];
let layer_4_indexes = [12, 8, 14, 9, 15, 11, 16, 13, 10];
let layer_4_probabilities = [2, 4, 4, 10, 10, 15, 15, 18, 22];
let layer_5_indexes = [
  59, 8, 55, 56, 57, 9, 58, 60, 15, 62, 63, 16, 64, 66, 19, 26, 22, 61, 65,
];
let layer_5_probabilities = [
  2, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 10, 10, 10, 10, 10,
];
let layer_6_indexes = [20, 22, 18, 21, 17, 24, 80, 25, 19];
let layer_6_probabilities = [2, 4, 5, 5, 8, 10, 15, 25, 26];
let layer_7_indexes = [
  70, 30, 67, 32, 17, 71, 72, 24, 77, 78, 69, 73, 75, 74, 27, 76, 79, 68, 28,
];
let layer_7_probabilities = [
  2, 2, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 6, 7, 7, 7, 10, 12,
];
let layer_8_indexes = [30, 29, 31, 32, 27, 28, 26, 33];
let layer_8_probabilities = [2, 10, 10, 10, 12, 16, 20, 20];
let hodl_layer_indexes = [
  6, 71, 5, 7, 8, 67, 17, 0, 59, 24, 52, 9, 64, 75, 78, 15, 32, 45, 1, 62, 70,
  69, 11, 49, 4, 22, 16, 73, 65, 27, 76, 74, 61, 68, 3, 10, 13, 19, 26, 28, 30,
  58,
];
let hodl_probabilities = [
  6, 6, 7, 7, 7, 7, 7, 8, 8, 9, 10, 10, 10, 10, 10, 11, 11, 12, 12, 12, 12, 13,
  15, 15, 15, 15, 15, 15, 16, 16, 16, 17, 18, 18, 20, 20, 20, 20, 20, 20, 20,
  25,
];
let milestone_layer_indexes = [
  21, 18, 14, 2, 7, 0, 5, 6, 8, 9, 15, 17, 24, 27, 32, 1, 4, 11, 16, 22, 3, 10,
  13, 19, 26, 28, 30, 31, 29, 33,
];
let milestone_probabilities = [
  3, 4, 5, 7, 7, 8, 10, 10, 10, 10, 10, 10, 10, 10, 10, 12, 15, 15, 15, 15, 20,
  20, 20, 20, 20, 20, 20, 20, 25, 27,
];

// number of color chances

let _number_of_colors = [1, 8, 16, 4, 2, 3];
let _number_of_color_chances = [5, 5, 5, 10, 20, 50];

// The names of all color schemes
let color_names = [
  "rhodium",
  "palladium",
  "vegas",
  "platinum",
  "ipanema",
  "malibu",
  "venicebeach",
  "cannes",
  "maldives",
  "dusk",
  "sunset",
  "mist",
  "southbeach",
  "night",
  "ibiza",
  "dawn",
  "goldenhour",
];
let color_chance = [3, 4, 4, 5, 5, 5, 5, 5, 6, 7, 7, 8, 10, 12, 20, 30, 40];

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
    let breakLoopCounter = 300;
    while (breakLoopCounter > 0) {
      breakLoopCounter--;
      for (let j = 0; j < color_chance.length; j++) {
        var c = color_names[j];
        let r = nextInt(seed);
        if (r > 100 - color_chance[j] && !selected_color_names.includes(c)) {
          breakLoopCounter = 0;
          break;
        }
      }
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
      let _probabilities;
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
      var breakLoopCounter = 300;
      while (breakLoopCounter > 0) {
        breakLoopCounter--;
        for (let i2 = 0; i2 < _probabilities.length; i2++) {
          let r = nextInt(seed);
          var p = paths[_indexes[i2]];
          if (
            r > 100 - _probabilities[i2] &&
            !selected_layer_paths.includes(p)
          ) {
            breakLoopCounter = 0;
            break;
          }
        }
      }
      selected_layer_paths.push(p);
    }
  }
  return selected_layer_paths;
}

function getAllTraits() {
  let token_seed_increment = 999;
  let seed_token = 799554;

  // generate random seed and seed increment
  // let token_seed_increment = Math.floor(1000 + Math.random() * 100);
  // let seed_token = Math.floor(1000 + Math.random() * 999999);

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
  // return layer_paths
}
getAllTraits();
// The code below is used for testing the traits distribution

// for (let layer_id = 0; layer_id < 8; layer_id ++){
//   let results = {};
//   for (let i = 0; i < 500; i++) {
//     let t = getAllTraits();
//     if (results[t[layer_id]] == undefined) {
//       results[t[layer_id]] = 1;
//     }
//     else {
//       results[t[layer_id]] ++;
//     }
//   }

//   console.log("Layer:", layer_id);
//   console.log(JSON.stringify(results, null, 2));
// }
