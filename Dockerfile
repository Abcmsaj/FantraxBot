FROM node:latest

# Create the directory within the container and CD into it
RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot

# Copy and install our bot's packages
COPY package.json /usr/src/bot
RUN npm install

# Copy the rest of the bot files
COPY . /usr/src/bot

# Start node
CMD ["node", "index.js"]
