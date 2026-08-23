FROM node:20-alpine

# Install OpenSSL for Prisma compatibility
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and prisma schema for caching and generation
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY . .

EXPOSE 4000

CMD ["node", "server.js"]
