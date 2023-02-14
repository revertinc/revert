export enum NODE_TRIGGER_TYPE {
  WEBHOOK = "WEBHOOK",
  CRON = "CRON",
}

export enum NODE_INTEGRATION_TYPE {
  INTEGRATION_SLACK = "INTEGRATION_SLACK",
  INTEGRATION_POSTGRES = "INTEGRATION_POSTGRES",
  INTEGRATION_GMAIL = "INTEGRATION_GMAIL",
}

export enum NODE_EXECUTION_TYPE {
  CODE_JS = "CODE_JS",
  API = "API",
  BRANCH = "BRANCH", // IF else , else if
  LOOP = "LOOP",
  NOOP = "NOOP", // Do nothing
}

export const NODE_TYPE = {
  ...NODE_TRIGGER_TYPE,
  ...NODE_INTEGRATION_TYPE,
  ...NODE_EXECUTION_TYPE,
};

export type NODE_TYPE = typeof NODE_TYPE;

export enum NODE_KIND_ENUM {
  action = "action",
  trigger = "trigger",
}

export enum WorflowDeploymentStatus {
  Live = "live",
  Archived = "archived",
  Paused = "paused",
}

export enum WorkflowEnvironment {
  Staging = "staging",
  Prod = "prod",
}
