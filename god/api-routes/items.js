var express = require('express');
var router = express.Router();

const colors = require('colors');
const Item = require('../../shared/lib/item');
const gremlin = require('../../shared/lib/gremlin-wrapper-v2');
const API = require('../../shared/lib/api')


//
//  Create an item and place it held by given entity (room, npc, player)
//
router.post('/api/items/heldby/:id', async (req, res) => {
  try {
      let name = req.body.name;
      let description = req.body.description;
      if(!name) throw new Error(`name missing`);
      if(!description) throw new Error(`description missing`);

      let item = new Item(name, description);
      let result = await gremlin.createEntityLinkedFrom(item, 'holds', req.params.id);
      // As we're creating, push the returned id into the Item object
      item.id = result.id        
      if(!result || result.length == 0) throw new Error('No results, heldby id probably does not exist')

      API.sendOne(res, "success", `The ${name} materializes!`, item);
  } catch(e) {
      console.error(`### ERROR: ${e.toString()}`);
      API.send500(res, e.toString())
  }
});


//
// Relocate an item, used by take, give and drop
//
router.post('/api/items/:id/moveto', async (req, res) => {
  try {
      let holderId = req.body.holderId;
      if(!holderId) throw new Error(`holderId missing`);
      let itemRes = await gremlin.getEntityById(req.params.id);
      if(itemRes.length == 0) { API.send404(res, `Item ${req.params.id} not found`); return }

      let item = gremlin.rehydrateEntity(itemRes[0], Item)
      await gremlin.moveEntityIn(req.params.id, 'holds', holderId);
      API.sendOne(res, "success", `The ${item.name} changes location`, item);
  } catch(e) {
      console.error(`### ERROR: ${e.toString()}`);
      API.send500(res, e.toString())
  }
});

module.exports = router;