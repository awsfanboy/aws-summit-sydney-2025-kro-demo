FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy app source and server file
COPY . .

# Build the app
RUN npm run build

# Install Express and AWS SDK
RUN npm install express cors aws-sdk

# Final image
FROM node:20-alpine

WORKDIR /app

# Copy built app and server
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.cjs .
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json .
COPY --from=build /app/public ./public

EXPOSE 80

# Use the Express server instead of the basic HTTP server
CMD ["node", "server.cjs"]