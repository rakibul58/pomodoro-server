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
ENV DATABASE_URL="postgresql://postgres.xluvsyqknsfskprrkmlw:PQjtif42YblxZz3l@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
ENV DIRECT_URL="postgresql://postgres.xluvsyqknsfskprrkmlw:PQjtif42YblxZz3l@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
ENV SALT_ROUNDS=12
ENV JWT_SECRET="47668a8d83f62482e27f2dc1f385183763c142fda27f9ce9d90b7fb814e548aa"
ENV EXPIRES_IN="30d"
ENV REFRESH_TOKEN_SECRET="af7848693163052cb5828d190887a1e8b36d2b2d216de09cfd8f1da5b881a755"
ENV REFRESH_TOKEN_EXPIRES_IN="30d"
ENV ENABLE_PRISMA_CACHING=false
ENV REDIS_USERNAME="default"
ENV REDIS_PASSWORD="00qAHjdEtQoeAqi93r4s5XtB3Rig8prR"
ENV REDIS_HOST="redis-15190.crce179.ap-south-1-1.ec2.redns.redis-cloud.com"
ENV REDIS_PORT=15190

# Command to run your app
CMD ["npm", "run", "dev"]
