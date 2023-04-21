ARG SERVER_PORT
ARG REDIS_SERVER_URL
ARG HUBSPOT_CLIENT_ID
ARG HUBSPOT_CLIENT_SECRET
ARG ZOHOCRM_CLIENT_ID
ARG ZOHOCRM_CLIENT_SECRET
ARG PGSQL_URL
ARG SFDC_CLIENT_ID
ARG SFDC_CLIENT_SECRET
ARG OAUTH_REDIRECT_BASE
ARG FERN_TOKEN
ARG PORT

FROM node:alpine
WORKDIR /app/
COPY . /app/
RUN npm install -g npm@9.6.5
RUN yarn install --check-cache
ENV FERN_TOKEN fern_WMz5us87SdllVZISrRAqKtxVsS7iuWm9
RUN ls && npm install -g fern-api@0.6.12 && fern -v && fern generate --log-level debug
RUN yarn workspace @revertdotdev/backend build
CMD ["node", "./packages/backend/dist/index.js"]