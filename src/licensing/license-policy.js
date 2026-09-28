"use strict";

const PLAN_POLICIES = Object.freeze({
    STANDARD: Object.freeze({
        code: "STANDARD",
        maxDevices: 1,
        offlineGraceDays: 7
    }),

    PRO: Object.freeze({
        code: "PRO",
        maxDevices: 1,
        offlineGraceDays: 7
    }),

    BUSINESS: Object.freeze({
        code: "BUSINESS",
        maxDevices: 1,
        offlineGraceDays: 7
    })
});

function normalizePlanCode(value) {
    if (typeof value !== "string" || !value.trim()) {
        return "STANDARD";
    }

    return value.trim().toUpperCase();
}

function getPlanPolicy(value) {
    const code = normalizePlanCode(value);
    const policy = PLAN_POLICIES[code];

    if (!policy) {
        throw new Error(`Unsupported plan code: ${code}`);
    }

    return policy;
}

function validateExpiryDate(value, now = new Date()) {
    if (typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error(
            "Expiry date must use YYYY-MM-DD format."
        );
    }

    const expiry = new Date(`${value}T23:59:59.999Z`);

    if (
        Number.isNaN(expiry.getTime()) ||
        expiry.toISOString().slice(0, 10) !== value
    ) {
        throw new Error("Invalid expiry date.");
    }

    if (expiry.getTime() <= now.getTime()) {
        throw new Error("Expiry date must be in the future.");
    }

    return value;
}

function createLicensePolicyAssignment(options = {}) {
    const policy = getPlanPolicy(options.planCode);

    const expiryDate = validateExpiryDate(
        options.expiryDate,
        options.now instanceof Date
            ? options.now
            : new Date()
    );

    return {
        plan_code: policy.code,
        status: "PENDING",
        max_devices: policy.maxDevices,
        expiry_date: expiryDate,
        offline_grace_days: policy.offlineGraceDays
    };
}

module.exports = {
    PLAN_POLICIES,
    normalizePlanCode,
    getPlanPolicy,
    validateExpiryDate,
    createLicensePolicyAssignment
};
