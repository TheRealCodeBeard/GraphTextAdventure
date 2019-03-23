const gremlin = require('gremlin');
const config = require("../../config");

//Picks up the config and creastes the client
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

// This function wraps a standard Gremlin call to cosmos with a Promise
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

let createEntityLinkedTo = function(entity, linkLabel, linkedToId) { 
    return query(`g.addV(label).as('x')
        .property('name', type)
        .property('description', description)
        .property('data', data)
        .addE(linkLabel).to( g.V('id', linkedToId) ).outV()`,
        { 
            label: entity.label,
            linkLabel: linkLabel, 
            linkedToId: linkedToId, 
            type: entity.name, 
            data: serializeEntity(entity),
            description: entity.description
        });
};

let createEntityLinkedFrom = function(entity, linkLabel, linkedFromId) { 
    return query(`g.addV(label).as('x')
        .property('name', type)
        .property('description', description)
        .property('data', data)
        .addE(linkLabel).from( g.V('id', linkedFromId) ).outV()`,
        { 
            label: entity.label,
            linkLabel: linkLabel, 
            linkedFromId: linkedFromId, 
            type: entity.name, 
            data: serializeEntity(entity),
            description: entity.description
        });
};

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

let getEntities = function(label, propFilter, propFilterValue) {
    return query(
        `g.v().hasLabel(label).has(propFilter, propFilterValue)`, 
        { label: label, propFilter: propFilter, propFilterValue: propFilterValue }
    )
}

let getEntitiesIn = function(sourceId, linkLabel) {
    return query(
        `g.v(sourceId).inE().hasLabel(linkLabel).outV()`, 
        { sourceId: sourceId, linkLabel: linkLabel }
    )
}

let getEntitiesOut = function(sourceId, linkLabel) {
    return query(
        `g.v(sourceId).outE().hasLabel(linkLabel).inV()`, 
        { sourceId: sourceId, linkLabel: linkLabel }
    )
}

let updateEntity = function(id, entity) { 
    return query(
        `g.v().hasLabel(label).has('id', id)
        .property('description', description)
        .property('data', data)`, 
        { label: entity.label, id: id, data: serializeEntity(entity), description: entity.description }
    )
}

let createLinkTo = function(sourceId, linkLabel, destId) {
    return query(`g.V('id', sourceId).addE(linkLabel).to(g.V('id', destId))`,
        { 
            linkLabel: linkLabel, 
            sourceId: sourceId, 
            destId: destId, 
        });
};

exports.query = query
exports.serializeEntity = serializeEntity
exports.rehydrateEntity = rehydrateEntity
exports.createEntity = createEntity
exports.getEntities = getEntities
exports.updateEntity = updateEntity

exports.createEntityLinkedTo = createEntityLinkedTo
exports.createEntityLinkedFrom = createEntityLinkedFrom
exports.createLinkTo = createLinkTo

exports.getEntitiesIn = getEntitiesIn
exports.getEntitiesOut = getEntitiesOut
