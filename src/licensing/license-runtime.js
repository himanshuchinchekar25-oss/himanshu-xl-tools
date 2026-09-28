"use strict";

import {
    getOrCreateDeviceIdentity
} from "./device-identity.js";

import {
    activateLicense,
    validateStoredLicense
} from "./license-client.js";

import {
    createSafeLicenseState,
    saveLicenseState,
    loadLicenseState,
    clearLicenseState,
    calculateOfflineGrace
} from "./license-state.js";

const APP_VERSION = "1.0.0.7";

function normalizeLicenseKey(value) {
    return typeof value === "string"
        ? value.trim().toUpperCase()
        : "";
}

function getRuntimeDeviceName() {
    try {
        const platform =
            globalThis.navigator &&
            typeof globalThis.navigator.platform === "string"
                ? globalThis.navigator.platform.trim()
                : "";

        return platform || "Excel Device";
    } catch (_) {
        return "Excel Device";
    }
}

function getRuntimePlatform() {
    try {
        const platform =
            globalThis.navigator &&
            typeof globalThis.navigator.platform === "string"
                ? globalThis.navigator.platform.trim()
                : "";

        return platform || "Windows";
    } catch (_) {
        return "Windows";
    }
}

async function hashDeviceToken(deviceToken) {
    const token =
        typeof deviceToken === "string"
            ? deviceToken.trim()
            : "";

    if (!token) {
        throw new Error("Valid device token is required.");
    }

    if (
        !globalThis.crypto ||
        !globalThis.crypto.subtle ||
        typeof globalThis.crypto.subtle.digest !== "function"
    ) {
        throw new Error("SHA-256 device hashing is unavailable.");
    }

    const bytes =
        new TextEncoder().encode(token);

    const digest =
        await globalThis.crypto.subtle.digest(
            "SHA-256",
            bytes
        );

    return Array.from(new Uint8Array(digest))
        .map(byte =>
            byte.toString(16).padStart(2, "0")
        )
        .join("");
}

async function activateAndBindLicense(
    licenseKey,
    options = {}
) {
    const normalizedKey =
        normalizeLicenseKey(licenseKey);

    if (!normalizedKey) {
        return {
            allowed: false,
            mode: "DENIED",
            reasonCode: "LICENSE_KEY_REQUIRED"
        };
    }

    const getIdentity =
        options.getDeviceIdentity ||
        getOrCreateDeviceIdentity;

    const activate =
        options.activate ||
        activateLicense;

    const saveState =
        options.saveState ||
        saveLicenseState;

    const identity =
        await getIdentity();

    const response =
        await activate(
            {
                licenseKey: normalizedKey,
                deviceToken: identity.deviceToken,
                deviceName:
                    options.deviceName ||
                    getRuntimeDeviceName(),
                platform:
                    options.platform ||
                    getRuntimePlatform(),
                appVersion:
                    options.appVersion ||
                    APP_VERSION
            },
            options.clientOptions || {}
        );

    const deviceTokenHash =
        await hashDeviceToken(
            identity.deviceToken
        );

    const state =
        createSafeLicenseState(
            {
                ...response,
                deviceTokenHash
            },
            options.now || new Date()
        );

    const storage =
        await saveState(state);

    return {
        allowed: true,
        mode: "ONLINE",
        reasonCode: response.reasonCode,
        state,
        storage,
        deviceStorage: identity.storage
    };
}

