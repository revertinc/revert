FROM node:18-alpine AS build_image
WORKDIR /app

COPY ./fern /app/fern
COPY ./packages/backend /app/packages/backend
COPY ./packages/backend/tsconfig.json /app/packages/backend/tsconfig.json
COPY ./yarn.lock /app/yarn.lock
COPY ./package.json /app/package.json
COPY ./.yarnrc.yml /app/.yarnrc.yml
COPY ./.yarn /app/.yarn

ARG SERVER_PORT
ARG NODE_ENV
ARG AES_ENCRYPTION_SECRET
ARG SVIX_ENDPOINT_SECRET
ARG WHITE_LISTED_DOMAINS
ARG CLOSECRM_CLIENT_ID
ARG CLOSECRM_CLIENT_SECRET
ARG SENTRY_DSN
ARG ZOHOCRM_CLIENT_ID
ARG ZOHOCRM_CLIENT_SECRET
ARG SLACK_CLIENT_ID
ARG SLACK_CLIENT_SECRET
ARG LOOPS_API_KEY
ARG LOOPS_ONBOARDING_TXN_ID
ARG PIPEDRIVE_CLIENT_SECRET
ARG SLACK_HOOK_URL
ARG SLACK_BOT_TOKEN
ARG SVIX_AUTH_TOKEN
ARG MOESIF_APPLICATION_ID
ARG SHORTLOOP_AUTH_KEY
ARG PIPEDRIVE_CLIENT_ID
ARG DISABLE_REVERT_TELEMETRY
ARG MS_DYNAMICS_SALES_CLIENT_ID
ARG MS_DYNAMICS_SALES_CLIENT_SECRET
ARG MS_DYNAMICS_SALES_ORG_URL
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
ARG POSTMAN_API_KEY
ARG POSTMAN_WORKSPACE_ID

