"use strict";

const LICENSE_STATE_STORAGE_KEY =
    "himanshuXLTools.licenseState.v1";

const LICENSE_STATE_VERSION = 1;

function normalizeString(value) {
    return typeof value === "string"
        ? value.trim()
        : "";
}

function getOfficeStorage() {
    if (
        globalThis.OfficeRuntime &&
        globalThis.OfficeRuntime.storage &&
        typeof globalThis.OfficeRuntime.storage.getItem === "function" &&
        typeof globalThis.OfficeRuntime.storage.setItem === "function"
    ) {
        return globalThis.OfficeRuntime.storage;
    }

    return null;
}

function getBrowserStorage() {
    try {
        if (
            globalThis.localStorage &&
            typeof globalThis.localStorage.getItem === "function" &&
            typeof globalThis.localStorage.setItem === "function"
        ) {
            return globalThis.localStorage;
        }
    } catch (_) {}

    return null;
}

function createSafeLicenseState(response, validatedAt = new Date()) {
    const value =
        response && typeof response === "object"
            ? response
            : {};

    if (
        value.success !== true ||
        !normalizeString(value.licenseId) ||
        !normalizeString(value.deviceId)
    ) {
        throw new Error("Valid activated license response is required.");
    }

    const date =
        validatedAt instanceof Date
            ? validatedAt
            : new Date(validatedAt);

    if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid validation timestamp.");
    }

    return {
        version: LICENSE_STATE_VERSION,
        status: normalizeString(value.status) || "ACTIVE",
        licenseId: normalizeString(value.licenseId),
        deviceId: normalizeString(value.deviceId),
        deviceTokenHash: normalizeString(value.deviceTokenHash).toLowerCase(),
        planCode: normalizeString(value.planCode) || null,
        expiryDate: normalizeString(value.expiryDate) || null,
        offlineGraceDays:
            Number.isFinite(Number(value.offlineGraceDays))
                ? Math.max(0, Number(value.offlineGraceDays))
                : 0,
        lastReasonCode:
            normalizeString(value.reasonCode) || null,
        lastValidatedAt: date.toISOString()
    };
}

function isSafeLicenseState(value) {
    return Boolean(
        value &&
        typeof value === "object" &&
        value.version === LICENSE_STATE_VERSION &&
        normalizeString(value.licenseId) &&
        normalizeString(value.deviceId) &&
        /^[a-f0-9]{64}$/i.test(normalizeString(value.deviceTokenHash)) &&
        normalizeString(value.lastValidatedAt)
    );
}

async function writeStateToStorage(storage, state) {
    const serialized = JSON.stringify(state);

    if (
        storage &&
        typeof storage.setItem === "function"
    ) {
        await storage.setItem(
            LICENSE_STATE_STORAGE_KEY,
            serialized
        );

        return true;
    }

    return false;
}

async function saveLicenseState(state) {
    if (!isSafeLicenseState(state)) {
        throw new Error("Invalid local license state.");
    }

    const officeStorage = getOfficeStorage();

    if (officeStorage) {
        try {
            if (
                await writeStateToStorage(
                    officeStorage,
                    state
                )
            ) {
                return "OfficeRuntime.storage";
            }
        } catch (_) {}
    }

    const browserStorage = getBrowserStorage();

    if (browserStorage) {
        await writeStateToStorage(
            browserStorage,
            state
        );

        return "localStorage";
    }

    throw new Error(
        "No persistent license-state storage is available."
    );
}

async function readStateFromStorage(storage) {
    if (
        !storage ||
        typeof storage.getItem !== "function"
    ) {
        return null;
    }

    const raw =
        await storage.getItem(
            LICENSE_STATE_STORAGE_KEY
        );

    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw);

        return isSafeLicenseState(parsed)
            ? parsed
            : null;
    } catch (_) {
        return null;
    }
}

async function loadLicenseState() {
    const officeStorage = getOfficeStorage();

    if (officeStorage) {
        try {
            const state =
                await readStateFromStorage(
                    officeStorage
                );

            if (state) {
                return {
                    state,
                    storage: "OfficeRuntime.storage"
                };
            }
        } catch (_) {}
    }

    const browserStorage = getBrowserStorage();

    if (browserStorage) {
        const state =
            await readStateFromStorage(
                browserStorage
            );

        if (state) {
            return {
                state,
                storage: "localStorage"
            };
        }
    }

    return null;
}

function calculateOfflineGrace(state, now = new Date()) {
    if (!isSafeLicenseState(state)) {
        return {
            allowed: false,
            reasonCode: "NO_VALID_LICENSE_STATE",
            remainingMs: 0
        };
    }

    const current =
        now instanceof Date
            ? now
            : new Date(now);

    const validated =
        new Date(state.lastValidatedAt);

    if (
        Number.isNaN(current.getTime()) ||
        Number.isNaN(validated.getTime())
    ) {
        return {
            allowed: false,
            reasonCode: "INVALID_LICENSE_TIME",
            remainingMs: 0
        };
    }

    const graceMs =
        Math.max(
            0,
            Number(state.offlineGraceDays) || 0
        ) *
        24 * 60 * 60 * 1000;

    const elapsed =
        Math.max(
            0,
            current.getTime() -
            validated.getTime()
        );

    const remainingMs =
        Math.max(0, graceMs - elapsed);

    return {
        allowed: elapsed <= graceMs,
        reasonCode:
            elapsed <= graceMs
                ? "OFFLINE_GRACE_VALID"
                : "OFFLINE_GRACE_EXPIRED",
        remainingMs
    };
}


async function clearLicenseState() {
    let cleared = false;

    const officeStorage = getOfficeStorage();

    if (
        officeStorage &&
        typeof officeStorage.removeItem === "function"
    ) {
        try {
            await officeStorage.removeItem(
                LICENSE_STATE_STORAGE_KEY
            );

            cleared = true;
        } catch (_) {}
    }

    const browserStorage = getBrowserStorage();

    if (
        browserStorage &&
        typeof browserStorage.removeItem === "function"
    ) {
        try {
            browserStorage.removeItem(
                LICENSE_STATE_STORAGE_KEY
            );

            cleared = true;
        } catch (_) {}
    }

    return cleared;
}
export {
    LICENSE_STATE_STORAGE_KEY,
    LICENSE_STATE_VERSION,
    createSafeLicenseState,
    isSafeLicenseState,
    saveLicenseState,
    clearLicenseState,
    loadLicenseState,
    calculateOfflineGrace
};


