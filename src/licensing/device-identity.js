"use strict";

const DEVICE_TOKEN_STORAGE_KEY =
    "himanshuXLTools.deviceToken.v1";

const DEVICE_TOKEN_PREFIX = "HXLDEV";

function normalizeStoredDeviceToken(value) {
    return typeof value === "string"
        ? value.trim()
        : "";
}

function isValidDeviceToken(value) {
    const token = normalizeStoredDeviceToken(value);

    return /^HXLDEV-[A-F0-9]{32}$/.test(token);
}

function generateRandomHex(byteLength = 16) {
    if (
        !globalThis.crypto ||
        typeof globalThis.crypto.getRandomValues !== "function"
    ) {
        throw new Error("Secure random generator is unavailable.");
    }

    const bytes = new Uint8Array(byteLength);
    globalThis.crypto.getRandomValues(bytes);

    return Array.from(
        bytes,
        (byte) => byte.toString(16).padStart(2, "0")
    )
        .join("")
        .toUpperCase();
}

function createDeviceToken() {
    return `${DEVICE_TOKEN_PREFIX}-${generateRandomHex(16)}`;
}

function getOfficeRuntimeStorage() {
    if (
        typeof globalThis.OfficeRuntime !== "undefined" &&
        globalThis.OfficeRuntime &&
        globalThis.OfficeRuntime.storage &&
        typeof globalThis.OfficeRuntime.storage.getItem === "function" &&
        typeof globalThis.OfficeRuntime.storage.setItem === "function"
    ) {
        return globalThis.OfficeRuntime.storage;
    }

    return null;
}

function getLocalStorage() {
    try {
        if (
            typeof globalThis.localStorage !== "undefined" &&
            globalThis.localStorage &&
            typeof globalThis.localStorage.getItem === "function" &&
            typeof globalThis.localStorage.setItem === "function"
        ) {
            return globalThis.localStorage;
        }
    } catch (_) {
        return null;
    }

    return null;
}

async function readStoredDeviceToken() {
    const officeStorage = getOfficeRuntimeStorage();

    if (officeStorage) {
        try {
            const value =
                await officeStorage.getItem(
                    DEVICE_TOKEN_STORAGE_KEY
                );

            if (isValidDeviceToken(value)) {
                return {
                    token: normalizeStoredDeviceToken(value),
                    storage: "OfficeRuntime.storage"
                };
            }
        } catch (_) {
            // Fall through to localStorage.
        }
    }

    const localStorage = getLocalStorage();

    if (localStorage) {
        try {
            const value =
                localStorage.getItem(
                    DEVICE_TOKEN_STORAGE_KEY
                );

            if (isValidDeviceToken(value)) {
                return {
                    token: normalizeStoredDeviceToken(value),
                    storage: "localStorage"
                };
            }
        } catch (_) {
            // No usable local storage.
        }
    }

    return null;
}

async function persistDeviceToken(token) {
    if (!isValidDeviceToken(token)) {
        throw new Error("Invalid device token.");
    }

    const normalized =
        normalizeStoredDeviceToken(token);

    const officeStorage = getOfficeRuntimeStorage();

    if (officeStorage) {
        try {
            await officeStorage.setItem(
                DEVICE_TOKEN_STORAGE_KEY,
                normalized
            );

            return {
                token: normalized,
                storage: "OfficeRuntime.storage"
            };
        } catch (_) {
            // Fall through to localStorage.
        }
    }

    const localStorage = getLocalStorage();

    if (localStorage) {
        localStorage.setItem(
            DEVICE_TOKEN_STORAGE_KEY,
            normalized
        );

        return {
            token: normalized,
            storage: "localStorage"
        };
    }

    throw new Error(
        "No persistent device-token storage is available."
    );
}

async function getOrCreateDeviceIdentity() {
    const existing =
        await readStoredDeviceToken();

    if (existing) {
        return {
            deviceToken: existing.token,
            storage: existing.storage,
            created: false
        };
    }

    const token = createDeviceToken();
    const saved = await persistDeviceToken(token);

    return {
        deviceToken: saved.token,
        storage: saved.storage,
        created: true
    };
}

export {
    DEVICE_TOKEN_STORAGE_KEY,
    DEVICE_TOKEN_PREFIX,
    normalizeStoredDeviceToken,
    isValidDeviceToken,
    generateRandomHex,
    createDeviceToken,
    getOfficeRuntimeStorage,
    getLocalStorage,
    readStoredDeviceToken,
    persistDeviceToken,
    getOrCreateDeviceIdentity
};
