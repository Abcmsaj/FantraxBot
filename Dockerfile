FROM node:20.19.1

# Install Chromium
RUN apt-get update && apt-get install chromium -y

# Create the directory within the container and CD into it
RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot

# Copy all of the bot files
COPY . /usr/src/bot

# Delete node_modules, if it exists
RUN rm -rf node_modules

# Install our bot's packages
RUN npm install
RUN npx playwright install chromium

# Start node
CMD ["node", "src/index.js"]