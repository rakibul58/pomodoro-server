# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock) first to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the source code and configuration files
COPY src /usr/src/app/src
COPY prisma /usr/src/app/prisma
COPY tsconfig.json /usr/src/app/

# Run Prisma migrations (adjust according to your needs)
RUN npx prisma migrate dev

# Build TypeScript code
RUN npm run build

# Expose the port your application will run on
EXPOSE 5000

# Define environment variables (adjust for your setup)
ENV NODE_ENV="production"
ENV PORT=5000
ENV DATABASE_URL=""
ENV DIRECT_URL=""
ENV SALT_ROUNDS=12
ENV JWT_SECRET=""
ENV EXPIRES_IN="30d"
ENV REFRESH_TOKEN_SECRET=""
ENV REFRESH_TOKEN_EXPIRES_IN="30d"
ENV ENABLE_PRISMA_CACHING=false
ENV REDIS_USERNAME=""
ENV REDIS_PASSWORD=""
ENV REDIS_HOST=""
ENV REDIS_PORT=15190

# Command to run your app
CMD ["npm", "run", "dev"]
