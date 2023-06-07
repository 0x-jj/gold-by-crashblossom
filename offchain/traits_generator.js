// Code snippet containing all the JS related to generating random numbers using the token hash as seed and then using it for generating traits

// All path names are stored in a single array. Then we have arrays containing indexes of paths that can be used for specific layers. This eliminates the need to repeat the string name of the path.
let paths = [
  "range", "splash", "plane", "streetlight", "glass", "left", "right", "map", "fracture", "liquid", 
  "mosaic", "cumulus", "recall fragment", "pointer", "cliff", "hill", "city", "sign", "ship", "plus", 
  "recall flock", "bug", "honeycomb", "ice large", "path", "footprint small", "planet", "logo", "multiplier", "fragment", 
  "stratus", "flock", "river", "candle", "girder", "elevation", "urban", "plan", "floor", "ruin", 
  "corridor", "wall ", "pie chart", "house", "pod", "ceiling", "window displaced", "modern", "blueprint", "road", 
  "bell curve", "beam thick", "perspective", "flame", "window pane", "window poly", 
  "window frame", "frame", "future", "body", "beam medium", "head", "rural", "beam thin", "ripple", "brain", 
  "flame high", "foothill", "mnemonic", "jet", "mountain", "rockies", "fingerprint", "haze", "skeleton", 
  "skyline", "comic", "ribbon", "wave", "footprint large"
];
let layer_1_indexes = [
  14, 40, 43, 2, 41, 34, 35, 37, 38, 39, 23, 11, 42, 36, 3
];
let layer_1_probabilities = [
  5, 5, 6, 7, 7, 10, 10, 10, 10, 10, 15, 15, 17, 18, 20
];
let layer_2_indexes = [
  2, 7, 0, 5, 6, 1, 4, 3
];
let layer_2_probabilities = [
  7, 7, 8, 10, 10, 12, 15, 20
];
let layer_3_indexes = [
  54, 44, 48, 53, 6, 5, 7, 0, 52, 45, 1, 51, 46, 47, 49, 4, 10, 50, 13
];
let layer_3_probabilities = [
  4, 5, 6, 6, 6, 7, 7, 8, 10, 12, 12, 12, 14, 15, 15, 15, 20, 20, 20
];
let layer_4_indexes = [
  12, 14, 8, 9, 15, 11, 16, 10, 13
];
let layer_4_probabilities = [
  4, 5, 10, 10, 10, 15, 15, 20, 20
];
let layer_5_indexes = [
  8, 66, 59, 60, 9, 63, 64, 15, 62, 55, 22, 16, 65, 56, 61, 57, 19, 26, 58
];
let layer_5_probabilities = [
  7, 7, 8, 9, 10, 10, 10, 11, 12, 15, 15, 15, 16, 18, 18, 20, 20, 20, 25
];
let layer_6_indexes = [
  20, 21, 18, 17, 24, 22, 23, 19, 25
];
let layer_6_probabilities = [
  2, 3, 4, 10, 10, 15, 15, 20, 20
];
let layer_7_indexes = [
  71, 67, 17, 72, 24, 75, 78, 32, 70, 79, 69, 73, 77, 27, 76, 74, 68, 28, 30
];
let layer_7_probabilities = [
  6, 7, 7, 7, 9, 10, 10, 11, 12, 12, 13, 15, 15, 16, 16, 17, 18, 20, 20
];
let layer_8_indexes = [
  27, 32, 26, 28, 30, 31, 29, 33
];
let layer_8_probabilities = [
  10, 10, 20, 20, 20, 20, 25, 27
];
let hodl_layer_indexes = [
  6, 71, 5, 7, 8, 67, 17, 0, 59, 24, 52, 9, 64, 75, 78, 15, 32, 45, 1, 62, 70, 69, 
  11, 49, 4, 22, 16, 73, 65, 27, 76, 74, 61, 68, 3, 10, 13, 19, 26, 28, 30, 58
];
let hodl_probabilities = [
  6, 6, 7, 7, 7, 7, 7, 8, 8, 9, 10, 10, 10, 10, 10, 11, 11, 12, 12, 12, 12, 13, 15, 
  15, 15, 15, 15, 15, 16, 16, 16, 17, 18, 18, 20, 20, 20, 20, 20, 20, 20, 25
];
let milestone_layer_indexes = [
  21, 18, 14, 2, 7, 0, 5, 6, 8, 9, 15, 17, 24, 27, 32, 1, 
  4, 11, 16, 22, 3, 10, 13, 19, 26, 28, 30, 31, 29, 33
];
let milestone_probabilities = [
  3, 4, 5, 7, 7, 8, 10, 10, 10, 10, 10, 10, 10, 10, 10, 12, 
  15, 15, 15, 15, 20, 20, 20, 20, 20, 20, 20, 20, 25, 27
];

// number of color chances

let _number_of_colors =        [1, 8, 16, 4, 2, 3];
let _number_of_color_chances = [5, 5, 5, 10, 20, 50];

// The names of all color schemes
let color_names = [
  "rhodium", "palladium", "vegas", "platinum", "ipanema", "malibu", "venicebeach", "cannes", "maldives", 
  "dusk", "sunset", "mist", "southbeach", "night", "ibiza", "dawn", "goldenhour"

];
let color_chance = [
  3, 4, 4, 5, 5, 5, 5, 5, 6, 7, 7, 8, 10, 12, 20, 30, 40
];

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
      breakLoopCounter --;
      for (let j = 0; j < color_chance.length; j++){
        var c = color_names[j];
    let r = nextInt(seed);
        if (r > 100 - color_chance[j] && ! selected_color_names.includes(c)){
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
        breakLoopCounter --;
        for (let i2 = 0; i2 < _probabilities.length; i2++) {
          let r = nextInt(seed);
          var p = paths[_indexes[i2]];
          if (r > 100 - _probabilities[i2] && ! selected_layer_paths.includes(p)) {
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
  let token_seed_increment = 1001;
  let seed_token = 739170;

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
