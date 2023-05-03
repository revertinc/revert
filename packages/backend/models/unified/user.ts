export interface UnifiedUser {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    id: string;
    remoteId: string;
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: any; // TODO: Support associations
    additional?: any; // TODO: Handle additional fields
}

export function unifyUser(user: any): UnifiedUser {
    const unifiedUser: UnifiedUser = {
        remoteId: user.id || user.Id,
        id: user.id || user.Id,
        createdTimestamp: user.createdDate || user.CreatedDate || user.Created_Time || user.hs_timestamp,
        updatedTimestamp: user.lastModifiedDate || user.LastModifiedDate || user.Modified_Time,
        firstName: user.firstName || user.First_Name || user.FirstName,
        lastName: user.lastName || user.Last_Name || user.LastName,
        phone: user.phone || user.phone_number || '',
        email: user.email || user.Email,
    };

    // Map additional fields
    Object.keys(user).forEach((key) => {
        if (!(key in unifiedUser)) {
            unifiedUser['additional'][key] = user[key];
        }
    });

    return unifiedUser;
}
