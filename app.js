/*
Done:
[o] Split config out to seperate file as per example
[o] GitIgnore Config file
[o] Create template config file with notes on creation
[o] Comments
[o] Get code into GitHub
[o] Colors!
[o] Get room builing to work (doors back and forth) - limited for now
[o] Refactors based on Tim S feedback
[o] Prove that Parameterised queries work
[o] Update to parameterised queries 
[o] LET vs VAR refactors

Working on:

To Do:
[ ] Items in the world
[ ] Connecting two rooms wich already exist.
[ ] Generic describer
[ ] Moving Items (take, hold, drop)
[ ] Golem that moves with seperate function (or Azure functions call)
[ ] Investigate making drop/attach one query
[ ] Seperate 'text strings' out into a config file.
[ ] Drawing the map
*/

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
const config = require("./config");//copy config_template.js as config.js and fill in your settings.

//Creates a client and tests the connection to Cosmos DB.
const gremlinClient = gremlin.createClient(
    config.port, //usually 443
    config.endpoint, 
    { 
        "session": false, 
        "ssl": true, 
        "user": `/dbs/${config.database}/colls/${config.collection}`,
        "password": config.primaryKey
    }
);

//Write to the console in the debug colour.
let debug = function(text){ console.log(text.grey); };
let error = function(text){ console.error(text.red); };
let game = function(text){ console.log(text.green); };
let info = function(text){ console.log(text.yellow); };
let desc = function(text){ console.log(text.cyan); };

/* 
   UTILITY FUNCTIONS
*/

//This function wraps a standard call to cosmos and outputs any errors calling 'next' with query result. 
let query = function(query,parameters,next){
    //debug(query);
    gremlinClient.execute(query,parameters,(err,results)=> {
        if (err)  error(`Error: ${err}`);
        else next(results);
    }); 
};

//writes out a file of nodes then edges
let dump_whole_graph = function(next){
    query("g.V().map(values('id','label','description').fold())",null,(node_results)=>{
        nodes = JSON.stringify(node_results);
        query("g.E()",null,(edge_results)=>{
            edges = JSON.stringify(edge_results);
            output = `let graph_data_actual = {nodes:${nodes},edges:${edges}};`
            fs.writeFile("./data/actual_cosmos.js", output, function(err) {
                if(err) {return error(err);}
                else {debug("graph output!");}
                next();
            }); 
        });
    });
};

let test = function(next){
    //A place to test stuff. 
    error('No test code currently live');
    next();
    /*
    query("g.v('id',playerid).outE()",{playerid:world.playerNodeID},(results)=>{
        debug(JSON.stringify(results));
        next();
    });
    */
};

//This retuns the 'out edges' from the players current room. An out edge represents a door.
let getExits = function(next){
    query("g.v('id',roomid).outE().where(inV().has('label','room'))",{roomid:world.playerCurrentRoomID},results=>next(results));
};

//This retuns the 'out edges' from the players current room. An out edge represents a door.
let getItems = function(next){
    query("g.v('id',roomid).outE().where(has('label','holds')).inV()",{roomid:world.playerCurrentRoomID},results=>next(results));
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
        getExits((rooms)=>{
            if(rooms.some(r=>r.label===direction)){
                info(`There is already a room to the ${direction.white}.`);
                info("Try and make a room in an unused direction. use [look] to see which directions have been used.");
                next();
            } else {
                info(`OK. Building Room to the ${direction.white}...`);
                let opposite = world.possibleDirections[direction];
                debug(`Return door to: ${opposite}.`);
                query("g.addV('room').property('made','node app').addE(opp).to(g.V('id',playerRoomId))",
                    {opp:opposite, playerRoomId:world.playerCurrentRoomID},
                    (newEdges)=>{
                        info(`Connecting door to current room...`);
                        query("g.V('id',playerRoomId).addE(dir).to(g.V('id',newRoomId))",
                        {playerRoomId:world.playerCurrentRoomID,dir:direction,newRoomId:newEdges[0].outV},
                        (result)=>{
                            info(`Connected door to current room`);
                            next();
                        });
                    }
                );
            }
        });
    } else {
        info(`You can't make a room to the ${direction.white}.`);
        info(`Only 'north, south, east and west' are currently allowed.`);
        next();
    } 
};

let make_item = function(words,next){
    let item = words[2];
    let desc = words.slice(3).join(" ");
    debug(`Making a(n) '${item}': '${desc}'`);
    query("g.addV('item').property('made','node app').property('description',description).property('name',name).addE('holds').from(g.V('id',playerRoomId))",
        {playerRoomId:world.playerCurrentRoomID,description:desc,name:item},
        (result)=>{
            info(`item '${item}' made`)
            next();
        });
};

//This is the function that 'makes' things. It will make rooms first and then other things.
//This would not be in the 'normal player' interface, but in the world builder interface
let make = function(words,next){
    if(words.length===4 && words[1]==='room' && words[2]==='to'){
        make_room(words,next);
    } else if(words.length>=4 && words[1]==='item'){
        make_item(words,next);
    } else {
        info("The syntax for the make command is: "+ "make [room] to [direction].".white);
        info("If a [room] already exists to the [direction] the command will fail.");
        info("To add a description you will need to [walk] to the [direction] to enter the room.");
        info("");
        info("For an item it the syntax is: "+ "make [item] name description".white);
        info("The item will be dropped in the room you make it in");
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
            look(next);        
        }
    );
};

/* 
   STANDARD ACTION FUNCTIONS
*/

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
}

//The top level action function for describing what the player sees
let look = function(next){
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
                                look(next);//Give the standard description of the new room.
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
        case "look": 
            look(next);
            break;
        case "make":
            make(words,next);
            break;
        case "go":
        case "walk":
            walk(words,next);
            break;
        case "describe:":
            add_description(words,next);
            break;
        case "who":
            info(`You are: '${world.playerNodeID}'`);
            next();
            break;
        case "where":
            info(`You are in: '${world.playerCurrentRoomID}'`);
            next();
            break;
        case "test":
            test(next);
            break;
        case "dump":
            dump_whole_graph(next);
            break;
        default:
            info("What?");
            next();
    }
};

/* 
   SET UP FUNCTIONS
*/

//Gets the player node id from the graph
let setup_player = function(next){
    process.stdout.write("\t[Player ... ".grey);
    //Would need to change this for multiple players. 
    //Collect player name from user and connect to that node.
    query("g.V().has('label','player')",{},(results)=>{
        if(results.length===1){
            world.playerNodeID = results[0].id;
            debug(`Player ID: ${world.playerNodeID}]`);
        } else {
            error("\t[Too many player nodes.]");
        }
        next();
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
    let last = ()=>{debug(' Setup complete!]\n');next();}
    let two = ()=>{setup_room(last);}
    setup_player(two);//Call back style for chaining.
};

/* 
   MAIN RECURSION
*/

//This is the main game loop.
//It is asnyc and recursive to work with RL and Graph APIs.
let interactive = function(finalise){
    rl.question('\n[What would you like to do?]\n> '.green,(response)=>{
        if(response === "quit") finalise();//This is the recursion exit.
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