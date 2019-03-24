/*
    This is a console text adventure using Cosmos DB Graph through Gremlin as full state back end.
    This code is presented 'as is' with no licence or warrenty of any kind - purely for demonstration purposes. 
    Use at your own risk.

    Early Cosmos DB Graph code build from reading: https://github.com/Azure-Samples/azure-cosmos-db-graph-nodejs-getting-started

    Thanks, Phil.
*/
const fs = require('fs');//used to write graph dumps while testing visualisation
const gremlin = require('gremlin');//npm install gremlin
const readline = require('readline');//npm install readline
const colors = require('colors');//npm install colors
const http = require('http');
const config = require("./config");//copy config_template.js as config.js and fill in your settings.
const gwr = require("./shared/lib/gremlin_wrapper.js");
const gwr2 = require("./shared/lib/gremlin-wrapper-v2");
const query = gwr.query;
const axios = require('axios')

const Player = require('./shared/lib/player')
const Room = require('./shared/lib/room')
const Item = require('./shared/lib/item')

//Write to the console in the debug colour.
let debug = function(text){ console.log(text.grey); };
let error = function(text){ console.error(text.red); };
let game = function(text){ console.log(text.green); };
let info = function(text){ console.log(text.yellow); };
let desc = function(text){ console.log(text.cyan); };

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
let getExits = function(next){
    query("g.v('id',roomid).outE().where(inV().has('label','room'))",{roomid:world.playerCurrentRoomID},results=>next(results));
};

//This retuns the 'out edges' from the players current room. An out edge represents a door.
let getItems = function(next){
    query("g.v('id',roomid).outE().where(has('label','holds')).inV()",{roomid:world.playerCurrentRoomID},results=>next(results));
};

let getPlayerItems = function(next){
    query("g.v('id',playerid).outE().where(has('label','holds')).inV()",{playerid:world.playerNodeID},results=>next(results));
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
    possibleDirections:{
        "north":"south",
        "east":"west",
        "south":"north",
        "west":"east"
    }
};

/* 
   WORLD BUILDER ACTION FUNCTIONS
*/

let make_room = function(words,next){
    let direction = words[3];
    if(world.possibleDirections[direction]){
        info("Checking...");
        getExits(async (rooms)=>{
            if(rooms.some(r=>r.label===direction)){
                info(`There is already a room to the ${direction.white}.`);
                info("Try and make a room in an unused direction. use [look] to see which directions have been used.");
                next();
            } else {
                info(`OK. Building room to the ${direction.white}...`);
                let opposite = world.possibleDirections[direction];
                debug(`Return door to: ${opposite}.`);

                let rnd = Math.floor(Math.random() * Math.floor(10000));
                let newRoom = new Room(`room ${rnd}`, 'An empty room');
                let result = await gwr2.createEntityLinkedTo(newRoom, opposite, world.playerCurrentRoomID)
                newRoom.id = result[0].id;
                await gwr2.createLinkTo(world.playerCurrentRoomID, direction, newRoom.id)
                next();
            }
        });
    } else {
        info(`You can't make a room to the ${direction.white}.`);
        info(`Only 'north, south, east and west' are currently allowed.`);
        next();
    } 
};

let make_item = async function(words,next){
    let itemName = words[2];
    let desc = words.slice(3).join(" ");
    debug(`Making a(n) '${itemName}': '${desc}'`);

    let item = new Item(itemName, desc);
    let result = await gwr2.createEntityLinkedFrom(item, 'holds', world.playerCurrentRoomID);
    item.id = result[0].id;
    next();
};

