export const filterLeadsFromContactsForHubspot = (leads: any[]) => {
    const updatedLeads = leads
        .flatMap((l) => l)
        .filter((lead) => lead.properties?.hs_lead_status === null || lead.properties?.hs_lead_status === undefined);
    return updatedLeads;
};
