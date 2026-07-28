# Dev-oriented image: installs deps at build time, then docker-compose bind-mounts
# the actual source over this so edits hot-reload via `tsx watch`. Not meant as a
# production image (no multi-stage build, no non-root user, etc.) — that's a later
# concern once this is actually being deployed somewhere.
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 8081

CMD ["npm", "run", "dev"]
