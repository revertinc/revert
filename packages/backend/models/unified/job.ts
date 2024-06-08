import { UnifiedDepartment } from './department';

export interface UnifiedJob {
    id: string;
    created_at: Date;
    modified_at: Date;
    name: string;
    confidential: boolean;
    departments: UnifiedDepartment[];
    offices: {
        id: number;
        name: string;
        location: {
            name: string;
        };
        parent_id: number;
        child_ids: number[];
        external_id: string;
    }[];
    hiring_managers: {
        id: number;
        first_name: string;
        last_name: string;
        name: string;
        employee_id: string;
        responsible: boolean;
    }[];
    recruiters: {
        id: number;
        first_name: string;
        last_name: string;
        name: string;
        employee_id: string;
        responsible: boolean;
    }[];
    additional: any;
}
