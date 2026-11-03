export interface WorkdayConfig {
  host: string;
  tenant: string;
  accessToken: string;
}

export interface UnifiedWorkdayWorker {
  id: string;
  descriptor: string;
  primaryWorkEmail?: string;
  businessTitle?: string;
  supervisoryOrganization?: string;
}

export class WorkdayClient {
  private readonly baseUrl: string;
  private readonly accessToken: string;

  constructor(config: WorkdayConfig) {
    if (!config.host || !config.tenant || !config.accessToken) {
      throw new Error("WorkdayClient requires host, tenant, and accessToken");
    }
    const cleanHost = config.host.replace(/^https?:\/\//, "").replace(/\/$/, "");
    this.baseUrl = `https://${cleanHost}/ccx/api/v1/${encodeURIComponent(config.tenant)}`;
    this.accessToken = config.accessToken;
  }

  async listWorkers(limit: number = 50, offset: number = 0): Promise<UnifiedWorkdayWorker[]> {
    const url = `${this.baseUrl}/workers?limit=${limit}&offset=${offset}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Workday API error (${response.status}): ${await response.text()}`);
    }
    const payload = (await response.json()) as { data?: Array<Record<string, unknown>> };
    return (payload.data ?? []).map((w) => ({
      id: String(w.id ?? ""),
      descriptor: String(w.descriptor ?? ""),
      primaryWorkEmail: w.primaryWorkEmail ? String(w.primaryWorkEmail) : undefined,
      businessTitle: w.businessTitle ? String(w.businessTitle) : undefined,
      supervisoryOrganization: (w.supervisoryOrganization as Record<string, unknown> | undefined)?.descriptor
        ? String((w.supervisoryOrganization as Record<string, unknown>).descriptor)
        : undefined,
    }));
  }
}