let make_npc = function(words, next){
    let type = words[2];
    call_api_post(`${config.npcURL}/api/npcs/create`, {type: type, locationId: world.playerCurrentRoomID})
    .then(resp => {
        if(resp && resp.data) {
            info(`${resp.data.gameMsg} before your very eyes!`);
        }
        next();
    })
    .catch(err => {
        error(`Failed to spawn NPC. ${err.response.data.apiMsg}`);
        next();
    })
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
let add_description = function(words,next){
    let description = words.slice(1).join(" ");
    query("g.v('id',playerRoomId).property('description',desc)",
        {playerRoomId:world.playerCurrentRoomID,desc:description},
        (results)=>{
            debug("Description added to room");
            act("look",next);        
        }
    );
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

//the wrapper method for calling the API based engine
// !!TODO!! move this to Axios as well
let call_api = function(call,next){
    http.get(call,resp=>{
        let data = '';
        resp.on('data',chunk=>data +=chunk);
        resp.on('end',()=>next(JSON.parse(data)));
    });
};

// Make a HTTP post call
let call_api_post = function(url, data){
    return axios.post(url, data)
    .then((response) => {
        return response
    })   
};

//Describe what the player holds methods
let inventory_local = function(next){
    getPlayerItems(items=>{
        if(items.length){
            desc(`You have ${items.length} items`);
            describe_items(items);
        } else {
            desc(`You don't have anything.`);
        }
        next();
    });
};

let inventory_api = function(next){
    call_api(`${config.baseURL}/api/items/player/${world.playerNodeID}`,(items)=>{
        desc(`You have ${items.length} item(s)`);
        items.forEach(item=>desc(`  ${item.name.white}: ${item.description.grey}`));
        next();
    });
};

//looking about methods
let look_local = function(next){
    process.stdout.write("Looking ... ".green);
    //Only does current room and exists so far, but should do items in rooms too
    query("g.v('id',playerRoomId)",{playerRoomId:world.playerCurrentRoomID},(rooms)=>{
        describe(rooms);
        //When have a generic describer, should push this function down
        getExits((doors)=>{
            desc(`There are exits to the${doors.map((e)=>{return " " + e.label.white}).join()}`);
            getItems((items)=>{
                if(items.length){
                    desc(`You also see ${items.length} item(s)`);
                    describe_items(items);
                } else {
                    desc(`There is nothing else to see`);
                }
                next();
            });
        });
    });
};

let look_api = function(next){
    call_api(`${config.godURL}/api/room/${world.playerCurrentRoomID}/look`,(result)=>{
        desc(result.gameMsg);
        next();
    });
    /*
    call_api(`${config.baseURL}/api/players/${world.playerNodeID}/look`,(result)=>{
        result.locations.forEach(location=>desc(location.description));
        if(result.doors && result.doors.length){
            desc(`There are ${result.doors.length} door(s) to the`.grey);
            desc(`  ${result.doors.map(d=>d.name).join(", ").white}`);
        } else desc('There is no way out!'.grey);
        if(result.items && result.items.length){
            desc(`You also see ${result.items.length} item(s)`.grey);
            result.items.forEach(item=>desc(`  ${item.name.white}: ${item.description.grey}`));
        } else desc("You don't see any items.".grey);
        if(result.npcs && result.npcs.length){
            desc(`You also see ${result.npcs.length} figures(s)`.grey);
            result.npcs.forEach(npc=>desc(`  ${npc.name.white}`));
        } else desc("You are alone in this room.".grey);
        next();
    });
    */
};


//This detaches the item from the room and attaches it to the player.
let take = function(words,next){
    let desired = words[1];
    debug(`you want the '${desired}'`);
    getItems(async items=>{
        if(items.length){
            let found = items.filter(e=>(e.properties.name[0].value===desired));
            if(found.length===1){
                let item = found[0];

                try {
                    await gwr2.moveEntityIn(item.id, 'holds', world.playerNodeID);
                    info(`The ${desired} is now yours!`);
                } catch(e) {
                    info(`You fail to pick up the ${desired}`);
                }
                next();

                // debug(JSON.stringify(item.id));
                // info(`You reach out for the '${item.properties.name[0].value}'`);
                // query("g.v('id',itemid).inE('label','holds').drop()", //we disconnect from what ever is holding (room).
                //     {itemid:item.id},
                //     (results)=>{
                //         info(`You grasp the '${item.properties.name[0].value}'`);
                //         query("g.v('id',playerId).addE('holds').to(g.v('id',itemid))",
                //             {playerId:world.playerNodeID,itemid:item.id},
                //             (results)=>{
                //                 info(`The '${item.properties.name[0].value}' is now yours!`);
                //                 next();
                //             }
                //         );
                //     });
            } else {
                info(`There there is no '${desired}'`);
                next();//next here to prevent 'fall through'
            }
        } else {
            info(`There are no items here so you can't take '${desired}'`);
            next();//next here to prevent 'fall through'
        }
    });
};

//This detaches the item from the player and attaches it to the room. Dedupe with above?
let drop = function(words,next){
    let desired = words[1];
    debug(`you want to drop the '${desired}'`);
    getPlayerItems(items=>{
        if(items.length){
            let found = items.filter(e=>(e.properties.name[0].value===desired));
            if(found.length===1){
                let item = found[0];
                debug(JSON.stringify(item.id));
                info(`You hold '${item.properties.name[0].value}' in front of you and let go.`);
                query("g.v('id',itemid).inE('label','holds').drop()", //we disconnect from what ever is holding (room).
                    {itemid:item.id},
                    (results)=>{
                        info(`The '${item.properties.name[0].value}' falls`);
                        query("g.v('id',playerRoomId).addE('holds').to(g.v('id',itemid))",
                            {playerRoomId:world.playerCurrentRoomID,itemid:item.id},
                            (results)=>{
                                info(`The '${item.properties.name[0].value}' is now now in the room!`);
                                next();
                            }
                        );
                    });
            } else {
                info(`You don't have '${desired}' to drop.`);
                next();//next here to prevent 'fall through'
            }
        } else {
            info(`You aren't holding anything so cannot drop the '${desired}'.`);
            next();//next here to prevent 'fall through'
        }
    });
};

//This function moves the player to other locations. 
//In the graph it disconnects the player 'in' edge from the current room node 
//   and reconnects to the other end of the 'edge' to the new room. 
let walk = function(words,next){
    process.stdout.write(`[${words[0].green}ing .`.green);//To allow for multiple verbs
    if(words.length>1){
        let direction = words[1];
        getExits((results)=>{//we want to make sure the users has specified a possibility
            process.stdout.write(".".green);//this is a very basic 'progress bar' of dots
            let chosen = results.filter((e)=>{return e.label===direction});
            if(chosen.length===1){
                //Need to investigte making this one query (more transactional and less prone to break)
                query("g.v('id',playerId).outE('label','in').drop()",
                    {playerId:world.playerNodeID},
                    (results)=>{
                        process.stdout.write(".".green);//progress
                        //Add an edge from palyer to the 'end' of the 'door edge'.
                        query("g.v('id',playerId).addE('in').to(g.v('id',newRoomId))",
                            {playerId:world.playerNodeID,newRoomId:chosen[0].inV},
                            (results)=>{
                                world.playerCurrentRoomID = chosen[0].inV;//Update state
                                game(" arrived!]");
                                act("look",next); //Give the standard description of the new room.
                        });
                });
            } else {//Feedback if the user has made a mistake
                game(`There is no exit to the '${direction.white}']`);
                next();
            }
        });
    } else {
        console.log("You must say which way you want to go. For example 'walk north'");
        next();
    }
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
        default:
            info("What?");
            next();
    }
};

/* 
   SET UP FUNCTIONS
*/

//Creates a player in a room if the player doesn't exist
let bootstrap = async function(next){
    // (BC) New version
    world.playerName = "First Player (for testing)";
    
    let room = new Room('start', 'The starting room');
    let result = await gwr2.createEntity(room);
    room.id = result[0].id;
    info(`In the beginning the Universe was created. This has made a lot of people very angry and been widely regarded as a bad move`);
    info(`The universe now contains one room: '${room.id}'`);

    let player = new Player('First Player', 'A test player');
    result = await gwr2.createEntityLinkedTo(player, 'in', room.id);
    player.id = result[0].id
    world.playerNodeID = player.id;

    info(`##########################################################################################`);
    info(`Your player ID is: '${world.playerNodeID}' put this in config.js as 'config.playerVectorID'`);
    info(`And then restart the app`);
    process.exit(0)
};

//Gets the player node id from the graph
let setup_player = function(next){
    process.stdout.write("\t[Player ... ".grey);
    query("g.V('id',playerVectorID)",
        {playerVectorID:config.playerVectorID},//you are identified by your config file currently
        (results)=>{
            if(results.length===1){
                world.playerNodeID = results[0].id;
                world.playerName = results[0].properties.name[0].value;
                debug(`Player ID: ${world.playerNodeID}. Player Name: ${world.playerName}]`);
                next();
            } else if (results.length===0){
                error("You have no players!");
                debug("I will create one for you. When I am done, I will give you the ID to put in your config");
                bootstrap(next);
            } else {
                error("\t[Too many player nodes with id in config.]");
                next();
            }
        });
};

//Collect the current room ID from the user in the graph
let setup_room = function(next){
    process.stdout.write("\t[Room   ... ".grey);
    query("g.v('id',playerId).out('in')",
        {playerId:world.playerNodeID},
        (results)=>{
        //old_query(`g.v('id','${world.playerNodeID}').out('in')`,(results)=>{
            if(results.length===1){
                world.playerCurrentRoomID = results[0].id;
                debug(`Player Room ID: ${world.playerCurrentRoomID}]`);
            } else {
                error("\t[Player can only be in one room]");
            }
            next();
    });
};

//This is the main game setup. 
//Other setup functions are all called from here. 
let setup = function(next){
    debug('[Setting up ...');
    let last = ()=>{debug(' Setup complete!]\n');info("Use 'engine: (api|local)' to use API or LOCAL command eval.");next();}
    let two = ()=>{setup_room(last);}
    setup_player(two);//Call back style for chaining.
};

/* 
   MAIN RECURSION
*/

//This is the main game loop.
//It is asnyc and recursive to work with RL and Graph APIs.
let interactive = function(finalise){
    rl.question(`\n${use_api?"API":"LOCAL"}: [What would you like to do?]\n>`.green,(response)=>{
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

//Begin!
setup(()=>{interactive(kill);});