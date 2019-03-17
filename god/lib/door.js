let build_door = function(id,name){
    return {
        id:id,
        type:'door',
        name:name
    };
};
module.exports = {
    hydrate:build_door
};