# Contributing to Revert

Thanks for taking the interest in contributing ♥. We really appreciate any support in making this project thrive.

## Before getting started

-   Before jumping into a PR be sure to search [existing PRs](https://github.com/revertinc/revert/pulls) or [issues](https://github.com/revertinc/revert/issues) for an open or closed item that relates to your submission.
-   Select an issue from [here](https://github.com/revertinc/revert/issues) or create a new one
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

See https://docs.revert.dev/overview/developer-guide/contribute-an-api-integration for more on how to contribute an integration.
