# Base Alpine linux image with Node 10.x
FROM node:10-alpine

# Build time arguments
LABEL version="0.0.1" 
ARG basedir="."
ENV NODE_ENV production

# Place our app here
WORKDIR /app

# NPM install packages
COPY ${basedir}/package*.json ./
RUN npm install --production --silent

# NPM is done, now copy in the the whole project to the workdir
COPY ${basedir}/ .

# Server params and startup
EXPOSE 3000
CMD ["npm", "start"]