export interface UnifiedExpense {
    id: string;
    domain: string;
    status?: 'deleted';
    metadata: {
        createTime: string;
        lastUpdatedTime: string;
    };
    accountRef: {
        value: string;
        name: string;
    };
    paymentMethodRef?: {
        value: string;
    };
    paymentType: string;
    entityRef?: {
        value: string;
        name: string;
        type?: string;
    };
    credit?: boolean;
    totalAmt: number;
    purchaseEx: {
        any: {
            name: string;
            declaredType: string;
            scope: string;
            value: {
                name: string;
                value: string;
            };
            nil: boolean;
            globalScope: boolean;
            typeSubstituted: boolean;
        }[];
    };
    sparse: boolean;
    syncToken: string;
    txnDate: string;
    currencyRef: {
        name: string;
        value: string;
    };
    privateNote: string;
    line: {
        id: string;
        description: string;
        amount: number;
        detailType: string;
        accountBasedExpenseLineDetail?: {
            accountRef: {
                value: string;
                name: string;
            };
            billableStatus: string;
            taxCodeRef: {
                value: string;
            };
            customerRef?: {
                value: string;
                name: string;
            };
        };
    }[];
    docNumber?: string;
    additional: any;
}
