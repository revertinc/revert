FROM node:alpine AS BUILD_IMAGE
WORKDIR /app/
COPY ./fern/ /app/fern/

COPY ./packages/backend /app/packages/backend
COPY ./yarn.lock /app/yarn.lock
COPY ./package.json /app/package.json

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

RUN echo $PGSQL_URL
ENV SERVER_PORT $PORT
ENV REDIS_SERVER_URL $REDIS_SERVER_URL
ENV HUBSPOT_CLIENT_ID $HUBSPOT_CLIENT_ID
ENV HUBSPOT_CLIENT_SECRET $HUBSPOT_CLIENT_SECRET
ENV ZOHOCRM_CLIENT_ID $ZOHOCRM_CLIENT_ID
ENV ZOHOCRM_CLIENT_SECRET $ZOHOCRM_CLIENT_SECRET
ENV PGSQL_URL $PGSQL_URL
ENV SFDC_CLIENT_ID $SFDC_CLIENT_ID
ENV SFDC_CLIENT_SECRET $SFDC_CLIENT_SECRET
ENV OAUTH_REDIRECT_BASE $OAUTH_REDIRECT_BASE
ENV PORT $PORT
ENV FERN_TOKEN $FERN_TOKEN

# create .env from the vars passed.
RUN echo "SERVER_PORT=$SERVER_PORT" > .env \
    && echo "REDIS_SERVER_URL=$REDIS_SERVER_URL" >> .env \
    && echo "HUBSPOT_CLIENT_ID=$HUBSPOT_CLIENT_ID" >> .env \
    && echo "HUBSPOT_CLIENT_SECRET=$HUBSPOT_CLIENT_SECRET" >> .env \
    && echo "ZOHOCRM_CLIENT_ID=$ZOHOCRM_CLIENT_ID" >> .env \
    && echo "ZOHOCRM_CLIENT_SECRET=$ZOHOCRM_CLIENT_SECRET" >> .env \
    && echo "PGSQL_URL=$PGSQL_URL" >> .env \
    && echo "SFDC_CLIENT_ID=$SFDC_CLIENT_ID" >> .env \
    && echo "SFDC_CLIENT_SECRET=$SFDC_CLIENT_SECRET" >> .env \
    && echo "OAUTH_REDIRECT_BASE=$OAUTH_REDIRECT_BASE" >> .env \
    && echo "PORT=$PORT" >> .env \
    && echo "FERN_TOKEN=$FERN_TOKEN" >> .env

RUN yarn install --check-cache 
RUN npm install -g fern-api@0.6.12 && fern -v && fern generate --log-level debug
RUN mkdir -p /app/packages/backend/dist/generated && cp -r /app/packages/backend/generated/typescript /app/packages/backend/dist/generated
RUN yarn workspace @revertdotdev/backend build

# remove development dependencies
RUN npm prune --production

FROM node:alpine as RUNTIME_IMAGE
WORKDIR /app/

#copy from build image
COPY --from=BUILD_IMAGE /app/packages/backend/dist ./dist
COPY --from=BUILD_IMAGE /app/node_modules ./node_modules
COPY --from=BUILD_IMAGE /app/.env ./dist/.env

WORKDIR /app/dist
CMD ["node", "index.js"]