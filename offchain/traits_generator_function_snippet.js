// Code snippet containing all the JS related to generating random numbers using the 
// token hash as seed and then using it for generating traits

// Fake token hash, can be any string
let token_hash = "108A6E830a809e88e74cbf5f5DE9D930152";

// Before generating the random number based on the token seed the token_seed_increment
// value will be added to the seed. The increment is created by taking the first 10
// characters from the token hash and converting it to integer using the cyrb53() function
let token_seed_increment = cyrb53(token_hash.slice(10));
let seed_token = cyrb53(token_hash);

// Test the generate_traits() function
let number_of_colors_to_use = generate_traits("number_of_colors");
let selected_color_palettes = generate_traits("color_names")
let background_color_pallette = generate_traits("background_and_frame_colors");
let layer_paths = generate_traits("layer_paths");
let hodl_layer_paths = generate_traits("hodl_layer_paths");
let contract_milestone_layer_paths = generate_traits("contract_milestone_layer_paths");

console.log("number_of_colors_to_use:", number_of_colors_to_use);
console.log("selected_color_palettes:", selected_color_palettes);
console.log("background_color_pallette:", background_color_pallette);
console.log("layer_paths:", layer_paths);
console.log("hodl_layer_paths:", hodl_layer_paths);
console.log("contract_milestone_layer_paths:", contract_milestone_layer_paths);

// Function definitions are below
function random_token() {
    // the most basic random number generator I could think of, it works in our use case 
    // because we don't need to generate large number of random numbers from the same hash
    seed_token += token_seed_increment;
    return (seed_token % 100) / 100;
};

