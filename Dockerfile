# Use Node 8 LTS
FROM node:8

# Create app dir inside container
WORKDIR /nodeapp

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy app's source files
COPY . .

CMD ["npm", "start"]
