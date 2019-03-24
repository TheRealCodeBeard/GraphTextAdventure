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

let graph_layout = {
    name:'breadthfirst',
    padding:120
};

let resplafunt = function(data){
    let the_data = [];
    data.nodes.forEach(element => {
        the_data.push({
            data:{
                id:element[0],
                label:element[1],
                description:element[2],
                name:element[3],
            }
        });
    });
    
    data.edges.forEach(element=>{
        the_data.push({
            data:{
                id:element.id,
                label:element.label,
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
    ps.innerHTML="Loading...";
    fetch(player_root+'/api/players')
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

let debug_room = function(guid){
    fetch(`${god_root}/api/room/${guid}/look`)
        .then(response=>response.json())
        .then(data=>{
            document.getElementById('debug').innerHTML = `Room: ${guid}\n\n${data.gameMsg}`
        })
};

let debug_entity = function(guid){
    fetch(`${god_root}/api/entities/${guid}`)
        .then(response=>response.json())
        .then(data=>{
            document.getElementById('debug').innerHTML = JSON.stringify(data.entities[0], null, 2)
            hljs.highlightBlock(document.getElementById('debug'));
        })
};


let go = function(){
    let lod = document.getElementById('loading');
    lod.innerHTML="Loading";
    fetch('./api/current')
        .then(response=>response.json())
        .then(data=>{
            let cy = cytoscape({
                container:document.getElementById("cy"),
                elements: resplafunt(data),
                style: graph_style,
                layout: graph_layout
            });
            cy.$('[label="room"]').style({ 'background-color': '#70594d' })
            cy.$('[label="item"]').style({ 'background-color': '#37a6dd' })
            cy.$('[label="player"]').style({ 'background-color': '#1fc14f' })
            cy.$('[label="npc"]').style({ 'background-color':'#bc2b14'})
            cy.$('[label="in"]').style({ 'line-color': '#8b27bc' })
            cy.$('[label="holds"]').style({ 'line-color': '#1fc4c6' })

            // Click/select event
            cy.on('click', evt => {
                // Only work with nodes
                if(evt.target.length > 0 && evt.target.isNode()) {
                    if(evt.target.data().label === 'room')
                        debug_room(evt.target.data().id);
                    else
                        debug_entity(evt.target.data().id);
                } else {
                    document.getElementById('debug').innerHTML = ''
                }
            })

            lod.innerHTML="";
        })
        .then(load_players);
}; 