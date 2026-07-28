# Dev-oriented image — see the note in packages/ebs/Dockerfile, same idea here.
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["npm", "run", "dev"]
