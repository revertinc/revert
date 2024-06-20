import { UnifiedDepartment } from './department';
import { Opening } from './offer';

export interface UnifiedJob {
    id: string;
    name: string;
    requisition_id: string;
    notes: string;
    confidential: boolean;
    status: string;
    created_at: Date;
    opened_at: Date;
    closed_at: Date;
    updated_at: Date;
    is_template: boolean | null;
    copied_from_id: string | null;
    departments: UnifiedDepartment[];
    offices: Office[];
    openings: Opening[];
    hiring_team: HiringTeam;
    additional: any;
}
interface Office {
    id: string;
    name: string;
    location: {
        name: string;
    };
    parent_id: string;
    child_ids: string[] | null;
    external_id: string;
}
interface HiringTeam {
    hiring_managers: HiringTeamInstance[];
    recruiters: HiringTeamInstance[];
    coordinators: HiringTeamInstance[];
    sourcers: HiringTeamInstance[];
}
interface HiringTeamInstance {
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    employee_id: string;
    responsible: boolean;
}
