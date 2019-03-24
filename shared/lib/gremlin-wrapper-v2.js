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
    return query(`g.addV(label).as('newEntity')
        .property('name', type)
        .property('description', description)
        .property('data', data)
        .addE(linkLabel).to( g.V('id', linkedToId) ).select('newEntity')`,
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
    return query(`g.addV(label).as('newEntity')
        .property('name', type)
        .property('description', description)
        .property('data', data)
        .addE(linkLabel).from( g.V('id', linkedFromId) ).select('newEntity')`,
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

let getEntitiesIn = function(id, linkLabel) {
    return query(
        `g.v(id).inE().hasLabel(linkLabel).outV()`, 
        { id: id, linkLabel: linkLabel }
    )
}

let getEntitiesOut = function(id, linkLabel) {
    return query(
        `g.v(id).outE().hasLabel(linkLabel).inV()`, 
        { id: id, linkLabel: linkLabel }
    )
}

let updateEntity = function(id, entity) { 
    return query(
        `g.v(id).hasLabel(label)
        .property('description', description)
        .property('data', data)`, 
        { label: entity.label, id: id, data: serializeEntity(entity), description: entity.description }
    )
}

let moveEntityOut = function(id, linkLabel, destId) { 
    return query("g.v(id).outE('label', linkLabel).drop()", {id: id, linkLabel: linkLabel })
    .then(r => {
        return query("g.v(id).addE(linkLabel).to( g.V('id', destId) )", {id: id, linkLabel: linkLabel, destId: destId})
    })
}

let moveEntityIn = function(id, linkLabel, destId) { 
    return query("g.v(id).inE('label', linkLabel).drop()", {id: id, linkLabel: linkLabel })
    .then(r => {
        return query("g.v(id).addE(linkLabel).from( g.V('id', destId) )", {id: id, linkLabel: linkLabel, destId: destId})
    })
}

let createLinkTo = function(sourceId, linkLabel, destId) {
    return query(`g.V(sourceId).addE(linkLabel).to(g.V(destId))`,
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
exports.moveEntityIn = moveEntityIn
exports.moveEntityOut = moveEntityOut

exports.createEntityLinkedTo = createEntityLinkedTo
exports.createEntityLinkedFrom = createEntityLinkedFrom
exports.createLinkTo = createLinkTo

exports.getEntitiesIn = getEntitiesIn
exports.getEntitiesOut = getEntitiesOut