RUN echo $PGSQL_URL
ENV SERVER_PORT=$PORT
ENV REDIS_SERVER_URL=$REDIS_SERVER_URL
ENV HUBSPOT_CLIENT_ID=$HUBSPOT_CLIENT_ID
ENV HUBSPOT_CLIENT_SECRET=$HUBSPOT_CLIENT_SECRET
ENV ZOHOCRM_CLIENT_ID=$ZOHOCRM_CLIENT_ID
ENV ZOHOCRM_CLIENT_SECRET=$ZOHOCRM_CLIENT_SECRET
ENV PGSQL_URL=$PGSQL_URL
ENV SFDC_CLIENT_ID=$SFDC_CLIENT_ID
ENV SFDC_CLIENT_SECRET=$SFDC_CLIENT_SECRET
ENV OAUTH_REDIRECT_BASE=$OAUTH_REDIRECT_BASE
ENV PORT=$PORT
ENV FERN_TOKEN=$FERN_TOKEN
ENV POSTMAN_API_KEY=$POSTMAN_API_KEY
ENV POSTMAN_WORKSPACE_ID=$POSTMAN_WORKSPACE_ID
ENV NODE_ENV=$NODE_ENV
ENV AES_ENCRYPTION_SECRET=$AES_ENCRYPTION_SECRET
ENV SVIX_ENDPOINT_SECRET=$SVIX_ENDPOINT_SECRET
ENV WHITE_LISTED_DOMAINS=$WHITE_LISTED_DOMAINS
ENV CLOSECRM_CLIENT_ID=$CLOSECRM_CLIENT_ID
ENV CLOSECRM_CLIENT_SECRET=$CLOSECRM_CLIENT_SECRET
ENV SENTRY_DSN=$SENTRY_DSN
ENV ZOHOCRM_CLIENT_ID=$ZOHOCRM_CLIENT_ID
ENV ZOHOCRM_CLIENT_SECRET=$ZOHOCRM_CLIENT_SECRET
ENV SLACK_CLIENT_ID=$SLACK_CLIENT_ID
ENV SLACK_CLIENT_SECRET=$SLACK_CLIENT_SECRET
ENV LOOPS_API_KEY=$LOOPS_API_KEY
ENV LOOPS_ONBOARDING_TXN_ID=$LOOPS_ONBOARDING_TXN_ID
ENV PIPEDRIVE_CLIENT_SECRET=$PIPEDRIVE_CLIENT_SECRET
ENV SLACK_HOOK_URL=$SLACK_HOOK_URL
ENV SLACK_BOT_TOKEN=$SLACK_BOT_TOKEN
ENV SVIX_AUTH_TOKEN=$SVIX_AUTH_TOKEN
ENV MOESIF_APPLICATION_ID=$MOESIF_APPLICATION_ID
ENV SHORTLOOP_AUTH_KEY=$SHORTLOOP_AUTH_KEY
ENV PIPEDRIVE_CLIENT_ID=$PIPEDRIVE_CLIENT_ID
ENV DISABLE_REVERT_TELEMETRY=$DISABLE_REVERT_TELEMETRY
ENV MS_DYNAMICS_SALES_CLIENT_ID=$MS_DYNAMICS_SALES_CLIENT_ID
ENV MS_DYNAMICS_SALES_CLIENT_SECRET=$MS_DYNAMICS_SALES_CLIENT_SECRET
ENV MS_DYNAMICS_SALES_ORG_URL=$MS_DYNAMICS_SALES_ORG_URL

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
    && echo "POSTMAN_API_KEY=$POSTMAN_API_KEY" >> .env \
    && echo "POSTMAN_WORKSPACE_ID=$POSTMAN_WORKSPACE_ID" >> .env \
    && echo "PORT=$PORT" >> .env \
    && echo "FERN_TOKEN=$FERN_TOKEN" >> .env \
    && echo "NODE_ENV=$NODE_ENV" >> .env \
    && echo "AES_ENCRYPTION_SECRET=$AES_ENCRYPTION_SECRET" >> .env \
    && echo "SVIX_ENDPOINT_SECRET=$REDIS_SERVER_URL" >> .env \
    && echo "WHITE_LISTED_DOMAINS=$WHITE_LISTED_DOMAINS" >> .env \
    && echo "CLOSECRM_CLIENT_ID=$CLOSECRM_CLIENT_ID" >> .env \
    && echo "CLOSECRM_CLIENT_SECRET=$CLOSECRM_CLIENT_SECRET" >> .env \
    && echo "SENTRY_DSN=$SENTRY_DSN" >> .env \
    && echo "ZOHOCRM_CLIENT_ID=$ZOHOCRM_CLIENT_ID" >> .env \
    && echo "ZOHOCRM_CLIENT_SECRET=$ZOHOCRM_CLIENT_SECRET" >> .env \
    && echo "SLACK_CLIENT_ID=$SLACK_CLIENT_ID" >> .env \
    && echo "SLACK_CLIENT_SECRET=$SLACK_CLIENT_SECRET" >> .env \
    && echo "LOOPS_API_KEY=$LOOPS_API_KEY" >> .env \
    && echo "LOOPS_ONBOARDING_TXN_ID=$LOOPS_ONBOARDING_TXN_ID" >> .env \
    && echo "PIPEDRIVE_CLIENT_SECRET=$PIPEDRIVE_CLIENT_SECRET" >> .env \
    && echo "SLACK_HOOK_URL=$SLACK_HOOK_URL" >> .env \
    && echo "SLACK_BOT_TOKEN=$SLACK_BOT_TOKEN" >> .env \
    && echo "SVIX_AUTH_TOKEN=$SVIX_AUTH_TOKEN" >> .env \
    && echo "MOESIF_APPLICATION_ID=$MOESIF_APPLICATION_ID" >> .env \
    && echo "SHORTLOOP_AUTH_KEY=$SHORTLOOP_AUTH_KEY" >> .env \
    && echo "PIPEDRIVE_CLIENT_ID=$PIPEDRIVE_CLIENT_ID" >> .env \
    && echo "DISABLE_REVERT_TELEMETRY=$DISABLE_REVERT_TELEMETRY" >> .env \
    && echo "MS_DYNAMICS_SALES_CLIENT_ID=$MS_DYNAMICS_SALES_CLIENT_ID" >> .env \
    && echo "MS_DYNAMICS_SALES_CLIENT_SECRET=$MS_DYNAMICS_SALES_CLIENT_SECRET" >> .env \
    && echo "MS_DYNAMICS_SALES_ORG_URL=$MS_DYNAMICS_SALES_ORG_URL" >> .env 

RUN rm -rf node_modules && yarn cache clean && yarn install
RUN npm install -g fern-api@0.16.22 && fern -v && fern generate --log-level debug
RUN yarn workspace @revertdotdev/backend build:prod

# remove development dependencies
RUN npm prune --production

FROM node:18-alpine AS runtime_image
WORKDIR /app/

# #copy from build image
COPY --from=build_image /app/packages/backend/dist ./dist
COPY --from=build_image /app/node_modules ./node_modules
COPY --from=build_image /app/.env ./.env
COPY --from=build_image /app/packages/backend/package.json ./package.json

WORKDIR /app/dist
CMD ["yarn", "start"]