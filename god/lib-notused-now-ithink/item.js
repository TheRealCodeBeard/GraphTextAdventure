let build_item = function(id,name,description){
    return {
        id:id,
        type:'item',
        name:name,
        description:description
    };
};
module.exports = {
    hydrate:build_item
};