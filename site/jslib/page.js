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

let go = function(){
    document.getElementById('loading').innerHTML="Loading";
    fetch('./api/current')
        .then(response=>response.json())
        .then(data=>{
            let cy = cytoscape({
                container:document.getElementById("cy"),
                elements: resplafunt(data),
                style: graph_style,
                layout: graph_layout
            });
            document.getElementById('loading').innerHTML="";
        });    
};