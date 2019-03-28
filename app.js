/*
    This is a console text adventure using Cosmos DB Graph through Gremlin as full state back end.
    This code is presented 'as is' with no licence or warrenty of any kind - purely for demonstration purposes. 
    Use at your own risk.

    Early Cosmos DB Graph code build from reading: https://github.com/Azure-Samples/azure-cosmos-db-graph-nodejs-getting-started

    Thanks, Phil.
*/

// Config file loading - MUST be before requiring the Gremlin wrapper(s)
if(process.argv.length === 3 && process.argv[2].includes('.env'))
    require('dotenv').config({ path: process.argv[2] })
else 
    require('dotenv').config()

const readline = require('readline');
const colors = require('colors');
const gremlin = require("./shared/lib/gremlin-wrapper-v2");

const API = require('./shared/lib/api')

const Player = require('./shared/lib/player')
const Room = require('./shared/lib/room')
const Item = require('./shared/lib/item')

//Write to the console in the debug colour.
let debug = function(text){ console.log(text.grey); };
let error = function(text){ console.error(text.red); };
let game = function(text){ console.log(text.green); };
let info = function(text){ console.log(text.yellow); };
let desc = function(text){ console.log(text.cyan); };
let post = function(text){ console.log(text.magenta); };

let use_api = true;

/* 
   UTILITY FUNCTIONS
*/

let test = function(next){
    //A place to test stuff. 
    error('No test code currently live')
    next();
};

let engine = function(words,next){
    if(words.length===2 && words[1]==='api'){
        use_api = true;
        debug("Using API Engine");
    } else if (words.length===2 && words[1]==='local'){
        use_api = false;
        debug("Using Local Engine");
    } else {
        error("Only options are 'engine: api' or 'engine: local'");
    }
    next();
};

//This retuns the 'out edges' from the players current room. An out edge represents a door.
// let getExits = async function(next){
//     let result = await gremlin.getEntitiesOutToLabel(world.playerCurrentRoomID, 'room');
//     return result;
// };

debug("[Graph connection established]");

//Readline wraps in/out streams nicely and takes away hastle
let rl = readline.createInterface(
    {
        input: process.stdin,
        output: process.stdout
    }
);

debug("[User connection established]");

//A very simple local state for the game client. All state should be stored in the graph.
//I know that this is slower overall, but this is not a fast paced game. 
let world = {
    playerNodeID:null,
    playerCurrentRoomID:null,
    possibleDirections:{
        "north":"south",
        "east":"west",
        "south":"north",
        "west":"east",
        "up": "down",
        "down": "up"
    }
};

/* 
   WORLD BUILDER ACTION FUNCTIONS
*/

let make_room = async function(words,next){
    let direction = words[3];

    if(world.possibleDirections[direction]){
        info("Checking...");
        let exitsRes = await gremlin.getLinksByLabel(world.playerCurrentRoomID, 'path');

        if(exitsRes.some(r => r.properties.name === direction)){
            info(`There is already a room to the ${direction.white}.`);
            info("Try and make a room in an unused direction. use [look] to see which directions have been used.");
            next();
        } else {
            info(`OK. Building room to the ${direction.white}...`);
            let opposite = world.possibleDirections[direction];
            debug(`Return door to: ${opposite}.`);

            let rnd = Math.floor(Math.random() * Math.floor(10000));
            let newRoom = new Room(`room ${rnd}`, 'An empty room');
            // Create a new room and link it with a link of type 'path' and name = direction
            let result = await gremlin.createEntityLinkedTo(newRoom, 'path', world.playerCurrentRoomID, opposite)
            newRoom.id = result[0].id;
            // Create a link of type 'path' and name = direction back to the room
            await gremlin.createLinkTo(world.playerCurrentRoomID, 'path', newRoom.id, direction)
            next();
        }

    } else {
        info(`You can't make a room to the ${direction.white}.`);
        info(`Only 'north, south, east and west' are currently allowed.`);
        next();
    } 
};

