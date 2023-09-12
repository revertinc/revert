import crypto from 'crypto';

const CIPHER_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const ITERATIONS = 10000;

const tagPosition = SALT_LENGTH + IV_LENGTH;
const encryptedPosition = tagPosition + TAG_LENGTH;

const getKey = (salt: Buffer, secret: string) => {
    return crypto.pbkdf2Sync(secret, salt, ITERATIONS, 32, 'sha256');
};

const gcm = {
    encrypt: (input: string, secret: string) => {
        const iv = crypto.randomBytes(IV_LENGTH);
        const salt = crypto.randomBytes(SALT_LENGTH);

        const AES_KEY = getKey(salt, secret);

        const cipher = crypto.createCipheriv(CIPHER_ALGORITHM, AES_KEY, iv);
        const encrypted = Buffer.concat([cipher.update(String(input), 'utf8'), cipher.final()]);

        const tag = cipher.getAuthTag();

        return Buffer.concat([salt, iv, tag, encrypted]).toString('hex');
    },

    decrypt: (input: string, secret: string) => {
        const inputValue = Buffer.from(String(input), 'hex');
        const salt = inputValue.subarray(0, SALT_LENGTH);
        const iv = inputValue.subarray(SALT_LENGTH, tagPosition);
        const tag = inputValue.subarray(tagPosition, encryptedPosition);
        const encrypted = inputValue.subarray(encryptedPosition);

        const key = getKey(salt, secret);

        const decipher = crypto.createDecipheriv(CIPHER_ALGORITHM, key, iv);

        decipher.setAuthTag(tag);

        return decipher.update(encrypted) + decipher.final('utf8');
    },
};

export default gcm;
