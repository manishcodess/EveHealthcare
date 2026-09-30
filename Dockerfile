FROM node:20-alpine

WORKDIR /app

# Install dependencies first for layer caching
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev --omit=optional

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "src/server.js"]
