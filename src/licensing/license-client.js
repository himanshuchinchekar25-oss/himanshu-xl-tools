"use strict";

const LICENSE_API_BASE_URL =
    "https://himanshu-xl-tools-license-api.himanshuchinchekar25.workers.dev";

const LICENSE_API_TIMEOUT_MS = 15000;

function normalizeLicenseKey(value) {
    return typeof value === "string"
        ? value.trim().toUpperCase()
        : "";
}

function normalizeDeviceToken(value) {
    return typeof value === "string"
        ? value.trim()
        : "";
}

function normalizeOptionalString(value) {
    const normalized =
        typeof value === "string"
            ? value.trim()
            : "";

    return normalized || null;
}

function createLicenseClientError(
    message,
    reasonCode,
    status = 0
) {
    const error = new Error(message);

    error.name = "LicenseClientError";
    error.reasonCode =
        reasonCode || "LICENSE_API_ERROR";
    error.status = Number(status) || 0;

    return error;
}

function validateActivationInput(input) {
    const value =
        input && typeof input === "object"
            ? input
            : {};

    const licenseKey =
        normalizeLicenseKey(value.licenseKey);

    const deviceToken =
        normalizeDeviceToken(value.deviceToken);

    const appVersion =
        normalizeOptionalString(value.appVersion);

    if (!licenseKey) {
        throw createLicenseClientError(
            "License key is required.",
            "LICENSE_KEY_REQUIRED"
        );
    }

    if (!deviceToken) {
        throw createLicenseClientError(
            "Device token is required.",
            "DEVICE_TOKEN_REQUIRED"
        );
    }

    if (!appVersion) {
        throw createLicenseClientError(
            "App version is required.",
            "APP_VERSION_REQUIRED"
        );
    }

    return {
        licenseKey,
        deviceToken,
        deviceName:
            normalizeOptionalString(value.deviceName),
        platform:
            normalizeOptionalString(value.platform),
        appVersion
    };
}

function sanitizeActivationResponse(body) {
    const value =
        body && typeof body === "object"
            ? body
            : {};

    return {
        success: value.success === true,
        status:
            normalizeOptionalString(value.status),
        licenseId:
            normalizeOptionalString(value.licenseId),
        planCode:
            normalizeOptionalString(value.planCode),
        expiryDate:
            normalizeOptionalString(value.expiryDate),
        deviceId:
            normalizeOptionalString(value.deviceId),
        offlineGraceDays:
            Number.isFinite(Number(value.offlineGraceDays))
                ? Number(value.offlineGraceDays)
                : null,
        reasonCode:
            normalizeOptionalString(value.reasonCode),
        requestId:
            normalizeOptionalString(value.requestId)
    };
}

async function activateLicense(
    input,
    options = {}
) {
    const payload =
        validateActivationInput(input);

    const fetchImpl =
        options.fetchImpl ||
        globalThis.fetch;

    if (typeof fetchImpl !== "function") {
        throw createLicenseClientError(
            "Network API is unavailable.",
            "NETWORK_API_UNAVAILABLE"
        );
    }

    const timeoutMs =
        Number.isFinite(Number(options.timeoutMs)) &&
        Number(options.timeoutMs) > 0
            ? Number(options.timeoutMs)
            : LICENSE_API_TIMEOUT_MS;

    const controller =
        typeof AbortController !== "undefined"
            ? new AbortController()
            : null;

    const timer =
        controller
            ? setTimeout(
                () => controller.abort(),
                timeoutMs
            )
            : null;

    let response;

    try {
        response = await fetchImpl(
            `${LICENSE_API_BASE_URL}/activate`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload),
                cache: "no-store",
                signal:
                    controller
                        ? controller.signal
                        : undefined
            }
        );
    } catch (error) {

        if (
            error &&
            (
                error.name === "AbortError" ||
                (
                    controller &&
                    controller.signal.aborted
                )
            )
        ) {
            throw createLicenseClientError(
                "License API request timed out.",
                "LICENSE_API_TIMEOUT"
            );
        }

        throw createLicenseClientError(
            "Unable to reach License API.",
            "LICENSE_API_UNREACHABLE"
        );
    } finally {
        if (timer) {
            clearTimeout(timer);
        }
    }

    let body = {};

    try {
        body = await response.json();
    } catch (_) {
        body = {};
    }

    const safe =
        sanitizeActivationResponse(body);

    if (!response.ok || safe.success !== true) {
        throw createLicenseClientError(
            "License activation was not accepted.",
            safe.reasonCode ||
                "LICENSE_ACTIVATION_DENIED",
            response.status
        );
    }

    return safe;
}


