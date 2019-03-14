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

let load_player_items = function(){
    let it = document.getElementById('items');
    it.innerHTML="Loading items..."
    let playerid = '8bf55d9c-ff0e-4fd6-9846-817dcb483392';//Currently this is a fixed node idea. It should be passed ... obvs
    fetch('./api/items/player/'+playerid)
        .then(response=>response.json())
        .then(data=>data.map(i=>'<div class="item"><span>'+i.name+"</span><span>"+i.description+"</span>"))
        .then(html=>{
            it.innerHTML = html;
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
        })
        .then(load_player_items);
}; 