"use strict";

const {
    generateLicenseKey,
    generateLicenseId,
    hashLicenseKey,
    getLicenseKeyLast4
} = require("./license-key-generator");

const DEFAULT_MAX_ATTEMPTS = 20;

function generateUniqueLicenseIdentity(options = {}) {
    const existingLicenseIds =
        options.existingLicenseIds instanceof Set
            ? options.existingLicenseIds
            : new Set(options.existingLicenseIds || []);

    const existingKeyHashes =
        options.existingKeyHashes instanceof Set
            ? options.existingKeyHashes
            : new Set(options.existingKeyHashes || []);

    const maxAttempts =
        Number.isInteger(options.maxAttempts) &&
        options.maxAttempts > 0
            ? options.maxAttempts
            : DEFAULT_MAX_ATTEMPTS;

    const generateId =
        typeof options.generateLicenseId === "function"
            ? options.generateLicenseId
            : generateLicenseId;

    const generateKey =
        typeof options.generateLicenseKey === "function"
            ? options.generateLicenseKey
            : generateLicenseKey;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const licenseId = generateId();
        const licenseKey = generateKey();
        const licenseKeyHash = hashLicenseKey(licenseKey);

        const idCollision = existingLicenseIds.has(licenseId);
        const keyCollision = existingKeyHashes.has(licenseKeyHash);

        if (!idCollision && !keyCollision) {
            return {
                licenseId,
                licenseKey,
                licenseKeyHash,
                licenseKeyLast4: getLicenseKeyLast4(licenseKey),
                attempts: attempt
            };
        }
    }

    throw new Error(
        `Unable to generate unique license identity after ${maxAttempts} attempts.`
    );
}

module.exports = {
    DEFAULT_MAX_ATTEMPTS,
    generateUniqueLicenseIdentity
};
