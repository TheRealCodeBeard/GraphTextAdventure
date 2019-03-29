# Base Alpine linux image with Node 10.x
FROM node:10-alpine

# Parameters, env vars and metadata
LABEL version="0.0.2"
ARG basedir="./npc"
ARG sharedir="./shared"
ENV NODE_ENV production
ENV PORT 4000

# NPM install packages for NPC server
WORKDIR /home/app/npc
COPY ${basedir}/package*.json ./
RUN npm install --production --silent

# NPM install packages for shared lib
WORKDIR /home/app/shared
COPY ${sharedir}/package*.json ./
RUN npm install --production --silent

# Copy in rest of shared lib
WORKDIR /home/app/shared
COPY ${sharedir}/lib ./lib/

# Now the rest of the NPC server
WORKDIR /home/app/npc
COPY ${basedir}/*.js ./
COPY ${basedir}/lib/ ./lib/
COPY ${basedir}/data/ ./data/
COPY ${basedir}/api-routes/ ./api-routes/

# Server params and startup
EXPOSE 4000
CMD ["npm", "start"]