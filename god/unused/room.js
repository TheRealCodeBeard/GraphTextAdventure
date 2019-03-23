let build_room= function(id,description){
    return {
        id:id,
        type:'room',
        description:description
    };
};
module.exports = {
    hydrate:build_room
};