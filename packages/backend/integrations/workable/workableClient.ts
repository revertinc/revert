export interface WorkableConfig {
  subdomain: string;
  accessToken: string;
  apiVersion?: string;
}

export interface UnifiedAtsJob {
  id: string;
  title: string;
  shortcode: string;
  state: string;
  department?: string;
  url?: string;
  createdAt?: string;
}

export interface UnifiedAtsCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  stage?: string;
  jobShortcode?: string;
  createdAt?: string;
}

export class WorkableClient {
  private readonly baseUrl: string;
  private readonly accessToken: string;

  constructor(config: WorkableConfig) {
    if (!config.subdomain || !config.accessToken) {
      throw new Error("WorkableClient requires both subdomain and accessToken");
    }
    const ver = config.apiVersion ?? "v3";
    this.baseUrl = `https://${config.subdomain}.workable.com/spi/${ver}`;
    this.accessToken = config.accessToken;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (!response.ok) {
      throw new Error(`Workable API error (${response.status}): ${await response.text()}`);
    }
    return (await response.json()) as T;
  }

  async listJobs(state: string = "published"): Promise<UnifiedAtsJob[]> {
    const data = await this.request<{ jobs?: Array<Record<string, unknown>> }>(
      `/jobs?state=${encodeURIComponent(state)}`
    );
    return (data.jobs ?? []).map((j) => ({
      id: String(j.id ?? j.shortcode ?? ""),
      title: String(j.title ?? ""),
      shortcode: String(j.shortcode ?? ""),
      state: String(j.state ?? ""),
      department: j.department ? String(j.department) : undefined,
      url: j.url ? String(j.url) : undefined,
      createdAt: j.created_at ? String(j.created_at) : undefined,
    }));
  }

  async listCandidates(shortcode?: string): Promise<UnifiedAtsCandidate[]> {
    const query = shortcode ? `?shortcode=${encodeURIComponent(shortcode)}` : "";
    const data = await this.request<{ candidates?: Array<Record<string, unknown>> }>(
      `/candidates${query}`
    );
    return (data.candidates ?? []).map((c) => ({
      id: String(c.id ?? ""),
      firstName: String(c.firstname ?? ""),
      lastName: String(c.lastname ?? ""),
      email: c.email ? String(c.email) : undefined,
      phone: c.phone ? String(c.phone) : undefined,
      stage: c.stage ? String(c.stage) : undefined,
      jobShortcode: (c.job as Record<string, unknown> | undefined)?.shortcode
        ? String((c.job as Record<string, unknown>).shortcode)
        : undefined,
      createdAt: c.created_at ? String(c.created_at) : undefined,
    }));
  }
}