let make_item = async function(words,next){
    let itemName = words[2];
    try {
        let desc = words.slice(3).join(" ");
        debug(`Making a(n) '${itemName}': '${desc}'`);

        let item = new Item(itemName, desc);
        let result = await gremlin.createEntityLinkedFrom(item, 'holds', world.playerCurrentRoomID);
        item.id = result[0].id;
    } catch(e) {
        error(`Failed to make item. ${e.toString()}`);
    }
    next();
};

let make_npc = async function(words, next){
    let type = words[2];
    try {
        //let resp = await call_api_post(`${process.env.API_NPC_HOST}/api/npcs/create`, {type: type, locationId: world.playerCurrentRoomID})
        let resp = await API.post('npc', `npcs/create`, {type: type, locationId: world.playerCurrentRoomID})
        if(resp) info(`${resp.gameMsg} before your very eyes!`);
    } catch(e) {
        error(`Failed to spawn NPC. ${e.toString()}`);
    }
    next();  
};

//This is the function that 'makes' things. It will make rooms first and then other things.
//This would not be in the 'normal player' interface, but in the world builder interface
let make = function(words,next){
    if(words.length===4 && words[1]==='room' && words[2]==='to'){
        make_room(words,next);
    } else if(words.length>=4 && words[1]==='item'){
        make_item(words,next);
    } else if(words.length >= 3 && words[1]==='npc'){
        make_npc(words, next);
    } else {
        info("The syntax for the make command is: "+ "make [room] to [direction].".white);
        info("If a [room] already exists to the [direction] the command will fail.");
        info("To add a description you will need to [walk] to the [direction] to enter the room.");
        info("");
        info("For an item it the syntax is: "+ "make [item] name description".white);
        info("The item will be dropped in the room you make it in");
        info("");
        info("For a npc it the syntax is: "+ "make [npc] type".white);
        info("The npc will spawn in the current room with the player");
        next();
    }
};

//This function adds the 'description' property to the current room node. 
//It will overwrite what is there currently
let add_description = async function(words,next) {
    try {
        let description = words.slice(1).join(" ");
        let roomRes = await gremlin.getEntities('room', 'id', world.playerCurrentRoomID)
        let room = gremlin.rehydrateEntity(roomRes[0], Room)
        room.description = description
        await gremlin.updateEntity(world.playerCurrentRoomID, room)
        await look_api(next)
    } catch(e) {
        error(`Failed to add description to room. ${e.toString()}`);
    }
    next();
};

/* 
   STANDARD ACTION FUNCTIONS
*/

//This method respects the engine flab but also any user given overrides
let api_switch = function(words,api,local,next){
    if(words.length>1 && words[1]==="api") api(next);
    else if(words.length>1 && words[1]==="local") local(next);
    else use_api ? api(next) : local(next);
};

//This provides the description property of the first rooms in the array given.
//Should turn this into a generic 'describer' that takes in any kind of object array and collates whole description
let describe = function(rooms){
    if(rooms.length===1){
        let room = rooms[0];
        if(room.properties){
            if(room.properties.description && room.properties.description.length>0){
                //The properties description appears to be an array by default so mapping here. 
                //Have only ever seen one.
                desc(room.properties.description.map(d=>d.value).join());
                return;
            }
        }
    } else {//see comment about making this a generic describer
        console.log("You can't describe multiple rooms at once");
    }
    console.log("The void looks back into you");
};

//This described items.
let describe_items = function(items){
    if(items.length){
        items.forEach(item=>{
            if(item.properties){
                //this line makes a massive assumption the item was set up right.
                //Yes, it could be refactored. But I am not going to right now because it works.  
                desc(`  ${item.properties.name[0].value.white}: ${item.properties.description[0].value.grey}`)
            } else {
                desc(`This item has no name and is indescribable!`);
            }
        });
    }
};

