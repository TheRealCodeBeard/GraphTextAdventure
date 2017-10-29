var config = {}

config.port = 443;
config.endpoint = "GRAPHENDPOINT";//e.g. "*.graphs.azure.com" (From portal. DO NOT INCLUDE PORT)
config.primaryKey = "PRIMARYKEY";//From 'Keys' page in portal.
config.database = "GRAPHDB"//Name of your Graph DB (Top level name in Data Explorer - when you hit 'new graph', that name)
config.collection = "GRAPH COLLECTION"//The name of the Graph Collection (Second level name in Data Explorer)

module.exports = config;