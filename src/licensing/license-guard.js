"use strict";

import {
    getLicenseRuntimeStatus
} from "./license-runtime.js";


const LICENSE_ACCESS_ALLOWED =
    "LICENSE_ACCESS_ALLOWED";

const LICENSE_ACCESS_DENIED =
    "LICENSE_ACCESS_DENIED";


function normalizeReasonCode(value) {
    return typeof value === "string"
        ? value.trim().toUpperCase()
        : "";
}


function getLicenseAccessMessage(result) {
    const reason =
        normalizeReasonCode(
            result && result.reasonCode
        );

    switch (reason) {

        case "NO_VALID_LICENSE_STATE":
            return "Himanshu XL Tools requires activation.";

        case "LICENSE_EXPIRED":
            return "Your Himanshu XL Tools license has expired.";

        case "LICENSE_NOT_ACTIVE":
            return "Your Himanshu XL Tools license is not active.";

        case "OFFLINE_GRACE_EXPIRED":
            return "Internet connection is required to validate your license.";

        case "LICENSE_RUNTIME_ERROR":
            return "License validation could not be completed.";

        default:
            return "Himanshu XL Tools license validation is required.";
    }
}


async function checkLicenseAccess(options = {}) {

    const getStatus =
        options.getStatus ||
        getLicenseRuntimeStatus;

    try {

        const result =
            await getStatus(
                options.runtimeOptions || {}
            );

        if (
            result &&
            result.allowed === true
        ) {
            return {
                allowed: true,
                code: LICENSE_ACCESS_ALLOWED,
                mode: result.mode || "",
                reasonCode:
                    normalizeReasonCode(
                        result.reasonCode
                    ),
                message: "",
                state:
                    result.state || null
            };
        }

        return {
            allowed: false,
            code: LICENSE_ACCESS_DENIED,
            mode:
                result && result.mode
                    ? result.mode
                    : "DENIED",
            reasonCode:
                normalizeReasonCode(
                    result &&
                    result.reasonCode
                ) ||
                "LICENSE_ACCESS_DENIED",
            message:
                getLicenseAccessMessage(
                    result
                ),
            state:
                result &&
                result.state
                    ? result.state
                    : null
        };

    } catch (_) {

        return {
            allowed: false,
            code: LICENSE_ACCESS_DENIED,
            mode: "ERROR",
            reasonCode:
                "LICENSE_RUNTIME_ERROR",
            message:
                getLicenseAccessMessage({
                    reasonCode:
                        "LICENSE_RUNTIME_ERROR"
                }),
            state: null
        };
    }
}


async function requireLicenseAccess(options = {}) {

    const result =
        await checkLicenseAccess(options);

    if (!result.allowed) {

        if (
            typeof options.onDenied ===
            "function"
        ) {
            try {
                await options.onDenied(result);
            } catch (_) {
                // Denial handler must not bypass license protection.
            }
        }

        return result;
    }

    if (
        typeof options.onAllowed ===
        "function"
    ) {
        await options.onAllowed(result);
    }

    return result;
}


async function runWithLicenseAccess(
    action,
    options = {}
) {

    if (typeof action !== "function") {
        throw new TypeError(
            "Licensed action must be a function."
        );
    }

    const access =
        await requireLicenseAccess(options);

    if (!access.allowed) {
        return {
            executed: false,
            access
        };
    }

    const value =
        await action(access);

    return {
        executed: true,
        access,
        value
    };
}


export {
    LICENSE_ACCESS_ALLOWED,
    LICENSE_ACCESS_DENIED,
    normalizeReasonCode,
    getLicenseAccessMessage,
    checkLicenseAccess,
    requireLicenseAccess,
    runWithLicenseAccess
};
