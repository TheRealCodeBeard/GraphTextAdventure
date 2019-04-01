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

let player_root = 'http://localhost:5000';
let god_root = 'http://localhost:7000';

let item_to_html = (item)=>'<div class="item"><span>'+item.name+"</span><span>"+item.description+"</span>";

let hidePlayerList = function(){
    document.getElementById('player_list').style.display="none";
};

let set_player = function(guid){
    document.getElementById('player_guid').innerHTML = guid;
    document.getElementById("player_information").style.display="block";
    load_player_items(guid);
    load_player_room_items(guid);
};

let load_players = function(){
    let ps = document.getElementById('player_list');
    //ps.innerHTML="Loading...";
    fetch(god_root+'/api/entities/player')
        .then(response=>response.json())
        .then(data=>{
            ps.innerHTML = data.entities.map((player)=>'<div class="item"><span onclick="set_player(\''+player.id+'\')">'+player.id+"</span><span>"+player.name+"</span>");
        });
};

let load_player_items = function(guid){
    let it = document.getElementById('player_items');
    it.innerHTML="Loading items..."
        fetch('./api/items/player/'+guid)
        .then(response=>response.json())
        .then(data=>it.innerHTML = data.map(item_to_html))
};

let load_player_room_items = function(guid){
    let r = document.getElementById('player_room');
    r.innerHTML="Loading room..."
    let rit = document.getElementById('room_items');
    rit.innerHTML="Loading items..."
    fetch('./api/players/'+guid+"/room")
        .then(response=>response.json())
        .then(data=>{
            let room = data[0];//assumptions, player can be in one room only
            r.innerHTML = room.description + " (" + room.id + ")";
            return room.id;
        })
        .then(id=>{
            return fetch('./api/items/room/'+id)
            .then(response=>response.json())
            .then(data=>{
                if(data.length>0) rit.innerHTML = data.map(item_to_html)
                else rit.innerHTML = "Nothing"
            })
        });
};

// let debug_room = function(guid){
//     fetch(`${god_root}/api/room/${guid}/look`)
//         .then(response=>response.json())
//         .then(data=>{
//             document.getElementById('debug').innerHTML = `Room: ${guid}\n\n${data.gameMsg}`
//         })
// };

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
    fetch('./api/current')
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