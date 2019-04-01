var express = require('express');
var router = express.Router();

const colors = require('colors');
const Entity = require('../../shared/lib/entity');
const gremlin = require('../../shared/lib/gremlin-wrapper-v2');
const API = require('../../shared/lib/api')

//
// Get ANY entity by its ID
//
router.get('/api/entities/any/:id', async (req, res) => {
  try {
      let results = await gremlin.query("g.v(id)", {id: req.params.id});
      if(results.length == 0) { API.send404(res, `Entity ${req.params.id} not found`); return }

      let e = gremlin.rehydrateEntity(results[0], Entity);
      API.sendOne(res, "success", "", e);
  } catch(e) {
      console.error(`### ERROR: ${e.toString()}`);
      API.send500(res, e.toString());
  }
});

//
// Get ALL entities by type/label
//
router.get('/api/entities/:label', async (req, res) => {
  try {
      let results = await gremlin.getEntities(req.params.label);
      API.sendArray(res, "success", "", results.map(r => gremlin.rehydrateEntity(r, Entity)));
  } catch(e) {
      console.error(`### ERROR: ${e.toString()}`);
      API.send500(res, e.toString())
  }
});

//
// Get SINGLE entity by type/label and ID (overlap with /any/:id but kept for symmetry)
//
router.get('/api/entities/:label/:id', async (req, res) => {
  try {
      let results = await gremlin.getEntities(req.params.label, 'id', req.params.id);
      if(results.length == 0) { API.send404(res, `Entity ${req.params.id} not found`); return }

      let entity = gremlin.rehydrateEntity(results[0], Entity);
      API.sendOne(res, "success", "", entity);
  } catch(e) {
      console.error(`### ERROR: ${e.toString()}`);
      API.send500(res, e.toString())
  }
});

//
// Update a SINGLE entity with a PUT
//
router.put('/api/entities/:id',async (req,res)=>{
  let ent = req.body;
  try {
      if(!ent) throw new Error(`Body missing!`)
      await gremlin.updateEntity(req.params.id, ent)
      API.sendOne(res, "success", `Entity '${ent.name}' updated`, ent)
  } catch(e) {
      console.error(`### ERROR: ${e.toString()}`);
      API.send500(res, e.toString())
  }
});

module.exports = router;