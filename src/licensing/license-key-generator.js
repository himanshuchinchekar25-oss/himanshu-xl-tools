"use strict";

const crypto = require("crypto");

const LICENSE_PREFIX = "HXL";
const LICENSE_ID_PREFIX = "LIC";

const GROUP_COUNT = 4;
const GROUP_LENGTH = 4;

const LICENSE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function secureRandomCharacter() {
    const alphabetLength = LICENSE_ALPHABET.length;
    const maxValidByte = 256 - (256 % alphabetLength);

    while (true) {
        const value = crypto.randomBytes(1)[0];

        if (value < maxValidByte) {
            return LICENSE_ALPHABET[value % alphabetLength];
        }
    }
}

function generateRandomCharacters(length) {
    let value = "";

    for (let i = 0; i < length; i += 1) {
        value += secureRandomCharacter();
    }

    return value;
}

function generateGroup(length = GROUP_LENGTH) {
    return generateRandomCharacters(length);
}

function generateLicenseKey() {
    const groups = [];

    for (let i = 0; i < GROUP_COUNT; i += 1) {
        groups.push(generateGroup());
    }

    return `${LICENSE_PREFIX}-${groups.join("-")}`;
}

function normalizeLicenseKey(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().toUpperCase();
}

function isValidLicenseKeyFormat(value) {
    const normalized = normalizeLicenseKey(value);

    const escapedAlphabet = LICENSE_ALPHABET.replace(
        /[-/\\^$*+?.()|[\]{}]/g,
        "\\$&"
    );

    const pattern = new RegExp(
        `^${LICENSE_PREFIX}(?:-[${escapedAlphabet}]{${GROUP_LENGTH}}){${GROUP_COUNT}}$`
    );

    return pattern.test(normalized);
}

function getUtcDateStamp(date = new Date()) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    return `${year}${month}${day}`;
}

function generateLicenseId(date = new Date()) {
    const dateStamp = getUtcDateStamp(date);
    const randomPart = generateRandomCharacters(8);

    return `${LICENSE_ID_PREFIX}-${dateStamp}-${randomPart}`;
}

function isValidLicenseIdFormat(value) {
    if (typeof value !== "string") {
        return false;
    }

    const pattern = /^LIC-\d{8}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/;

    return pattern.test(value.trim().toUpperCase());
}

module.exports = {
    LICENSE_PREFIX,
    LICENSE_ID_PREFIX,
    LICENSE_ALPHABET,
    GROUP_COUNT,
    GROUP_LENGTH,
    generateLicenseKey,
    generateLicenseId,
    normalizeLicenseKey,
    isValidLicenseKeyFormat,
    isValidLicenseIdFormat
};

function hashLicenseKey(value) {
    const normalized = normalizeLicenseKey(value);

    if (!isValidLicenseKeyFormat(normalized)) {
        throw new Error("Invalid license key format.");
    }

    return crypto
        .createHash("sha256")
        .update(normalized, "utf8")
        .digest("hex");
}

function getLicenseKeyLast4(value) {
    const normalized = normalizeLicenseKey(value);

    if (!isValidLicenseKeyFormat(normalized)) {
        throw new Error("Invalid license key format.");
    }

    return normalized.slice(-4);
}

function verifyLicenseKey(value, expectedHash) {
    if (typeof expectedHash !== "string" || !/^[a-f0-9]{64}$/i.test(expectedHash)) {
        return false;
    }

    let actualHash;

    try {
        actualHash = hashLicenseKey(value);
    }
    catch {
        return false;
    }

    const actualBuffer = Buffer.from(actualHash, "hex");
    const expectedBuffer = Buffer.from(expectedHash.toLowerCase(), "hex");

    return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

module.exports.hashLicenseKey = hashLicenseKey;
module.exports.getLicenseKeyLast4 = getLicenseKeyLast4;
module.exports.verifyLicenseKey = verifyLicenseKey;