function cyrb53(str, cseed = 0){
    // Converts string to integer
    let h1 = 0xdeadbeef ^ cseed, h2 = 0x41c6ce57 ^ cseed;
    for(let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

function generate_traits(type){
    // This function takes a string representing the trait type it should be generating and generates the corresponding traits.
    // I tried not to use any JS "magic" and to stick to simple indexing so it is hopefully translatable to Solidity without too much additional work required
    //
    // Note: This function is not following good practices -- it relays on global variables that will be generated using it's own output SO it must be used in the correct order
    // The variables it relays on are:
    // layer_paths: Contains layer path group names that were selected
    // hodl_layer_paths: Contains hodl layer path group names
    // selected_color_palettes: Contains color palette names that were selected
    //
    // The order in which this function is called in the JS is the following:
    // let number_of_colors_to_use = generate_traits("number_of_colors");
    // let selected_color_palettes = generate_traits("color_names")
    // let background_color_combinations_list = generate_traits("background_and_frame_colors");
    // let layer_paths = generate_traits("layer_paths");
    // let hodl_layer_paths = generate_traits("hodl_layer_paths");
    // let contract_milestone_layer_paths = generate_traits("contract_milestone_layer_paths");
    //
    // You will have to call it in the same order to get the same results using the random number generator.


    // The names of all color schemes
    let _color_names = ["goldenhour", "dawn", "ibiza", "southbeach", "mist", "dusk","platinum", "palladium", "rhodium", "ipanema", "malibu", "night", "maldives", "venicebeach", "sunset", "vegas", "cannes"];
    
    // The probabilities for each scheme appearing, currently they have equal probability but this will soon change!
    let _color_chance = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]

    // This is 2d array where each inner array contains the possible path groups for the corresponding layer of the art.
    // There are 8 layers total, first one is a plate layer, second one is a cluster layer, third one plate and so on.
    let _layer_paths = [["LS - jut right", "LS - plane", "LS - streetlight", "LS - flame 2", "LS - glass", "LS - chart medium", "LS - jut left"], ["LS - fracture", "LS - liquid", "LS - mosaic", "LS - cliff edge", "LS - hill", "LS clouds2", "S - recall1", "LS - city"], ["LS - sign", "S - recall2", "S - ice", "S - tile", "LS - road", "S - space sign", "LS - hexagon", "S - footprint"], ["LS - planet", "LS - cloud", "LS - ribbon2", "LS - triangle", "S - fragment", "S - flock", "S - candle"], ["L - girder", "L - elevation", "L - distressed", "LS - plane", "L - urban", "LS - cloud", "LS - streetlight", "L - ice", "L - floor", "L - ruin", "L - corridor", "LS - chart medium", "L - semicircle", "L - wall ", "L - house"], ["L - pod", "L - window 2", "L - ceiling", "L - window displaced", "LS - jut right", "L - modern", "LS - mosaic", "L - blueprint", "LS - flame 2", "L - bell curve", "LS - glass", "LS - cliff", "L - beam thick", "L - perspective", "LS clouds2", "LS - jut left", "L - flame"], ["LS - fracture", "L - window poly", "L - window frame", "L - frame", "LS - liquid", "LS - planet", "L - future", "L - flame 3", "L - body", "L - wave 2", "L - beam medium", "LS - hill", "L - head", "L - rural", "L - beam thin", "LS - hexagon", "LS - city", "L - brain"], ["L - future2", "L - ribbon", "L - water jet", "LS - sign", "L - wave 1", "L - chart high", "LS - cloud", "L - mountain", "LS - ribbon2", "LS - triangle", "LS - road", "L - wave 3", "L - flame3", "L - chart low", "L - skeleton", "L - skyline", "L - comic", "L - footprint"]];
    
    // Probabilities for each path appearing
    let _path_chances = [[0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]]

    // I added this to stop the while loops after certain number of iterations in case we need this in Solidity
    let while_loop_breaker = 50;

    // Select the number of color palettes that will be used in the art
    if (type=="number_of_colors"){
        let r = random_token();
        if (r>1-0.1){return 4}; // 10% chance
        if (r>1-0.2){return 3}; // 20% chance
        if (r>1-0.3){return 1}; // 30% chance
        return 2; // 40% chance
    }
    // Select path groups for regular layers, the returned array will contain 8 strings - one for each layer
    if (type=="layer_paths"){
        let selected_layer_paths = [];
        for (let i=0;i<_layer_paths.length;i++){
            let r = random_token();
            let p = _layer_paths[i][Math.floor(r*(_layer_paths[i].length-1))];
            while (selected_layer_paths.indexOf(p)!=-1){
                r = random_token();
                p = _layer_paths[i][Math.floor(r*(_layer_paths[i].length-1))];
            }
            selected_layer_paths.push(p);
        }
        return selected_layer_paths;
    }
    // Select path groups for hodl layers that will be added when the piece is held in a wallet after 6m, 1y and so on
    if (type=="hodl_layer_paths"){
        let selected_layer_paths = [];
        for (let i=0;i<_layer_paths.length;i++){
            let r = random_token();
            let r2 = random_token();
            let j = Math.floor(r*(_layer_paths[i].length-1));
            let p = _layer_paths[i][j];
            while (selected_layer_paths.indexOf(p)!=-1 | layer_paths.indexOf(p)!=-1){
                r = random_token();
                r2 = random_token();
                j = Math.floor(r*(_layer_paths[i].length-1));
                p = _layer_paths[i][j];
                while_loop_breaker --;
                if (while_loop_breaker<=0){break}; // not needed for the JS but may be good idea in Solidity version
            }
            selected_layer_paths.push(p);
        }
        return selected_layer_paths;
    }
    // Select path groups for contract milestone layers, similar to hodl
    if (type=="contract_milestone_layer_paths"){
        let selected_layer_paths = [];
        for (let i=0;i<_layer_paths.length;i++){
            let r = random_token();
            let r2 = random_token();
            let j = Math.floor(r*(_layer_paths[i].length-1));
            let p = _layer_paths[i][j];
            while (r2 < 1-_path_chances[i][j] | selected_layer_paths.indexOf(p)!=-1 | layer_paths.indexOf(p)!=-1 | hodl_layer_paths.indexOf(p)!=-1){
                r = random_token();
                r2 = random_token();
                j = Math.floor(r*(_layer_paths[i].length-1));
                p = _layer_paths[i][j];
                if (while_loop_breaker<=0){break}; // not needed for the JS but may be good idea in Solidity version
            }
            selected_layer_paths.push(p);
        }
        return selected_layer_paths;
    }
    // Select the color palettes that will be used for the piece
    if (type=="color_names"){
        let selected_color_names = [];
        for (let i=0;i<number_of_colors_to_use;i++){
            let r = random_token();
            let r2 = random_token();
            let j = Math.floor(r*(_color_names.length-1))
            let c = _color_names[j];
            while (r2 < 1-_color_chance[j] & selected_color_names.indexOf(c)==-1){
                r = random_token();
                r2 = random_token();
                j = Math.floor(r*(_color_names.length-1))
                c = _color_names[j];
                if (while_loop_breaker<=0){break}; // not needed for the JS but may be good idea in Solidity version
            }
            selected_color_names.push(c);
        }
        return selected_color_names;
    }
    // Select the color palettes that will be used for the piece
    if (type=="background_and_frame_colors"){
        let r = random_token();
        return selected_color_palettes[Math.floor(r*(selected_color_palettes.length-1))];
    }
};