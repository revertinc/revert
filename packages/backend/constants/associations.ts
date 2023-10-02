import { Subtype } from "./typeHelpers";

export type AllAssociation = 'contactId' | 'companyId' | 'leadId' | 'dealId' | 'noteId';

export type CompanyAssociation = Subtype<AllAssociation, 'dealId'>;

export type ContactAssociation = Subtype<AllAssociation, 'dealId'>;

export type DealAssociation = Subtype<AllAssociation, 'contactId' | 'companyId'>;

export type EventAssociation = Subtype<AllAssociation, 'dealId' | 'contactId'>;

export type LeadAssociation = Subtype<AllAssociation, 'contactId' | 'companyId' | 'dealId'>;

export type NoteAssociation = Subtype<AllAssociation, 'contactId' | 'companyId' | 'leadId' | 'dealId'>;

export type TaskAssociation = Subtype<AllAssociation, 'dealId'>;

export type UserAssociation = Subtype<AllAssociation, 'dealId'>;
