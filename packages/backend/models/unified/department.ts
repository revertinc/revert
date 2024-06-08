export interface UnifiedDepartment {
    id: string;
    name: string;
    child_ids: string[];
    child_department_external_ids: string[];
    created_at: Date;
    modified_at: Date;
    parent_id: string;
    parent_department_external_id: string;
    additional: any;
}
