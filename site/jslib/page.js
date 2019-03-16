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

let playerid = '';

let item_to_html = (item)=>'<div class="item"><span>'+item.name+"</span><span>"+item.description+"</span>";

let player_load = function(){
    playerid = document.getElementById('player_guid').value;
    load_player_items();
    load_player_room_items();
};

let load_player_items = function(){
    let it = document.getElementById('player_items');
    it.innerHTML="Loading items..."
        fetch('./api/items/player/'+playerid)
        .then(response=>response.json())
        .then(data=>it.innerHTML = data.map(item_to_html))
};

let load_player_room_items = function(){
    let r = document.getElementById('player_room');
    r.innerHTML="Loading room..."
    let rit = document.getElementById('room_items');
    rit.innerHTML="Loading items..."
    fetch('./api/player/'+playerid+"/room")
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
            lod.innerHTML="";
        });
}; 