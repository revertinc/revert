export interface UnifiedVendor {
    id: string;
    domain: string;
    status?: 'deleted';
    metadata: {
        createTime: string;
        lastUpdatedTime: string;
    };
    displayName: string;
    printOnCheckName?: string;
    additional: any;
}
