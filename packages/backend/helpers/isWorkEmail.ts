function isWorkEmail(email: string): boolean {
    const personalEmailProviders = [
        'gmail.com',
        'yahoo.com',
        'hotmail.com',
        'outlook.com',
        'aol.com',
        'icloud.com',
        'zoho.com',
        'protonmail.com',
        'mail.com',
        'yandex.com',
    ];

    const emailParts = email.split('@');
    if (emailParts.length !== 2) {
        return false;
    }
    const workEmailRegex = new RegExp(`^[A-Za-z0-9._%+-]+@(?!(${personalEmailProviders.join('|')})).*$`);

    return workEmailRegex.test(email);
}
export default isWorkEmail;
