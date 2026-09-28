"use strict";

const {
    generateLicenseKey,
    generateLicenseId,
    hashLicenseKey,
    getLicenseKeyLast4
} = require("./license-key-generator");

const ALLOWED_PLANS = new Set([
    "STANDARD",
    "PRO",
    "BUSINESS"
]);

function normalizeCustomerId(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().toUpperCase();
}

function normalizePlanCode(value) {
    if (typeof value !== "string" || !value.trim()) {
        return "STANDARD";
    }

    return value.trim().toUpperCase();
}

function normalizeExpiryDate(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    if (typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error("Expiry date must use YYYY-MM-DD format.");
    }

    const parsed = new Date(`${value}T00:00:00Z`);

    if (
        Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== value
    ) {
        throw new Error("Invalid expiry date.");
    }

    return value;
}

function createLicenseForCustomer(options = {}) {
    const customerId = normalizeCustomerId(options.customerId);

    if (!customerId) {
        throw new Error("Customer ID is required.");
    }

    const planCode = normalizePlanCode(options.planCode);

    if (!ALLOWED_PLANS.has(planCode)) {
        throw new Error(`Unsupported plan code: ${planCode}`);
    }

    const expiryDate = normalizeExpiryDate(options.expiryDate);

    const maxDevices =
        options.maxDevices === undefined
            ? 1
            : Number(options.maxDevices);

    if (!Number.isInteger(maxDevices) || maxDevices !== 1) {
        throw new Error(
            "Current licensing policy requires exactly 1 active device."
        );
    }

    const rawLicenseKey = generateLicenseKey();
    const licenseId = generateLicenseId();

    const databaseRecord = {
        license_id: licenseId,
        customer_id: customerId,
        license_key_hash: hashLicenseKey(rawLicenseKey),
        license_key_last4: getLicenseKeyLast4(rawLicenseKey),
        plan_code: planCode,
        status: "PENDING",
        max_devices: 1,
        activation_date: null,
        expiry_date: expiryDate,
        update_entitlement_until: null,
        offline_grace_days: 7
    };

    return {
        licenseKey: rawLicenseKey,
        databaseRecord
    };
}

module.exports = {
    ALLOWED_PLANS,
    normalizeCustomerId,
    normalizePlanCode,
    normalizeExpiryDate,
    createLicenseForCustomer
};
