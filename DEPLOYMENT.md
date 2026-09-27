# Deployment Guide: NOVA

This guide explains how to deploy NOVA to staging or production environments.

---

## 1. Single-Service Production Deployment (e.g. Render / Railway / DigitalOcean)

The platform is designed so that the built frontend SPA in `client/dist` can be served directly by the Express production server on a single port.

### Build and Start:
```bash
# 1. Install root backend dependencies
npm install --production=false

# 2. Build frontend React bundle
cd client
npm install
npm run build
cd ..

# 3. Apply database migration
npm run migrate

# 4. Start production server
NODE_ENV=production npm start
```

---

## 2. Docker Deployment

### `Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

WORKDIR /app
COPY . .

EXPOSE 5000
CMD ["npm", "start"]
```

---

## 3. Decoupled Deployment (Vercel / Netlify Frontend + Render Backend)

If deploying the React client independently to Netlify/Vercel:
1. Deploy `client/` pointing build command to `npm run build` and publish directory to `dist`.
2. Set environment variable `VITE_API_URL=https://your-backend-domain.com`.
3. In backend `.env`, set `CLIENT_URL=https://your-frontend-domain.com` to allow CORS and credentials exchange.