//Describe what the player holds methods  - TO BE REMOVED
let inventory_local = function(next){
    // getPlayerItems(items=>{
    //     if(items.length){
    //         desc(`You have ${items.length} items`);
    //         describe_items(items);
    //     } else {
    //         desc(`You don't have anything.`);
    //     }
    //     next();
    // });
};

let inventory_api = async function(next){
    try {
        //let items = await call_api(`${process.env.API_BASE_HOST}/api/items/player/${world.playerNodeID}`)
        let items = await API.get('base', `items/player/${world.playerNodeID}`)
        desc(`You have ${items.length} item(s)`);
        items.forEach(item=>desc(`  ${item.name.white}: ${item.description.grey}`));
    } catch(e) {
        error("Error calling API for look "+e.toString())        
    }
    next();    
};

//looking about methods  - TO BE REMOVED
let look_local = function(next){
    // process.stdout.write("Looking ... ".green);
    // //Only does current room and exists so far, but should do items in rooms too
    // query("g.v('id',playerRoomId)",{playerRoomId:world.playerCurrentRoomID},(rooms)=>{
    //     describe(rooms);
    //     //When have a generic describer, should push this function down
    //     getExits((doors)=>{
    //         desc(`There are exits to the${doors.map((e)=>{return " " + e.label.white}).join()}`);
    //         getItems((items)=>{
    //             if(items.length){
    //                 desc(`You also see ${items.length} item(s)`);
    //                 describe_items(items);
    //             } else {
    //                 desc(`There is nothing else to see`);
    //             }
    //             next();
    //         });
    //     });
    // });
};

let look_api = async function(next){
    try {
        //let lookResult = await call_api(`${process.env.API_GOD_HOST}/api/room/${world.playerCurrentRoomID}/look?filter=${world.playerNodeID}`)
        let lookResult = await API.get('god', `room/${world.playerCurrentRoomID}/look?filter=${world.playerNodeID}`)
        desc(lookResult.gameMsg);
    } catch(e) {
        error("Error calling API for look "+e.toString())        
    }
    next();
};


//This detaches the item from the room and attaches it to the player.
let take = async function(words, next){
    let desired = words[1];
    debug(`you want the '${desired}'`);

    // Check item is here! - EDGE CASE NOT HANDLED: Multiple items with same name!
    let itemsHereRes = await gremlin.getEntitiesOut(world.playerCurrentRoomID, 'holds')
    let item
    for(let itemRes of itemsHereRes) {
        item = gremlin.rehydrateEntity(itemRes, Item)
        if(item.name === desired) break
    }

    if(item) {
        info(`You reach out and grab the '${desired}'...`);
        try {
            // Taking items is the same as moving, the in/out direction on the edge is reversed
            await gremlin.moveEntityIn(item.id, 'holds', world.playerNodeID);
            info(`The ${desired} is now yours!`);
        } catch(e) {
            info(`You fail to pick up the ${desired}`);
        }
        next();        
        return;
    }
    
    info(`There there is no '${desired}' here!`);
    next();
};

let drop = async function(words, next){
    let desired = words[1];
    debug(`you want to drop the '${desired}'`);

    // Check item is in inventory - EDGE CASE NOT HANDLED: Multiple items with same name!
    let itemsHereRes = await gremlin.getEntitiesOut(world.playerNodeID, 'holds')
    let item
    for(let itemRes of itemsHereRes) {
        item = gremlin.rehydrateEntity(itemRes, Item)
        if(item.name === desired) break
    }

    if(item) {
        info(`You reach out and try to drop the '${desired}'...`);
        try {
            // Taking items is the same as moving, the in/out direction on the edge is reversed
            await gremlin.moveEntityIn(item.id, 'holds', world.playerCurrentRoomID);
            info(`The ${desired} drops to the floor!`);
        } catch(e) {
            info(`You fail to drop the ${desired}`);
        }
        next();        
        return;
    }
    
    info(`You are not carrying '${desired}'!`);
    next();
};

