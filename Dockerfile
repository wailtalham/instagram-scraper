# Use an official Node runtime as a parent image
FROM node:21

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./


# Install any needed packages
RUN npm install

# Bundle your app's source code inside the Docker image
COPY . .

# Make port 3000 available outside this container
EXPOSE 3000

# Run the app when the container launches
CMD ["node", "app.js"]

