"use strict";

const {
    generateUniqueLicenseIdentity
} = require("./license-collision-guard");

const {
    createLicensePolicyAssignment
} = require("./license-policy");

function normalizeCustomerId(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().toUpperCase();
}

function createAdminLicensePackage(options = {}) {
    const customerId = normalizeCustomerId(options.customerId);

    if (!customerId) {
        throw new Error("Customer ID is required.");
    }

    const policy = createLicensePolicyAssignment({
        planCode: options.planCode,
        expiryDate: options.expiryDate,
        now: options.now
    });

    const identity = generateUniqueLicenseIdentity({
        existingLicenseIds: options.existingLicenseIds,
        existingKeyHashes: options.existingKeyHashes
    });

    const databaseRecord = {
        license_id: identity.licenseId,
        customer_id: customerId,
        license_key_hash: identity.licenseKeyHash,
        license_key_last4: identity.licenseKeyLast4,
        plan_code: policy.plan_code,
        status: policy.status,
        max_devices: policy.max_devices,
        activation_date: null,
        expiry_date: policy.expiry_date,
        update_entitlement_until: null,
        offline_grace_days: policy.offline_grace_days
    };

    return {
        customerDelivery: {
            licenseKey: identity.licenseKey,
            licenseId: identity.licenseId,
            planCode: policy.plan_code,
            expiryDate: policy.expiry_date,
            maxDevices: policy.max_devices
        },

        databaseRecord,

        generationAttempts: identity.attempts
    };
}

function printAdminLicensePackage(result) {
    console.log("========================================");
    console.log("HIMANSHU XL TOOLS - LICENSE CREATED");
    console.log("========================================");
    console.log("License ID :", result.customerDelivery.licenseId);
    console.log("License Key:", result.customerDelivery.licenseKey);
    console.log("Plan       :", result.customerDelivery.planCode);
    console.log("Expiry     :", result.customerDelivery.expiryDate);
    console.log("Devices    :", result.customerDelivery.maxDevices);
    console.log("========================================");
}

module.exports = {
    normalizeCustomerId,
    createAdminLicensePackage,
    printAdminLicensePackage
};
