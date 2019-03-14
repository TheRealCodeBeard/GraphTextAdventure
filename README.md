# GraphTextAdventure
Graph DB backed text adventure

# intention
This is a Node.js project to connect to Cosmos DB through the Gremlin API. The text adventure state is entierly stored within the graph within Cosmos DB. This script is a command line driven 'builder' application to allow a user to build a graph using text-adventure-like commands. There will eventually be a bot for playing the text adventure. The full state is saved in the graph to make the code as simple as possible and allow for multip player. I know it will be slower to do it this way.

# setup
To use this you will need a [Cosmos DB graph account](https://azure.microsoft.com/en-us/services/cosmos-db/  "Cosmos DB Homepage"). In this you will need a graph and a collection. Currently you will also need to know the layout of the vertexs and edges. One node with a 'label' of 'player'. This will need an 'out' edge with a label of 'in' connected to a vertex with 'label' 'room'. I will be working to make this set up automagic in the console at some point.

# config.js
You will need your own 'config.js' file. Copy 'config_template.js' and call it 'config.js'. Fill in the details fron the graph you set up in Cosmos DB and you are ready to go.

# running
When you have set it all up you will need to make sure you have the right modules installed as detailed at the begining of app.js.
Run with node app.js as you would expect.

# The Server
Running ```node server.js``` will give you a localhost:3000 page that will display the current graph in your graph. It will also show the items that the player is holding. This needs to be running if you want to use ```inventory api``` instead of just ```inventory```