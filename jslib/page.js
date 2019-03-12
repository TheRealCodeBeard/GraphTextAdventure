


let graph_data = [
    {
        data:{id:'a',name:"foo"}
    },
    {
        data:{id:'b',name:"bar"}
    },
    {
        data:{id:'c',name:"banana"}
    },
    {
        data:{id:'d',name:"baz"}
    },
    {
        data:{id:'e',name:"erk"}
    },
    {
        data:{id:'ab', source: 'a', target:'b'}
    },
    {
        data:{id:'ac', source: 'a', target:'c'}
    },
    {
        data:{id:'cd', source: 'c', target:'d'}
    },
    {
        data:{id:'de', source: 'd', target:'e'}
    }
];

let graph_style = [
    {
        selector:'node',
        style: {
            'background-color':'#666',
            'label': 'data(name)'
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
        elements: graph_data,
        style: graph_style,
        layout: graph_layout
    });
};