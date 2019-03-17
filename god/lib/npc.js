let build_npc = function(id,name,description){
    return {
        id:id,
        type:'npc',
        name:name,
        description:description
    };
};

module.exports = {
    hydrate:build_npc
};