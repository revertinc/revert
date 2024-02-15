# Contributing to Revert

Thanks for taking the interest in contributing ♥. We really appreciate any support in making this project thrive.

## Before getting started

-   Before jumping into a PR be sure to search [existing PRs](https://github.com/revert/revert/pulls) or [issues](https://github.com/revert/revert/issues) for an open or closed item that relates to your submission.
-   Select an issue from [here](https://github.com/revert/revert/issues) or create a new one
-   Consider the results from the discussion in the issue

## Developing

-   The development branch is <code>main</code>. All pull request should be made against this branch.
-   If you need help getting started, [join us on Discord](https://discord.gg/q5K5cRhymW).
-   Use [Conventional Commits](https://www.conventionalcommits.org/) to keep everything nice and clean.
-   Choose your branch name using the issue you are working on and a conventional commit type.

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your
   own GitHub account and then
   [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device.
2. Create a new branch:

-   Create a new branch (include the issue id and something readable):

    ```sh
    git checkout -b feat/<feature-description>
    ```

3. See the individual [package's](https://github.com/revertinc/revert#packages) README for instructions on how to build each from source.

## Building

> **Note**
> Please be sure that you can make a full production build before pushing code or creating PRs.

- Install the project dependencies by running:
```bash
yarn install
```
- Next, you can build the project with:

```bash
yarn build
```

## Contributing an API Integration

**1:** Ensure that the project is configured in the local environment following the instructions outlined [here](https://github.com/revertinc/revert/blob/main/CONTRIBUTING.md). Establish a connection to an existing application and test various [endpoints](https://docs.revert.dev/api-reference) to verify proper functionality.

**2:** Analyze the authentication and authorization flow based on the requirements of the third-party API. Identify the appropriate authentication type, which may include options such as Basic, OAuth 2.0, OAuth 1.0, API Key, etc depending on the thirdparty.

**3:** Incorporate your third-party integration by adding it to the Prisma TP_ID enum. Execute the command `yarn migration:dev` in `packages/backend` to apply the necessary database migrations.

**4:** Implement the recommended authentication and refresh token flows for the third-party integration. To generate access tokens and establish a connection, refer to the relevant code in `packages/backend/routes/v1/` within respective sub-packages like `crm, chat, ticketing, etc`. For the refresh token flow, inspect the methods available in `packages/backend/services/auth.ts`, for categorized token-refreshing methods such as `refreshOAuthTokensForThirdParty` and `refreshOAuthTokensForThirdPartyTicketServices`.

> Note: If you are introducing a new category that lacks a corresponding structure in the project, feel free to create new packages as needed. Should you require assistance, please don't hesitate to reach out to us on [Discord](<(https://discord.gg/q5K5cRhymW)>).

**5:** Incorporate the designated value as a string (previously set in the `TP_ID` enum in the Prisma schema) within the suitable category in both `packages/backend/common.ts` and `packages/backend/prisma/seed.ts`.

**6:** Prior to Unification, when implementing any given endpoint, initiate the process by generating a fern configuration for it. Ensure that thirdparty endpoint/operations for the specified API are conducted through Revert.

**7:** For the given endpoint(s), unify the schema and fields by implementing them in `packages/backend/prisma/fields.ts`.

**Unification Process:** Performed while retrieving resources from third party to match the provided schema. The process involves the following steps:

1. Request to Third-Party Endpoint: Begin by initiating a request to the third-party endpoint.
2. unifyObject: After receiving the response, pass it to `unifyObject`, incorporating a preprocessing to standardize essential values.
3. transformFieldMappingToModel: Send the preprocessed data to `transformFieldMappingToModel`, which aligns it with the provided schema.
4. Unified Response: The processed data is returned as a unified response.

**Disunification Process:** Primarily performed during the creation or updating of a resource. When a create or update request is made, it is initially in the format defined by Revert. This format is then disunified to align with the structure accepted by the third party. The process involves the following steps:

1. `disunifyObject`: The initial Revert-defined format is disunified.
2. `flattenObj`: Extract additional values from the object.
3. `transformModelToFieldMapping`: Convert fields to match the format accepted by the third party, which is the reverse of the `transformFieldMappingToModel` step in the unification process.
4. `postprocessDisUnifyObject`: Modify values to align with the expectations of the third party.
