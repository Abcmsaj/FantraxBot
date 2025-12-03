FROM node:20.19.1

RUN apt-get update && apt-get install -y chromium

WORKDIR /usr/src/bot

COPY package*.json ./

RUN npm install
RUN npx playwright install chromium

CMD ["node", "src/index.js"]
