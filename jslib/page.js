let the_data = [];

graph_data_actual.nodes.forEach(element => {
    the_data.push({
        data:{
            id:element[0],
            name:element[1],
            description:element[2]
        }
    });
});

graph_data_actual.edges.forEach(element=>{
    the_data.push({
        data:{
            id:element.id,
            label:element.label,
            source:element.outV,
            target:element.inV
        }
    });
});

let graph_style = [
    {
        selector:'node',
        style: {
            'background-color':'#666',
            'label': 'data(name)'
        }
    },
    {
        selector:'edge',
        style: {
            'curve-style':'bezier',
            'label':'data(label)'
        }
    }
];

let graph_layout = {
    name:'grid',
    rows: 2,
    columns: 2
};

let go = function(){
    let cy = cytoscape({
        container:document.getElementById("cy"),
        elements: the_data,
        style: graph_style,
        layout: graph_layout
    });
};