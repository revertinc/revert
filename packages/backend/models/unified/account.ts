export interface UnifiedAccount {
    id: string;
    domain: string;
    status?: 'deleted';
    metadata: {
        createTime: string;
        lastUpdatedTime: string;
    };
    accountSubType: string;
    accountType: string;
    active: boolean;
    classification: string;
    currencyRef: {
        name: string;
        value: string;
    };
    currentBalance: number;
    currentBalanceWithSubAccounts: number;
    fullyQualifiedName: string;
    name: string;
    subAccount: boolean;
    syncToken: string;
    sparse: boolean;
    additional: any;
}
