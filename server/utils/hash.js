import crypto from 'crypto'

// Hash a given password and return the derived key along with the salt
export const hashPassword = async (password) => {
    if (typeof password !== 'string' || password.length < 1 || password.length > 1024) {
        throw new TypeError('Password must be a string between 1 and 1024 characters long')
    }
    const salt = crypto.randomBytes(16); // Generate a binary salt
    const derivedKey = await new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, key) => {
            if (err) reject(err);
            resolve(key);
        });
    });
    return { salt, hash: derivedKey };
}

// Verify a password against the provided hash and salt
export const verifyPassword = async (password, hash, salt) => {
    if (typeof password !== 'string' || !Buffer.isBuffer(hash) || hash.length !== 64 ||
        !Buffer.isBuffer(salt) || salt.length !== 16 || password.length > 1024) return false
    const derivedKey = await new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, key) => {
            if (err) reject(err);
            resolve(key);
        });
    });
    return crypto.timingSafeEqual(derivedKey, hash);
}
