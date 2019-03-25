


router.get('/api/npcs/:id', async function (req, res, next) {
  try {
    debug(`Fetching NPC ${req.params.id}`)
    let gremlinRes = await gremlin.getEntities('npc', 'id', req.params.id)
    if(gremlinRes.length == 0) { API.send404(res, `NPC ${req.params.id} not found`); return }
  
    let npc = gremlin.rehydrateEntity(gremlinRes[0], NPC)
    API.sendOne(res, "success", "", npc)
  } catch(e) {
    console.error(`### ERROR: ${e.toString()}`);
    API.send500(res, e.toString())
  }
})

router.get('/api/npcs', async function (req, res, next) {
  debug(`Listing ALL NPCs`)

  // we pass a redundant filter to fetch ALL npcs
  let gremlinResults = await gremlin.getEntities('npc')
  let entities = []
  for(let gremlinRes of gremlinResults) {
    let npc = gremlin.rehydrateEntity(gremlinRes, NPC)
    entities.push(npc)
  }
  API.sendArray(res, "success", "", entities)
})
