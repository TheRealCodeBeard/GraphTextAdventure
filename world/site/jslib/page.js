let graph_style = [
    {
        selector:'node',
        style: {
            'background-color':'#666',
            'label': 'data(name)',
            'text-background-color':'white',
            'text-background-opacity':1
        }
    },
    {
        selector:'edge',
        style: {
            'curve-style':'bezier',
            'label':'data(label)',
            'arrow-scale': 2.5,
            'target-arrow-shape':'triangle-backcurve',
            'source-endpoint':'inside-to-node',
            'text-background-color':'white',
            'text-background-opacity':1
        }
    }
];

let resplafunt = function(data){
    let the_data = [];
    data.nodes.forEach(element => {
        the_data.push({
            data:{
                id:element[0],
                label:element[1],
                description:element[2],
                name:element[3]
            }
        });
    });
    
    data.edges.forEach(element=>{    
        the_data.push({
            data:{
                id:element.id,
                label: (element.properties && element.properties.name) ? element.properties.name : element.label,
                source:element.outV,
                target:element.inV
            }
        });
    });
    
   return the_data;
};

let agent_root = 'http://localhost:4000';
let god_root = 'http://localhost:5000';

let thing_to_html = function (thing) {
    return `<div class="item-row"><span class="label-colour-${thing.label}">${thing.name}</span><span  class="label-colour-${thing.label}">${thing.description}</span></div>`;
}

let hidePlayerList = function(){
    document.getElementById('player_list').style.display="none";
};

let set_player = function(guid){
    document.getElementById('player_guid').innerHTML = guid;
    document.getElementById("player_information").style.display="block";
    load_player_items(guid);
    load_player_room(guid);
};

let load_players = function(){
    let ps = document.getElementById('player_list');
    fetch(god_root+'/api/entities/player')
        .then(response=>response.json())
        .then(data=>{
            ps.innerHTML = data.entities.map((player)=>'<div class="item-row"><span class="clickable" onclick="set_player(\''+player.id+'\')">'+player.id+"</span><span>"+player.name+"</span></div>").join("")
        });
};

let load_player_items = function(guid){
    let it = document.getElementById('player_items');
    fetch(agent_root+`/api/agents/${guid}/items`)
    .then(resp => resp.json())
    .then(data => {
        it.innerHTML = data.entities.map(thing_to_html).join("")
    })
};


let load_player_room = function(guid){
    let r = document.getElementById('player_room_pre');
    let rit = document.getElementById('room_items');
    fetch(god_root+`/api/room/whereis/${guid}`)
    .then(resp => resp.json())
    .then(data => {
        r.innerHTML = data.entities[0].description
        return  data.entities[0].id;
    })
    .then(roomId => {
        fetch(god_root+`/api/room/${roomId}/look?filter=${guid}`)
        .then(resp => resp.json())
        .then(data => {
            r.innerHTML = data.gameMsg.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
            if(data.entities.length > 0) rit.innerHTML = data.entities.map(thing_to_html).join("")
        })
    })
};

let debug_entity = function(guid){
    fetch(`${god_root}/api/entities/any/${guid}`)
        .then(response=>response.json())
        .then(data=>{
            document.getElementById('debug').innerHTML = JSON.stringify(data.entities[0], null, 2)
            hljs.highlightBlock(document.getElementById('debug'));
        })
};

// Global vars aren't always bad, ok?
let cy = {}

//
// Starts here
//
let go = function(){
    cy = cytoscape({
        container:document.getElementById("cy"),
        style: graph_style
    });

    let style = cy.style()
    style.selector('[label="room"]').style({ 'background-color': '#70594d' })
    style.selector('[label="item"]').style({ 'background-color': '#37a6dd' })
    style.selector('[label="player"]').style({ 'background-color': '#1fc14f' })
    style.selector('[label="npc"]').style({ 'background-color':'#bc2b14'})
    style.selector('[label="in"]').style({ 'line-color': '#8b27bc' })
    style.selector('[label="holds"]').style({ 'line-color': '#1fc4c6' })
    style.update()

    // Click/select event
    cy.on('click', evt => {
        // Only work with nodes
        if(evt.target.length > 0 && evt.target.isNode()) {
            debug_entity(evt.target.data().id);
        } else {
            document.getElementById('debug').innerHTML = ''
        }
    })

    dataRefresh();
    setInterval(dataRefresh, 10 * 1000)
}; 

//
// Update data displayed and re-layout
//
let dataRefresh = function() {
    var loading = document.getElementById('loading')
    loading.classList.add('is-visible');
    fetch(`${god_root}/api/world/current`)
        .then(response=>response.json())
        .then(data=>{
            cy.remove("*")
            cy.add(resplafunt(data))
            cy.layout({
                name: 'breadthfirst', 
                roots: cy.nodes(`[name="start"]`),
                nodeDimensionsIncludeLabels: true,
                spacingFactor: 1.3
              }).run()
            cy.fit()

            loading.classList.remove('is-visible');
        })
        .then(load_players);
}