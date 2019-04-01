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

const API = require('../../shared/lib/api')
const RPG = require('../../shared/lib/rpg')

//Write to the console in the debug colour.
let debug = function(text){ console.log(text.grey); };
let error = function(text){ console.error(text.red); };
let game = function(text){ console.log(text.green); };
let info = function(text){ console.log(text.yellow); };
let desc = function(text){ console.log(text.cyan); };
let post = function(text){ console.log(text.magenta); };

/* 
   UTILITY FUNCTIONS
*/

let test = function(next){
    //A place to test stuff. 
    error('No test code currently live')
    next();
};

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
    // possibleDirections:{
    //     "north":"south",
    //     "east":"west",
    //     "south":"north",
    //     "west":"east",
    //     "up": "down",
    //     "down": "up"
    // }
};

/* 
   WORLD BUILDER ACTION FUNCTIONS
*/

let make_room = async function(words,next){
    let direction = words[3];

    try {
        debug(`Making a(n) new room to the ${direction}`);
        let newRoomReq = {
            "name": "room "+RPG.rand(1, 10000),
            "description": "A plain room",
            "direction": direction
        }
        let resp = await API.post('god', `room/${world.playerCurrentRoomID}/create`, newRoomReq)
        info(resp.gameMsg);

    } catch(e) {
        error(`Failed to make room. ${e.apiMsg ? e.apiMsg : e.toString()}`);
    }
    next();
};

let make_item = async function(words,next){
    let itemName = words[2];
    try {
        let desc = words.slice(3).join(" ");
        debug(`Making a(n) '${itemName}': '${desc}'`);
        let resp = await API.post('god', `items/heldby/${world.playerCurrentRoomID}`, {name: itemName, description: desc})
        if(resp) info(resp.gameMsg);
    } catch(e) {
        error(`Failed to make item. ${e.toString()}`);
    }
    next();
};

let make_npc = async function(words, next){
    let type = words[2];
    try {
        debug(`Spawning a(n) NPC '${type}'`);
        let resp = await API.post('agent', `npcs/create`, {type: type, locationId: world.playerCurrentRoomID})
        if(resp) info(resp.gameMsg);
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
        let roomRes = await API.get('god', `entities/room/${world.playerCurrentRoomID}`)    
        let room = roomRes.entities[0]; 
        room.description = description
        let resp = await API.put('god', `entities/${world.playerCurrentRoomID}`, room)
        info(resp.gameMsg);        
        await look(next)
    } catch(e) {
        error(`Failed to add description to room. ${e.toString()}`);
    }
    next();
};

/* 
   STANDARD ACTION FUNCTIONS
*/

let inventory = async function(next){
    try {
        let items = await API.get('agent', `agents/${world.playerNodeID}/items`)
        desc(`You have ${items.length} item(s)`);
        items.entities.forEach(item=>desc(`  ${item.name.white}: ${item.description.grey}`));
    } catch(e) {
        error("Error calling API for look "+e.toString())        
    }
    next();    
};