async function validateRuntimeAccess(
    options = {}
) {
    const loadState =
        options.loadState ||
        loadLicenseState;

    const loaded =
        await loadState();

    if (!loaded || !loaded.state) {
        return {
            allowed: false,
            mode: "NO_LICENSE",
            reasonCode: "NO_VALID_LICENSE_STATE"
        };
    }

    const state = loaded.state;

    if (
        String(state.status || "").toUpperCase() !==
        "ACTIVE"
    ) {
        return {
            allowed: false,
            mode: "DENIED",
            reasonCode: "LICENSE_NOT_ACTIVE",
            state
        };
    }

    const now =
        options.now instanceof Date
            ? options.now
            : new Date();

    if (state.expiryDate) {
        const expiry =
            new Date(
                `${state.expiryDate}T23:59:59.999Z`
            );

        if (
            !Number.isNaN(expiry.getTime()) &&
            now.getTime() > expiry.getTime()
        ) {
            return {
                allowed: false,
                mode: "DENIED",
                reasonCode: "LICENSE_EXPIRED",
                state
            };
        }
    }

    const getIdentity =
        options.getDeviceIdentity ||
        getOrCreateDeviceIdentity;

    const validateOnline =
        options.validateOnline ||
        validateStoredLicense;

    const saveState =
        options.saveState ||
        saveLicenseState;

    const clearState =
        options.clearState ||
        clearLicenseState;

    try {
        const identity =
            await getIdentity();

        const response =
            await validateOnline(
                {
                    licenseId: state.licenseId,
                    deviceToken: identity.deviceToken,
                    appVersion:
                        options.appVersion ||
                        APP_VERSION
                },
                options.clientOptions || {}
            );

        // Preserve/recreate the safe device-token hash after online validation.
        // The runtime validation API does not return deviceTokenHash.
        const deviceTokenHash =
            await hashDeviceToken(
                identity.deviceToken
            );

        const refreshedState =
            createSafeLicenseState(
                {
                    ...response,
                    deviceTokenHash
                },
                now
            );

        const storage =
            await saveState(refreshedState);

        return {
            allowed: true,
            mode: "ONLINE",
            reasonCode:
                response.reasonCode ||
                "RUNTIME_VALIDATION_SUCCESS",
            state: refreshedState,
            storage,
            deviceStorage: identity.storage
        };
    } catch (error) {
        const reasonCode =
            error &&
            typeof error.reasonCode === "string"
                ? error.reasonCode
                : "RUNTIME_LICENSE_VALIDATION_FAILED";

        /*
           OFFLINE_GRACE is permitted ONLY when the API
           genuinely cannot be reached or the request times out.
        */
        if (
            reasonCode === "LICENSE_API_TIMEOUT" ||
            reasonCode === "LICENSE_API_UNREACHABLE"
        ) {
            const grace =
                calculateOfflineGrace(
                    state,
                    now
                );

            if (!grace.allowed) {
                return {
                    allowed: false,
                    mode: "DENIED",
                    reasonCode: grace.reasonCode,
                    state,
                    remainingMs: grace.remainingMs
                };
            }

            return {
                allowed: true,
                mode: "OFFLINE_GRACE",
                reasonCode: grace.reasonCode,
                state,
                storage: loaded.storage,
                remainingMs: grace.remainingMs
            };
        }

        /*
           These are authoritative server denials.
           Remove stale cached authorization immediately.
           Device identity itself is NOT cleared.
        */
        /*
           Customer lifecycle denial is authoritative, but reversible.

           Fail closed immediately and NEVER grant OFFLINE_GRACE.
           Preserve only the existing safe local license state so that
           Reactivate Customer -> Refresh License can validate the same
           licenseId/device again without requiring the raw license key.

           The saved state contains no raw license key or device token.
        */
        const recoverableCustomerDenials =
            new Set([
                "CUSTOMER_INACTIVE",
                "CUSTOMER_NOT_ACTIVE",
                "CUSTOMER_LIFECYCLE_INACTIVE"
            ]);

        if (recoverableCustomerDenials.has(reasonCode)) {
            return {
                allowed: false,
                mode: "DENIED",
                reasonCode,
                state
            };
        }

        /*
           Permanent/security-sensitive authoritative denials invalidate
           the cached license authorization and must clear local state.
        */
        const authoritativeDenials =
            new Set([
                "LICENSE_NOT_FOUND",
                "CUSTOMER_BLOCKED",
                "LICENSE_BLOCKED",
                "LICENSE_EXPIRED",
                "LICENSE_DEACTIVATED",
                "LICENSE_CANCELLED",
                "LICENSE_STATUS_NOT_ALLOWED",
                "LICENSE_NOT_ACTIVE",
                "DEVICE_NOT_ACTIVE",
                "DEVICE_TOKEN_INVALID"
            ]);

        if (authoritativeDenials.has(reasonCode)) {
            try {
                await clearState();
            } catch (_) {}

            return {
                allowed: false,
                mode: "DENIED",
                reasonCode
            };
        }

        /*
           Server responded with an unexpected/internal error:
           fail closed, but preserve local state for later retry.
           No OFFLINE_GRACE.
        */
        return {
            allowed: false,
            mode: "ERROR",
            reasonCode
        };
    }
}

async function getLicenseRuntimeStatus(
    options = {}
) {
    try {
        return await validateRuntimeAccess(options);
    } catch (error) {
        console.error(
            "[HXL License Runtime] getLicenseRuntimeStatus failed:",
            error
        );

        return {
            allowed: false,
            mode: "ERROR",
            reasonCode:
                error && typeof error.reasonCode === "string"
                    ? error.reasonCode
                    : "LICENSE_RUNTIME_ERROR"
        };
    }
}

export {
    APP_VERSION,
    normalizeLicenseKey,
    getRuntimeDeviceName,
    getRuntimePlatform,
    activateAndBindLicense,
    validateRuntimeAccess,
    getLicenseRuntimeStatus
};





