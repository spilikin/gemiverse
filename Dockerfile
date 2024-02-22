FROM node:18 as build

WORKDIR /app

#RUN npm install @rollup/rollup-linux-x64-gnu
#RUN npm install -g @sveltejs/kit
#RUN npm install -g vite
COPY package.json ./
RUN npm install
RUN ls node_modules
COPY . ./
RUN npm run build


FROM node:18-alpine

WORKDIR /app
COPY --from=build /app .


ENV HOST=0.0.0.0
EXPOSE 4173
CMD ["npm","run", "preview","--", "--host", "0.0.0.0"]
