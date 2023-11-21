<p align="center">
<img width="150" style="border-radius:75px;" src="../../public/logo.png"/>
<h1 align="center"><b>Revert.dev</b></h1>
<p align="center">
 <h2 align="center">Open-source unified API for product integrations

# @revertdotdev/backend

```shell

# Copy the example env file
cp packages/backend/.env.example packages/backend/.env

# Update this .env file with your own secrets if you'd like to.

```

### Fern setup

-   Login with Fern with `fern login`.
-   To generate Fern drive code locally, run `yarn fern` in the root folder of this repo. This will create the `packages/backend/generated` folder with the generated code.

### Setup Redis

-   Have a redis instance running locally or use https://upstash.com/ to get a redis url.
-   Update the redis url in `.env`

### Seed the database

```shell
# seed the database with sample data
yarn workspace @revertdotdev/backend db-seed

```

### Running the API locally

-   Run `yarn workspace @revertdotdev/backend dev` to the run service locally at `:4001`

## Integrations

#### Connect to Pipedrive CRM via Revert

-   Open [Pipedrive Developers Corner](https://developers.pipedrive.com/) and sign in to your account, or create a new one
-   Go to Settings > (company name) Developer Hub
-   Create a Pipedrive app, using the steps mentioned [here](https://pipedrive.readme.io/docs/marketplace-creating-a-proper-app#create-an-app-in-5-simple-steps)
    -   You can skip this step and use the default revert Pipedrive app
-   Set `https://app.revert.dev/oauth-callback/pipedrive` as a callback url for your app
-   **Get your client_id and client_secret**:
    -   Go to the "OAuth & access scopes" tab of your app
    -   Copy your client_id and client_secret
-   **Login to your revert dashboard and click on "Customize your apps" -> "Pipedrive"**
-   **Enter the client_id and client_secret you copied in the previous step**
-   **(Optional) Copy the scopes (from the Pipedrive app) and add them to the revert dashboard to get granular control over the scope of your app**
    -   You can skip this step and use the default revert scopes and permissions

#### Connect to CLOSE CRM via Revert

-   Open [CLOSE CRM](https://www.close.com/) and sigin or create an account
-   Left Pane Setting > Developer > OAuth Apps > create apps . More details mentioned [here](https://help.close.com/docs/create-oauth-apps)
-   **Get your client_id and client_secret**:
    -   Select your app
    -   Copy Client ID and Client Secret
-   **Login to your revert dashboard**
-   **Enter the Client ID and Client Secret you copied in the previous step and click submit**
