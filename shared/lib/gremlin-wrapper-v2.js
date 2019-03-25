//
// New unified and reusable entity based Gremlin wrapper library
// Ben C, March 2019
// Notes. None
//

const gremlin = require('gremlin');

//
// Picks up the config and creates the Gremlin client
//
const gremlinClient = gremlin.createClient(
    process.env.COSMOS_PORT,
    process.env.COSMOS_ENDPOINT, 
    { 
        "session": false, 
        "ssl": true, 
        "user": `/dbs/${process.env.COSMOS_DB}/colls/${process.env.COSMOS_COLLECTION}`,
        "password": process.env.COSMOS_KEY
    }
);


//
// This function wraps a standard Gremlin call to cosmos with a Promise
//
let query = function(query, parameters) {
    //console.log(query, parameters);
    return new Promise(function (resolve, reject) {
        gremlinClient.execute(query, parameters, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};


//
// Remove special entity fields, and serialize to JSON
//   Not exported only used in this file
//
let serializeEntity = function(entity) {
    const copy = Object.assign({}, entity);
    delete copy.id
    delete copy.name
    delete copy.description
    delete copy.label
    return JSON.stringify(copy)
}


//
// Rehydrate any Entity from Gremlin vertex result
//
let rehydrateEntity = function(vertex, entityConstructor) {
    // Deserialise data
    let data = JSON.parse(vertex.properties.data[0].value)
    let name = vertex.properties.name[0].value
    
    // Construct new entity Entity
    let entity = new entityConstructor(name)
    // Push in and overwrite with loaded/de-serialized data
    Object.assign(entity, data)

    // Further mutate new object and push in special properties
    entity.id = vertex.id
    entity.label = vertex.label
    entity.name = name
    entity.description = vertex.properties.description[0].value

    return entity
}


//
// Store a new Entity as a vertex, serialization will automatically happen
//   Entity will NOT BE LINKED TO ANYTHING
//
let createEntity = function(entity) {
    return query(`g.addV(label)
        .property('name', type)
        .property('description', description)
        .property('data', data)`,
        { 
            label: entity.label,
            type: entity.name, 
            data: serializeEntity(entity),
            description: entity.description
        });
};


//
// Create a link TO - between two entities 
//   Used when making rooms in conjunction with createEntityLinkedTo to create the link in other direction 
//
let createLinkTo = function(sourceId, linkLabel, destId, linkName) {
    return query(`g.V(sourceId).addE(linkLabel).property('name', linkName).to(g.V(destId))`,
        { 
            linkLabel: linkLabel, 
            linkName: linkName,
            sourceId: sourceId, 
            destId: destId, 
        });
};


//
// Store a new Entity as a vertex, serialization will automatically happen
//   Entity will be linked TO another vertex: 'linkedToId', and the edge will be labeled: 'linkLabel'
//   Optional parameter 'linkName' also adds a name property to the edge link
//
let createEntityLinkedTo = function(entity, linkLabel, linkedToId, linkName = null) { 
    return query(`g.addV(label).as('newEntity')
        .property('name', type)
        .property('description', description)
        .property('data', data)
        .addE(linkLabel).property('name', linkName).to( g.V('id', linkedToId) ).select('newEntity')`,
        { 
            label: entity.label,
            linkLabel: linkLabel, 
            linkName: linkName,
            linkedToId: linkedToId, 
            type: entity.name, 
            data: serializeEntity(entity),
            description: entity.description
        });
};

//
// Store a new Entity as a vertex, serialization will automatically happen
//   Entity will be linked FROM another vertex: 'linkedToId', and the edge will be labeled: 'linkLabel'
//   Optional parameter 'linkName' also adds a name property to the edge link
//
let createEntityLinkedFrom = function(entity, linkLabel, linkedFromId, linkName = null) { 
    return query(`g.addV(label).as('newEntity')
        .property('name', type)
        .property('description', description)
        .property('data', data)
        .addE(linkLabel).property('name', linkName).from( g.V('id', linkedFromId) ).select('newEntity')`,
        { 
            label: entity.label,
            linkLabel: linkLabel, 
            linkName: linkName, 
            linkedFromId: linkedFromId, 
            type: entity.name, 
            data: serializeEntity(entity),
            description: entity.description
        });
};


//
// Get all Entities with a specific label
//   propFilter and propFilterValue allow you to filter by id, label or other property
//
let getEntities = function(label, propFilter = null, propFilterValue = null) {
    if(propFilter) {
        return query(
            `g.v().hasLabel(label).has(propFilter, propFilterValue)`, 
            { label: label, propFilter: propFilter, propFilterValue: propFilterValue });
    } else {
        return query(
            `g.v().hasLabel(label)`, 
            { label: label });
    }
}

//
// Get all Entities linked with given id via an inEdge with a specific label
//
let getEntitiesIn = function(id, linkLabel) {
    return query(
        `g.v(id).inE().hasLabel(linkLabel).outV()`, 
        { id: id, linkLabel: linkLabel }
    )
}

//
// Get all Entities linked with given id via an outEdge with a specific label
//
let getEntitiesOut = function(id, linkLabel) {
    return query(
        `g.v(id).outE().hasLabel(linkLabel).inV()`, 
        { id: id, linkLabel: linkLabel }
    )
}

//
// Get links (edges) from an given id vertex where the edges have a label, 
//   Used for getting paths/routes from a room
//
let getLinksByLabel = function(id, linkLabel) {
    return query(
        `g.v(id).outE().hasLabel(linkLabel)`, 
        { id: id, linkLabel: linkLabel }
    )
}

//
// update an entity, is is assumed that label and name properties are immutable 
//
let updateEntity = function(id, entity) { 
    return query(
        `g.v(id).hasLabel(label)
        .property('description', description)
        .property('data', data)`, 
        { label: entity.label, id: id, data: serializeEntity(entity), description: entity.description }
    )
}

//
// Move an entity where it is joined via outE to a new destination, labeling the edge/link
//   Used to move NPC and players between rooms
//
let moveEntityOut = function(id, linkLabel, destId) { 
    return query("g.v(id).outE('label', linkLabel).drop()", {id: id, linkLabel: linkLabel })
    .then(r => {
        return query("g.v(id).addE(linkLabel).to( g.V('id', destId) )", {id: id, linkLabel: linkLabel, destId: destId})
    })
}

//
// Move an entity where it is joined via inE to a new destination, labeling the edge/link
//   Used to move items between rooms and players 
//
let moveEntityIn = function(id, linkLabel, destId) { 
    return query("g.v(id).inE('label', linkLabel).drop()", {id: id, linkLabel: linkLabel })
    .then(r => {
        return query("g.v(id).addE(linkLabel).from( g.V('id', destId) )", {id: id, linkLabel: linkLabel, destId: destId})
    })
}

// Utils
exports.query = query
exports.rehydrateEntity = rehydrateEntity

// Create
exports.createEntity = createEntity
exports.createLinkTo = createLinkTo
exports.createEntityLinkedTo = createEntityLinkedTo
exports.createEntityLinkedFrom = createEntityLinkedFrom

// Getters
exports.getEntities = getEntities
exports.getEntitiesIn = getEntitiesIn
exports.getEntitiesOut = getEntitiesOut
exports.getLinksByLabel = getLinksByLabel

// Updates
exports.updateEntity = updateEntity
exports.moveEntityIn = moveEntityIn
exports.moveEntityOut = moveEntityOut