let look = async function(next){
    try {
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

    let lookResult = await API.get('god', `room/${world.playerCurrentRoomID}/look?filter=${world.playerNodeID}`)
    let item = lookResult.entities.find(e => (e.label === 'item' && e.name === desired))
    
    if(!item) {
        info(`There there is no '${desired}' here!`);
        next();
    }
    try {
        let moveResult = await API.post('god', `items/${item.id}/moveto`, {holderId: world.playerNodeID})
        info(`The ${desired} is now yours!`);
    } catch(e) {
        error(`You fail to pick up the ${desired}`);
    }
    next();
};

let drop = async function(words, next){
    let desired = words[1];
    debug(`you want the '${desired}'`);

    try {
        let itemsResult = await API.get('agent', `agents/${world.playerNodeID}/items`)
        let item = itemsResult.entities.find(e =>  e.name === desired)
        
        if(!item) {
            info(`You are not carrying a ${desired}`);
            next();
        }

        let moveResult = await API.post('god', `items/${item.id}/moveto`, {holderId: world.playerCurrentRoomID})
        info(`You drop the ${desired} onto the ground`);
    } catch(e) {
        error(`You fail to pick up the ${desired}`);
    }
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

    // Walk is now a API
    try {
        let walkRes = await API.post('agent', `agents/${world.playerNodeID}/walk`, {direction: direction});
        // Should return new room if successful
        if(walkRes.entities.length > 0) {
            world.playerCurrentRoomID = walkRes.entities[0].id;
            game(" arrived!]");
            await look(next)            
        } else {
            game(walkRes.gameMsg);  
        }
    } catch(e) {
        error("ERROR "+e.toString());
    }
    
    next();
};

// This is going to be terrible
let say = async function(words,next) {
    await API.postRoomMessage(world.playerCurrentRoomID, `${world.playerName} says: ` + words.slice(1, words.length).join(" "))
    next();
};

//This is the main 'parser' that turns a user input into the function call.
//Very very basic. Would be better as a bot.
let act = function(command, next){
    let words = command.split(" ");
    switch(words[0]) {
        case "l": 
        case "look": 
            look(next);
            break;
        case "i":
        case "inventory":
            inventory(next);
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
    try {
        let result = await API.post('god', `room`, {
            name: 'start',
            description: 'The starting room',
        })
        room = result.entities[0];
        info(`In the beginning the Universe was created. This has made a lot of people very angry and been widely regarded as a bad move`);
        info(`\nThe universe now contains one room: '${room.id}'\n`);
        info(`After this add players by with: npm run addplayer ${room.id} {name} "{description}"`);
        info(`Exiting, bye!`);
    } catch(e) {
        error(`Unable to create starting room ${e.toString}`);
    }
    process.exit(0)
};

// Gets the player node id from the graph
let setup_player = async function() {
    process.stdout.write("\t[Player ... ".grey);

    try {
        let results = await API.get('god', `entities/player/${process.env.LOCAL_PLAYER_ID}`)
        if(results.entities.length === 1) {
            world.playerNodeID = results.entities[0].id;
            world.playerName = results.entities[0].name;
            debug(`Player ID: ${world.playerNodeID}. Player Name: ${world.playerName}]`);
            return true;
        } else {
            error("\t[Too many player nodes with id");
            return false;
        }
    } catch(e) {
        error('\nPlayer not found, check env and LOCAL_PLAYER_ID is set correctly');
        error('Or to create new player with: npm run addplayer {roomId} {name} "{description}"');
        return false;
    }
};

//Collect the current room ID from the user in the graph
let setup_room = async function(){
    process.stdout.write("\t[Room   ... ".grey);
    
    let results = await API.get('god', `room/whereis/${process.env.LOCAL_PLAYER_ID}`)
    if(results.entities.length > 0) {
        world.playerCurrentRoomID = results.entities[0].id;
        debug(`Player Room ID: ${world.playerCurrentRoomID}]`);
        return true
    } else {
        error("\t[Player is not in a room! That's really bad]");
        return false
    }
};

// Check we have at least one room
let setup_world = async function() {
    let results = await API.get('god', `entities/room`)
    if(results.entities.length < 1) {
        // No rooms! Trigger bootstrap and exit
        await bootstrap();
        return false
    }
    return true
}

let create_player = async function(roomId, name, description) {
    try {
        let roomRes = await API.get('god', `entities/room/${roomId}`)
        if(roomRes.entities.length != 1) { 
            throw new Error(`Room '${roomId}' does not exist, can not create player!`)
        }
        let playerRes = await API.post('agent', `players/create`, {
            name: name,
            description: description,
            startRoomId: roomId
        })
        debug(playerRes.gameMsg);
        debug(JSON.stringify(playerRes.entities[0], null, 3));
        
        return playerRes.entities[0]
    } catch(e) {
        error(`Unable to create player ${e.toString}`);
    }

    return null
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
    await look(next)

    // chaining stuff
    next()
};

/* 
   MAIN RECURSION
*/

//This is the main game loop.
//It is async and recursive to work with RL and Graph APIs.
let interactive = function(finalise){
    rl.question(`\n[What would you like to do?]\n> `.green,(response)=>{
        if(response === "quit" || response === "exit") finalise();//This is the recursion exit.
        else act(response,()=>{interactive(finalise)});
    });
};

game(
`                                  
   Welcome to the world creator   
                                  `
.bgWhite.blue
);

//This is the 'clean' shut down, closing the 'readline' and and exiting the process.
let kill = function(){
    game(
`        
  Bye!  
        `
        .bgWhite.black);
    rl.close();
    process.exit();
};

// =========================================================
// Begin!
// =========================================================

// Otherwise start the game client
setup(()=>{interactive(kill);});


// =========================================================
// Janky message looping polling thing which seems to work
// =========================================================
var lastCheck = new Date().getTime()
setInterval(() => {
    try {
        API.get('god', `room/whereis/${world.playerNodeID}`)
        .then(results => {
            for(let msg of results.entities[0].messages) {
                if(msg.text.startsWith(`${world.playerName} says:`)) continue;
                if(msg.text === `The ${world.playerName} has entered`) continue;
                if(msg.timestamp > lastCheck)
                    post("\n" + msg.text); 
            }
            lastCheck = new Date().getTime();
        })
        .catch(err => { 
            console.log(err)
        })
    } catch(e) {
        // nothing
    }
}, 5000);
