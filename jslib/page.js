let graph_data = [
    {
        data:{id:'a'}
    },
    {
        data:{id:'b'}
    },
    {
        data:{id:'ab', source: 'a', target:'b'}
    }
];

let graph_style = [
    {
        selector:'node',
        style: {
            'background-color':'#666',
            'label': 'data(id)'
        }
    }
];

let graph_layout

let go = function(){
    let cy = cytoscape({
        container:document.getElementById("cy"),
        elements: graph_data,
        style: graph_style,
        layout: graph_layout
    });
};