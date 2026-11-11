export interface WorkdayConnectionConfig {
    host: string;
    tenant: string;
    accessToken: string;
}

export function buildWorkdayRestUrl(host: string, tenant: string, service = 'recruiting/v1'): string {
    const cleanHost = String(host || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    const cleanTenant = String(tenant || '').trim();
    if (!cleanHost || !cleanTenant) {
        throw new Error('Workday host and tenant are required');
    }
    return `https://${cleanHost}/ccx/api/${service}/${cleanTenant}`;
}

export function buildWorkdayTokenEndpoint(host: string, tenant: string): string {
    const cleanHost = String(host || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    const cleanTenant = String(tenant || '').trim();
    return `https://${cleanHost}/ccx/oauth2/${cleanTenant}/token`;
}

export function unifyWorkdayJobRequisition(raw: Record<string, any>) {
    const statusDescriptor = String(raw.jobRequisitionStatus?.descriptor || raw.status || 'Open').toLowerCase();
    let status: 'OPEN' | 'CLOSED' | 'DRAFT' = 'OPEN';
    if (statusDescriptor.includes('close') || statusDescriptor.includes('fill')) {
        status = 'CLOSED';
    } else if (statusDescriptor.includes('draft') || statusDescriptor.includes('freeze')) {
        status = 'DRAFT';
    }
    return {
        id: String(raw.id || raw.jobRequisitionId || ''),
        title: String(raw.jobPostingTitle || raw.descriptor || ''),
        description: String(raw.jobDescriptionSummary || raw.jobDescription || ''),
        status,
        department: raw.supervisoryOrganization?.descriptor || undefined,
        location: raw.primaryLocation?.descriptor || undefined,
        remoteData: raw,
    };
}

export function unifyWorkdayCandidate(raw: Record<string, any>) {
    const fullName = String(raw.name?.descriptor || raw.descriptor || '').trim();
    const parts = fullName.split(/\s+/).filter(Boolean);
    const firstName = raw.firstName || parts[0] || '';
    const lastName = raw.lastName || parts.slice(1).join(' ') || '';
    return {
        id: String(raw.id || raw.candidateId || ''),
        firstName,
        lastName,
        email: String(raw.email || raw.primaryEmail || ''),
        phone: raw.phoneNumber || raw.primaryPhone || undefined,
        stage: raw.stage?.descriptor || undefined,
        jobId: raw.jobRequisition?.id || undefined,
        remoteData: raw,
    };
}

export function unifyWorkdaySupervisoryOrg(raw: Record<string, any>) {
    return {
        id: String(raw.id || ''),
        name: String(raw.descriptor || raw.name || ''),
        managerId: raw.manager?.id || undefined,
        remoteData: raw,
    };
}
