# NPC API
NPC API for controlling NPCs 

# Running
```
npm install
npm start
```

# Config
**Default port is 4000**. This can be set with environmental var `PORT`

# API 
The main API is at `/api/npcs`

Routes are:
```
POST /api/npcs/create
POST /api/npcs/{id}/damage
PUT /api/npcs/{id}/move/{locationId}
```

# Swagger
Swagger is available, the UI is at the URL path `/api-docs`
```
http://localhost:3000/api-docs
```