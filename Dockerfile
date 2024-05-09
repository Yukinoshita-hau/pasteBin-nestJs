FROM node:22-alpine as build
WORKDIR /opt/app
ADD *.json ./
RUN npm install --only=prod
ADD . .
RUN npm run build


FROM node:22-alpine
WORKDIR /opt/app
ADD *.json ./
RUN npm install --only=prod
COPY --from=build /opt/app/dist ./dist
CMD [ "node", "dist/main.js" ]