//This function moves the player to other locations. 
//In the graph it disconnects the player 'in' edge from the current room node 
//   and reconnects to the other end of the 'edge' to the new room. 
let walk = async function(words,next){
    process.stdout.write(`[${words[0].green}ing .`.green);//To allow for multiple verbs
    
    if(words.length == 1) {
        console.log("You must say which way you want to go. For example 'walk north'");
        next();
        return;
    }

    let direction = words[1];
    process.stdout.write(".".green);

    // Get exits and see if user had picked one
    let pathsRes = await gremlin.getLinksByLabel(world.playerCurrentRoomID, 'path');
    let chosenRoom = pathsRes.filter(path => { return path.properties.name === direction });

    if(chosenRoom.length === 1) {
        world.playerCurrentRoomID = chosenRoom[0].inV;
        await gremlin.moveEntityOut(world.playerNodeID, 'in', chosenRoom[0].inV);
        game(" arrived!]");
        await look_api(next)
    } else {
        game(`There is no exit to the '${direction.white}']`);
        next();        
    }
    
    next();
};

// This is going to be terrible
let say = async function(words,next){
    //let msg = words.slice(1, words.length).join("")
    await API.postRoomMessage(world.playerCurrentRoomID, `${world.playerName} says: ` + words.slice(1, words.length).join(" "))
    //     `${process.env.API_GOD_HOST}/api/room/${world.playerCurrentRoomID}/message`, {
    //     message: `${world.playerName} says: ` + words.slice(1, words.length).join(" ")
    // })
    
    next();
};

//This is the main 'parser' that turns a user input into the function call.
//Very very basic. Would be better as a bot.
let act = function(command, next){
    let words = command.split(" ");
    switch(words[0]) {
        case "l": 
        case "look": 
            api_switch(words,look_api,look_local,next);
            break;
        case "i":
        case "inventory":
            api_switch(words,inventory_api,inventory_local,next);
            break;
        case "make":
            make(words,next);
            break;
        case "go":
        case "walk":
            walk(words,next);
            break;
        case "get":
        case "take":
            take(words,next);
            break;
        case "drop":
            drop(words,next);
            break;
        case "describe:":
            add_description(words,next);
            break;
        case "who":
            info(`You are: '${world.playerNodeID}'`);
            info(`Your name is: '${world.playerName}'`);
            next();
            break;
        case "where":
            info(`You are in: '${world.playerCurrentRoomID}'`);
            next();
            break;
        case "test":
            test(next);
            break;
        case "engine:":
            engine(words,next);
            break;
        case "say":
            say(words,next);
            break;            
        default:
            info("What?");
            next();
    }
};

/* 
   SET UP FUNCTIONS
*/

// Creates a room if none exist
let bootstrap = async function(next){
    let room = new Room('start', 'The starting room');
    let result = await gremlin.createEntity(room);
    room.id = result[0].id;
    info(`In the beginning the Universe was created. This has made a lot of people very angry and been widely regarded as a bad move`);
    info(`\nThe universe now contains one room: '${room.id}'\n`);
    info(`After this run BLAH BLAH and pass this new room ID`);
    info(`Exiting, bye!`);
    process.exit(0)
};

// Gets the player node id from the graph
let setup_player = async function() {
    process.stdout.write("\t[Player ... ".grey);

    let results = await gremlin.getEntities('player', 'id', process.env.LOCAL_PLAYER_ID);

    if(results.length === 1) {
        world.playerNodeID = results[0].id;
        world.playerName = results[0].properties.name[0].value;
        debug(`Player ID: ${world.playerNodeID}. Player Name: ${world.playerName}]`);
        return true;
    } else if (results.length===0){
        error('\nPlayer not found, check env and LOCAL_PLAYER_ID is set correctly');
        error('Or to create new player run: app.js addPlayer {roomId} {name} "{description}"');
        return false;
    } else {
        error("\t[Too many player nodes with id");
        return false;
    }
};

