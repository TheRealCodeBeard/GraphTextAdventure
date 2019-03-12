
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
            'curve-style':'bezier'
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
        elements: graph_data_hand,
        style: graph_style,
        layout: graph_layout
    });
};