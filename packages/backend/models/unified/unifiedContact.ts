export interface UnifiedContact {
    id: string;
    isDeleted: boolean;
    masterRecordId?: string;
    accountId: string;
    lastName: string;
    firstName: string;
    salutation?: string;
    name?: string;
    otherStreet?: string;
    otherCity?: string;
    otherState?: string;
    otherPostalCode?: string;
    otherCountry?: string;
    otherLatitude?: number;
    otherLongitude?: number;
    otherGeocodeAccuracy?: string;
    otherAddress?: string;
    mailingStreet?: string;
    mailingCity?: string;
    mailingState?: string;
    mailingPostalCode?: string;
    mailingCountry?: string;
    mailingLatitude?: number;
    mailingLongitude?: number;
    mailingGeocodeAccuracy?: string;
    mailingAddress?: string;
    phone?: string;
    fax?: string;
    mobilePhone?: string;
    homePhone?: string;
    otherPhone?: string;
    assistantPhone?: string;
    reportsToId?: string;
    email?: string;
    title?: string;
    department?: string;
    assistantName?: string;
    leadSource?: string;
    birthdate?: Date;
    description?: string;
    ownerId: string;
    createdDate: Date;
    createdById: string;
    lastModifiedDate: Date;
    lastModifiedById: string;
    systemModstamp: Date;
    lastActivityDate?: Date;
    lastCURequestDate?: Date;
    lastCUUpdateDate?: Date;
    lastViewedDate?: Date;
    lastReferencedDate?: Date;
    emailBouncedReason?: string;
    emailBouncedDate?: Date;
    isEmailBounced?: boolean;
    photoUrl?: string;
    jigsaw?: string;
    jigsawContactId?: string;
    cleanStatus?: string;
    individualId?: string;
    level?: string;
    languages?: string[];
}

export function unifyContact(contact: any): UnifiedContact {
    const unifiedContact = {
        id: contact.id || contact.ContactID || contact.contact_id,
        name: contact.Name,
        isDeleted: contact.isDeleted || false,
        firstName: contact.firstName || contact.firstname || contact.FirstName || contact.First_Name,
        lastName: contact.lastName || contact.lastname || contact.LastName || contact.Last_Name,
        email: contact.email || contact.emailaddress || '',
        phone: contact.phone || contact.phone_number || '',
        address: contact.address || contact.address1 || '',
        city: contact.city || contact.city_name || '',
        state: contact.state || contact.state_name || '',
        country: contact.country || contact.country_name || '',
        zip: contact.zip || contact.postalcode || '',
        createdAt: contact.createdAt || contact.created_time || '',
        updatedAt: contact.updatedAt || contact.last_modified_time || '',
        source: contact.source || '',
        description: contact.description || '',
        owner: contact.owner || contact.owner_name || '',
        accountId: contact.accountId,
        ownerId: contact.ownerId,
        createdDate: contact.createdDate,
        createdById: contact.createdById,
        lastModifiedDate: contact.lastModifiedDate,
        lastModifiedById: contact.lastModifiedById,
        systemModstamp: contact.systemModstamp,
    };

    return unifiedContact;
}
// TODO: Make the transformation per field
export function disunifyContact(contact: UnifiedContact, integrationId: string): any {
    if (integrationId === 'sfdc') {
        return contact;
    } else if (integrationId === 'hubspot') {
        return contact;
    } else if (integrationId === 'zohocrm') {
        return contact;
    }
}
