#
# Multipurpose Dockerfile used for all the servers
#

# Base Alpine linux image with Node 10.x
FROM node:10-alpine

# Parameters, env vars and metadata
# basedir and port MUST be provided at build time
LABEL version="0.0.3"
ARG basedir
ARG port
ARG sharedir="./shared"
ENV NODE_ENV production
ENV PORT ${port}

# Trick to validate build arguments have been passed in
RUN test -n "$basedir"
RUN test -n "$port"

# NPM install packages for server
WORKDIR /home/app/${basedir}
COPY ${basedir}/package*.json ./
RUN npm install --production --silent

# NPM install packages for shared lib
WORKDIR /home/app/shared
COPY ${sharedir}/package*.json ./
RUN npm install --production --silent

# Copy in rest of shared lib
WORKDIR /home/app/shared
COPY ${sharedir}/lib ./lib/

# Now the rest of the server
WORKDIR /home/app/${basedir}
COPY ${basedir}/ ./

# Server params and startup
EXPOSE ${port}
CMD ["npm", "start"]