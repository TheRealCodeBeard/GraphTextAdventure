/*
Done:
[o] Split config out to seperate file as per example
[o] GitIgnore Config file
[o] Create template config file with notes on creation
[o] Comments
[o] Get code into GitHub
[o] Colors!
[o] Get room building to work (doors back and forth) - limited for now

Working on:
[ ] Items in the world

To Do:
[ ] Generic describer
[ ] Moving Items (take, hold, drop)
[ ] Golem that moves with seperate function (or Azure functions call)
[ ] Investigate making drop/attach one query
[ ] Seperate 'text strings' out into a config file.
*/

/*
    This is a console text adventure using Cosmos DB Graph through Gremlin as full state back end.
    This code is presented 'as is' with no licence or warrenty of any kind - purely for demonstration purposes. 
    Use at your own risk.

    Early Cosmos DB Graph code build from reading: https://github.com/Azure-Samples/azure-cosmos-db-graph-nodejs-getting-started

    Thanks, Phil.
*/

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
var debug = function(text){ console.log(text.grey); };
var error = function(text){ console.error(text.red); };
var game = function(text){ console.log(text.green); };
var info = function(text){ console.log(text.yellow); };
var desc = function(text){ console.log(text.cyan); };


/* 
   UTILITY FUNCTIONS
*/

//This function wraps a standard call to cosmos and outputs any errors calling 'next' with query result. 
var query = function(query,next){
    gremlinClient.execute(query,{},(err,results)=> {
        if (err) error(err);
        else next(results);
    }); 
};

//This retuns the 'out edges' from the players current room. An out edge represents a door.
var getExits = function(next){
    query(`g.v('id','${world.playerCurrentRoomID}').outE()`,(results)=>{next(results);});
};

debug("[Graph connection established]");

//Readline wraps in/out streams nicely and takes away hastle
const rl = readline.createInterface(
    {
        input: process.stdin,
        output: process.stdout
    }
);

debug("[User connection established]");

