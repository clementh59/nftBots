FROM node:12

COPY . /home/clement/rpiBots

# Change working directory
WORKDIR /home/clement/rpiBots

COPY package*.json ./

RUN ls -al
# Install dependencies
RUN npm install

# Expose API port to the outside
EXPOSE 80

# Launch application
CMD ["node","src/terra/randomEarth/randomEarthBot.js"]