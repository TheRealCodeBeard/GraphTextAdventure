/*
To Do:
[o] Split config out to seperate file as per example
[o] GitIgnore Config file
[o] Create template config file with notes on creation
[o] Comments
[ ] Get code into GitHub
[ ] Get room building to work (doors back and forth) - limited for now
[ ] Items in the world
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

//This function wraps a standard call to cosmos and outputs any errors calling 'next' with query result. 
var query = function(query,next){
    gremlinClient.execute(query,{},(err,results)=> {
        if (err) console.error(err);
        else next(results);
    }); 
};

console.log("[Graph connection established]");

//Readline wraps in/out streams nicely and takes away hastle
const rl = readline.createInterface(
    {
        input: process.stdin,
        output: process.stdout
    }
);

console.log("[User connection established]");

//A very simple local state for the game client. All state should be stored in the graph.
//I know that this is slower overall, but this is not a fast paced game. 
var world = {
    playerNodeID:null,
    playerCurrentRoomID:null
};

/* 
   WORLD BUILDER ACTION FUNCTIONS
*/
//This is the function that 'makes' things. It will make rooms first and then other things.
//This would not be in the 'normal player' interface, but in the world builder interface
var make = function(words,next){
    //Currently commented out because it doesn't work with rest of game currently. On To Do list.
    /*
    if(words.length>1){
        console.log("Making '"+words[1]+"'.");
        gremlinClient.execute("g.addV('"+words[1]+"').property('made', 'node app')",{},(err,results)=> {
            if (err) console.error(err);
            else {console.log(results);}
            next();
        });        
    } else {
        console.log("Make needs a 'thing' to make. Like 'make room' for example");
        next();
    }
    */
    console.log("Functionality currently disabled as it doesn't connect up the new room to a 'free door' on the current room. That is what it must do");
    next();
};

//This function adds the 'description' property to the current room node. 
//It will overwrite what is there currently
var add_description = function(words,next){
    var description = words.slice(1).join(" ");
    query("g.v('id','"+world.playerCurrentRoomID+"').property('description','"+description+"')",(results)=>{
        console.log("Description added to room");
        look(next);
    });
};

/* 
   UTILITY FUNCTIONS
*/

//This retuns the 'out edges' from the players current room. An out edge represents a door.
var getExits = function(next){
    query(`g.v('id','${world.playerCurrentRoomID}').outE()`,(results)=>{next(results);});
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
                console.log(room.properties.description.map((d)=>{return d.value}).join());
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
    process.stdout.write("Looking ... ");
    //Only does current room and exists so far, but should do items in rooms too
    query(`g.v('id','${world.playerCurrentRoomID}')`, (rooms)=>{
        describe(rooms);
        //When have a generic describer, should push this function down
        getExits((results)=>{
            console.log(`There are exits to the${results.map((e)=>{return " " + e.label}).join()}`);
            next();
        });
    });
};

//This function moves the player to other locations. 
//In the graph it disconnects the player 'in' edge from the current room node 
//   and reconnects to the other end of the 'edge' to the new room. 
var walk = function(words,next){
    process.stdout.write("[" + words[0] + "ing .");//To allow for multiple verbs
    if(words.length>1){
        var direction = words[1];
        getExits((results)=>{//we want to make sure the users has specified a possibility
            process.stdout.write(".");//this is a very basic 'progress bar' of dots
            var chosen = results.filter((e)=>{return e.label===direction});
            if(chosen.length===1){
                //Need to investigte making this one query (more transactional and less prone to break)
                query(`g.v('id','${world.playerNodeID}').outE('label','in').drop()`,(results)=>{
                    process.stdout.write(".");//progress
                    //Add an edge from palyer to the 'end' of the 'door edge'.
                    query(`g.V('id','${world.playerNodeID}').addE('in').to(g.V('id','${chosen[0].inV}'))`,(results)=>{
                        world.playerCurrentRoomID = chosen[0].inV;//Update state
                        console.log(" arrived!]");
                        look(next);//Give the standard description of the new room.
                    });
                });
            } else {//Feedback if the user has made a mistake
                console.log(`There is no exit to the '${direction}']`);
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
            console.log("You are: '" + world.playerNodeID + "'");
            next();
            break;
        default:
            console.log("What?");
            next();
    }
};

/* 
   SET UP FUNCTIONS
*/

//Gets the player node id from the graph
var setup_player = function(next){
    process.stdout.write("\t[Player ... ");
    //Would need to change this for multiple players. 
    //Collect player name from user and connect to that node.
    query("g.V().has('label','player')",(results)=>{
        if(results.length===1){
            world.playerNodeID = results[0].id;
            console.info(`Player ID: ${world.playerNodeID}]`);
        } else {
            console.error("\t[Too many player nodes.]");
        }
        next();
    });
};

//Collect the current room ID from the user in the graph
var setup_room = function(next){
    process.stdout.write("\t[Room   ... ");
    query(`g.v('id','${world.playerNodeID}').out('in')`,(results)=>{
        if(results.length===1){
            world.playerCurrentRoomID = results[0].id;
            console.info(`Player Room ID: ${world.playerCurrentRoomID}]`);
        } else {
            console.error("\t[Player can only be in one room]");
        }
        next();
    });
};

//This is the main game setup. 
//Other setup functions are all called from here. 
var setup = function(next){
    console.log('[Setting up ...');
    var last = ()=>{console.log(' Setup complete!]\n');next();}
    var two = ()=>{setup_room(last);}
    setup_player(two);//Call back style for chaining.
};

/* 
   MAIN RECURSION
*/

//This is the main game loop.
//It is asnyc and recursive to work with RL and Graph APIs.
var interactive = function(finalise){
    rl.question('\n[What would you like to do?]\n> ',(response)=>{
        if(response === "quit") finalise();//This is the recursion exit.
        else act(response,()=>{interactive(finalise)});
    });
};

console.log('[Welcome to world creator]');

//This is the 'clean' shut down, closing the 'readline' and and exiting the process.
var kill = function(){
    console.log('[BYE!]');
    rl.close();
    process.exit();
};

//Begin!
setup(()=>{interactive(kill);});