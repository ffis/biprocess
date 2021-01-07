FROM node:lts

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

# Bundle app source
COPY dist/ .


EXPOSE 7890
CMD [ "node", ".", "--config", "/config/config.json" ]