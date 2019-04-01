var express = require('express');
var router = express.Router();

const gremlin = require('../../shared/lib/gremlin-wrapper-v2');
const API = require('../../shared/lib/api')

//
// Get the entire world and edges
// Used by the web app / god view, IMPORTANT! doesn't return results in standard API format
//
router.get('/api/world/current', async (req, res) => {
    try {
        let nodeResults = await gremlin.query("g.V().map(values('id','label','description','name').fold())", {});
        let edgeResults = await gremlin.query("g.E()", {});

        res.status(200).send({
            nodes: nodeResults,
            edges: edgeResults
        })
    } catch(e) {
        console.error(`### ERROR: ${e.toString()}`);
        API.send500(res, e.toString())
    }
});

module.exports = router;