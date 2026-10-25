/**
 * Workable Integration Module
 *
 * Provides a thin wrapper around the Workable API:
 *  - Generates & caches OAuth2 client‑credentials access tokens
 *  - Retrieves jobs, candidates and other common resources
 *
 * Usage:
 *   import { WorkableClient } from "./workable";
 *
 *   const client = new WorkableClient({
 *     clientId: process.env.WORKABLE_CLIENT_ID!,
 *     clientSecret: process.env.WORKABLE_CLIENT_SECRET!,
 *     subdomain: "your-company", // e.g. https://your-company.workable.com
 *   });
 *
 *   const jobs = await client.listJobs();
 *
 * The implementation is deliberately self‑contained, uses only `axios`
 * (a lightweight HTTP client) and does not depend on any external
 * framework.  Errors are thrown as native `Error` objects with a
 * descriptive `code` property for easier handling upstream.
 */

import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface WorkableConfig {
  /** Workable OAuth client id */
  clientId: string;
  /** Workable OAuth client secret */
  clientSecret: string;
  /** Sub‑domain of the Workable account (e.g. "my-company" for https://my-company.workable.com) */
  subdomain: string;
  /** Optional request timeout (ms) */
  timeout?: number;
}

/** Shape of the OAuth token response */
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds
}

/** Minimal Job representation returned by Workable */
export interface Job {
  shortcode: string;
  title: string;
  location: string;
  department: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/** Minimal Candidate representation returned by Workable */
export interface Candidate {
  shortlink: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  stage: string;
  applied_at: string;
}

/* -------------------------------------------------------------------------- */
/* WorkableClient                                                             */
/* -------------------------------------------------------------------------- */

export class WorkableClient {
  private readonly config: WorkableConfig;
  private readonly http: AxiosInstance;

  // Cached token & expiry timestamp (epoch ms)
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: WorkableConfig) {
    if (!config.clientId || !config.clientSecret || !config.subdomain) {
      throw new Error(
        "WorkableClient: clientId, clientSecret and subdomain are required"
      );
    }

    this.config = {
      timeout: 10_000,
      ...config,
    };

    const baseURL = `https://${this.config.subdomain}.workable.com/spi/v3/`;

    this.http = axios.create({
      baseURL,
      timeout: this.config.timeout,
    });

    // Attach interceptor to inject Authorization header automatically
    this.http.interceptors.request.use(async (req) => {
      const token = await this.getValidToken();
      req.headers = {
        ...req.headers,
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      };
      return req;
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Token handling                                                          */
  /* ---------------------------------------------------------------------- */

  /** Returns a valid (non‑expired) token, refreshing it if necessary */
  private async getValidToken(): Promise<string> {
    const now = Date.now();

    if (this.token && now < this.tokenExpiresAt - 5_000) {
      // Token still valid (5‑second safety margin)
      return this.token;
    }

    // Refresh token
    await this.refreshToken();
    if (!this.token) {
      throw new Error("WorkableClient: Failed to obtain access token");
    }
    return this.token;
  }

  /** Calls Workable's token endpoint and caches the result */
  private async refreshToken(): Promise<void> {
    const url = `https://${this.config.subdomain}.workable.com/oauth/token`;
    const params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    try {
      const resp = await axios.post<TokenResponse>(url, params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const data = resp.data;
      this.token = data.access_token;
      // expires_in is seconds; convert to epoch ms
      this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || "Unknown error";
      const error = new Error(
        `WorkableClient: Unable to fetch access token – ${msg}`
      ) as any;
      error.code = "WORKABLE_TOKEN_ERROR";
      throw error;
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Public API methods                                                      */
  /* ---------------------------------------------------------------------- */

  /** List all jobs (paginated internally) */
  async listJobs(): Promise<Job[]> {
    const endpoint = "jobs";
    const jobs: Job[] = [];

    let page = 1;
    const perPage = 100;

    while (true) {
      const resp = await this.request<Job[]>(endpoint, {
        params: { page, per_page: perPage },
      });
      if (!Array.isArray(resp)) break;
      jobs.push(...resp);
      if (resp.length < perPage) break; // last page
      page += 1;
    }

    return jobs;
  }

  /** Retrieve a single job by its shortcode */
  async getJob(shortcode: string): Promise<Job> {
    if (!shortcode) throw new Error("WorkableClient: shortcode is required");
    return this.request<Job>(`jobs/${encodeURIComponent(shortcode)}`);
  }

  /** List candidates for a given job (paginated) */
  async listCandidates(jobShortcode: string): Promise<Candidate[]> {
    if (!jobShortcode) throw new Error("WorkableClient: jobShortcode required");
    const endpoint = `jobs/${encodeURIComponent(jobShortcode)}/candidates`;
    const candidates: Candidate[] = [];

    let page = 1;
    const perPage = 100;

    while (true) {
      const resp = await this.request<Candidate[]>(endpoint, {
        params: { page, per_page: perPage },
      });
      if (!Array.isArray(resp)) break;
      candidates.push(...resp);
      if (resp.length < perPage) break;
      page += 1;
    }

    return candidates;
  }

  /** Retrieve a single candidate by shortlink */
  async getCandidate(shortlink: string): Promise<Candidate> {
    if (!shortlink) throw new Error("WorkableClient: shortlink is required");
    return this.request<Candidate>(`candidates/${encodeURIComponent(shortlink)}`);
  }

  /* ---------------------------------------------------------------------- */
  /* Low‑level request helper                                                */
  /* ---------------------------------------------------------------------- */

  private async request<T>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const resp = await this.http.get<T>(endpoint, config);
      return resp.data;
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const message = data?.error || err.message || "Unknown error";

      const error = new Error(
        `WorkableClient: Request to ${endpoint} failed – ${message}`
      ) as any;
      error.code = "WORKABLE_API_ERROR";
      error.status = status;
      error.response = data;
      throw error;
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Export a singleton for convenience (optional)                              */
/* -------------------------------------------------------------------------- */

export const workable = (config: WorkableConfig) => new WorkableClient(config);