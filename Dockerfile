FROM node:alpine
WORKDIR /app/
COPY . /app/
RUN npm install -g npm@9.6.5
RUN yarn install 
ENV FERN_TOKEN fern_WMz5us87SdllVZISrRAqKtxVsS7iuWm9
RUN ls && npm install -g fern-api@0.6.12 && fern -v && fern generate --log-level debug
RUN yarn workspace @revertdotdev/backend build
CMD ["node", "./packages/backend/dist/index.js"]