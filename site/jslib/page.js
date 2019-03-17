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
            'target-arrow-shape':'triangle-backcurve',
            'target-arrow-color':'green',
            'source-arrow-shape':'circle',
            'source-arrow-color':'grey',
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
                name:element[1],
                description:element[2]
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
    fetch(confic.playerURL + '/api/players')
        .then(response=>response.json())
        .then(data=>{
            ps.innerHTML = data.map((player)=>'<div class="item"><span onclick="set_player(\''+player.id+'\')">'+player.id+"</span><span>"+player.name+"</span>");
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
            r.innerHTML = room.description;
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
            cy.$('[name="room"]').style({ 'background-color': '#70594d' })
            cy.$('[name="item"]').style({ 'background-color': '#37a6dd' })
            cy.$('[name="player"]').style({ 'background-color': '#1fc14f' })
            cy.$('[name="npc"]').style({ 'background-color':'#bc2b14'})
            cy.$('[label="in"]').style({ 'line-color': '#8b27bc' })
            cy.$('[label="holds"]').style({ 'line-color': '#1fc4c6' })
            lod.innerHTML="";
        })
        .then(load_players);
}; 