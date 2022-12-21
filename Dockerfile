FROM node:16.17.0-alpine
WORKDIR /usr
COPY package.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm install
RUN npm run build

## this is stage two , where the app actually runs
FROM node:16.17.0-alpine
ENV NODE_ENV=production
LABEL org.opencontainers.image.source https://github.com/Armadindon/monix-express-backend
WORKDIR /usr
COPY package.json ./
RUN npm install --omit=dev
COPY --from=0 /usr/dist .
COPY .env ./
RUN npm install pm2 -g
EXPOSE 80
CMD ["pm2-runtime","index.js"]