//A very simple local state for the game client. All state should be stored in the graph.
//I know that this is slower overall, but this is not a fast paced game. 
var world = {
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
//This is the function that 'makes' things. It will make rooms first and then other things.
//This would not be in the 'normal player' interface, but in the world builder interface
var make = function(words,next){
    if(words.length===4 && words[1]==='room' && words[2]==='to'){
        var direction = words[3];
        if(world.possibleDirections[direction]){
            info("Checking...");
            getExits((rooms)=>{
                if(rooms.filter((r)=>r.label===direction).length>0){
                    info(`There is already a room to the ${direction.white}.`);
                    info("Try and make a room in an unused direction. use [look] to see which directions have been used.");
                    next();
                } else {
                    info(`OK. Building Room to the ${direction.white}...`);
                    var opposite = world.possibleDirections[direction];
                    debug(`Return door to: ${opposite}.`);
                    query(`g.addV('room').property('made','node app').addE('${opposite}').to(g.V('id','${world.playerCurrentRoomID}'))`,(newEdges)=>{
                        info(`Connecting door to current room...`);
                        //outV of the NEW EDGE is the NEW ROOM
                        query(`g.V('id','${world.playerCurrentRoomID}').addE('${direction}').to(g.V('id','${newEdges[0].outV}'))`,(results)=>{
                            info(`Connecting door to current room...`);
                            next();                  
                        });
                    });
                }
            });
        } else {
            info(`You can't make a room to the ${direction.white}.`);
            info(`Only 'north, south, east and west' are currently allowed.`);
            next();
        }     
    } else {
        info("The syntax for the make command is: "+ "make [room] to [direction].".white);
        info("If a [room] already exists to the [direction] the command will fail.");
        info("To add a description you will need to [walk] to the [direction] to enter the room.");
        next();
    }
};

//This function adds the 'description' property to the current room node. 
//It will overwrite what is there currently
var add_description = function(words,next){
    var description = words.slice(1).join(" ");
    query("g.v('id','"+world.playerCurrentRoomID+"').property('description','"+description+"')",(results)=>{
        debug("Description added to room");
        look(next);
    });
};

/* 
   STANDARD ACTION FUNCTIONS
*/

//This provides the description property of the first rooms in the array given.
//Should turn this into a generic 'describer' that takes in any kind of object array and collates whole description
var describe = function(rooms){
    if(rooms.length===1){
        var room = rooms[0];
        if(room.properties){
            if(room.properties.description && room.properties.description.length>0)
            {
                //The properties description appears to be an array by default so mapping here. 
                //Have only ever seen one.
                desc(room.properties.description.map((d)=>{return d.value}).join());
                return;
            }
        }
    } else {//see comment about making this a generic describer
        console.log("You can't describe multiple rooms at once");
    }
    console.log("The void looks back into you");
};

//The top level action function for describing what the player sees
var look = function(next){
    process.stdout.write("Looking ... ".green);
    //Only does current room and exists so far, but should do items in rooms too
    query(`g.v('id','${world.playerCurrentRoomID}')`, (rooms)=>{
        describe(rooms);
        //When have a generic describer, should push this function down
        getExits((results)=>{
            desc(`There are exits to the${results.map((e)=>{return " " + e.label.white}).join()}`);
            next();
        });
    });
};

//This function moves the player to other locations. 
//In the graph it disconnects the player 'in' edge from the current room node 
//   and reconnects to the other end of the 'edge' to the new room. 
var walk = function(words,next){
    process.stdout.write(`[${words[0].green}ing .`.green);//To allow for multiple verbs
    if(words.length>1){
        var direction = words[1];
        getExits((results)=>{//we want to make sure the users has specified a possibility
            process.stdout.write(".".green);//this is a very basic 'progress bar' of dots
            var chosen = results.filter((e)=>{return e.label===direction});
            if(chosen.length===1){
                //Need to investigte making this one query (more transactional and less prone to break)
                query(`g.v('id','${world.playerNodeID}').outE('label','in').drop()`,(results)=>{
                    process.stdout.write(".".green);//progress
                    //Add an edge from palyer to the 'end' of the 'door edge'.
                    query(`g.V('id','${world.playerNodeID}').addE('in').to(g.V('id','${chosen[0].inV}'))`,(results)=>{
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
var act = function(command, next){
    var words = command.split(" ");
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
        default:
            info("What?");
            next();
    }
};

/* 
   SET UP FUNCTIONS
*/

//Gets the player node id from the graph
var setup_player = function(next){
    process.stdout.write("\t[Player ... ".grey);
    //Would need to change this for multiple players. 
    //Collect player name from user and connect to that node.
    query("g.V().has('label','player')",(results)=>{
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
var setup_room = function(next){
    process.stdout.write("\t[Room   ... ".grey);
    query(`g.v('id','${world.playerNodeID}').out('in')`,(results)=>{
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
var setup = function(next){
    debug('[Setting up ...');
    var last = ()=>{debug(' Setup complete!]\n');next();}
    var two = ()=>{setup_room(last);}
    setup_player(two);//Call back style for chaining.
};

/* 
   MAIN RECURSION
*/

//This is the main game loop.
//It is asnyc and recursive to work with RL and Graph APIs.
var interactive = function(finalise){
    rl.question('\n[What would you like to do?]\n> '.green,(response)=>{
        if(response === "quit") finalise();//This is the recursion exit.
        else act(response,()=>{interactive(finalise)});
    });
};

game('                                \n  Welcome to the world creator  \n                                '.bgWhite);

//This is the 'clean' shut down, closing the 'readline' and and exiting the process.
var kill = function(){
    game('        \n  Bye!  \n        '.bgWhite);
    rl.close();
    process.exit();
};

//Begin!
setup(()=>{interactive(kill);});