//Collect the current room ID from the user in the graph
let setup_room = async function(){
    process.stdout.write("\t[Room   ... ".grey);
    let results = await gremlin.getEntitiesOut(world.playerNodeID, 'in')
    if(results.length === 1) {
        world.playerCurrentRoomID = results[0].id;
        debug(`Player Room ID: ${world.playerCurrentRoomID}]`);
        return true
    } else {
        error("\t[Player can only be in one room]");
        return false
    }
};

// Check we have at least one room
let setup_world = async function() {
    let rooms = await gremlin.getEntities('room', 'label', 'room')
    if(rooms.length < 1) {
        // No rooms! Trigger bootstrap and exit
        await bootstrap();
        return false
    }
    return true
}

let create_player = async function(roomId, name, description) {
    let roomRes = await gremlin.getEntities('room', 'id', roomId)
    if(roomRes.length != 1) { 
        throw new Error(`Room '${roomId}' does not exist, can not create player!`)
    }

    let player = new Player(name, description);
    let result
    try {
        result = await gremlin.createEntityLinkedTo(player, 'in', roomId);
    } catch(e) {
        console.error(e);
        return null
    }

    player.id = result[0].id;
    return player
}

//This is the main game setup. 
//Other setup functions are all called from here. 
let setup = async function(next) {
    if(process.argv.length > 2) {
        switch(process.argv[2].toLowerCase()) {
            case 'addplayer':
                if(process.argv.length < 6) { info('Syntax is: addPlayer {roomId} {name} "{description}"'); process.exit(1) }
                info('Adding a new player...') 
                try {
                    let player = await create_player(process.argv[3], process.argv[4], process.argv[5])
                    info(`Rejoyce! '${player.name}' has been beamed into the world\n`)
                    info(`Now edit your .env file and set LOCAL_PLAYER_ID to be id: ${player.id}\n\nExiting...`)
                    process.exit(0);
                } catch(e) {
                    console.log(e);
                    process.exit(1);
                }
                break;
            default:
                if(!process.argv[2].includes('.env')) {
                    error("Arguments to app.js can be: addplayer or a config.env file to load")
                    process.exit(1);
                }
        }
    }

    debug('[Setting up ...');
    if(! await setup_world()) {
        error('- Problem with world, exiting!')
        process.exit(1)
    }
    if(! await setup_player()) {
        error('- Problem with player, exiting!')
        process.exit(1)
    }   
    if(! await setup_room()) {
        error('- Problem with player current room, exiting!')
        process.exit(1)
    }      
    
    // Look at startup
    await look_api(next)

    // chaining stuff
    next()
};

/* 
   MAIN RECURSION
*/

//This is the main game loop.
//It is async and recursive to work with RL and Graph APIs.
let interactive = function(finalise){
    rl.question(`\n${use_api?"API":"LOCAL"}: [What would you like to do?]\n> `.green,(response)=>{
        if(response === "quit" || response === "exit") finalise();//This is the recursion exit.
        else act(response,()=>{interactive(finalise)});
    });
};

game(
`                                  
   Welcome to the world creator   
                                  `
.bgWhite
);

//This is the 'clean' shut down, closing the 'readline' and and exiting the process.
let kill = function(){
    game(
`        
  Bye!  
        `
        .bgWhite);
    rl.close();
    process.exit();
};

// =========================================================
// Begin!
// =========================================================

// Otherwise start the game client
setup(()=>{interactive(kill);});


// Janky message comms test, looping polling thing
// Not using API to keep overhead low - for now
var lastCheck = new Date().getTime()
setInterval(() => {
    gremlin.getEntities('room', 'id', world.playerCurrentRoomID)
    .then(roomRes => {
        let room = gremlin.rehydrateEntity(roomRes[0], Room);
        for(let msg of room.messages) {
            if(msg.text.startsWith(`${world.playerName} says:`)) continue;
            if(msg.timestamp > lastCheck)
                post("\n" + msg.text); 
        }
        lastCheck = new Date().getTime();
    })

}, 8000);
