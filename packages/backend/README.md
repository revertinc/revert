### Running locally

-   Run `yarn workspace @revertdotdev/backend dev` to the run service locally at `:4001`

### Fern setup

-   Login with Fern if necessary with `fern login`.
-   To generate Fern drive code locally, run `yarn fern` in the root folder of this repo. This will create the `packages/backend/generated` folder with the generated code.

### Connect to Pipedrive CRM

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
