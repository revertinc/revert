export interface UnifiedDepartment {
    id: string;
    name: string;
    parent_id: string;
    parent_department_external_ids: string;
    child_ids: number[];
    child_department_external_ids: string[];
    external_id: string;
    additional: any;
}