async function validateStoredLicense(
    input,
    options = {}
) {
    const value =
        input && typeof input === "object"
            ? input
            : {};

    const licenseId =
        typeof value.licenseId === "string"
            ? value.licenseId.trim()
            : "";

    const deviceToken =
        typeof value.deviceToken === "string"
            ? value.deviceToken.trim()
            : "";

    const appVersion =
        typeof value.appVersion === "string"
            ? value.appVersion.trim()
            : "";

    if (!licenseId || !deviceToken) {
        const error =
            new Error("Runtime license validation input is incomplete.");

        error.reasonCode =
            !licenseId
                ? "LICENSE_ID_REQUIRED"
                : "DEVICE_TOKEN_REQUIRED";

        throw error;
    }

    const timeoutMs =
        Number.isFinite(Number(options.timeoutMs))
            ? Math.max(1, Number(options.timeoutMs))
            : LICENSE_API_TIMEOUT_MS;

    const controller =
        typeof AbortController !== "undefined"
            ? new AbortController()
            : null;

    const timer =
        controller
            ? setTimeout(
                () => controller.abort(),
                timeoutMs
            )
            : null;

    let response;

    try {
        response = await fetch(
            `${LICENSE_API_BASE_URL}/runtime/validate`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                },
                cache: "no-store",
                body: JSON.stringify({
                    licenseId,
                    deviceToken,
                    appVersion
                }),
                signal:
                    controller
                        ? controller.signal
                        : undefined
            }
        );
    } catch (error) {
        const wrapped =
            new Error(
                error && error.name === "AbortError"
                    ? "License API request timed out."
                    : "License API is unreachable."
            );

        wrapped.reasonCode =
            error && error.name === "AbortError"
                ? "LICENSE_API_TIMEOUT"
                : "LICENSE_API_UNREACHABLE";

        throw wrapped;
    } finally {
        if (timer) {
            clearTimeout(timer);
        }
    }

    let body = {};

    try {
        body = await response.json();
    } catch (_) {}

    if (!response.ok || body.success !== true) {
        const error =
            new Error(
                body && body.reasonCode
                    ? body.reasonCode
                    : "RUNTIME_LICENSE_VALIDATION_DENIED"
            );

        error.reasonCode =
            body && body.reasonCode
                ? body.reasonCode
                : "RUNTIME_LICENSE_VALIDATION_DENIED";

        error.httpStatus = response.status;

        throw error;
    }

    return {
        success: true,
        status: body.status,
        licenseId: body.licenseId,
        planCode: body.planCode || null,
        expiryDate: body.expiryDate || null,
        deviceId: body.deviceId,
        offlineGraceDays:
            Number(body.offlineGraceDays) || 0,
        reasonCode:
            body.reasonCode ||
            "RUNTIME_VALIDATION_SUCCESS"
    };
}

export {
    LICENSE_API_BASE_URL,
    LICENSE_API_TIMEOUT_MS,
    normalizeLicenseKey,
    normalizeDeviceToken,
    normalizeOptionalString,
    createLicenseClientError,
    validateActivationInput,
    sanitizeActivationResponse,
    activateLicense,
    validateStoredLicense
};

