"use strict";

const API_NAME = "Himanshu XL Tools License API";
const API_VERSION = "1.0";

const LICENSE_KEY_PATTERN =
    /^HXL-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;

const MAX_LICENSE_KEY_LENGTH = 23;
const MAX_DEVICE_TOKEN_LENGTH = 256;
const MAX_DEVICE_NAME_LENGTH = 128;
const MAX_PLATFORM_LENGTH = 64;
const MAX_APP_VERSION_LENGTH = 32;

const PRODUCTION_APP_ORIGIN =
    "https://restless-shape-bea9.himanshuchinchekar25.workers.dev";

const ALLOWED_APP_ORIGINS = new Set([
    PRODUCTION_APP_ORIGIN
]);

function getCorsHeaders(request) {
    const origin =
        request && request.headers
            ? normalizeString(request.headers.get("origin"))
            : "";

    if (!ALLOWED_APP_ORIGINS.has(origin)) {
        return {
            "Vary": "Origin"
        };
    }

    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Cache-Control",
        "Vary": "Origin"
    };
}

function withCors(response, request) {
    const headers = new Headers(response.headers);
    const corsHeaders = getCorsHeaders(request);

    for (const [name, value] of Object.entries(corsHeaders)) {
        headers.set(name, value);
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
    });
}

function jsonResponse(body, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "no-referrer",
            "X-Frame-Options": "DENY",
            "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
            ...extraHeaders
        }
    });
}

function createRequestId() {
    return crypto.randomUUID();
}

function getSafePath(request) {
    try {
        return new URL(request.url).pathname;
    } catch {
        return "/";
    }
}

function normalizeString(value) {
    return typeof value === "string" ? value.trim() : "";
}

function normalizeLicenseKey(value) {
    return normalizeString(value).toUpperCase();
}

function validationError(reasonCode, requestId, status = 400) {
    return jsonResponse({
        success: false,
        status: "INVALID_REQUEST",
        reasonCode,
        requestId
    }, status);
}

/* ============================================================
   PHASE 6.11B - ADMIN SECURITY HARDENING
   Lightweight admin authentication brute-force protection.

   IMPORTANT:
   - In-memory / Worker-isolate scope only.
   - No D1 schema or data mutation.
   - This is defense-in-depth, not a globally persistent limiter.
   ============================================================ */

const ADMIN_AUTH_RATE_LIMIT_MAX_ATTEMPTS = 10;
const ADMIN_AUTH_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

const adminAuthFailureBuckets = new Map();

function getAdminRateLimitKey(request) {
    if (!request || !request.headers) {
        return "unknown";
    }

    return (
        normalizeString(request.headers.get("cf-connecting-ip")) ||
        normalizeString(request.headers.get("x-forwarded-for"))
            .split(",")[0]
            .trim() ||
        "unknown"
    );
}

function cleanupAdminAuthFailureBuckets(now = Date.now()) {
    for (const [key, bucket] of adminAuthFailureBuckets.entries()) {
        if (
            !bucket ||
            typeof bucket.windowStartedAt !== "number" ||
            now - bucket.windowStartedAt >= ADMIN_AUTH_RATE_LIMIT_WINDOW_MS
        ) {
            adminAuthFailureBuckets.delete(key);
        }
    }
}

function getAdminAuthRateLimitState(request) {
    const now = Date.now();

    cleanupAdminAuthFailureBuckets(now);

    const key = getAdminRateLimitKey(request);
    const bucket = adminAuthFailureBuckets.get(key);

    if (!bucket) {
        return {
            limited: false,
            retryAfterSeconds: 0
        };
    }

    const elapsed =
        now - bucket.windowStartedAt;

    if (elapsed >= ADMIN_AUTH_RATE_LIMIT_WINDOW_MS) {
        adminAuthFailureBuckets.delete(key);

        return {
            limited: false,
            retryAfterSeconds: 0
        };
    }

    if (bucket.failures < ADMIN_AUTH_RATE_LIMIT_MAX_ATTEMPTS) {
        return {
            limited: false,
            retryAfterSeconds: 0
        };
    }

    return {
        limited: true,
        retryAfterSeconds: Math.max(
            1,
            Math.ceil(
                (ADMIN_AUTH_RATE_LIMIT_WINDOW_MS - elapsed) / 1000
            )
        )
    };
}

function recordAdminAuthFailure(request) {
    const now = Date.now();
    const key = getAdminRateLimitKey(request);

    cleanupAdminAuthFailureBuckets(now);

    const existing =
        adminAuthFailureBuckets.get(key);

    if (
        !existing ||
        now - existing.windowStartedAt >= ADMIN_AUTH_RATE_LIMIT_WINDOW_MS
    ) {
        adminAuthFailureBuckets.set(key, {
            failures: 1,
            windowStartedAt: now
        });

        return;
    }

    existing.failures += 1;

    adminAuthFailureBuckets.set(
        key,
        existing
    );
}

function clearAdminAuthFailures(request) {
    adminAuthFailureBuckets.delete(
        getAdminRateLimitKey(request)
    );
}

function getAdminAuthorizationToken(request) {
    if (!request || !request.headers) {
        return "";
    }

    const authorization =
        normalizeString(
            request.headers.get("authorization")
        );

    const match =
        /^Bearer\s+(.+)$/i.exec(authorization);

    return match
        ? normalizeString(match[1])
        : "";
}

function timingSafeStringEqual(leftValue, rightValue) {
    const left = new TextEncoder().encode(
        typeof leftValue === "string" ? leftValue : ""
    );

    const right = new TextEncoder().encode(
        typeof rightValue === "string" ? rightValue : ""
    );

    const maxLength = Math.max(left.length, right.length);

    let difference =
        left.length ^ right.length;

    for (let index = 0; index < maxLength; index += 1) {
        const leftByte =
            index < left.length ? left[index] : 0;

        const rightByte =
            index < right.length ? right[index] : 0;

        difference |=
            leftByte ^ rightByte;
    }

    return difference === 0;
}

function verifyAdminAuthorization(request, env) {
    const configuredSecret =
        env && typeof env.ADMIN_RESET_SECRET === "string"
            ? env.ADMIN_RESET_SECRET.trim()
            : "";

    if (!configuredSecret) {
        return {
            ok: false,
            reasonCode: "ADMIN_RESET_NOT_CONFIGURED",
            status: 503
        };
    }

    const rateLimitState =
        getAdminAuthRateLimitState(request);

    if (rateLimitState.limited) {
        return {
            ok: false,
            reasonCode: "ADMIN_AUTH_RATE_LIMITED",
            status: 429,
            retryAfterSeconds:
                rateLimitState.retryAfterSeconds
        };
    }

    const suppliedSecret =
        getAdminAuthorizationToken(request);

    if (!suppliedSecret) {
        recordAdminAuthFailure(request);

        return {
            ok: false,
            reasonCode: "ADMIN_AUTH_REQUIRED",
            status: 401
        };
    }

    if (!timingSafeStringEqual(suppliedSecret, configuredSecret)) {
        recordAdminAuthFailure(request);

        return {
            ok: false,
            reasonCode: "ADMIN_AUTH_INVALID",
            status: 403
        };
    }

    clearAdminAuthFailures(request);

    return {
        ok: true
    };
}

function getAdminAuthorizationResponseHeaders(authorization) {
    if (
        !authorization ||
        authorization.status !== 429 ||
        !Number.isFinite(
            Number(authorization.retryAfterSeconds)
        )
    ) {
        return {};
    }

    return {
        "Retry-After": String(
            Math.max(
                1,
                Math.ceil(
                    Number(authorization.retryAfterSeconds)
                )
            )
        )
    };
}

function validateDeviceResetPayload(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return {
            ok: false,
            reasonCode: "INVALID_JSON_BODY"
        };
    }

    const licenseKey =
        normalizeLicenseKey(payload.licenseKey);

    if (!licenseKey) {
        return {
            ok: false,
            reasonCode: "LICENSE_KEY_REQUIRED"
        };
    }

    if (
        licenseKey.length !== MAX_LICENSE_KEY_LENGTH ||
        !LICENSE_KEY_PATTERN.test(licenseKey)
    ) {
        return {
            ok: false,
            reasonCode: "INVALID_LICENSE_KEY_FORMAT"
        };
    }

    return {
        ok: true,
        value: {
            licenseKey
        }
    };
}

function validateActivationPayload(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return { ok: false, reasonCode: "INVALID_JSON_BODY" };
    }

    const licenseKey = normalizeLicenseKey(payload.licenseKey);
    const deviceToken = normalizeString(payload.deviceToken);
    const deviceName = normalizeString(payload.deviceName);
    const platform = normalizeString(payload.platform);
    const appVersion = normalizeString(payload.appVersion);

    if (!licenseKey) {
        return { ok: false, reasonCode: "LICENSE_KEY_REQUIRED" };
    }

    if (
        licenseKey.length !== MAX_LICENSE_KEY_LENGTH ||
        !LICENSE_KEY_PATTERN.test(licenseKey)
    ) {
        return { ok: false, reasonCode: "INVALID_LICENSE_KEY_FORMAT" };
    }

    if (!deviceToken) {
        return { ok: false, reasonCode: "DEVICE_TOKEN_REQUIRED" };
    }

    if (deviceToken.length > MAX_DEVICE_TOKEN_LENGTH) {
        return { ok: false, reasonCode: "DEVICE_TOKEN_TOO_LONG" };
    }

    if (!appVersion) {
        return { ok: false, reasonCode: "APP_VERSION_REQUIRED" };
    }

    if (appVersion.length > MAX_APP_VERSION_LENGTH) {
        return { ok: false, reasonCode: "APP_VERSION_TOO_LONG" };
    }

    if (deviceName.length > MAX_DEVICE_NAME_LENGTH) {
        return { ok: false, reasonCode: "DEVICE_NAME_TOO_LONG" };
    }

    if (platform.length > MAX_PLATFORM_LENGTH) {
        return { ok: false, reasonCode: "PLATFORM_TOO_LONG" };
    }

    return {
        ok: true,
        value: {
            licenseKey,
            deviceToken,
            deviceName: deviceName || null,
            platform: platform || null,
            appVersion
        }
    };
}

async function sha256Hex(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);

    return Array.from(new Uint8Array(digest))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}


function getLicenseVaultSecret(env) {
    return env && typeof env.LICENSE_VAULT_SECRET === "string"
        ? env.LICENSE_VAULT_SECRET.trim()
        : "";
}

async function getLicenseVaultCryptoKey(env) {
    const secret = getLicenseVaultSecret(env);
    if (!secret) throw new Error("LICENSE_VAULT_SECRET_MISSING");
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
    return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function bytesToBase64(bytes) {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
}

function base64ToBytes(value) {
    const binary = atob(value);
    return Uint8Array.from(binary, ch => ch.charCodeAt(0));
}

async function encryptLicenseKeyForVault(env, rawLicenseKey) {
    const normalized = normalizeLicenseKey(rawLicenseKey);
    if (!LICENSE_KEY_PATTERN.test(normalized)) throw new Error("LICENSE_KEY_INVALID");
    const key = await getLicenseVaultCryptoKey(env);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(normalized));
    return { ciphertext: bytesToBase64(new Uint8Array(encrypted)), iv: bytesToBase64(iv) };
}

async function decryptLicenseKeyFromVault(env, ciphertext, iv) {
    const key = await getLicenseVaultCryptoKey(env);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(iv) }, key, base64ToBytes(ciphertext));
    return new TextDecoder().decode(decrypted);
}

async function handleAdminLicenseVaultStore(request, env, requestId, licenseId) {
    const authorization = verifyAdminAuthorization(request, env);
    if (!authorization.ok) return jsonResponse({ success:false,status:"DENIED",reasonCode:authorization.reasonCode,requestId }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json")) return validationError("CONTENT_TYPE_JSON_REQUIRED", requestId, 415);
    let payload; try { payload = await request.json(); } catch { return validationError("INVALID_JSON_BODY", requestId); }
    const safeLicenseId = normalizeString(licenseId);
    const rawLicenseKey = normalizeLicenseKey(payload && payload.licenseKey);
    if (!safeLicenseId || !LICENSE_KEY_PATTERN.test(rawLicenseKey)) return validationError("LICENSE_KEY_INVALID", requestId);
    try {
        const row = await env.DB.prepare("SELECT license_key_hash,license_key_last4 FROM licenses WHERE license_id=? LIMIT 1").bind(safeLicenseId).first();
        if (!row) return jsonResponse({ success:false,status:"NOT_FOUND",reasonCode:"LICENSE_NOT_FOUND",requestId },404);
        if ((await sha256Hex(rawLicenseKey)) !== row.license_key_hash) return jsonResponse({ success:false,status:"DENIED",reasonCode:"LICENSE_KEY_MISMATCH",requestId },400);
        const encrypted = await encryptLicenseKeyForVault(env, rawLicenseKey);
        await env.DB.prepare(`INSERT INTO license_vault (license_id,key_ciphertext,key_iv,key_last4,updated_at) VALUES (?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(license_id) DO UPDATE SET key_ciphertext=excluded.key_ciphertext,key_iv=excluded.key_iv,key_last4=excluded.key_last4,updated_at=CURRENT_TIMESTAMP`).bind(safeLicenseId, encrypted.ciphertext, encrypted.iv, row.license_key_last4).run();
        return jsonResponse({ success:true,status:"STORED",licenseId:safeLicenseId,keyMasked:`HXL-Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢-Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢-Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢-${row.license_key_last4}`,requestId });
    } catch (error) {
        const reasonCode = error && error.message === "LICENSE_VAULT_SECRET_MISSING" ? "LICENSE_VAULT_NOT_CONFIGURED" : "LICENSE_VAULT_STORE_FAILED";
        return jsonResponse({ success:false,status:"ERROR",reasonCode,requestId },500);
    }
}

async function handleAdminLicenseVaultRead(request, env, requestId, licenseId) {
    const authorization = verifyAdminAuthorization(request, env);
    if (!authorization.ok) return jsonResponse({ success:false,status:"DENIED",reasonCode:authorization.reasonCode,requestId }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    const safeLicenseId = normalizeString(licenseId);
    try {
        const row = await env.DB.prepare("SELECT key_ciphertext,key_iv,key_last4 FROM license_vault WHERE license_id=? LIMIT 1").bind(safeLicenseId).first();
        if (!row) return jsonResponse({ success:false,status:"NOT_FOUND",reasonCode:"LICENSE_KEY_NOT_IN_VAULT",requestId },404);
        const licenseKey = await decryptLicenseKeyFromVault(env, row.key_ciphertext, row.key_iv);
        return jsonResponse({ success:true,status:"OK",licenseId:safeLicenseId,licenseKey,keyMasked:`HXL-Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢-Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢-Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢-${row.key_last4}`,requestId },200,{"Cache-Control":"no-store"});
    } catch (error) {
        const reasonCode = error && error.message === "LICENSE_VAULT_SECRET_MISSING" ? "LICENSE_VAULT_NOT_CONFIGURED" : "LICENSE_VAULT_READ_FAILED";
        return jsonResponse({ success:false,status:"ERROR",reasonCode,requestId },500,{"Cache-Control":"no-store"});
    }
}




/* WEBSITE STEP 8 Ã¢â‚¬â€ Orders + provider-neutral verified payment fulfillment. */
const HXL_KEY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function randomToken(length) { const b=crypto.getRandomValues(new Uint8Array(length)); let out=""; for (let i=0;i<length;i++) out += HXL_KEY_ALPHABET[b[i] % HXL_KEY_ALPHABET.length]; return out; }
function createWebLicenseKey(){ return `HXL-${randomToken(4)}-${randomToken(4)}-${randomToken(4)}-${randomToken(4)}`; }
function createWebLicenseId(){ const d=new Date().toISOString().slice(0,10).replace(/-/g,""); return `LIC-${d}-${randomToken(8)}`; }
function createCustomerId(){ return `CUS-${crypto.randomUUID().replace(/-/g,"").slice(0,16).toUpperCase()}`; }
function calculateOfferPriceMinor(basePriceMinor, offer) {
    const base=Number(basePriceMinor);
    if(!Number.isInteger(base)||base<1||!offer||Number(offer.enabled)!==1) return base;
    const now=Date.now(), starts=offer.starts_at?Date.parse(offer.starts_at):null, ends=offer.ends_at?Date.parse(offer.ends_at):null;
    if((Number.isFinite(starts)&&now<starts)||(Number.isFinite(ends)&&now>=ends)) return base;
    const type=String(offer.discount_type||"").toUpperCase();
    let finalPrice=base;
    if(type==="PERCENT"){
        const bps=Number(offer.discount_percent_bps);
        if(Number.isInteger(bps)&&bps>0&&bps<=10000) finalPrice=Math.round(base*(10000-bps)/10000);
    } else if(type==="FLAT") {
        const flat=Number(offer.discount_flat_minor);
        if(Number.isInteger(flat)&&flat>0) finalPrice=base-flat;
    }
    return Math.max(1,Math.min(base,finalPrice));
}
function publicOfferPayload(offer, basePriceMinor) {
    if(!offer) return {active:false};
    const effective=calculateOfferPriceMinor(basePriceMinor,offer), active=Number(offer.enabled)===1&&effective<Number(basePriceMinor);
    return {active,name:offer.offer_name||null,badge:offer.badge_text||null,discount_type:offer.discount_type||null,discount_percent_bps:Number(offer.discount_percent_bps)||0,discount_flat_minor:Number(offer.discount_flat_minor)||0,starts_at:offer.starts_at||null,ends_at:offer.ends_at||null};
}
async function getPlanOffer(env, planCode){
    try{return await env.DB.prepare(`SELECT offer_id,plan_code,offer_name,badge_text,enabled,discount_type,discount_percent_bps,discount_flat_minor,starts_at,ends_at,updated_at FROM business_plan_offers WHERE plan_code=? LIMIT 1`).bind(planCode).first();}catch(_){return null;}
}
async function getCheckoutPlan(env, code){
    const plan=(normalizeString(code)||"STANDARD").toUpperCase();
    try {
        const row=await env.DB.prepare(`SELECT plan_code,price_minor,currency,validity_days,max_devices,status,buy_enabled FROM business_plans WHERE plan_code=? LIMIT 1`).bind(plan).first();
        if(row){
            if(row.status!=="ACTIVE" || Number(row.buy_enabled)!==1) return null;
            const baseAmount=Number(row.price_minor),days=Number(row.validity_days),maxDevices=Number(row.max_devices);
            if(!Number.isInteger(baseAmount)||baseAmount<1||!Number.isInteger(days)||days<1||!Number.isInteger(maxDevices)||maxDevices<1)return null;
            const offer=await getPlanOffer(env,row.plan_code), amount=calculateOfferPriceMinor(baseAmount,offer);
            return {planCode:row.plan_code,configured:true,amountMinor:amount,regularPriceMinor:baseAmount,currency:String(row.currency||"INR").toUpperCase(),days,maxDevices,offer:publicOfferPayload(offer,baseAmount),offerId:offer&&amount<baseAmount?offer.offer_id:null};
        }
    } catch (_) {}
    if(plan!=="STANDARD") return null;
    const amount=Number(env && env.STANDARD_PRICE_MINOR);
    if(!Number.isInteger(amount)||amount<1) return {planCode:plan,configured:false,amountMinor:null,currency:"INR",days:365,maxDevices:1};
    return {planCode:plan,configured:true,amountMinor:amount,regularPriceMinor:amount,currency:(normalizeString(env.STANDARD_PRICE_CURRENCY)||"INR").toUpperCase(),days:365,maxDevices:1,offer:{active:false},offerId:null};
}
async function hmacHex(secret, body){ const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]); const sig=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(body)); return Array.from(new Uint8Array(sig)).map(x=>x.toString(16).padStart(2,"0")).join(""); }
function constantTimeTextEqual(a,b){ a=String(a||"");b=String(b||""); if(a.length!==b.length)return false; let x=0; for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i); return x===0; }
/* K7_6_CUSTOMER_REGISTRATION_API */

function createRegistrationId(){
    return `REG-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${randomToken(8)}`;
}

function createEmailVerificationCode(){
    const bytes=crypto.getRandomValues(new Uint32Array(1));
    return String(100000 + (bytes[0] % 900000));
}

async function hashVerificationCode(code){
    return sha256Hex(String(code||""));
}

async function sendRegistrationVerificationEmail(
    env,
    {
        fullName,
        email,
        code
    }
) {
    /* K7_6_MAILJET_REGISTRATION_OTP */

    const intendedRecipient = normalizeString(email);
    const safeName = normalizeString(fullName) || "Customer";
    const safeCode = normalizeString(code);

    if (!intendedRecipient) {
        return {
            success: false,
            status: "ERROR",
            reasonCode: "EMAIL_RECIPIENT_REQUIRED",
            provider: "MAILJET",
            deliveryMode: "LIVE"
        };
    }

    const subject =
        "Himanshu XL Tools - Verify your email";

    const text =
        "Hello " + safeName + ",\n\n" +
        "Your Himanshu XL Tools verification code is: " +
        safeCode +
        "\n\nThis code expires in 10 minutes.\n\n" +
        "If you did not request this, you can ignore this email.";

    const html =
        "<div style='font-family:Arial,sans-serif;line-height:1.6'>" +
        "<h2>Himanshu XL Tools</h2>" +
        "<p>Hello " + safeName + ",</p>" +
        "<p>Your email verification code is:</p>" +
        "<div style='font-size:30px;font-weight:700;letter-spacing:6px'>" +
        safeCode +
        "</div>" +
        "<p>This code expires in <strong>10 minutes</strong>.</p>" +
        "<p>If you did not request this, you can ignore this email.</p>" +
        "</div>";

    const result =
        await sendEmailWithMailjet(
            env,
            {
                to: intendedRecipient,
                subject,
                text,
                html
            }
        );

    return {
        ...result,
        deliveryMode: "LIVE",
        intendedRecipient,
        deliveryRecipient: intendedRecipient
    };
}

async function handleCustomerRegistrationStart(request,env,requestId){
    if(!(request.headers.get("content-type")||"")
        .toLowerCase()
        .includes("application/json")){
        return validationError(
            "CONTENT_TYPE_JSON_REQUIRED",
            requestId,
            415
        );
    }

    let p;
    try{
        p=await request.json();
    }catch{
        return validationError("INVALID_JSON_BODY",requestId);
    }

    const fullName=normalizeString(p&&p.fullName);
    const email=normalizeString(p&&p.email).toLowerCase();
    const mobile=normalizeString(p&&p.mobile);
    const companyName=normalizeString(p&&p.companyName);
    const country=normalizeString(p&&p.country);

    if(!fullName)
        return validationError("FULL_NAME_REQUIRED",requestId);

    if(!/^\S+@\S+\.\S+$/.test(email))
        return validationError("EMAIL_INVALID",requestId);

    if(!mobile)
        return validationError("MOBILE_REQUIRED",requestId);

    if(!country)
        return validationError("COUNTRY_REQUIRED",requestId);

    if(fullName.length>120)
        return validationError("FULL_NAME_TOO_LONG",requestId);

    if(email.length>254)
        return validationError("EMAIL_TOO_LONG",requestId);

    if(mobile.length>40)
        return validationError("MOBILE_TOO_LONG",requestId);

    if(companyName.length>160)
        return validationError("COMPANY_TOO_LONG",requestId);

    if(country.length>120)
        return validationError("COUNTRY_TOO_LONG",requestId);

    try{
        const existingCustomer=await env.DB.prepare(
            "SELECT customer_id FROM customers WHERE lower(email)=lower(?) LIMIT 1"
        ).bind(email).first();

        if(existingCustomer){
            return jsonResponse({
                success:false,
                status:"CONFLICT",
                reasonCode:"EMAIL_ALREADY_REGISTERED",
                requestId
            },409);
        }

        /*
         * Invalidate previous pending verification for this email.
         * This also keeps the partial unique index safe.
         */
        await env.DB.prepare(`
            UPDATE customer_registrations
            SET verification_status='CANCELLED',
                updated_at=CURRENT_TIMESTAMP
            WHERE lower(email)=lower(?)
              AND verification_status='PENDING'
        `).bind(email).run();

        const registrationId=createRegistrationId();
        const code=createEmailVerificationCode();
        const codeHash=await hashVerificationCode(code);

        const expiresAt=
            new Date(Date.now()+10*60*1000).toISOString();

        await env.DB.prepare(`
            INSERT INTO customer_registrations
            (
                registration_id,
                email,
                full_name,
                mobile,
                company_name,
                country,
                email_verified,
                verification_status,
                verification_code_hash,
                verification_expires_at,
                created_at,
                updated_at
            )
            VALUES
            (?,?,?,?,?,?,0,'PENDING',?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        `).bind(
            registrationId,
            email,
            fullName,
            mobile,
            companyName||null,
            country,
            codeHash,
            expiresAt
        ).run();

        const emailResult=
            await sendRegistrationVerificationEmail(env,{
                fullName,
                email,
                code
            });

        if(!emailResult.success){
            return jsonResponse({
                success:false,
                status:"EMAIL_PENDING",
                reasonCode:
                    emailResult.reasonCode||
                    "VERIFICATION_EMAIL_FAILED",
                registrationId,
                deliveryMode:emailResult.deliveryMode||null,
                requestId
            },502,{
                "Cache-Control":"no-store"
            });
        }

        return jsonResponse({
            success:true,
            status:"VERIFICATION_REQUIRED",
            registrationId,
            expiresInSeconds:600,
            deliveryMode:emailResult.deliveryMode,
            requestId
        },201,{
            "Cache-Control":"no-store"
        });

    }catch(error){
        return jsonResponse({
            success:false,
            status:"ERROR",
            reasonCode:"REGISTRATION_START_FAILED",
            requestId
        },500,{
            "Cache-Control":"no-store"
        });
    }
}


/* K7_6_OTP_RESEND_HANDLER */
async function handleCustomerRegistrationResend(request,env,requestId){
    if(!(request.headers.get("content-type")||"")
        .toLowerCase()
        .includes("application/json")){
        return validationError(
            "CONTENT_TYPE_JSON_REQUIRED",
            requestId,
            415
        );
    }

    let p;
    try{
        p=await request.json();
    }catch{
        return validationError("INVALID_JSON_BODY",requestId);
    }

    const registrationId=
        normalizeString(p&&p.registrationId);

    if(!registrationId){
        return validationError(
            "REGISTRATION_ID_REQUIRED",
            requestId
        );
    }

    try{
        const registration=await env.DB.prepare(`
            SELECT
                registration_id,
                email,
                full_name,
                email_verified,
                verification_status,
                verification_expires_at,
                updated_at
            FROM customer_registrations
            WHERE registration_id=?
            LIMIT 1
        `).bind(registrationId).first();

        if(!registration){
            return jsonResponse({
                success:false,
                status:"NOT_FOUND",
                reasonCode:"REGISTRATION_NOT_FOUND",
                requestId
            },404,{
                "Cache-Control":"no-store"
            });
        }

        if(
            Number(registration.email_verified)===1 ||
            registration.verification_status==="VERIFIED"
        ){
            return jsonResponse({
                success:false,
                status:"CONFLICT",
                reasonCode:"REGISTRATION_ALREADY_VERIFIED",
                requestId
            },409,{
                "Cache-Control":"no-store"
            });
        }

        if(
            registration.verification_status!=="PENDING"
        ){
            return jsonResponse({
                success:false,
                status:"CONFLICT",
                reasonCode:"REGISTRATION_NOT_PENDING",
                requestId
            },409,{
                "Cache-Control":"no-store"
            });
        }

        /*
         * Server-side 60 second cooldown.
         * Browser countdown is UX only; server remains authoritative.
         */
        if(registration.updated_at){
            const lastUpdate=
                Date.parse(
                    String(registration.updated_at)
                        .replace(" ","T")+"Z"
                );

            if(
                Number.isFinite(lastUpdate) &&
                Date.now()-lastUpdate < 60000
            ){
                const retryAfterSeconds=
                    Math.max(
                        1,
                        Math.ceil(
                            (60000-(Date.now()-lastUpdate))/1000
                        )
                    );

                return jsonResponse({
                    success:false,
                    status:"COOLDOWN",
                    reasonCode:"OTP_RESEND_COOLDOWN",
                    retryAfterSeconds,
                    requestId
                },429,{
                    "Cache-Control":"no-store",
                    "Retry-After":String(retryAfterSeconds)
                });
            }
        }

        const code=createEmailVerificationCode();
        const codeHash=await hashVerificationCode(code);

        const expiresAt=
            new Date(Date.now()+10*60*1000)
                .toISOString()
                .replace("T"," ")
                .replace(/\.\d{3}Z$/,"");

        /*
         * Replace the hash before sending.
         * Therefore any older OTP becomes invalid immediately.
         */
        await env.DB.prepare(`
            UPDATE customer_registrations
            SET
                verification_code_hash=?,
                verification_expires_at=?,
                updated_at=CURRENT_TIMESTAMP
            WHERE registration_id=?
              AND email_verified=0
              AND verification_status='PENDING'
        `).bind(
            codeHash,
            expiresAt,
            registrationId
        ).run();

        const emailResult=
            await sendRegistrationVerificationEmail(env,{
                fullName:registration.full_name,
                email:registration.email,
                code
            });

        if(!emailResult.success){
            return jsonResponse({
                success:false,
                status:"EMAIL_PENDING",
                reasonCode:
                    emailResult.reasonCode||
                    "VERIFICATION_EMAIL_FAILED",
                registrationId,
                deliveryMode:
                    emailResult.deliveryMode||null,
                requestId
            },502,{
                "Cache-Control":"no-store"
            });
        }

        return jsonResponse({
            success:true,
            status:"VERIFICATION_CODE_RESENT",
            registrationId,
            expiresInSeconds:600,
            resendCooldownSeconds:60,
            deliveryMode:emailResult.deliveryMode,
            requestId
        },200,{
            "Cache-Control":"no-store"
        });

    }catch(error){
        return jsonResponse({
            success:false,
            status:"ERROR",
            reasonCode:"OTP_RESEND_FAILED",
            requestId
        },500,{
            "Cache-Control":"no-store"
        });
    }
}
/* END K7_6_OTP_RESEND_HANDLER */
async function handleCustomerRegistrationVerify(request,env,requestId){
    if(!(request.headers.get("content-type")||"")
        .toLowerCase()
        .includes("application/json")){
        return validationError(
            "CONTENT_TYPE_JSON_REQUIRED",
            requestId,
            415
        );
    }

    let p;
    try{
        p=await request.json();
    }catch{
        return validationError("INVALID_JSON_BODY",requestId);
    }

    const registrationId=
        normalizeString(p&&p.registrationId);

    const code=
        normalizeString(p&&p.code);

    if(!registrationId)
        return validationError(
            "REGISTRATION_ID_REQUIRED",
            requestId
        );

    if(!/^\d{6}$/.test(code))
        return validationError(
            "VERIFICATION_CODE_INVALID",
            requestId
        );

    try{
        const registration=await env.DB.prepare(`
            SELECT
                registration_id,
                email,
                email_verified,
                verification_status,
                verification_code_hash,
                verification_expires_at
            FROM customer_registrations
            WHERE registration_id=?
            LIMIT 1
        `).bind(registrationId).first();

        if(!registration){
            return jsonResponse({
                success:false,
                status:"NOT_FOUND",
                reasonCode:"REGISTRATION_NOT_FOUND",
                requestId
            },404);
        }

        if(
            Number(registration.email_verified)===1 ||
            registration.verification_status==="VERIFIED"
        ){
            return jsonResponse({
                success:true,
                status:"ALREADY_VERIFIED",
                registrationId,
                requestId
            },200,{
                "Cache-Control":"no-store"
            });
        }

        if(registration.verification_status!=="PENDING"){
            return jsonResponse({
                success:false,
                status:"DENIED",
                reasonCode:"REGISTRATION_NOT_PENDING",
                requestId
            },409);
        }

        if(
            !registration.verification_expires_at ||
            Date.parse(registration.verification_expires_at)<=Date.now()
        ){
            await env.DB.prepare(`
                UPDATE customer_registrations
                SET verification_status='EXPIRED',
                    updated_at=CURRENT_TIMESTAMP
                WHERE registration_id=?
            `).bind(registrationId).run();

            return jsonResponse({
                success:false,
                status:"EXPIRED",
                reasonCode:"VERIFICATION_CODE_EXPIRED",
                requestId
            },410);
        }

        const suppliedHash=
            await hashVerificationCode(code);

        if(!constantTimeTextEqual(
            suppliedHash,
            registration.verification_code_hash
        )){
            return jsonResponse({
                success:false,
                status:"DENIED",
                reasonCode:"VERIFICATION_CODE_INCORRECT",
                requestId
            },401);
        }

        await env.DB.prepare(`
            UPDATE customer_registrations
            SET email_verified=1,
                verification_status='VERIFIED',
                verification_code_hash=NULL,
                verified_at=CURRENT_TIMESTAMP,
                updated_at=CURRENT_TIMESTAMP
            WHERE registration_id=?
        `).bind(registrationId).run();

        return jsonResponse({
            success:true,
            status:"VERIFIED",
            registrationId,
            requestId
        },200,{
            "Cache-Control":"no-store"
        });

    }catch(error){
        return jsonResponse({
            success:false,
            status:"ERROR",
            reasonCode:"REGISTRATION_VERIFY_FAILED",
            requestId
        },500,{
            "Cache-Control":"no-store"
        });
    }
}

/* END K7_6_CUSTOMER_REGISTRATION_API */

/* K7_6_VERIFIED_CHECKOUT_BRIDGE */

async function handleVerifiedCheckoutOrderCreate(request,env,requestId){

    if(!(request.headers.get("content-type")||"")
        .toLowerCase()
        .includes("application/json")){
        return validationError(
            "CONTENT_TYPE_JSON_REQUIRED",
            requestId,
            415
        );
    }

    let p;

    try{
        p=await request.json();
    }catch{
        return validationError(
            "INVALID_JSON_BODY",
            requestId
        );
    }

    const registrationId=
        normalizeString(p&&p.registrationId);

    if(!registrationId){
        return validationError(
            "REGISTRATION_ID_REQUIRED",
            requestId
        );
    }

    const plan=
        await getCheckoutPlan(
            env,
            p&&p.planCode
        );

    if(!plan){
        return validationError(
            "PLAN_INVALID",
            requestId
        );
    }

    try{

        const registration=await env.DB.prepare(`
            SELECT
                registration_id,
                email,
                full_name,
                mobile,
                company_name,
                country,
                email_verified,
                verification_status,
                verified_at
            FROM customer_registrations
            WHERE registration_id=?
            LIMIT 1
        `)
        .bind(registrationId)
        .first();

        if(!registration){
            return jsonResponse({
                success:false,
                status:"NOT_FOUND",
                reasonCode:"REGISTRATION_NOT_FOUND",
                requestId
            },404);
        }

        if(
            Number(registration.email_verified)!==1 ||
            registration.verification_status!=="VERIFIED"
        ){
            return jsonResponse({
                success:false,
                status:"DENIED",
                reasonCode:"EMAIL_VERIFICATION_REQUIRED",
                requestId
            },403);
        }

        /*
         * Prevent multiple open/paid orders from one
         * registration flow.
         */
        let prior=null;

        try{
            prior=await env.DB.prepare(`
                SELECT
                    order_id,
                    status,
                    plan_code,
                    amount_minor,
                    currency
                FROM web_orders
                WHERE registration_id=?
                ORDER BY created_at DESC
                LIMIT 1
            `)
            .bind(registrationId)
            .first();
        }catch(_){
            /*
             * registration_id column is added by the
             * K7.6 migration extension below.
             */
        }

        if(prior){
            return jsonResponse({
                success:true,
                status:prior.status,
                order:{
                    orderId:prior.order_id,
                    planCode:prior.plan_code,
                    amountMinor:Number(prior.amount_minor),
                    currency:prior.currency
                },
                alreadyCreated:true,
                paymentConfigured:plan.configured,
                requestId
            },200,{
                "Cache-Control":"no-store"
            });
        }

        const orderId=
            `ORD-${new Date()
                .toISOString()
                .slice(0,10)
                .replace(/-/g,"")}-${randomToken(8)}`;

        await env.DB.prepare(`
            INSERT INTO web_orders
            (
                order_id,
                email,
                full_name,
                mobile,
                company_name,
                country,
                registration_id,
                plan_code,
                amount_minor,
                currency,
                status,
                created_at,
                updated_at
            )
            VALUES
            (?,?,?,?,?,?,?,?,?,?,'PENDING',
             CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        `)
        .bind(
            orderId,
            registration.email,
            registration.full_name,
            registration.mobile,
            registration.company_name||null,
            registration.country,
            registration.registration_id,
            plan.planCode,
            plan.amountMinor,
            plan.currency
        )
        .run();

        try{
            await env.DB.prepare(`
                INSERT INTO web_order_plan_snapshots
                (
                    order_id,
                    plan_code,
                    amount_minor,
                    currency,
                    validity_days,
                    max_devices,
                    offer_id,
                    created_at
                )
                VALUES
                (?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
            `)
            .bind(
                orderId,
                plan.planCode,
                plan.amountMinor,
                plan.currency,
                plan.days,
                plan.maxDevices,
                plan.offerId||null
            )
            .run();
        }catch(_){}

        return jsonResponse({
            success:true,
            status:
                plan.configured
                    ?"PENDING_PAYMENT"
                    :"PAYMENT_NOT_CONFIGURED",

            order:{
                orderId,
                planCode:plan.planCode,
                amountMinor:plan.amountMinor,
                regularPriceMinor:plan.regularPriceMinor,
                currency:plan.currency,
                offer:plan.offer||{active:false}
            },

            paymentConfigured:plan.configured,
            requestId
        },201,{
            "Cache-Control":"no-store"
        });

    }catch(error){

        return jsonResponse({
            success:false,
            status:"ERROR",
            reasonCode:"VERIFIED_ORDER_CREATE_FAILED",
            requestId
        },500,{
            "Cache-Control":"no-store"
        });
    }
}

/* END K7_6_VERIFIED_CHECKOUT_BRIDGE */
/* K7_6_CASHFREE_SANDBOX_PAYMENT */
async function cashfreeRequest(env, path, options={}) {
    const clientId=normalizeString(env&&env.CASHFREE_CLIENT_ID);
    const clientSecret=normalizeString(env&&env.CASHFREE_CLIENT_SECRET);
    if(!clientId||!clientSecret) throw new Error("CASHFREE_NOT_CONFIGURED");
    const response=await fetch(`https://sandbox.cashfree.com/pg${path}`,{
        method:options.method||"GET",
        headers:{
            "Accept":"application/json",
            "Content-Type":"application/json",
            "x-client-id":clientId,
            "x-client-secret":clientSecret,
            "x-api-version":"2025-01-01",
            ...(options.headers||{})
        },
        body:options.body?JSON.stringify(options.body):undefined
    });
    let data={}; try{data=await response.json();}catch(_){}
    if(!response.ok){
        const e=new Error("CASHFREE_API_FAILED"); e.status=response.status; e.data=data; throw e;
    }
    return data;
}

async function handleCashfreeCreateOrder(request,env,requestId){
    let p; try{p=await request.json();}catch{return validationError("INVALID_JSON_BODY",requestId);}
    const orderId=normalizeString(p&&p.orderId), registrationId=normalizeString(p&&p.registrationId);
    if(!orderId||!registrationId)return validationError("ORDER_AND_REGISTRATION_REQUIRED",requestId);
    try{
        const o=await env.DB.prepare(`SELECT order_id,registration_id,email,full_name,mobile,amount_minor,currency,status,license_id FROM web_orders WHERE order_id=? LIMIT 1`).bind(orderId).first();
        if(!o)return jsonResponse({success:false,status:"NOT_FOUND",reasonCode:"ORDER_NOT_FOUND",requestId},404);
        if(normalizeString(o.registration_id)!==registrationId)return jsonResponse({success:false,status:"DENIED",reasonCode:"REGISTRATION_ORDER_MISMATCH",requestId},403);
        if(o.license_id)return jsonResponse({success:true,status:"ALREADY_FULFILLED",orderId:o.order_id,licenseId:o.license_id,requestId});
        const cf=await cashfreeRequest(env,"/orders",{method:"POST",headers:{"x-idempotency-key":crypto.randomUUID()},body:{
            order_id:o.order_id,
            order_amount:Number(o.amount_minor)/100,
            order_currency:String(o.currency||"INR"),
            customer_details:{
                customer_id:("CUST_"+registrationId).replace(/[^A-Za-z0-9_-]/g,"_").slice(0,50),
                customer_name:normalizeString(o.full_name)||"Customer",
                customer_email:normalizeString(o.email),
                customer_phone:normalizeString(o.mobile)
            },
            order_note:"Himanshu XL Tools Standard License"
        }});
        return jsonResponse({success:true,status:"PAYMENT_READY",orderId:o.order_id,paymentSessionId:cf.payment_session_id,cashfreeOrderStatus:cf.order_status||null,mode:"sandbox",requestId},200,{"Cache-Control":"no-store"});
    }catch(e){
        return jsonResponse({success:false,status:"ERROR",reasonCode:e&&e.message==="CASHFREE_NOT_CONFIGURED"?"CASHFREE_NOT_CONFIGURED":"CASHFREE_ORDER_CREATE_FAILED",requestId},e&&e.message==="CASHFREE_NOT_CONFIGURED"?503:502,{"Cache-Control":"no-store"});
    }
}

async function handleCashfreeVerifyPayment(request,env,requestId){
    let p; try{p=await request.json();}catch{return validationError("INVALID_JSON_BODY",requestId);}
    const orderId=normalizeString(p&&p.orderId), registrationId=normalizeString(p&&p.registrationId);
    if(!orderId||!registrationId)return validationError("ORDER_AND_REGISTRATION_REQUIRED",requestId);
    try{
        const o=await env.DB.prepare(`SELECT order_id,registration_id,license_id FROM web_orders WHERE order_id=? LIMIT 1`).bind(orderId).first();
        if(!o)return jsonResponse({success:false,status:"NOT_FOUND",reasonCode:"ORDER_NOT_FOUND",requestId},404);
        if(normalizeString(o.registration_id)!==registrationId)return jsonResponse({success:false,status:"DENIED",reasonCode:"REGISTRATION_ORDER_MISMATCH",requestId},403);
        if(o.license_id)return jsonResponse({success:true,status:"ALREADY_FULFILLED",orderId,licenseId:o.license_id,requestId});
        const cf=await cashfreeRequest(env,"/orders/"+encodeURIComponent(orderId));
        if(String(cf.order_status||"").toUpperCase()!=="PAID")return jsonResponse({success:false,status:String(cf.order_status||"PENDING"),reasonCode:"PAYMENT_NOT_PAID",orderId,requestId},409,{"Cache-Control":"no-store"});
        const secret=normalizeString(env&&env.PAYMENT_WEBHOOK_SECRET);
        if(!secret)return jsonResponse({success:false,status:"ERROR",reasonCode:"PAYMENT_WEBHOOK_NOT_CONFIGURED",requestId},503);
        const payload=JSON.stringify({eventId:"CASHFREE-"+orderId,paymentReference:normalizeString(cf.cf_order_id)||orderId,orderId,status:"PAID"});
        const signature=await hmacHex(secret,payload);
        const internalRequest=new Request("https://internal.hxl/payments/webhook",{method:"POST",headers:{"Content-Type":"application/json","x-hxl-signature":signature},body:payload});
        return await handlePaymentWebhook(internalRequest,env,requestId);
    }catch(e){
        return jsonResponse({success:false,status:"ERROR",reasonCode:e&&e.message==="CASHFREE_NOT_CONFIGURED"?"CASHFREE_NOT_CONFIGURED":"CASHFREE_VERIFY_FAILED",requestId},e&&e.message==="CASHFREE_NOT_CONFIGURED"?503:502,{"Cache-Control":"no-store"});
    }
}

async function handleCheckoutOrderCreate(request,env,requestId){
    if(!(request.headers.get("content-type")||"").toLowerCase().includes("application/json")) return validationError("CONTENT_TYPE_JSON_REQUIRED",requestId,415);
    let p; try{p=await request.json();}catch{return validationError("INVALID_JSON_BODY",requestId);}
    const fullName=normalizeString(p&&p.fullName), email=normalizeString(p&&p.email).toLowerCase(), plan=await getCheckoutPlan(env,p&&p.planCode);
    if(!fullName)return validationError("FULL_NAME_REQUIRED",requestId); if(!/^\S+@\S+\.\S+$/.test(email))return validationError("EMAIL_INVALID",requestId); if(!plan)return validationError("PLAN_INVALID",requestId);
    const orderId=`ORD-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${randomToken(8)}`;
    try{await env.DB.prepare(`INSERT INTO web_orders (order_id,email,full_name,plan_code,amount_minor,currency,status,created_at,updated_at) VALUES (?,?,?,?,?,?,'PENDING',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(orderId,email,fullName,plan.planCode,plan.amountMinor,plan.currency).run();
      try{await env.DB.prepare(`INSERT INTO web_order_plan_snapshots(order_id,plan_code,amount_minor,currency,validity_days,max_devices,offer_id,created_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(orderId,plan.planCode,plan.amountMinor,plan.currency,plan.days,plan.maxDevices,plan.offerId||null).run();}catch(_){}
      return jsonResponse({success:true,status:plan.configured?"PENDING_PAYMENT":"PAYMENT_NOT_CONFIGURED",order:{orderId,planCode:plan.planCode,amountMinor:plan.amountMinor,regularPriceMinor:plan.regularPriceMinor,currency:plan.currency,offer:plan.offer||{active:false}},paymentConfigured:plan.configured,requestId},201);
    }catch{return jsonResponse({success:false,status:"ERROR",reasonCode:"ORDER_CREATE_FAILED",requestId},500);}
}
async function handleAdminOrders(request,env,requestId){ const a=verifyAdminAuthorization(request,env); if(!a.ok)return jsonResponse({success:false,status:"DENIED",reasonCode:a.reasonCode,requestId},a.status,getAdminAuthorizationResponseHeaders(a)); try{const r=await env.DB.prepare(`SELECT order_id,email,full_name,plan_code,amount_minor,currency,status,payment_reference,license_id,created_at,updated_at FROM web_orders ORDER BY created_at DESC LIMIT 250`).all(); return jsonResponse({success:true,status:"OK",orders:r.results||[],requestId});}catch{return jsonResponse({success:false,status:"ERROR",reasonCode:"ORDER_LIST_FAILED",requestId},500);} }
async function handleCustomerOrders(request,env,requestId){ const session=await requireCustomerSession(request,env); if(!session)return jsonResponse({success:false,status:"DENIED",reasonCode:"CUSTOMER_SESSION_REQUIRED",requestId},401,{"Cache-Control":"no-store"}); try{const c=await env.DB.prepare("SELECT email FROM customers WHERE customer_id=? LIMIT 1").bind(session.customerId).first(); if(!c||!c.email)return jsonResponse({success:true,status:"OK",orders:[],requestId},200,{"Cache-Control":"no-store"}); const r=await env.DB.prepare(`SELECT order_id,plan_code,amount_minor,currency,status,license_id,created_at FROM web_orders WHERE lower(email)=lower(?) ORDER BY created_at DESC LIMIT 50`).bind(c.email).all(); return jsonResponse({success:true,status:"OK",orders:r.results||[],requestId},200,{"Cache-Control":"no-store"});}catch{return jsonResponse({success:false,status:"ERROR",reasonCode:"ORDER_LIST_FAILED",requestId},500);} }

/* WEBSITE STEP 9 Ã¢â‚¬â€ automatic license fulfillment + transactional email. */
function getCustomerPortalUrl(env){return normalizeString(env&&env.CUSTOMER_PORTAL_URL)||`${PRODUCTION_APP_ORIGIN}/customer-portal.html`;}
async function sendOrderLicenseEmail(env,{orderId,fullName,email,licenseId,licenseKey,planCode,expiryDate}){
    const liveEnabled=normalizeString(env&&env.CUSTOMER_EMAIL_LIVE_ENABLED).toLowerCase()==="true";
    const intendedRecipient=normalizeString(email).toLowerCase();
    const deliveryRecipient=liveEnabled?intendedRecipient:RESEND_TEST_TO;
    
    const portal=getCustomerPortalUrl(env), safeName=escapeEmailHtml(fullName||"Customer"), safeKey=escapeEmailHtml(licenseKey), safeId=escapeEmailHtml(licenseId), safePlan=escapeEmailHtml(planCode), safeExpiry=escapeEmailHtml(expiryDate), safeOrder=escapeEmailHtml(orderId);
    const subject=`Himanshu XL Tools - Your License ${licenseId}`;
    const html=`<h2>Himanshu XL Tools</h2><p>Hello ${safeName},</p><p>Your order <strong>${safeOrder}</strong> is fulfilled.</p><p><strong>License Key:</strong> ${safeKey}<br><strong>License ID:</strong> ${safeId}<br><strong>Plan:</strong> ${safePlan}<br><strong>Expiry:</strong> ${safeExpiry}</p><p>Customer Portal: ${escapeEmailHtml(portal)}</p><p>Keep your license key private.</p>`;
    const text=`Himanshu XL Tools\nOrder: ${orderId}\nLicense Key: ${licenseKey}\nLicense ID: ${licenseId}\nPlan: ${planCode}\nExpiry: ${expiryDate}\nCustomer Portal: ${portal}`;
    const result=await sendEmailWithMailjet(env,{to:intendedRecipient,subject,html,text});
    return {...result,intendedRecipient,deliveryRecipient,deliveryMode:liveEnabled?"LIVE":"TEST"};
}
async function recordFulfillmentEmail(env,{orderId,licenseId,emailResult}){
    try{await env.DB.prepare(`INSERT INTO order_fulfillment_events (order_id,license_id,event_type,email_status,email_provider,email_provider_id,intended_recipient,delivery_recipient,reason_code,created_at) VALUES (?,?,'LICENSE_EMAIL',?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(orderId,licenseId,emailResult&&emailResult.status||"FAILED",emailResult&&emailResult.provider||"RESEND",emailResult&&emailResult.providerMessageId||null,emailResult&&emailResult.intendedRecipient||null,emailResult&&emailResult.deliveryRecipient||null,emailResult&&emailResult.reasonCode||null).run();}catch{}
}
async function handleAdminResendOrderLicense(request,env,requestId){
    const a=verifyAdminAuthorization(request,env); if(!a.ok)return jsonResponse({success:false,status:"DENIED",reasonCode:a.reasonCode,requestId},a.status,getAdminAuthorizationResponseHeaders(a));
    let p;try{p=await request.json();}catch{return validationError("INVALID_JSON_BODY",requestId);} const orderId=normalizeString(p&&p.orderId); if(!orderId)return validationError("ORDER_ID_REQUIRED",requestId);
    try{const o=await env.DB.prepare(`SELECT o.order_id,o.email,o.full_name,o.plan_code,o.license_id,l.expiry_date FROM web_orders o LEFT JOIN licenses l ON l.license_id=o.license_id WHERE o.order_id=? LIMIT 1`).bind(orderId).first(); if(!o||!o.license_id)return jsonResponse({success:false,status:"NOT_FOUND",reasonCode:"FULFILLED_ORDER_NOT_FOUND",requestId},404);
      const v=await env.DB.prepare("SELECT key_ciphertext,key_iv FROM license_vault WHERE license_id=? LIMIT 1").bind(o.license_id).first(); if(!v)return jsonResponse({success:false,status:"ERROR",reasonCode:"LICENSE_VAULT_ENTRY_MISSING",requestId},409);
      const licenseKey=await decryptLicenseKeyFromVault(env,v.key_ciphertext,v.key_iv); const emailResult=await sendOrderLicenseEmail(env,{orderId:o.order_id,fullName:o.full_name,email:o.email,licenseId:o.license_id,licenseKey,planCode:o.plan_code,expiryDate:o.expiry_date}); await recordFulfillmentEmail(env,{orderId:o.order_id,licenseId:o.license_id,emailResult});
      return jsonResponse({success:emailResult.success,status:emailResult.success?"SENT":"FAILED",deliveryMode:emailResult.deliveryMode,reasonCode:emailResult.reasonCode||null,requestId},emailResult.success?200:502);
    }catch(e){return jsonResponse({success:false,status:"ERROR",reasonCode:e&&e.message==="LICENSE_VAULT_SECRET_MISSING"?"LICENSE_VAULT_NOT_CONFIGURED":"LICENSE_EMAIL_RESEND_FAILED",requestId},500);}
}


/* ============================================================
   K7_6_QA_DEMO_PAYMENT_BRIDGE
   QA ONLY:
   - No real money is charged.
   - Restricted to QA_DEMO_EMAIL.
   - Reuses the existing signed payment fulfillment engine.
   ============================================================ */
async function handleQaDemoPayment(
    request,
    env,
    requestId
) {
    const enabled =
        String(
            env &&
            env.QA_DEMO_PAYMENT_ENABLED ||
            ""
        ).toLowerCase() === "true";

    if (!enabled) {
        return jsonResponse(
            {
                success: false,
                status: "DENIED",
                reasonCode: "QA_DEMO_PAYMENT_DISABLED",
                requestId
            },
            403
        );
    }

    const allowedEmail =
        normalizeString(
            env &&
            env.QA_DEMO_EMAIL
        ).toLowerCase();

    if (!allowedEmail) {
        return jsonResponse(
            {
                success: false,
                status: "ERROR",
                reasonCode: "QA_DEMO_EMAIL_NOT_CONFIGURED",
                requestId
            },
            503
        );
    }

    let body;

    try {
        body = await request.json();
    }
    catch (_) {
        return validationError(
            "INVALID_JSON_BODY",
            requestId
        );
    }

    const orderId =
        normalizeString(body && body.orderId);

    const registrationId =
        normalizeString(
            body &&
            body.registrationId
        );

    if (!orderId || !registrationId) {
        return validationError(
            "QA_DEMO_PAYMENT_INPUT_REQUIRED",
            requestId
        );
    }

    try {
        const order =
            await env.DB.prepare(`
                SELECT
                    order_id,
                    registration_id,
                    email,
                    status,
                    license_id
                FROM web_orders
                WHERE order_id = ?
                LIMIT 1
            `)
            .bind(orderId)
            .first();

        if (!order) {
            return jsonResponse(
                {
                    success: false,
                    status: "NOT_FOUND",
                    reasonCode: "ORDER_NOT_FOUND",
                    requestId
                },
                404
            );
        }

        if (
            normalizeString(
                order.registration_id
            ) !== registrationId
        ) {
            return jsonResponse(
                {
                    success: false,
                    status: "DENIED",
                    reasonCode:
                        "QA_REGISTRATION_ORDER_MISMATCH",
                    requestId
                },
                403
            );
        }

        if (
            normalizeString(
                order.email
            ).toLowerCase() !== allowedEmail
        ) {
            return jsonResponse(
                {
                    success: false,
                    status: "DENIED",
                    reasonCode:
                        "QA_EMAIL_NOT_ALLOWED",
                    requestId
                },
                403
            );
        }

        const registration =
            await env.DB.prepare(`
                SELECT
                    registration_id,
                    email,
                    email_verified,
                    verification_status
                FROM customer_registrations
                WHERE registration_id = ?
                LIMIT 1
            `)
            .bind(registrationId)
            .first();

        if (
            !registration ||
            Number(
                registration.email_verified
            ) !== 1 ||
            String(
                registration.verification_status ||
                ""
            ).toUpperCase() !== "VERIFIED"
        ) {
            return jsonResponse(
                {
                    success: false,
                    status: "DENIED",
                    reasonCode:
                        "EMAIL_VERIFICATION_REQUIRED",
                    requestId
                },
                403
            );
        }

        if (
            normalizeString(
                registration.email
            ).toLowerCase() !== allowedEmail
        ) {
            return jsonResponse(
                {
                    success: false,
                    status: "DENIED",
                    reasonCode:
                        "QA_EMAIL_NOT_ALLOWED",
                    requestId
                },
                403
            );
        }

        if (order.license_id) {
            return jsonResponse(
                {
                    success: true,
                    status: "ALREADY_FULFILLED",
                    orderId:
                        order.order_id,
                    licenseId:
                        order.license_id,
                    qaDemo: true,
                    requestId
                },
                200,
                {
                    "Cache-Control":
                        "no-store"
                }
            );
        }

        const paymentSecret =
            normalizeString(
                env &&
                env.PAYMENT_WEBHOOK_SECRET
            );

        if (!paymentSecret) {
            return jsonResponse(
                {
                    success: false,
                    status: "ERROR",
                    reasonCode:
                        "PAYMENT_WEBHOOK_NOT_CONFIGURED",
                    requestId
                },
                503
            );
        }

        const eventId =
            "QA-DEMO-" +
            crypto.randomUUID();

        const paymentReference =
            "QA-DEMO-" +
            Date.now();

        const paymentPayload =
            JSON.stringify({
                eventId,
                orderId:
                    order.order_id,
                paymentReference,
                status: "PAID"
            });

        const signature =
            await hmacHex(
                paymentSecret,
                paymentPayload
            );

        const internalRequest =
            new Request(
                "https://internal.hxl/payments/webhook",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        "x-hxl-signature":
                            signature
                    },
                    body:
                        paymentPayload
                }
            );

        const fulfillmentResponse =
            await handlePaymentWebhook(
                internalRequest,
                env,
                requestId
            );

        return fulfillmentResponse;
    }
    catch (_) {
        return jsonResponse(
            {
                success: false,
                status: "ERROR",
                reasonCode:
                    "QA_DEMO_PAYMENT_FAILED",
                requestId
            },
            500
        );
    }
}

async function handlePaymentWebhook(request,env,requestId){
    const secret=normalizeString(env&&env.PAYMENT_WEBHOOK_SECRET); if(!secret)return jsonResponse({success:false,status:"ERROR",reasonCode:"PAYMENT_WEBHOOK_NOT_CONFIGURED",requestId},503);
    const raw=await request.text(), supplied=normalizeString(request.headers.get("x-hxl-signature")).toLowerCase(), expected=await hmacHex(secret,raw); if(!constantTimeTextEqual(supplied,expected))return jsonResponse({success:false,status:"DENIED",reasonCode:"PAYMENT_SIGNATURE_INVALID",requestId},401);
    let p;try{p=JSON.parse(raw);}catch{return validationError("INVALID_JSON_BODY",requestId);} const eventId=normalizeString(p.eventId),orderId=normalizeString(p.orderId),paymentReference=normalizeString(p.paymentReference),paid=String(p.status||"").toUpperCase()==="PAID"; if(!eventId||!orderId||!paymentReference||!paid)return validationError("PAYMENT_EVENT_INVALID",requestId);
    try{
      const prior=await env.DB.prepare("SELECT event_id FROM payment_events WHERE event_id=? LIMIT 1").bind(eventId).first(); if(prior)return jsonResponse({success:true,status:"ALREADY_PROCESSED",requestId});
      const o=await env.DB.prepare("SELECT * FROM web_orders WHERE order_id=? LIMIT 1").bind(orderId).first(); if(!o)return jsonResponse({success:false,status:"NOT_FOUND",reasonCode:"ORDER_NOT_FOUND",requestId},404); if(o.license_id)return jsonResponse({success:true,status:"ALREADY_FULFILLED",licenseId:o.license_id,requestId});
      let snapshot=null;try{snapshot=await env.DB.prepare(`SELECT plan_code,amount_minor,currency,validity_days,max_devices FROM web_order_plan_snapshots WHERE order_id=? LIMIT 1`).bind(orderId).first();}catch(_){}
      let plan=snapshot?{planCode:snapshot.plan_code,configured:true,amountMinor:Number(snapshot.amount_minor),currency:String(snapshot.currency||"INR"),days:Number(snapshot.validity_days),maxDevices:Number(snapshot.max_devices)}:await getCheckoutPlan(env,o.plan_code);
      if(!plan||!plan.configured||Number(o.amount_minor)!==plan.amountMinor||String(o.currency)!==plan.currency)return jsonResponse({success:false,status:"DENIED",reasonCode:"ORDER_PRICE_MISMATCH",requestId},409);
      let customer=await env.DB.prepare("SELECT customer_id FROM customers WHERE lower(email)=lower(?) ORDER BY created_at ASC LIMIT 1").bind(o.email).first(); const customerId=customer&&customer.customer_id||createCustomerId(); if(!customer)await env.DB.prepare("INSERT INTO customers (customer_id,full_name,email,mobile,company_name,country,status,created_at,updated_at) VALUES (?,?,?,?,?,?,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(customerId,o.full_name,o.email,o.mobile||null,o.company_name||null,o.country||null).run(); else await env.DB.prepare("UPDATE customers SET full_name=COALESCE(NULLIF(?,''),full_name),mobile=COALESCE(NULLIF(?,''),mobile),company_name=COALESCE(NULLIF(?,''),company_name),country=COALESCE(NULLIF(?,''),country),updated_at=CURRENT_TIMESTAMP WHERE customer_id=?").bind(o.full_name||'',o.mobile||'',o.company_name||'',o.country||'',customerId).run();
      let key,id,hash,last4; for(let i=0;i<8;i++){key=createWebLicenseKey();id=createWebLicenseId();hash=await sha256Hex(key);last4=key.slice(-4); const c=await env.DB.prepare("SELECT license_id FROM licenses WHERE license_id=? OR license_key_hash=? LIMIT 1").bind(id,hash).first(); if(!c)break; key=null;} if(!key)throw new Error("LICENSE_COLLISION");
      const expiry=new Date(Date.now()+plan.days*86400000).toISOString().slice(0,10); await env.DB.prepare(`INSERT INTO licenses (license_id,customer_id,license_key_hash,license_key_last4,plan_code,status,max_devices,activation_date,expiry_date,offline_grace_days,created_at,updated_at) VALUES (?,?,?,?,?,'PENDING',?,NULL,?,7,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(id,customerId,hash,last4,plan.planCode,plan.maxDevices||1,expiry).run();
      const enc=await encryptLicenseKeyForVault(env,key); await env.DB.prepare("INSERT INTO license_vault (license_id,key_ciphertext,key_iv,key_last4,updated_at) VALUES (?,?,?,?,CURRENT_TIMESTAMP)").bind(id,enc.ciphertext,enc.iv,last4).run();
      await env.DB.prepare("UPDATE web_orders SET status='PAID',payment_reference=?,license_id=?,updated_at=CURRENT_TIMESTAMP WHERE order_id=?").bind(paymentReference,id,orderId).run(); await env.DB.prepare("INSERT INTO payment_events (event_id,order_id,payment_reference,status,created_at) VALUES (?,?,?,'PAID',CURRENT_TIMESTAMP)").bind(eventId,orderId,paymentReference).run();
      const emailResult=await sendOrderLicenseEmail(env,{orderId,fullName:o.full_name,email:o.email,licenseId:id,licenseKey:key,planCode:plan.planCode,expiryDate:expiry}); await recordFulfillmentEmail(env,{orderId,licenseId:id,emailResult});
      const fulfillmentStatus=emailResult.success?"FULFILLED":"FULFILLED_EMAIL_PENDING"; await env.DB.prepare("UPDATE web_orders SET status=?,updated_at=CURRENT_TIMESTAMP WHERE order_id=?").bind(fulfillmentStatus,orderId).run();
      return jsonResponse({success:true,status:fulfillmentStatus,orderId,licenseId:id,emailStatus:emailResult.status,deliveryMode:emailResult.deliveryMode,requestId},200,{"Cache-Control":"no-store"});
    }catch(e){return jsonResponse({success:false,status:"ERROR",reasonCode:e&&e.message==="LICENSE_VAULT_SECRET_MISSING"?"LICENSE_VAULT_NOT_CONFIGURED":"PAYMENT_FULFILLMENT_FAILED",requestId},500);}
}

/* WEBSITE STEP 7 Ã¢â‚¬â€ authenticated release/download center. */
function getReleaseConfig(env) {
    const version = normalizeString(env && env.RELEASE_VERSION) || "1.0.0";
    const fileName = normalizeString(env && env.RELEASE_FILE_NAME) || "HimanshuXLTools-v1.0-Setup.exe";
    const sha256 = normalizeString(env && env.RELEASE_SHA256);
    const releaseDate = normalizeString(env && env.RELEASE_DATE);
    const notes = normalizeString(env && env.RELEASE_NOTES) || "Himanshu XL Tools production release.";
    const downloadUrl = normalizeString(env && env.RELEASE_DOWNLOAD_URL);
    const published = String(env && env.RELEASE_PUBLISHED || "false").toLowerCase() === "true";
    return { version, fileName, sha256, releaseDate, notes, published, downloadConfigured: Boolean(downloadUrl), downloadUrl };
}

function publicReleaseMetadata(env) {
    const r = getReleaseConfig(env);
    return { version:r.version,fileName:r.fileName,sha256:r.sha256,releaseDate:r.releaseDate,notes:r.notes,published:r.published,downloadConfigured:r.downloadConfigured };
}

async function requireCustomerSession(request, env) {
    try {
        const session = await verifyCustomerSessionToken(request, env);

        if (!session) {
            return null;
        }

        const access = await env.DB.prepare(`
            SELECT
                c.status AS customer_status,
                COALESCE(cl.lifecycle_status, 'ACTIVE') AS lifecycle_status
            FROM customers AS c
            LEFT JOIN customer_lifecycle AS cl
                ON cl.customer_id = c.customer_id
            WHERE c.customer_id = ?
            LIMIT 1
        `).bind(session.customerId).first();

        if (!access) {
            return null;
        }

        if (
            String(access.customer_status || "")
                .trim()
                .toUpperCase() !== "ACTIVE"
        ) {
            return null;
        }

        if (
            String(access.lifecycle_status || "ACTIVE")
                .trim()
                .toUpperCase() !== "ACTIVE"
        ) {
            return null;
        }

        return session;
    } catch {
        return null;
    }
}

async function handleCustomerRelease(request, env, requestId) {
    const session = await requireCustomerSession(request, env);
    if (!session) return jsonResponse({success:false,status:"DENIED",reasonCode:"CUSTOMER_SESSION_REQUIRED",requestId},401,{"Cache-Control":"no-store"});
    const row = await env.DB.prepare("SELECT license_id,status,expiry_date FROM licenses WHERE license_id=? AND customer_id=? LIMIT 1").bind(session.licenseId,session.customerId).first();
    if (!row || !["ACTIVE", "PENDING"].includes(String(row.status || "").toUpperCase())) {
        return jsonResponse(
            {
                success:false,
                status:"DENIED",
                reasonCode:"DOWNLOAD_LICENSE_REQUIRED",
                requestId
            },
            403,
            {"Cache-Control":"no-store"}
        );
    }
    if (row.expiry_date && row.expiry_date < new Date().toISOString().slice(0,10)) return jsonResponse({success:false,status:"DENIED",reasonCode:"LICENSE_EXPIRED",requestId},403,{"Cache-Control":"no-store"});
    /* K6_ADMIN_TO_CUSTOMER_RELEASE_SYNC */
    const centralRelease = await getPublishedCentralRelease(env);

    if (centralRelease) {
        const release = {
            version: normalizeString(centralRelease.version),
            fileName: normalizeString(centralRelease.file_name),
            sha256: normalizeString(centralRelease.sha256),
            releaseDate: normalizeString(centralRelease.release_date),
            notes: normalizeString(centralRelease.notes) ||
                "Himanshu XL Tools production release.",
            published:
                String(centralRelease.status || "").toUpperCase() ===
                "PUBLISHED",
            downloadConfigured:
                Boolean(
                    env.INSTALLER_STORAGE &&
                    normalizeString(centralRelease.version)
                )
        };

        return jsonResponse(
            {
                success:true,
                status:"OK",
                release,
                source:"CENTRAL_RELEASES",
                requestId
            },
            200,
            {"Cache-Control":"no-store"}
        );
    }

    /* Certified legacy fallback retained for recovery. */
    return jsonResponse(
        {
            success:true,
            status:"OK",
            release:publicReleaseMetadata(env),
            source:"LEGACY_RELEASE_CONFIG",
            requestId
        },
        200,
        {"Cache-Control":"no-store"}
    );
}

async function handleCustomerDownload(request, env, requestId) {
    const session = await requireCustomerSession(request, env);
    if (!session) return jsonResponse({success:false,status:"DENIED",reasonCode:"CUSTOMER_SESSION_REQUIRED",requestId},401,{"Cache-Control":"no-store"});
    const row = await env.DB.prepare("SELECT license_id,status,expiry_date FROM licenses WHERE license_id=? AND customer_id=? LIMIT 1").bind(session.licenseId,session.customerId).first();
    if (!row || !["ACTIVE", "PENDING"].includes(String(row.status || "").toUpperCase())) {
        return jsonResponse(
            {
                success:false,
                status:"DENIED",
                reasonCode:"DOWNLOAD_LICENSE_REQUIRED",
                requestId
            },
            403,
            {"Cache-Control":"no-store"}
        );
    }
    if (row.expiry_date && row.expiry_date < new Date().toISOString().slice(0,10)) return jsonResponse({success:false,status:"DENIED",reasonCode:"LICENSE_EXPIRED",requestId},403,{"Cache-Control":"no-store"});
    const release = getReleaseConfig(env);

    /* K5_KV_PROTECTED_DOWNLOAD */
    try {
        const centralRelease =
            await getPublishedCentralRelease(env);

        if (centralRelease &&
            centralRelease.version &&
            env.INSTALLER_STORAGE) {

            const safeVersion =
                String(centralRelease.version)
                    .replace(/[^A-Za-z0-9._-]/g, "_");

            const storageKey =
                `installer:${safeVersion}`;

            const stored =
                await env.INSTALLER_STORAGE.getWithMetadata(
                    storageKey,
                    { type:"arrayBuffer" }
                );

            if (stored && stored.value) {
                const metadata = stored.metadata || {};

                try {
                    await env.DB.prepare(
                        "INSERT INTO download_events (customer_id,license_id,release_version,file_name,created_at) VALUES (?,?,?,?,CURRENT_TIMESTAMP)"
                    )
                    .bind(
                        session.customerId,
                        session.licenseId,
                        centralRelease.version,
                        metadata.fileName ||
                            centralRelease.file_name ||
                            "HimanshuXLTools-Setup.exe"
                    )
                    .run();
                } catch (_) {}

                const fileName =
                    metadata.fileName ||
                    centralRelease.file_name ||
                    "HimanshuXLTools-Setup.exe";

                return new Response(
                    stored.value,
                    {
                        status:200,
                        headers:{
                            "Content-Type":
                                "application/octet-stream",
                            "Content-Disposition":
                                `attachment; filename="${String(fileName).replace(/"/g,"")}"`,
                            "Content-Length":
                                String(stored.value.byteLength),
                            "Cache-Control":
                                "private, no-store",
                            "X-Content-Type-Options":
                                "nosniff",
                            "Referrer-Policy":
                                "no-referrer"
                        }
                    }
                );
            }
        }
    } catch (_) {
        /* Existing certified HTTPS release remains fallback. */
    }
    if (!release.published || !release.downloadUrl) return jsonResponse({success:false,status:"UNAVAILABLE",reasonCode:"RELEASE_NOT_PUBLISHED",requestId},503,{"Cache-Control":"no-store"});
    try { await env.DB.prepare("INSERT INTO download_events (customer_id,license_id,release_version,file_name,created_at) VALUES (?,?,?,?,CURRENT_TIMESTAMP)").bind(session.customerId,session.licenseId,release.version,release.fileName).run(); } catch (_) {}
    try {
        const target = new URL(release.downloadUrl);

        if (target.protocol !== "https:") {
            return jsonResponse(
                {
                    success:false,
                    status:"UNAVAILABLE",
                    reasonCode:"RELEASE_FILE_UNAVAILABLE",
                    requestId
                },
                503,
                {"Cache-Control":"no-store"}
            );
        }

        return new Response(null,{
            status:302,
            headers:{
                "Location":target.toString(),
                "Cache-Control":"no-store",
                "X-Content-Type-Options":"nosniff",
                "Referrer-Policy":"no-referrer"
            }
        });
    } catch (_) {
        return jsonResponse(
            {
                success:false,
                status:"UNAVAILABLE",
                reasonCode:"RELEASE_FILE_UNAVAILABLE",
                requestId
            },
            503,
            {"Cache-Control":"no-store"}
        );
    }
}

async function handleAdminRelease(request, env, requestId) {
    const authorization = verifyAdminAuthorization(request, env);
    if (!authorization.ok) return jsonResponse({success:false,status:"DENIED",reasonCode:authorization.reasonCode,requestId},authorization.status,getAdminAuthorizationResponseHeaders(authorization));
    let downloads = 0;
    try { const r=await env.DB.prepare("SELECT COUNT(*) AS count FROM download_events").first(); downloads=Number(r&&r.count||0); } catch (_) {}
    return jsonResponse({success:true,status:"OK",release:publicReleaseMetadata(env),downloads,requestId},200,{"Cache-Control":"no-store"});
}

async function findLicenseByRawKey(env, rawLicenseKey) {
    if (!env || !env.DB || typeof env.DB.prepare !== "function") {
        throw new Error("Database binding unavailable.");
    }

    const normalizedKey = normalizeLicenseKey(rawLicenseKey);

    if (!LICENSE_KEY_PATTERN.test(normalizedKey)) {
        return null;
    }

    const licenseKeyHash = await sha256Hex(normalizedKey);

    const row = await env.DB
        .prepare(`
            SELECT
                l.license_id,
                l.customer_id,
                l.plan_code,
                l.status,
                l.max_devices,
                l.activation_date,
                l.expiry_date,
                l.update_entitlement_until,
                l.offline_grace_days,
                l.license_key_last4,
                c.status AS customer_status
            FROM licenses AS l
            INNER JOIN customers AS c
                ON c.customer_id = l.customer_id
            WHERE l.license_key_hash = ?
            LIMIT 1
        `)
        .bind(licenseKeyHash)
        .first();

    return row || null;
}

function validateCustomerAndLicenseStatus(license) {
    if (!license || typeof license !== "object") {
        return {
            ok: false,
            reasonCode: "LICENSE_NOT_FOUND"
        };
    }

    const customerStatus =
        String(license.customer_status || "").trim().toUpperCase();

    const licenseStatus =
        String(license.status || "").trim().toUpperCase();

    if (customerStatus === "BLOCKED") {
        return {
            ok: false,
            reasonCode: "CUSTOMER_BLOCKED"
        };
    }

    if (customerStatus === "INACTIVE") {
        return {
            ok: false,
            reasonCode: "CUSTOMER_INACTIVE"
        };
    }

    if (customerStatus !== "ACTIVE") {
        return {
            ok: false,
            reasonCode: "CUSTOMER_NOT_ACTIVE"
        };
    }

    if (licenseStatus === "BLOCKED") {
        return {
            ok: false,
            reasonCode: "LICENSE_BLOCKED"
        };
    }

    if (licenseStatus === "EXPIRED") {
        return {
            ok: false,
            reasonCode: "LICENSE_EXPIRED"
        };
    }

    if (licenseStatus === "DEACTIVATED") {
        return {
            ok: false,
            reasonCode: "LICENSE_DEACTIVATED"
        };
    }

    if (licenseStatus === "CANCELLED") {
        return {
            ok: false,
            reasonCode: "LICENSE_CANCELLED"
        };
    }

    if (
        licenseStatus !== "PENDING" &&
        licenseStatus !== "ACTIVE"
    ) {
        return {
            ok: false,
            reasonCode: "LICENSE_STATUS_NOT_ALLOWED"
        };
    }

    return {
        ok: true,
        customerStatus,
        licenseStatus
    };
}
function validateLicenseExpiry(license, now = new Date()) {
    if (!license || typeof license !== "object") {
        return {
            ok: false,
            reasonCode: "LICENSE_NOT_FOUND"
        };
    }

    const expiryDate =
        typeof license.expiry_date === "string"
            ? license.expiry_date.trim()
            : "";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
        return {
            ok: false,
            reasonCode: "LICENSE_EXPIRY_INVALID"
        };
    }

    const expiry =
        new Date(`${expiryDate}T23:59:59.999Z`);

    if (
        Number.isNaN(expiry.getTime()) ||
        expiry.toISOString().slice(0, 10) !== expiryDate
    ) {
        return {
            ok: false,
            reasonCode: "LICENSE_EXPIRY_INVALID"
        };
    }

    const currentTime =
        now instanceof Date
            ? now.getTime()
            : NaN;

    if (Number.isNaN(currentTime)) {
        return {
            ok: false,
            reasonCode: "SERVER_TIME_INVALID"
        };
    }

    if (currentTime > expiry.getTime()) {
        return {
            ok: false,
            reasonCode: "LICENSE_EXPIRED"
        };
    }

    return {
        ok: true,
        expiryDate
    };
}
async function hashDeviceToken(deviceToken) {
    const normalized =
        typeof deviceToken === "string"
            ? deviceToken.trim()
            : "";

    if (!normalized) {
        throw new Error("Device token is required.");
    }

    return sha256Hex(normalized);
}

function createDeviceId() {
    return `DEV-${crypto.randomUUID().replace(/-/g, "").toUpperCase()}`;
}

async function resetActiveDevice(env, license, requestId = null) {
    if (!env || !env.DB || typeof env.DB.prepare !== "function") {
        throw new Error("Database binding unavailable.");
    }

    if (!license || !license.license_id) {
        throw new Error("License is required.");
    }

    const safeRequestId =
        typeof requestId === "string" && requestId.trim()
            ? requestId.trim()
            : crypto.randomUUID();

    const activeDevice =
        await env.DB
            .prepare(`
                SELECT
                    device_id,
                    status
                FROM devices
                WHERE license_id = ?
                  AND status = 'ACTIVE'
                LIMIT 1
            `)
            .bind(license.license_id)
            .first();

    if (!activeDevice) {
        return {
            ok: false,
            reasonCode: "NO_ACTIVE_DEVICE"
        };
    }

    const resetAt =
        new Date().toISOString();

    const resetActivationId =
        `ACT-${crypto.randomUUID().replace(/-/g, "").toUpperCase()}`;

    const resetAuditId =
        `AUD-${crypto.randomUUID().replace(/-/g, "").toUpperCase()}`;

    const statements = [
        env.DB
            .prepare(`
                UPDATE devices
                SET
                    status = 'RESET',
                    reset_at = ?,
                    deactivated_at = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE device_id = ?
                  AND license_id = ?
                  AND status = 'ACTIVE'
            `)
            .bind(
                resetAt,
                resetAt,
                activeDevice.device_id,
                license.license_id
            ),

        env.DB
            .prepare(`
                INSERT INTO activations (
                    activation_id,
                    license_id,
                    device_id,
                    event_type,
                    result,
                    reason_code,
                    app_version,
                    created_at
                )
                VALUES (?, ?, ?, 'RESET_DEVICE', 'SUCCESS', ?, NULL, ?)
            `)
            .bind(
                resetActivationId,
                license.license_id,
                activeDevice.device_id,
                'ADMIN_DEVICE_RESET',
                resetAt
            ),

        env.DB
            .prepare(`
                INSERT INTO audit_logs (
                    audit_id,
                    actor_type,
                    actor_id,
                    action,
                    entity_type,
                    entity_id,
                    result,
                    reason_code,
                    request_id,
                    metadata_json,
                    created_at
                )
                VALUES (?, 'ADMIN', NULL, 'RESET_DEVICE', 'DEVICE', ?, 'SUCCESS', ?, ?, ?, ?)
            `)
            .bind(
                resetAuditId,
                activeDevice.device_id,
                'ADMIN_DEVICE_RESET',
                safeRequestId,
                JSON.stringify({
                    licenseId: license.license_id,
                    previousDeviceId: activeDevice.device_id
                }),
                resetAt
            )
    ];

    const results =
        await env.DB.batch(statements);

    return {
        ok: true,
        reset: true,
        previousDeviceId: activeDevice.device_id,
        resetAt,
        activationId: resetActivationId,
        auditId: resetAuditId,
        results
    };
}

async function activateFirstDevice(env, license, activationData, requestId = null) {
    if (!env || !env.DB || typeof env.DB.prepare !== "function") {
        throw new Error("Database binding unavailable.");
    }

    if (!license || !license.license_id) {
        throw new Error("License is required.");
    }

    const deviceTokenHash =
        await hashDeviceToken(activationData.deviceToken);

    const deviceId = createDeviceId();

    const activationId =
        `ACT-${crypto.randomUUID().replace(/-/g, "").toUpperCase()}`;

    const auditId =
        `AUD-${crypto.randomUUID().replace(/-/g, "").toUpperCase()}`;

    const safeRequestId =
        typeof requestId === "string" && requestId.trim()
            ? requestId.trim()
            : crypto.randomUUID();

    const activatedAt = new Date().toISOString();

    const existingDevice = await env.DB
        .prepare(`
            SELECT
                device_id,
                device_token_hash,
                status
            FROM devices
            WHERE license_id = ?
              AND status = 'ACTIVE'
            LIMIT 1
        `)
        .bind(license.license_id)
        .first();

    if (existingDevice) {

        // Same activated PC/device: validate instead of rejecting.
        if (existingDevice.device_token_hash === deviceTokenHash) {

            const validationId =
                `ACT-${crypto.randomUUID().replace(/-/g, "").toUpperCase()}`;

            const validationAuditId =
                `AUD-${crypto.randomUUID().replace(/-/g, "").toUpperCase()}`;

            const validatedAt = new Date().toISOString();

            const validationStatements = [
                env.DB
                    .prepare(`
                        UPDATE devices
                        SET
                            device_name = ?,
                            platform = ?,
                            app_version = ?,
                            last_seen_at = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE device_id = ?
                          AND license_id = ?
                          AND status = 'ACTIVE'
                    `)
                    .bind(
                        activationData.deviceName || null,
                        activationData.platform || null,
                        activationData.appVersion,
                        validatedAt,
                        existingDevice.device_id,
                        license.license_id
                    ),

                env.DB
                    .prepare(`
                        INSERT INTO activations (
                            activation_id,
                            license_id,
                            device_id,
                            event_type,
                            result,
                            reason_code,
                            app_version,
                            created_at
                        )
                        VALUES (?, ?, ?, 'VALIDATE', 'SUCCESS', ?, ?, ?)
                    `)
                    .bind(
                        validationId,
                        license.license_id,
                        existingDevice.device_id,
                        'DEVICE_VALIDATION_SUCCESS',
                        activationData.appVersion,
                        validatedAt
                    ),

                env.DB
                    .prepare(`
                        INSERT INTO audit_logs (
                            audit_id,
                            actor_type,
                            actor_id,
                            action,
                            entity_type,
                            entity_id,
                            result,
                            reason_code,
                            request_id,
                            metadata_json,
                            created_at
                        )
                        VALUES (?, 'API', ?, 'VALIDATE', 'LICENSE', ?, 'SUCCESS', ?, ?, ?, ?)
                    `)
                    .bind(
                        validationAuditId,
                        existingDevice.device_id,
                        license.license_id,
                        'DEVICE_VALIDATION_SUCCESS',
                        safeRequestId,
                        JSON.stringify({
                            deviceId: existingDevice.device_id,
                            platform: activationData.platform || null,
                            appVersion: activationData.appVersion
                        }),
                        validatedAt
                    )
            ];

            const validationResults =
                await env.DB.batch(validationStatements);

            return {
                ok: true,
                validated: true,
                deviceId: existingDevice.device_id,
                activationId: validationId,
                auditId: validationAuditId,
                validatedAt,
                results: validationResults
            };
        }

        // Different device: deny and record the denied attempt.
        const deniedActivationId =
            `ACT-${crypto.randomUUID().replace(/-/g, "").toUpperCase()}`;

        const deniedAuditId =
            `AUD-${crypto.randomUUID().replace(/-/g, "").toUpperCase()}`;

        const deniedAt = new Date().toISOString();

        const deniedStatements = [
            env.DB
                .prepare(`
                    INSERT INTO activations (
                        activation_id,
                        license_id,
                        device_id,
                        event_type,
                        result,
                        reason_code,
                        app_version,
                        created_at
                    )
                    VALUES (?, ?, NULL, 'ACTIVATE', 'DENIED', ?, ?, ?)
                `)
                .bind(
                    deniedActivationId,
                    license.license_id,
                    'ACTIVE_DEVICE_ALREADY_EXISTS',
                    activationData.appVersion,
                    deniedAt
                ),

            env.DB
                .prepare(`
                    INSERT INTO audit_logs (
                        audit_id,
                        actor_type,
                        actor_id,
                        action,
                        entity_type,
                        entity_id,
                        result,
                        reason_code,
                        request_id,
                        metadata_json,
                        created_at
                    )
                    VALUES (?, 'API', NULL, 'ACTIVATE', 'LICENSE', ?, 'DENIED', ?, ?, ?, ?)
                `)
                .bind(
                    deniedAuditId,
                    license.license_id,
                    'ACTIVE_DEVICE_ALREADY_EXISTS',
                    safeRequestId,
                    JSON.stringify({
                        platform: activationData.platform || null,
                        appVersion: activationData.appVersion
                    }),
                    deniedAt
                )
        ];

        await env.DB.batch(deniedStatements);

        return {
            ok: false,
            reasonCode: "ACTIVE_DEVICE_ALREADY_EXISTS"
        };
    }

    const statements = [
        env.DB
            .prepare(`
                INSERT INTO devices (
                    device_id,
                    license_id,
                    device_token_hash,
                    device_name,
                    platform,
                    app_version,
                    status,
                    activated_at,
                    last_seen_at
                )
                VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
            `)
            .bind(
                deviceId,
                license.license_id,
                deviceTokenHash,
                activationData.deviceName,
                activationData.platform,
                activationData.appVersion,
                activatedAt,
                activatedAt
            ),

        env.DB
            .prepare(`
                UPDATE licenses
                SET
                    status = 'ACTIVE',
                    activation_date =
                        COALESCE(activation_date, ?),
                    updated_at = CURRENT_TIMESTAMP
                WHERE license_id = ?
            `)
            .bind(
                activatedAt,
                license.license_id
            ),

        env.DB
            .prepare(`
                INSERT INTO activations (
                    activation_id,
                    license_id,
                    device_id,
                    event_type,
                    result,
                    reason_code,
                    app_version,
                    created_at
                )
                VALUES (?, ?, ?, 'ACTIVATE', 'SUCCESS', ?, ?, ?)
            `)
            .bind(
                activationId,
                license.license_id,
                deviceId,
                'ACTIVATION_SUCCESS',
                activationData.appVersion,
                activatedAt
            ),

        env.DB
            .prepare(`
                INSERT INTO audit_logs (
                    audit_id,
                    actor_type,
                    actor_id,
                    action,
                    entity_type,
                    entity_id,
                    result,
                    reason_code,
                    request_id,
                    metadata_json,
                    created_at
                )
                VALUES (?, 'API', ?, 'ACTIVATE', 'LICENSE', ?, 'SUCCESS', ?, ?, ?, ?)
            `)
            .bind(
                auditId,
                deviceId,
                license.license_id,
                'ACTIVATION_SUCCESS',
                safeRequestId,
                JSON.stringify({
                    deviceId,
                    platform: activationData.platform || null,
                    appVersion: activationData.appVersion
                }),
                activatedAt
            )
    ];

    const results = await env.DB.batch(statements);

    return {
        ok: true,
        deviceId,
        activationId,
        auditId,
        activatedAt,
        deviceTokenHash,
        results
    };
}
async function handleAdminCustomersList(request, env, requestId) {
    const authorization =
        verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    try {
        const result = await env.DB.prepare(`
            SELECT
                c.customer_id,
                c.full_name,
                c.email,
                c.mobile,
                c.company_name,
                c.country,
                c.status AS customer_status,
                c.created_at,
                l.license_id,
                l.plan_code,
                l.status AS license_status,
                l.activation_date,
                l.expiry_date,
                l.max_devices,
                (
                    SELECT COUNT(*)
                    FROM devices AS d
                    WHERE d.license_id = l.license_id
                      AND d.status = 'ACTIVE'
                ) AS active_device_count
            FROM customers AS c
            LEFT JOIN licenses AS l
                ON l.customer_id = c.customer_id
            LEFT JOIN customer_lifecycle AS cl
                ON cl.customer_id = c.customer_id
            WHERE COALESCE(cl.lifecycle_status, 'ACTIVE') <> 'ARCHIVED'
            ORDER BY c.created_at DESC, c.customer_id ASC
        `).all();

        const customers =
            result && Array.isArray(result.results)
                ? result.results
                : [];

        return jsonResponse({
            success: true,
            status: "OK",
            customers,
            count: customers.length,
            requestId
        });

    } catch {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "CUSTOMER_LIST_FAILED",
            requestId
        }, 500);
    }
}
async function handleAdminArchivedCustomersList(request, env, requestId) {
    const authorization =
        verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status,
        getAdminAuthorizationResponseHeaders(authorization));
    }

    try {
        const result = await env.DB.prepare(`
            SELECT
                c.customer_id,
                c.full_name,
                c.email,
                c.mobile,
                c.company_name,
                c.country,
                c.status AS customer_status,
                c.created_at,
                l.license_id,
                l.plan_code,
                l.status AS license_status,
                l.activation_date,
                l.expiry_date,
                l.max_devices,
                (
                    SELECT COUNT(*)
                    FROM devices AS d
                    WHERE d.license_id = l.license_id
                      AND d.status = 'ACTIVE'
                ) AS active_device_count
            FROM customers AS c
            LEFT JOIN licenses AS l
                ON l.customer_id = c.customer_id
            INNER JOIN customer_lifecycle AS cl
                ON cl.customer_id = c.customer_id
            WHERE cl.lifecycle_status = 'ARCHIVED'
            ORDER BY c.created_at DESC, c.customer_id ASC
        `).all();

        const customers =
            result && Array.isArray(result.results)
                ? result.results
                : [];

        return jsonResponse({
            success: true,
            status: "OK",
            customers,
            count: customers.length,
            requestId
        });
    } catch {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "ARCHIVED_CUSTOMER_LIST_FAILED",
            requestId
        }, 500);
    }
}
async function handleAdminCustomerDetail(request, env, requestId, customerId) {
    const authorization = verifyAdminAuthorization(request, env);
    if (!authorization.ok) return jsonResponse({ success: false, status: "DENIED", reasonCode: authorization.reasonCode, requestId }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));

    const safeCustomerId = normalizeString(customerId);
    if (!safeCustomerId) return validationError("CUSTOMER_ID_REQUIRED", requestId);

    try {
        const customer = await env.DB.prepare(`
            SELECT customer_id, full_name, email, mobile, company_name, country, status, notes, created_at, updated_at
            FROM customers WHERE customer_id = ? LIMIT 1
        `).bind(safeCustomerId).first();
        if (!customer) return jsonResponse({ success: false, status: "NOT_FOUND", reasonCode: "CUSTOMER_NOT_FOUND", requestId }, 404);

        const lifecycleRow = await env.DB.prepare(`
            SELECT lifecycle_status, reason_code, deactivated_at, archived_at,
                   recovery_until, last_action, last_request_id, created_at, updated_at
            FROM customer_lifecycle
            WHERE customer_id = ?
            LIMIT 1
        `).bind(safeCustomerId).first();

        const lifecycle = lifecycleRow
            ? {
                status: normalizeString(lifecycleRow.lifecycle_status).toUpperCase() || "ACTIVE",
                reasonCode: lifecycleRow.reason_code || null,
                deactivatedAt: lifecycleRow.deactivated_at || null,
                archivedAt: lifecycleRow.archived_at || null,
                recoveryUntil: lifecycleRow.recovery_until || null,
                lastAction: lifecycleRow.last_action || null,
                lastRequestId: lifecycleRow.last_request_id || null,
                createdAt: lifecycleRow.created_at || null,
                updatedAt: lifecycleRow.updated_at || null
            }
            : {
                status: "ACTIVE",
                reasonCode: null,
                deactivatedAt: null,
                archivedAt: null,
                recoveryUntil: null,
                lastAction: null,
                lastRequestId: null,
                createdAt: null,
                updatedAt: null
            };

        const licensesResult = await env.DB.prepare(`
            SELECT license_id, plan_code, status, max_devices, activation_date, expiry_date,
                   update_entitlement_until, offline_grace_days, created_at, updated_at
            FROM licenses WHERE customer_id = ? ORDER BY created_at DESC
        `).bind(safeCustomerId).all();
        const licenses = licensesResult && Array.isArray(licensesResult.results) ? licensesResult.results : [];
        const licenseIds = licenses.map(item => item.license_id).filter(Boolean);
        let devices = [];
        let renewals = [];

        for (const licenseId of licenseIds) {
            const deviceResult = await env.DB.prepare(`
                SELECT device_id, license_id, device_name, platform, app_version, status,
                       activated_at, last_seen_at, deactivated_at, reset_at, created_at, updated_at
                FROM devices WHERE license_id = ? ORDER BY created_at DESC
            `).bind(licenseId).all();
            devices.push(...(deviceResult.results || []));

            const renewalResult = await env.DB.prepare(`
                SELECT renewal_id, license_id, old_expiry_date, new_expiry_date, renewal_days,
                       amount_minor, currency, payment_reference, status, notes, created_at
                FROM renewals WHERE license_id = ? ORDER BY created_at DESC
            `).bind(licenseId).all();
            renewals.push(...(renewalResult.results || []));
        }

        /* K7_CUSTOMER_360 */
        let orders = [];
        let payments = [];
        let activity = [];

        if (customer.email) {
            const orderResult = await env.DB.prepare(`
                SELECT order_id, email, full_name, plan_code, amount_minor, currency, status,
                       payment_reference, license_id, created_at, updated_at
                FROM web_orders
                WHERE LOWER(email) = LOWER(?)
                ORDER BY created_at DESC
                LIMIT 100
            `).bind(customer.email).all();
            orders = orderResult && Array.isArray(orderResult.results) ? orderResult.results : [];
        }

        for (const order of orders) {
            const paymentResult = await env.DB.prepare(`
                SELECT event_id, order_id, payment_reference, status, created_at
                FROM payment_events
                WHERE order_id = ?
                ORDER BY created_at DESC
            `).bind(order.order_id).all();
            payments.push(...((paymentResult && paymentResult.results) || []));
        }

        activity.push({ type: "CUSTOMER", label: "Customer created", at: customer.created_at });
        for (const item of licenses) activity.push({ type: "LICENSE", label: `License ${item.license_id} - ${item.status}`, at: item.updated_at || item.created_at });
        for (const item of devices) activity.push({ type: "DEVICE", label: `${item.device_name || item.device_id} - ${item.status}`, at: item.last_seen_at || item.activated_at || item.created_at });
        for (const item of orders) activity.push({ type: "ORDER", label: `Order ${item.order_id} - ${item.status}`, at: item.updated_at || item.created_at });
        for (const item of payments) activity.push({ type: "PAYMENT", label: `Payment ${item.payment_reference || item.event_id} - ${item.status}`, at: item.created_at });
        for (const item of renewals) activity.push({ type: "RENEWAL", label: `Renewal ${item.renewal_id} - ${item.status}`, at: item.created_at });
        activity = activity.filter(item => item.at).sort((a,b) => String(b.at).localeCompare(String(a.at))).slice(0,100);

        return jsonResponse({
            success: true,
            status: "OK",
            customer,
            lifecycle,
            licenses,
            devices,
            orders,
            payments,
            renewals,
            activity,
            requestId
        });
    } catch {
        return jsonResponse({ success: false, status: "ERROR", reasonCode: "CUSTOMER_DETAIL_FAILED", requestId }, 500);
    }
}

async function handleAdminCustomerCreate(request, env, requestId) {
    const authorization = verifyAdminAuthorization(request, env);
    if (!authorization.ok) return jsonResponse({ success: false, status: "DENIED", reasonCode: authorization.reasonCode, requestId }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json")) return validationError("CONTENT_TYPE_JSON_REQUIRED", requestId, 415);

    let payload;
    try { payload = await request.json(); } catch { return validationError("INVALID_JSON_BODY", requestId); }
    const fullName = normalizeString(payload && payload.fullName);
    if (!fullName) return validationError("FULL_NAME_REQUIRED", requestId);

    const customerId = normalizeString(payload.customerId) || `CUS-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
    const email = normalizeString(payload.email) || null;
    const mobile = normalizeString(payload.mobile) || null;
    const companyName = normalizeString(payload.companyName) || null;
    const country = (normalizeString(payload.country) || "IN").toUpperCase();
    const status = (normalizeString(payload.status) || "ACTIVE").toUpperCase();
    const notes = normalizeString(payload.notes) || null;
    if (!["ACTIVE", "BLOCKED", "INACTIVE"].includes(status)) return validationError("CUSTOMER_STATUS_INVALID", requestId);

    try {
        const existing = await env.DB.prepare("SELECT customer_id FROM customers WHERE customer_id = ? LIMIT 1").bind(customerId).first();
        if (existing) return jsonResponse({ success: false, status: "CONFLICT", reasonCode: "CUSTOMER_ALREADY_EXISTS", requestId }, 409);
        await env.DB.prepare(`
            INSERT INTO customers (customer_id, full_name, email, mobile, company_name, country, status, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(customerId, fullName, email, mobile, companyName, country, status, notes).run();
        return jsonResponse({ success: true, status: "CREATED", customerId, requestId }, 201);
    } catch {
        return jsonResponse({ success: false, status: "ERROR", reasonCode: "CUSTOMER_CREATE_FAILED", requestId }, 500);
    }
}

async function handleAdminCustomerUpdate(request, env, requestId, customerId) {
    const authorization = verifyAdminAuthorization(request, env);
    if (!authorization.ok) return jsonResponse({ success: false, status: "DENIED", reasonCode: authorization.reasonCode, requestId }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json")) return validationError("CONTENT_TYPE_JSON_REQUIRED", requestId, 415);
    let payload;
    try { payload = await request.json(); } catch { return validationError("INVALID_JSON_BODY", requestId); }
    const safeCustomerId = normalizeString(customerId);
    if (!safeCustomerId) return validationError("CUSTOMER_ID_REQUIRED", requestId);

    try {
        const current = await env.DB.prepare("SELECT * FROM customers WHERE customer_id = ? LIMIT 1").bind(safeCustomerId).first();
        if (!current) return jsonResponse({ success: false, status: "NOT_FOUND", reasonCode: "CUSTOMER_NOT_FOUND", requestId }, 404);

        const lifecycle = await env.DB.prepare(`
            SELECT lifecycle_status
            FROM customer_lifecycle
            WHERE customer_id = ?
            LIMIT 1
        `).bind(safeCustomerId).first();

        const lifecycleStatus =
            normalizeString(
                lifecycle && lifecycle.lifecycle_status
                    ? lifecycle.lifecycle_status
                    : "ACTIVE"
            ).toUpperCase();

        const currentStatus =
            normalizeString(current.status).toUpperCase();

        const status =
            payload.status === undefined
                ? currentStatus
                : normalizeString(payload.status).toUpperCase();

        if (!["ACTIVE", "BLOCKED", "INACTIVE"].includes(status)) {
            return validationError("CUSTOMER_STATUS_INVALID", requestId);
        }

        if (
            payload.status !== undefined &&
            status !== currentStatus
        ) {
            return jsonResponse({
                success: false,
                status: "DENIED",
                reasonCode:
                    "CUSTOMER_STATUS_DEDICATED_ACTION_REQUIRED",
                lifecycleStatus,
                currentStatus,
                requestedStatus: status,
                requestId
            }, 409, {
                "Cache-Control": "no-store"
            });
        }

        if (
            lifecycleStatus === "DEACTIVATED" &&
            status !== "INACTIVE"
        ) {
            return jsonResponse({
                success: false,
                status: "DENIED",
                reasonCode: "CUSTOMER_LIFECYCLE_RESTORE_REQUIRED",
                lifecycleStatus,
                requestId
            }, 409);
        }

        if (
            lifecycleStatus === "ARCHIVED" &&
            status !== "INACTIVE"
        ) {
            return jsonResponse({
                success: false,
                status: "DENIED",
                reasonCode: "CUSTOMER_LIFECYCLE_RESTORE_REQUIRED",
                lifecycleStatus,
                requestId
            }, 409);
        }

        const fullName = payload.fullName === undefined ? current.full_name : normalizeString(payload.fullName);
        if (!fullName) return validationError("FULL_NAME_REQUIRED", requestId);
        const value = (key, column) => payload[key] === undefined ? current[column] : (normalizeString(payload[key]) || null);
        await env.DB.prepare(`
            UPDATE customers SET full_name=?, email=?, mobile=?, company_name=?, country=?, status=?, notes=?, updated_at=CURRENT_TIMESTAMP
            WHERE customer_id=?
        `).bind(fullName, value("email","email"), value("mobile","mobile"), value("companyName","company_name"),
                payload.country === undefined ? current.country : (normalizeString(payload.country) || "IN").toUpperCase(),
                status, value("notes","notes"), safeCustomerId).run();
        return jsonResponse({ success: true, status: "UPDATED", customerId: safeCustomerId, requestId });
    } catch {
        return jsonResponse({ success: false, status: "ERROR", reasonCode: "CUSTOMER_UPDATE_FAILED", requestId }, 500);
    }
}

/* ============================================================
   S2_INDIVIDUAL_STAFF_ACCOUNTS_V2

   Individual staff credentials.
   Roles -> S3
   MFA   -> S5
   Sessions / Devices -> S11

   Existing ADMIN_RESET_SECRET authorization remains unchanged.
   ============================================================ */

const STAFF_PASSWORD_ALGORITHM = "PBKDF2-SHA256";
const STAFF_PASSWORD_ITERATIONS = 100000;
const STAFF_PASSWORD_MIN_LENGTH = 12;
const STAFF_PASSWORD_MAX_LENGTH = 128;
const STAFF_LOGIN_MAX_FAILURES = 5;
const STAFF_LOGIN_LOCK_MINUTES = 15;

function createStaffAccountId() {
    return (
        "SUA-" +
        crypto.randomUUID()
            .replace(/-/g, "")
            .slice(0, 20)
            .toUpperCase()
    );
}

function s2BytesToBase64(bytes) {
    let binary = "";

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary);
}

function s2Base64ToBytes(value) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}

function s2TimingSafeEqual(left, right) {
    if (
        typeof left !== "string" ||
        typeof right !== "string"
    ) {
        return false;
    }

    const leftBytes = new TextEncoder().encode(left);
    const rightBytes = new TextEncoder().encode(right);

    const maxLength = Math.max(
        leftBytes.length,
        rightBytes.length
    );

    let diff = leftBytes.length ^ rightBytes.length;

    for (let i = 0; i < maxLength; i += 1) {
        diff |=
            (leftBytes[i] || 0) ^
            (rightBytes[i] || 0);
    }

    return diff === 0;
}

function validateStaffPasswordV2(password) {
    if (typeof password !== "string") {
        return {
            ok: false,
            reasonCode: "STAFF_PASSWORD_REQUIRED"
        };
    }

    if (
        password.length < STAFF_PASSWORD_MIN_LENGTH ||
        password.length > STAFF_PASSWORD_MAX_LENGTH
    ) {
        return {
            ok: false,
            reasonCode: "STAFF_PASSWORD_LENGTH_INVALID"
        };
    }

    return { ok: true };
}

async function deriveStaffPasswordHashV2(
    password,
    saltBytes,
    iterations = STAFF_PASSWORD_ITERATIONS
) {
    const material =
        await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(password),
            "PBKDF2",
            false,
            ["deriveBits"]
        );

    const bits =
        await crypto.subtle.deriveBits(
            {
                name: "PBKDF2",
                hash: "SHA-256",
                salt: saltBytes,
                iterations
            },
            material,
            256
        );

    return s2BytesToBase64(
        new Uint8Array(bits)
    );
}
async function createStaffPasswordRecordV2(password) {
    const salt =
        crypto.getRandomValues(
            new Uint8Array(16)
        );

    const hash =
        await deriveStaffPasswordHashV2(
            password,
            salt,
            STAFF_PASSWORD_ITERATIONS
        );

    return {
        hash,
        salt: s2BytesToBase64(salt),
        iterations: STAFF_PASSWORD_ITERATIONS,
        algorithm: STAFF_PASSWORD_ALGORITHM
    };
}

async function verifyStaffPasswordV2(
    password,
    account
) {
    if (
        !account ||
        account.password_algorithm !==
            STAFF_PASSWORD_ALGORITHM ||
        !account.password_salt ||
        !account.password_hash
    ) {
        return false;
    }

    const iterations =
        Number(account.password_iterations);

    if (
        !Number.isInteger(iterations) ||
        iterations < 100000 ||
        iterations > 1000000
    ) {
        return false;
    }

    try {
        const supplied =
            await deriveStaffPasswordHashV2(
                password,
                s2Base64ToBytes(
                    account.password_salt
                ),
                iterations
            );

        return s2TimingSafeEqual(
            supplied,
            account.password_hash
        );
    } catch {
        return false;
    }
}

async function writeStaffAccountAuditV2(
    env,
    action,
    accountId,
    staffId,
    requestId,
    reasonCode
) {
    await env.DB.prepare(
        "INSERT INTO audit_logs " +
        "(audit_id, actor_type, actor_id, action, " +
        "entity_type, entity_id, result, reason_code, " +
        "request_id, metadata_json, created_at) " +
        "VALUES (?, 'ADMIN', NULL, ?, 'STAFF', ?, " +
        "'SUCCESS', ?, ?, ?, CURRENT_TIMESTAMP)"
    ).bind(
        "AUD-" + crypto.randomUUID(),
        action,
        staffId,
        reasonCode,
        requestId,
        JSON.stringify({
            staffId,
            accountId
        })
    ).run();
}

async function handleAdminStaffAccountListV2(
    request,
    env,
    requestId
) {
    const authorization =
        verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse(
            {
                success: false,
                status: "DENIED",
                reasonCode:
                    authorization.reasonCode,
                requestId
            },
            authorization.status,
            getAdminAuthorizationResponseHeaders(
                authorization
            )
        );
    }

    try {
        const result =
            await env.DB.prepare(
                "SELECT " +
                "a.account_id, " +
                "a.staff_id, " +
                "a.login_email, " +
                "a.status, " +
                "a.password_algorithm, " +
                "a.password_iterations, " +
                "a.password_changed_at, " +
                "a.last_login_at, " +
                "a.failed_login_count, " +
                "a.locked_at, " +
                "a.created_at, " +
                "a.updated_at, " +
                "s.full_name, " +
                "s.status AS staff_status " +
                "FROM staff_user_accounts a " +
                "JOIN staff_accounts s " +
                "ON s.staff_id = a.staff_id " +
                "ORDER BY a.created_at DESC"
            ).all();

        return jsonResponse({
            success: true,
            status: "OK",
            accounts: result.results || [],
            requestId
        });
    } catch {
        return jsonResponse(
            {
                success: false,
                status: "ERROR",
                reasonCode:
                    "STAFF_ACCOUNT_LIST_FAILED",
                requestId
            },
            500
        );
    }
}

async function handleAdminStaffAccountCreateV2(
    request,
    env,
    requestId
) {
    const authorization =
        verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse(
            {
                success: false,
                status: "DENIED",
                reasonCode:
                    authorization.reasonCode,
                requestId
            },
            authorization.status,
            getAdminAuthorizationResponseHeaders(
                authorization
            )
        );
    }

    let payload;

    try {
        payload = await request.json();
    } catch {
        return validationError(
            "INVALID_JSON_BODY",
            requestId
        );
    }

    const staffId =
        normalizeString(
            payload && payload.staffId
        );

    const loginEmail =
        normalizeString(
            payload && payload.loginEmail
        ).toLowerCase();

    const password =
        payload &&
        typeof payload.password === "string"
            ? payload.password
            : "";

    if (!staffId) {
        return validationError(
            "STAFF_ID_REQUIRED",
            requestId
        );
    }

    if (
        !loginEmail ||
        !/^\S+@\S+\.\S+$/.test(loginEmail) ||
        loginEmail.length > 254
    ) {
        return validationError(
            "STAFF_LOGIN_EMAIL_INVALID",
            requestId
        );
    }

    const passwordCheck =
        validateStaffPasswordV2(password);

    if (!passwordCheck.ok) {
        return validationError(
            passwordCheck.reasonCode,
            requestId
        );
    }

    let createStage = "STAFF_LOOKUP";

    try {
        const staff =
            await env.DB.prepare(
                "SELECT staff_id, status " +
                "FROM staff_accounts " +
                "WHERE staff_id = ? LIMIT 1"
            ).bind(staffId).first();

        if (!staff) {
            return jsonResponse(
                {
                    success: false,
                    status: "NOT_FOUND",
                    reasonCode: "STAFF_NOT_FOUND",
                    requestId
                },
                404
            );
        }

        if (
            normalizeString(staff.status)
                .toUpperCase() !== "ACTIVE"
        ) {
            return jsonResponse(
                {
                    success: false,
                    status: "CONFLICT",
                    reasonCode:
                        "STAFF_NOT_ACTIVE",
                    requestId
                },
                409
            );
        }

        createStage = "DUPLICATE_CHECK";

        const existing =
            await env.DB.prepare(
                "SELECT account_id " +
                "FROM staff_user_accounts " +
                "WHERE staff_id = ? " +
                "OR login_email = ? LIMIT 1"
            ).bind(
                staffId,
                loginEmail
            ).first();

        if (existing) {
            return jsonResponse(
                {
                    success: false,
                    status: "CONFLICT",
                    reasonCode:
                        "STAFF_ACCOUNT_ALREADY_EXISTS",
                    requestId
                },
                409
            );
        }

        createStage = "ACCOUNT_ID";

        const accountId =
            createStaffAccountId();

        createStage = "PASSWORD_HASH";

        const passwordRecord =
            await createStaffPasswordRecordV2(
                password
            );

        createStage = "ACCOUNT_INSERT";

        await env.DB.prepare(
            "INSERT INTO staff_user_accounts (" +
            "account_id, staff_id, login_email, " +
            "password_hash, password_salt, " +
            "password_iterations, password_algorithm, " +
            "status, password_changed_at, " +
            "failed_login_count, created_at, updated_at, " +
            "created_by, updated_by" +
            ") VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', " +
            "CURRENT_TIMESTAMP, 0, CURRENT_TIMESTAMP, " +
            "CURRENT_TIMESTAMP, 'ADMIN', 'ADMIN')"
        ).bind(
            accountId,
            staffId,
            loginEmail,
            passwordRecord.hash,
            passwordRecord.salt,
            passwordRecord.iterations,
            passwordRecord.algorithm
        ).run();

        createStage = "AUDIT_WRITE";

        await writeStaffAccountAuditV2(
            env,
            "CREATE_STAFF_ACCOUNT",
            accountId,
            staffId,
            requestId,
            "ADMIN_STAFF_ACCOUNT_CREATE"
        );

        return jsonResponse(
            {
                success: true,
                status: "CREATED",
                accountId,
                staffId,
                requestId
            },
            201
        );
    } catch (error) {
        console.error(
            "S2 staff account create failed",
            {
                stage: createStage,
                errorName:
                    error && error.name
                        ? String(error.name)
                        : "Error"
            }
        );

        return jsonResponse(
            {
                success: false,
                status: "ERROR",
                reasonCode:
                    "STAFF_ACCOUNT_CREATE_FAILED",
                requestId
            },
            500
        );
    }
}

async function handleAdminStaffAccountDeactivateV2(
    request,
    env,
    requestId,
    accountId
) {
    const authorization =
        verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse(
            {
                success: false,
                status: "DENIED",
                reasonCode:
                    authorization.reasonCode,
                requestId
            },
            authorization.status,
            getAdminAuthorizationResponseHeaders(
                authorization
            )
        );
    }

    const safeAccountId =
        normalizeString(accountId);

    try {
        const account =
            await env.DB.prepare(
                "SELECT account_id, staff_id, status " +
                "FROM staff_user_accounts " +
                "WHERE account_id = ? LIMIT 1"
            ).bind(safeAccountId).first();

        if (!account) {
            return jsonResponse(
                {
                    success: false,
                    status: "NOT_FOUND",
                    reasonCode:
                        "STAFF_ACCOUNT_NOT_FOUND",
                    requestId
                },
                404
            );
        }

        if (account.status === "INACTIVE") {
            return jsonResponse({
                success: true,
                status: "ALREADY_INACTIVE",
                accountId: safeAccountId,
                requestId
            });
        }

        await env.DB.prepare(
            "UPDATE staff_user_accounts " +
            "SET status = 'INACTIVE', " +
            "updated_at = CURRENT_TIMESTAMP, " +
            "updated_by = 'ADMIN' " +
            "WHERE account_id = ?"
        ).bind(safeAccountId).run();

        await writeStaffAccountAuditV2(
            env,
            "DEACTIVATE_STAFF_ACCOUNT",
            safeAccountId,
            account.staff_id,
            requestId,
            "ADMIN_STAFF_ACCOUNT_DEACTIVATE"
        );

        return jsonResponse({
            success: true,
            status: "DEACTIVATED",
            accountId: safeAccountId,
            requestId
        });
    } catch {
        return jsonResponse(
            {
                success: false,
                status: "ERROR",
                reasonCode:
                    "STAFF_ACCOUNT_DEACTIVATE_FAILED",
                requestId
            },
            500
        );
    }
}

async function handleAdminStaffPasswordResetV2(
    request,
    env,
    requestId,
    accountId
) {
    const authorization =
        verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse(
            {
                success: false,
                status: "DENIED",
                reasonCode:
                    authorization.reasonCode,
                requestId
            },
            authorization.status,
            getAdminAuthorizationResponseHeaders(
                authorization
            )
        );
    }

    let payload;

    try {
        payload = await request.json();
    } catch {
        return validationError(
            "INVALID_JSON_BODY",
            requestId
        );
    }

    const password =
        payload &&
        typeof payload.password === "string"
            ? payload.password
            : "";

    const passwordCheck =
        validateStaffPasswordV2(password);

    if (!passwordCheck.ok) {
        return validationError(
            passwordCheck.reasonCode,
            requestId
        );
    }

    const safeAccountId =
        normalizeString(accountId);

    try {
        const account =
            await env.DB.prepare(
                "SELECT account_id, staff_id " +
                "FROM staff_user_accounts " +
                "WHERE account_id = ? LIMIT 1"
            ).bind(safeAccountId).first();

        if (!account) {
            return jsonResponse(
                {
                    success: false,
                    status: "NOT_FOUND",
                    reasonCode:
                        "STAFF_ACCOUNT_NOT_FOUND",
                    requestId
                },
                404
            );
        }

        const record =
            await createStaffPasswordRecordV2(
                password
            );

        await env.DB.prepare(
            "UPDATE staff_user_accounts SET " +
            "password_hash = ?, " +
            "password_salt = ?, " +
            "password_iterations = ?, " +
            "password_algorithm = ?, " +
            "password_changed_at = CURRENT_TIMESTAMP, " +
            "failed_login_count = 0, " +
            "locked_at = NULL, " +
            "status = CASE " +
            "WHEN status = 'LOCKED' THEN 'ACTIVE' " +
            "ELSE status END, " +
            "updated_at = CURRENT_TIMESTAMP, " +
            "updated_by = 'ADMIN' " +
            "WHERE account_id = ?"
        ).bind(
            record.hash,
            record.salt,
            record.iterations,
            record.algorithm,
            safeAccountId
        ).run();

        await writeStaffAccountAuditV2(
            env,
            "RESET_STAFF_PASSWORD",
            safeAccountId,
            account.staff_id,
            requestId,
            "ADMIN_STAFF_PASSWORD_RESET"
        );

        return jsonResponse({
            success: true,
            status: "PASSWORD_RESET",
            accountId: safeAccountId,
            requestId
        });
    } catch {
        return jsonResponse(
            {
                success: false,
                status: "ERROR",
                reasonCode:
                    "STAFF_PASSWORD_RESET_FAILED",
                requestId
            },
            500
        );
    }
}

async function handleStaffLoginVerifyV2(
    request,
    env,
    requestId
) {
    let payload;

    try {
        payload = await request.json();
    } catch {
        return validationError(
            "INVALID_JSON_BODY",
            requestId
        );
    }

    const loginEmail =
        normalizeString(
            payload && payload.loginEmail
        ).toLowerCase();

    const password =
        payload &&
        typeof payload.password === "string"
            ? payload.password
            : "";

    if (
        !loginEmail ||
        !password ||
        loginEmail.length > 254 ||
        password.length > STAFF_PASSWORD_MAX_LENGTH
    ) {
        return jsonResponse(
            {
                success: false,
                status: "DENIED",
                reasonCode:
                    "STAFF_LOGIN_INVALID",
                requestId
            },
            401,
            { "Cache-Control": "no-store" }
        );
    }

    try {
        const account =
            await env.DB.prepare(
                "SELECT " +
                "a.account_id, a.staff_id, " +
                "a.login_email, a.password_hash, " +
                "a.password_salt, " +
                "a.password_iterations, " +
                "a.password_algorithm, a.status, " +
                "a.failed_login_count, " +
                "s.full_name, " +
                "s.status AS staff_status " +
                "FROM staff_user_accounts a " +
                "JOIN staff_accounts s " +
                "ON s.staff_id = a.staff_id " +
                "WHERE a.login_email = ? LIMIT 1"
            ).bind(loginEmail).first();

        if (!account) {
            return jsonResponse(
                {
                    success: false,
                    status: "DENIED",
                    reasonCode:
                        "STAFF_LOGIN_INVALID",
                    requestId
                },
                401,
                { "Cache-Control": "no-store" }
            );
        }

        if (account.status === "LOCKED") {
            const lockRow =
                await env.DB.prepare(
                    "SELECT " +
                    "CASE WHEN locked_at IS NOT NULL " +
                    "AND datetime(locked_at, '+' || ? || ' minutes') " +
                    "<= CURRENT_TIMESTAMP " +
                    "THEN 1 ELSE 0 END AS expired " +
                    "FROM staff_user_accounts " +
                    "WHERE account_id = ?"
                ).bind(
                    STAFF_LOGIN_LOCK_MINUTES,
                    account.account_id
                ).first();

            if (
                lockRow &&
                Number(lockRow.expired) === 1
            ) {
                await env.DB.prepare(
                    "UPDATE staff_user_accounts SET " +
                    "status = 'ACTIVE', " +
                    "failed_login_count = 0, " +
                    "locked_at = NULL, " +
                    "updated_at = CURRENT_TIMESTAMP " +
                    "WHERE account_id = ? " +
                    "AND status = 'LOCKED'"
                ).bind(
                    account.account_id
                ).run();

                account.status = "ACTIVE";
                account.failed_login_count = 0;
            } else {
                return jsonResponse(
                    {
                        success: false,
                        status: "LOCKED",
                        reasonCode:
                            "STAFF_ACCOUNT_TEMPORARILY_LOCKED",
                        retryAfterMinutes:
                            STAFF_LOGIN_LOCK_MINUTES,
                        requestId
                    },
                    423,
                    {
                        "Cache-Control": "no-store",
                        "Retry-After": String(
                            STAFF_LOGIN_LOCK_MINUTES * 60
                        )
                    }
                );
            }
        }

        if (
            account.status !== "ACTIVE" ||
            normalizeString(
                account.staff_status
            ).toUpperCase() !== "ACTIVE"
        ) {
            return jsonResponse(
                {
                    success: false,
                    status: "DENIED",
                    reasonCode:
                        "STAFF_ACCOUNT_INACTIVE",
                    requestId
                },
                403,
                { "Cache-Control": "no-store" }
            );
        }

        const valid =
            await verifyStaffPasswordV2(
                password,
                account
            );

        if (!valid) {
            const failures =
                Number(
                    account.failed_login_count || 0
                ) + 1;

            const lock =
                failures >=
                STAFF_LOGIN_MAX_FAILURES;

            await env.DB.prepare(
                "UPDATE staff_user_accounts SET " +
                "failed_login_count = ?, " +
                "status = CASE WHEN ? = 1 " +
                "THEN 'LOCKED' ELSE status END, " +
                "locked_at = CASE WHEN ? = 1 " +
                "THEN CURRENT_TIMESTAMP " +
                "ELSE locked_at END, " +
                "updated_at = CURRENT_TIMESTAMP " +
                "WHERE account_id = ?"
            ).bind(
                failures,
                lock ? 1 : 0,
                lock ? 1 : 0,
                account.account_id
            ).run();

            return jsonResponse(
                {
                    success: false,
                    status:
                        lock ? "LOCKED" : "DENIED",
                    reasonCode:
                        lock
                            ? "STAFF_ACCOUNT_LOCKED"
                            : "STAFF_LOGIN_INVALID",
                    requestId
                },
                lock ? 423 : 401,
                { "Cache-Control": "no-store" }
            );
        }

        await env.DB.prepare(
            "UPDATE staff_user_accounts SET " +
            "failed_login_count = 0, " +
            "locked_at = NULL, " +
            "last_login_at = CURRENT_TIMESTAMP, " +
            "updated_at = CURRENT_TIMESTAMP " +
            "WHERE account_id = ?"
        ).bind(account.account_id).run();

        return jsonResponse(
            {
                success: true,
                status: "AUTHENTICATED",
                account: {
                    accountId:
                        account.account_id,
                    staffId:
                        account.staff_id,
                    fullName:
                        account.full_name,
                    loginEmail:
                        account.login_email
                },

                // Session issuance intentionally belongs
                // to S11 Session / Device Management.
                sessionIssued: false,
                requestId
            },
            200,
            { "Cache-Control": "no-store" }
        );
    } catch {
        return jsonResponse(
            {
                success: false,
                status: "ERROR",
                reasonCode:
                    "STAFF_LOGIN_FAILED",
                requestId
            },
            500,
            { "Cache-Control": "no-store" }
        );
    }
}

/* END S2_INDIVIDUAL_STAFF_ACCOUNTS_V2 */


/* ============================================================
   S1 STAFF / TEAM MANAGEMENT
   ============================================================ */

async function handleAdminStaffList(request, env, requestId) {
    const authorization = verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status,
        getAdminAuthorizationResponseHeaders(authorization));
    }

    try {
        const result = await env.DB.prepare(`
            SELECT
                staff_id,
                full_name,
                email,
                status,
                created_at,
                updated_at,
                deactivated_at,
                created_by,
                updated_by
            FROM staff_accounts
            ORDER BY created_at DESC
        `).all();

        return jsonResponse({
            success: true,
            status: "OK",
            staff: result.results || [],
            requestId
        });
    } catch {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "STAFF_LIST_FAILED",
            requestId
        }, 500);
    }
}

async function handleAdminStaffCreate(request, env, requestId) {
    const authorization = verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status,
        getAdminAuthorizationResponseHeaders(authorization));
    }

    if (!(request.headers.get("content-type") || "")
        .toLowerCase()
        .includes("application/json")) {
        return validationError(
            "CONTENT_TYPE_JSON_REQUIRED",
            requestId,
            415
        );
    }

    let payload;

    try {
        payload = await request.json();
    } catch {
        return validationError("INVALID_JSON_BODY", requestId);
    }

    const fullName =
        normalizeString(payload && payload.fullName);

    const email =
        normalizeString(payload && payload.email)
            .toLowerCase();

    if (!fullName) {
        return validationError(
            "STAFF_FULL_NAME_REQUIRED",
            requestId
        );
    }

    if (!email || !email.includes("@")) {
        return validationError(
            "STAFF_EMAIL_INVALID",
            requestId
        );
    }

    const staffId =
        `STF-${crypto.randomUUID()
            .replace(/-/g, "")
            .slice(0, 16)
            .toUpperCase()}`;

    try {
        const existing =
            await env.DB.prepare(`
                SELECT staff_id
                FROM staff_accounts
                WHERE email = ?
                LIMIT 1
            `).bind(email).first();

        if (existing) {
            return jsonResponse({
                success: false,
                status: "CONFLICT",
                reasonCode: "STAFF_EMAIL_ALREADY_EXISTS",
                requestId
            }, 409);
        }

        const auditId =
            `AUD-${crypto.randomUUID()}`;

        await env.DB.batch([
            env.DB.prepare(`
                INSERT INTO staff_accounts (
                    staff_id,
                    full_name,
                    email,
                    status,
                    created_at,
                    updated_at,
                    created_by,
                    updated_by
                )
                VALUES (
                    ?, ?, ?, 'ACTIVE',
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP,
                    'ADMIN',
                    'ADMIN'
                )
            `).bind(
                staffId,
                fullName,
                email
            ),

            env.DB.prepare(`
                INSERT INTO audit_logs (
                    audit_id,
                    actor_type,
                    actor_id,
                    action,
                    entity_type,
                    entity_id,
                    result,
                    reason_code,
                    request_id,
                    metadata_json,
                    created_at
                )
                VALUES (
                    ?,
                    'ADMIN',
                    NULL,
                    'CREATE_STAFF',
                    'STAFF',
                    ?,
                    'SUCCESS',
                    'ADMIN_STAFF_CREATE',
                    ?,
                    ?,
                    CURRENT_TIMESTAMP
                )
            `).bind(
                auditId,
                staffId,
                requestId,
                JSON.stringify({
                    staffId
                })
            )
        ]);

        return jsonResponse({
            success: true,
            status: "CREATED",
            staffId,
            requestId
        }, 201);

    } catch {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "STAFF_CREATE_FAILED",
            requestId
        }, 500);
    }
}

async function handleAdminStaffUpdate(
    request,
    env,
    requestId,
    staffId
) {
    const authorization =
        verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status,
        getAdminAuthorizationResponseHeaders(authorization));
    }

    if (!(request.headers.get("content-type") || "")
        .toLowerCase()
        .includes("application/json")) {
        return validationError(
            "CONTENT_TYPE_JSON_REQUIRED",
            requestId,
            415
        );
    }

    const safeStaffId = normalizeString(staffId);

    if (!safeStaffId) {
        return validationError(
            "STAFF_ID_REQUIRED",
            requestId
        );
    }

    let payload;

    try {
        payload = await request.json();
    } catch {
        return validationError("INVALID_JSON_BODY", requestId);
    }

    try {
        const current =
            await env.DB.prepare(`
                SELECT *
                FROM staff_accounts
                WHERE staff_id = ?
                LIMIT 1
            `).bind(safeStaffId).first();

        if (!current) {
            return jsonResponse({
                success: false,
                status: "NOT_FOUND",
                reasonCode: "STAFF_NOT_FOUND",
                requestId
            }, 404);
        }

        const fullName =
            payload.fullName === undefined
                ? current.full_name
                : normalizeString(payload.fullName);

        const email =
            payload.email === undefined
                ? current.email
                : normalizeString(payload.email)
                    .toLowerCase();

        if (!fullName) {
            return validationError(
                "STAFF_FULL_NAME_REQUIRED",
                requestId
            );
        }

        if (!email || !email.includes("@")) {
            return validationError(
                "STAFF_EMAIL_INVALID",
                requestId
            );
        }

        const duplicate =
            await env.DB.prepare(`
                SELECT staff_id
                FROM staff_accounts
                WHERE email = ?
                  AND staff_id <> ?
                LIMIT 1
            `).bind(
                email,
                safeStaffId
            ).first();

        if (duplicate) {
            return jsonResponse({
                success: false,
                status: "CONFLICT",
                reasonCode: "STAFF_EMAIL_ALREADY_EXISTS",
                requestId
            }, 409);
        }

        const auditId =
            `AUD-${crypto.randomUUID()}`;

        await env.DB.batch([
            env.DB.prepare(`
                UPDATE staff_accounts
                SET
                    full_name = ?,
                    email = ?,
                    updated_at = CURRENT_TIMESTAMP,
                    updated_by = 'ADMIN'
                WHERE staff_id = ?
            `).bind(
                fullName,
                email,
                safeStaffId
            ),

            env.DB.prepare(`
                INSERT INTO audit_logs (
                    audit_id,
                    actor_type,
                    actor_id,
                    action,
                    entity_type,
                    entity_id,
                    result,
                    reason_code,
                    request_id,
                    metadata_json,
                    created_at
                )
                VALUES (
                    ?,
                    'ADMIN',
                    NULL,
                    'UPDATE_STAFF',
                    'STAFF',
                    ?,
                    'SUCCESS',
                    'ADMIN_STAFF_UPDATE',
                    ?,
                    ?,
                    CURRENT_TIMESTAMP
                )
            `).bind(
                auditId,
                safeStaffId,
                requestId,
                JSON.stringify({
                    staffId: safeStaffId
                })
            )
        ]);

        return jsonResponse({
            success: true,
            status: "UPDATED",
            staffId: safeStaffId,
            requestId
        });

    } catch {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "STAFF_UPDATE_FAILED",
            requestId
        }, 500);
    }
}

async function handleAdminStaffDeactivate(
    request,
    env,
    requestId,
    staffId
) {
    const authorization =
        verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status,
        getAdminAuthorizationResponseHeaders(authorization));
    }

    const safeStaffId = normalizeString(staffId);

    if (!safeStaffId) {
        return validationError(
            "STAFF_ID_REQUIRED",
            requestId
        );
    }

    try {
        const current =
            await env.DB.prepare(`
                SELECT staff_id, status
                FROM staff_accounts
                WHERE staff_id = ?
                LIMIT 1
            `).bind(safeStaffId).first();

        if (!current) {
            return jsonResponse({
                success: false,
                status: "NOT_FOUND",
                reasonCode: "STAFF_NOT_FOUND",
                requestId
            }, 404);
        }

        if (
            normalizeString(current.status)
                .toUpperCase() !== "ACTIVE"
        ) {
            return jsonResponse({
                success: false,
                status: "CONFLICT",
                reasonCode: "STAFF_NOT_ACTIVE",
                requestId
            }, 409);
        }

        const auditId =
            `AUD-${crypto.randomUUID()}`;

        await env.DB.batch([
            env.DB.prepare(`
                UPDATE staff_accounts
                SET
                    status = 'INACTIVE',
                    deactivated_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP,
                    updated_by = 'ADMIN'
                WHERE staff_id = ?
                  AND status = 'ACTIVE'
            `).bind(safeStaffId),

            env.DB.prepare(`
                INSERT INTO audit_logs (
                    audit_id,
                    actor_type,
                    actor_id,
                    action,
                    entity_type,
                    entity_id,
                    result,
                    reason_code,
                    request_id,
                    metadata_json,
                    created_at
                )
                VALUES (
                    ?,
                    'ADMIN',
                    NULL,
                    'DEACTIVATE_STAFF',
                    'STAFF',
                    ?,
                    'SUCCESS',
                    'ADMIN_STAFF_DEACTIVATE',
                    ?,
                    ?,
                    CURRENT_TIMESTAMP
                )
            `).bind(
                auditId,
                safeStaffId,
                requestId,
                JSON.stringify({
                    staffId: safeStaffId
                })
            )
        ]);

        return jsonResponse({
            success: true,
            status: "DEACTIVATED",
            staffId: safeStaffId,
            requestId
        });

    } catch {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "STAFF_DEACTIVATE_FAILED",
            requestId
        }, 500);
    }
}


async function handleAdminTeamList(request, env, requestId) {
    const authorization = verifyAdminAuthorization(request, env);
    if (!authorization.ok) {
        return jsonResponse({ success:false, status:"DENIED", reasonCode:authorization.reasonCode, requestId },
            authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    try {
        const result = await env.DB.prepare(`
            SELECT
                t.team_id,
                t.team_name,
                t.description,
                t.status,
                t.created_at,
                t.updated_at,
                t.deactivated_at,
                COUNT(m.staff_id) AS member_count
            FROM staff_teams t
            LEFT JOIN staff_team_members m ON m.team_id = t.team_id
            GROUP BY t.team_id
            ORDER BY t.created_at DESC
        `).all();

        return jsonResponse({
            success:true,
            status:"OK",
            teams:result.results || [],
            requestId
        });
    } catch {
        return jsonResponse({
            success:false,
            status:"ERROR",
            reasonCode:"TEAM_LIST_FAILED",
            requestId
        },500);
    }
}

async function handleAdminTeamCreate(request, env, requestId) {
    const authorization = verifyAdminAuthorization(request, env);
    if (!authorization.ok) {
        return jsonResponse({ success:false, status:"DENIED", reasonCode:authorization.reasonCode, requestId },
            authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
        return validationError("CONTENT_TYPE_JSON_REQUIRED", requestId, 415);
    }

    let payload;
    try { payload = await request.json(); }
    catch { return validationError("INVALID_JSON_BODY", requestId); }

    const teamName = normalizeString(payload && payload.teamName);
    const description = normalizeString(payload && payload.description);

    if (!teamName) return validationError("TEAM_NAME_REQUIRED", requestId);

    try {
        const duplicate = await env.DB.prepare(`
            SELECT team_id FROM staff_teams
            WHERE team_name = ? COLLATE NOCASE
            LIMIT 1
        `).bind(teamName).first();

        if (duplicate) {
            return jsonResponse({
                success:false,
                status:"CONFLICT",
                reasonCode:"TEAM_NAME_ALREADY_EXISTS",
                requestId
            },409);
        }

        const teamId = `TEAM-${crypto.randomUUID()}`;
        const auditId = `AUD-${crypto.randomUUID()}`;

        await env.DB.batch([
            env.DB.prepare(`
                INSERT INTO staff_teams (
                    team_id, team_name, description, status,
                    created_at, updated_at
                )
                VALUES (?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `).bind(teamId, teamName, description || null),

            env.DB.prepare(`
                INSERT INTO audit_logs (
                    audit_id, actor_type, actor_id, action,
                    entity_type, entity_id, result,
                    reason_code, request_id, metadata_json, created_at
                )
                VALUES (
                    ?, 'ADMIN', NULL, 'CREATE_STAFF_TEAM',
                    'STAFF_TEAM', ?, 'SUCCESS',
                    'ADMIN_STAFF_TEAM_CREATE', ?, ?, CURRENT_TIMESTAMP
                )
            `).bind(
                auditId,
                teamId,
                requestId,
                JSON.stringify({ teamId })
            )
        ]);

        return jsonResponse({
            success:true,
            status:"CREATED",
            teamId,
            requestId
        });

    } catch {
        return jsonResponse({
            success:false,
            status:"ERROR",
            reasonCode:"TEAM_CREATE_FAILED",
            requestId
        },500);
    }
}

async function handleAdminTeamUpdate(request, env, requestId, teamId) {
    const authorization = verifyAdminAuthorization(request, env);
    if (!authorization.ok) {
        return jsonResponse({ success:false, status:"DENIED", reasonCode:authorization.reasonCode, requestId },
            authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    const safeTeamId = normalizeString(teamId);
    if (!safeTeamId) return validationError("TEAM_ID_REQUIRED", requestId);

    let payload;
    try { payload = await request.json(); }
    catch { return validationError("INVALID_JSON_BODY", requestId); }

    const teamName = normalizeString(payload && payload.teamName);
    const description = normalizeString(payload && payload.description);

    if (!teamName) return validationError("TEAM_NAME_REQUIRED", requestId);

    try {
        const existing = await env.DB.prepare(`
            SELECT team_id FROM staff_teams WHERE team_id = ? LIMIT 1
        `).bind(safeTeamId).first();

        if (!existing) {
            return jsonResponse({
                success:false,
                status:"NOT_FOUND",
                reasonCode:"TEAM_NOT_FOUND",
                requestId
            },404);
        }

        const duplicate = await env.DB.prepare(`
            SELECT team_id FROM staff_teams
            WHERE team_name = ? COLLATE NOCASE
              AND team_id <> ?
            LIMIT 1
        `).bind(teamName, safeTeamId).first();

        if (duplicate) {
            return jsonResponse({
                success:false,
                status:"CONFLICT",
                reasonCode:"TEAM_NAME_ALREADY_EXISTS",
                requestId
            },409);
        }

        const auditId = `AUD-${crypto.randomUUID()}`;

        await env.DB.batch([
            env.DB.prepare(`
                UPDATE staff_teams
                SET team_name = ?,
                    description = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE team_id = ?
            `).bind(teamName, description || null, safeTeamId),

            env.DB.prepare(`
                INSERT INTO audit_logs (
                    audit_id, actor_type, actor_id, action,
                    entity_type, entity_id, result,
                    reason_code, request_id, metadata_json, created_at
                )
                VALUES (
                    ?, 'ADMIN', NULL, 'UPDATE_STAFF_TEAM',
                    'STAFF_TEAM', ?, 'SUCCESS',
                    'ADMIN_STAFF_TEAM_UPDATE', ?, ?, CURRENT_TIMESTAMP
                )
            `).bind(
                auditId,
                safeTeamId,
                requestId,
                JSON.stringify({ teamId:safeTeamId })
            )
        ]);

        return jsonResponse({
            success:true,
            status:"UPDATED",
            teamId:safeTeamId,
            requestId
        });

    } catch {
        return jsonResponse({
            success:false,
            status:"ERROR",
            reasonCode:"TEAM_UPDATE_FAILED",
            requestId
        },500);
    }
}

async function handleAdminTeamDeactivate(request, env, requestId, teamId) {
    const authorization = verifyAdminAuthorization(request, env);
    if (!authorization.ok) {
        return jsonResponse({ success:false, status:"DENIED", reasonCode:authorization.reasonCode, requestId },
            authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    const safeTeamId = normalizeString(teamId);
    if (!safeTeamId) return validationError("TEAM_ID_REQUIRED", requestId);

    try {
        const existing = await env.DB.prepare(`
            SELECT status FROM staff_teams WHERE team_id = ? LIMIT 1
        `).bind(safeTeamId).first();

        if (!existing) {
            return jsonResponse({
                success:false,
                status:"NOT_FOUND",
                reasonCode:"TEAM_NOT_FOUND",
                requestId
            },404);
        }

        if (existing.status !== "ACTIVE") {
            return jsonResponse({
                success:false,
                status:"CONFLICT",
                reasonCode:"TEAM_NOT_ACTIVE",
                requestId
            },409);
        }

        const auditId = `AUD-${crypto.randomUUID()}`;

        await env.DB.batch([
            env.DB.prepare(`
                UPDATE staff_teams
                SET status='INACTIVE',
                    deactivated_at=CURRENT_TIMESTAMP,
                    updated_at=CURRENT_TIMESTAMP
                WHERE team_id=? AND status='ACTIVE'
            `).bind(safeTeamId),

            env.DB.prepare(`
                INSERT INTO audit_logs (
                    audit_id, actor_type, actor_id, action,
                    entity_type, entity_id, result,
                    reason_code, request_id, metadata_json, created_at
                )
                VALUES (
                    ?, 'ADMIN', NULL, 'DEACTIVATE_STAFF_TEAM',
                    'STAFF_TEAM', ?, 'SUCCESS',
                    'ADMIN_STAFF_TEAM_DEACTIVATE', ?, ?, CURRENT_TIMESTAMP
                )
            `).bind(
                auditId,
                safeTeamId,
                requestId,
                JSON.stringify({ teamId:safeTeamId })
            )
        ]);

        return jsonResponse({
            success:true,
            status:"DEACTIVATED",
            teamId:safeTeamId,
            requestId
        });

    } catch {
        return jsonResponse({
            success:false,
            status:"ERROR",
            reasonCode:"TEAM_DEACTIVATE_FAILED",
            requestId
        },500);
    }
}

async function handleAdminTeamMembersList(request, env, requestId, teamId) {
    const authorization = verifyAdminAuthorization(request, env);
    if (!authorization.ok) {
        return jsonResponse({ success:false, status:"DENIED", reasonCode:authorization.reasonCode, requestId },
            authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    try {
        const result = await env.DB.prepare(`
            SELECT
                m.team_id,
                m.staff_id,
                s.full_name,
                s.email,
                s.status,
                m.added_at
            FROM staff_team_members m
            JOIN staff_accounts s ON s.staff_id = m.staff_id
            WHERE m.team_id = ?
            ORDER BY s.full_name
        `).bind(teamId).all();

        return jsonResponse({
            success:true,
            status:"OK",
            members:result.results || [],
            requestId
        });

    } catch {
        return jsonResponse({
            success:false,
            status:"ERROR",
            reasonCode:"TEAM_MEMBERS_LIST_FAILED",
            requestId
        },500);
    }
}

async function handleAdminTeamMemberAdd(request, env, requestId, teamId) {
    const authorization = verifyAdminAuthorization(request, env);
    if (!authorization.ok) {
        return jsonResponse({ success:false, status:"DENIED", reasonCode:authorization.reasonCode, requestId },
            authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    let payload;
    try { payload = await request.json(); }
    catch { return validationError("INVALID_JSON_BODY", requestId); }

    const safeTeamId = normalizeString(teamId);
    const staffId = normalizeString(payload && payload.staffId);

    if (!safeTeamId) return validationError("TEAM_ID_REQUIRED", requestId);
    if (!staffId) return validationError("STAFF_ID_REQUIRED", requestId);

    try {
        const team = await env.DB.prepare(`
            SELECT status FROM staff_teams WHERE team_id=? LIMIT 1
        `).bind(safeTeamId).first();

        if (!team) {
            return jsonResponse({success:false,status:"NOT_FOUND",reasonCode:"TEAM_NOT_FOUND",requestId},404);
        }

        if (team.status !== "ACTIVE") {
            return jsonResponse({success:false,status:"CONFLICT",reasonCode:"TEAM_NOT_ACTIVE",requestId},409);
        }

        const staff = await env.DB.prepare(`
            SELECT status FROM staff_accounts WHERE staff_id=? LIMIT 1
        `).bind(staffId).first();

        if (!staff) {
            return jsonResponse({success:false,status:"NOT_FOUND",reasonCode:"STAFF_NOT_FOUND",requestId},404);
        }

        if (staff.status !== "ACTIVE") {
            return jsonResponse({success:false,status:"CONFLICT",reasonCode:"STAFF_NOT_ACTIVE",requestId},409);
        }

        const existing = await env.DB.prepare(`
            SELECT team_id FROM staff_team_members
            WHERE team_id=? AND staff_id=?
            LIMIT 1
        `).bind(safeTeamId, staffId).first();

        if (existing) {
            return jsonResponse({
                success:false,
                status:"CONFLICT",
                reasonCode:"TEAM_MEMBER_ALREADY_EXISTS",
                requestId
            },409);
        }

        const auditId = `AUD-${crypto.randomUUID()}`;

        await env.DB.batch([
            env.DB.prepare(`
                INSERT INTO staff_team_members (
                    team_id, staff_id, added_at
                )
                VALUES (?, ?, CURRENT_TIMESTAMP)
            `).bind(safeTeamId, staffId),

            env.DB.prepare(`
                INSERT INTO audit_logs (
                    audit_id, actor_type, actor_id, action,
                    entity_type, entity_id, result,
                    reason_code, request_id, metadata_json, created_at
                )
                VALUES (
                    ?, 'ADMIN', NULL, 'ADD_STAFF_TEAM_MEMBER',
                    'STAFF_TEAM', ?, 'SUCCESS',
                    'ADMIN_STAFF_TEAM_MEMBER_ADD', ?, ?, CURRENT_TIMESTAMP
                )
            `).bind(
                auditId,
                safeTeamId,
                requestId,
                JSON.stringify({teamId:safeTeamId, staffId})
            )
        ]);

        return jsonResponse({
            success:true,
            status:"MEMBER_ADDED",
            teamId:safeTeamId,
            staffId,
            requestId
        });

    } catch {
        return jsonResponse({
            success:false,
            status:"ERROR",
            reasonCode:"TEAM_MEMBER_ADD_FAILED",
            requestId
        },500);
    }
}

async function handleAdminTeamMemberRemove(request, env, requestId, teamId, staffId) {
    const authorization = verifyAdminAuthorization(request, env);
    if (!authorization.ok) {
        return jsonResponse({ success:false, status:"DENIED", reasonCode:authorization.reasonCode, requestId },
            authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    const safeTeamId = normalizeString(teamId);
    const safeStaffId = normalizeString(staffId);

    if (!safeTeamId) return validationError("TEAM_ID_REQUIRED", requestId);
    if (!safeStaffId) return validationError("STAFF_ID_REQUIRED", requestId);

    try {
        const existing = await env.DB.prepare(`
            SELECT team_id FROM staff_team_members
            WHERE team_id=? AND staff_id=?
            LIMIT 1
        `).bind(safeTeamId, safeStaffId).first();

        if (!existing) {
            return jsonResponse({
                success:false,
                status:"NOT_FOUND",
                reasonCode:"TEAM_MEMBER_NOT_FOUND",
                requestId
            },404);
        }

        const auditId = `AUD-${crypto.randomUUID()}`;

        await env.DB.batch([
            env.DB.prepare(`
                DELETE FROM staff_team_members
                WHERE team_id=? AND staff_id=?
            `).bind(safeTeamId, safeStaffId),

            env.DB.prepare(`
                INSERT INTO audit_logs (
                    audit_id, actor_type, actor_id, action,
                    entity_type, entity_id, result,
                    reason_code, request_id, metadata_json, created_at
                )
                VALUES (
                    ?, 'ADMIN', NULL, 'REMOVE_STAFF_TEAM_MEMBER',
                    'STAFF_TEAM', ?, 'SUCCESS',
                    'ADMIN_STAFF_TEAM_MEMBER_REMOVE', ?, ?, CURRENT_TIMESTAMP
                )
            `).bind(
                auditId,
                safeTeamId,
                requestId,
                JSON.stringify({teamId:safeTeamId, staffId:safeStaffId})
            )
        ]);

        return jsonResponse({
            success:true,
            status:"MEMBER_REMOVED",
            teamId:safeTeamId,
            staffId:safeStaffId,
            requestId
        });

    } catch {
        return jsonResponse({
            success:false,
            status:"ERROR",
            reasonCode:"TEAM_MEMBER_REMOVE_FAILED",
            requestId
        },500);
    }
}

async function handleAdminLicensesList(request, env, requestId) {
    const authorization = verifyAdminAuthorization(request, env);
    if (!authorization.ok) return jsonResponse({ success: false, status: "DENIED", reasonCode: authorization.reasonCode, requestId }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    try {
        const result = await env.DB.prepare(`
            SELECT l.license_id, l.customer_id, c.full_name, l.license_key_last4, l.plan_code, l.status, l.max_devices,
                   l.activation_date, l.expiry_date, l.update_entitlement_until, l.offline_grace_days,
                   l.created_at, l.updated_at,
                   (SELECT COUNT(*) FROM devices d WHERE d.license_id=l.license_id AND d.status='ACTIVE') AS active_device_count
            FROM licenses l LEFT JOIN customers c ON c.customer_id=l.customer_id
            ORDER BY l.created_at DESC
        `).all();
        const licenses = result && Array.isArray(result.results) ? result.results : [];
        return jsonResponse({ success: true, status: "OK", licenses, count: licenses.length, requestId });
    } catch {
        return jsonResponse({ success: false, status: "ERROR", reasonCode: "LICENSE_LIST_FAILED", requestId }, 500);
    }
}

async function handleAdminLicenseUpdate(request, env, requestId, licenseId) {
    const authorization = verifyAdminAuthorization(request, env);
    if (!authorization.ok) return jsonResponse({ success: false, status: "DENIED", reasonCode: authorization.reasonCode, requestId }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json")) return validationError("CONTENT_TYPE_JSON_REQUIRED", requestId, 415);
    let payload;
    try { payload = await request.json(); } catch { return validationError("INVALID_JSON_BODY", requestId); }
    const safeLicenseId = normalizeString(licenseId);
    if (!safeLicenseId) return validationError("LICENSE_ID_REQUIRED", requestId);
    try {
        const current = await env.DB.prepare("SELECT * FROM licenses WHERE license_id=? LIMIT 1").bind(safeLicenseId).first();
        if (!current) return jsonResponse({ success: false, status: "NOT_FOUND", reasonCode: "LICENSE_NOT_FOUND", requestId }, 404);
        const status = payload.status === undefined ? current.status : normalizeString(payload.status).toUpperCase();
        if (!["PENDING", "ACTIVE", "EXPIRED", "BLOCKED", "DEACTIVATED"].includes(status)) return validationError("LICENSE_STATUS_INVALID", requestId);
        const planCode = payload.planCode === undefined ? current.plan_code : (normalizeString(payload.planCode) || current.plan_code).toUpperCase();
        const maxDevices = payload.maxDevices === undefined ? current.max_devices : Number(payload.maxDevices);
        const graceDays = payload.offlineGraceDays === undefined ? current.offline_grace_days : Number(payload.offlineGraceDays);
        if (!Number.isInteger(maxDevices) || maxDevices < 1 || maxDevices > 100) return validationError("MAX_DEVICES_INVALID", requestId);
        if (!Number.isInteger(graceDays) || graceDays < 0 || graceDays > 365) return validationError("OFFLINE_GRACE_DAYS_INVALID", requestId);
        const expiryDate = payload.expiryDate === undefined ? current.expiry_date : (normalizeString(payload.expiryDate) || null);
        await env.DB.prepare(`
            UPDATE licenses SET plan_code=?, status=?, max_devices=?, expiry_date=?, offline_grace_days=?, updated_at=CURRENT_TIMESTAMP
            WHERE license_id=?
        `).bind(planCode, status, maxDevices, expiryDate, graceDays, safeLicenseId).run();
        return jsonResponse({ success: true, status: "UPDATED", licenseId: safeLicenseId, requestId });
    } catch {
        return jsonResponse({ success: false, status: "ERROR", reasonCode: "LICENSE_UPDATE_FAILED", requestId }, 500);
    }
}


/* K7_ADMIN_ISSUE_LICENSE_V1
   Admin-issued license for an existing ACTIVE customer.
   Reuses the production key/hash/vault model.
*/
async function handleAdminCustomerIssueLicense(request, env, requestId, customerId) {
    const authorization = verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse(
            {
                success: false,
                status: "DENIED",
                reasonCode: authorization.reasonCode,
                requestId
            },
            authorization.status,
            getAdminAuthorizationResponseHeaders(authorization)
        );
    }

    if (!(request.headers.get("content-type") || "")
        .toLowerCase()
        .includes("application/json")) {
        return validationError(
            "CONTENT_TYPE_JSON_REQUIRED",
            requestId,
            415
        );
    }

    let payload;

    try {
        payload = await request.json();
    } catch {
        return validationError(
            "INVALID_JSON_BODY",
            requestId
        );
    }

    const safeCustomerId = normalizeString(customerId);

    if (!safeCustomerId) {
        return validationError(
            "CUSTOMER_ID_REQUIRED",
            requestId
        );
    }

    const requestedPlan =
        (normalizeString(payload && payload.planCode) || "STANDARD")
            .toUpperCase();

    try {
        const customer = await env.DB.prepare(`
            SELECT
                c.customer_id,
                c.full_name,
                c.email,
                c.status AS customer_status,
                COALESCE(cl.lifecycle_status, 'ACTIVE') AS lifecycle_status
            FROM customers AS c
            LEFT JOIN customer_lifecycle AS cl
                ON cl.customer_id = c.customer_id
            WHERE c.customer_id = ?
            LIMIT 1
        `).bind(safeCustomerId).first();

        if (!customer) {
            return jsonResponse(
                {
                    success: false,
                    status: "NOT_FOUND",
                    reasonCode: "CUSTOMER_NOT_FOUND",
                    requestId
                },
                404
            );
        }

        if (
            String(customer.customer_status || "")
                .trim()
                .toUpperCase() !== "ACTIVE" ||
            String(customer.lifecycle_status || "ACTIVE")
                .trim()
                .toUpperCase() !== "ACTIVE"
        ) {
            return jsonResponse(
                {
                    success: false,
                    status: "DENIED",
                    reasonCode: "CUSTOMER_LIFECYCLE_INACTIVE",
                    requestId
                },
                409
            );
        }

        const plan = await getCheckoutPlan(env, requestedPlan);

        if (!plan || !plan.configured) {
            return jsonResponse(
                {
                    success: false,
                    status: "DENIED",
                    reasonCode: "LICENSE_PLAN_NOT_AVAILABLE",
                    requestId
                },
                409
            );
        }

        const validityDays =
            payload &&
            payload.validityDays !== undefined &&
            payload.validityDays !== null &&
            payload.validityDays !== ""
                ? Number(payload.validityDays)
                : Number(plan.days);

        const maxDevices =
            payload &&
            payload.maxDevices !== undefined &&
            payload.maxDevices !== null &&
            payload.maxDevices !== ""
                ? Number(payload.maxDevices)
                : Number(plan.maxDevices || 1);

        if (
            !Number.isInteger(validityDays) ||
            validityDays < 1 ||
            validityDays > 3650
        ) {
            return validationError(
                "VALIDITY_DAYS_INVALID",
                requestId
            );
        }

        if (
            !Number.isInteger(maxDevices) ||
            maxDevices < 1 ||
            maxDevices > 100
        ) {
            return validationError(
                "MAX_DEVICES_INVALID",
                requestId
            );
        }

        let licenseKey = null;
        let licenseId = null;
        let licenseHash = null;
        let last4 = null;

        for (let attempt = 0; attempt < 8; attempt++) {
            const candidateKey = createWebLicenseKey();
            const candidateId = createWebLicenseId();
            const candidateHash = await sha256Hex(candidateKey);

            const collision = await env.DB.prepare(`
                SELECT license_id
                FROM licenses
                WHERE license_id = ?
                   OR license_key_hash = ?
                LIMIT 1
            `).bind(candidateId, candidateHash).first();

            if (!collision) {
                licenseKey = candidateKey;
                licenseId = candidateId;
                licenseHash = candidateHash;
                last4 = candidateKey.slice(-4);
                break;
            }
        }

        if (!licenseKey) {
            throw new Error("LICENSE_COLLISION");
        }

        /*
         * Encrypt before DB writes so a missing/broken vault secret cannot
         * leave a license row without recoverable key material.
         */
        const encrypted =
            await encryptLicenseKeyForVault(
                env,
                licenseKey
            );

        const expiryDate =
            new Date(
                Date.now() +
                validityDays * 86400000
            )
            .toISOString()
            .slice(0, 10);

        const auditId =
            `AUD-${crypto.randomUUID()
                .replace(/-/g, "")
                .slice(0, 20)
                .toUpperCase()}`;

        /*
         * Keep the license PENDING until normal activation.
         * Plaintext key is never stored in licenses/audit metadata.
         */
        await env.DB.batch([
            env.DB.prepare(`
                INSERT INTO licenses (
                    license_id,
                    customer_id,
                    license_key_hash,
                    license_key_last4,
                    plan_code,
                    status,
                    max_devices,
                    activation_date,
                    expiry_date,
                    offline_grace_days,
                    created_at,
                    updated_at
                )
                VALUES (
                    ?, ?, ?, ?, ?,
                    'PENDING',
                    ?,
                    NULL,
                    ?,
                    7,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                )
            `).bind(
                licenseId,
                safeCustomerId,
                licenseHash,
                last4,
                plan.planCode,
                maxDevices,
                expiryDate
            ),

            env.DB.prepare(`
                INSERT INTO license_vault (
                    license_id,
                    key_ciphertext,
                    key_iv,
                    key_last4,
                    updated_at
                )
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
                licenseId,
                encrypted.ciphertext,
                encrypted.iv,
                last4
            ),

            env.DB.prepare(`
                INSERT INTO audit_logs (
                    audit_id,
                    actor_type,
                    actor_id,
                    action,
                    entity_type,
                    entity_id,
                    result,
                    reason_code,
                    request_id,
                    metadata_json,
                    created_at
                )
                VALUES (
                    ?,
                    'ADMIN',
                    NULL,
                    'ADMIN_ISSUE_LICENSE',
                    'LICENSE',
                    ?,
                    'SUCCESS',
                    'ADMIN_MANUAL_ISSUE',
                    ?,
                    ?,
                    CURRENT_TIMESTAMP
                )
            `).bind(
                auditId,
                licenseId,
                requestId,
                JSON.stringify({
                    customerId: safeCustomerId,
                    planCode: plan.planCode,
                    validityDays,
                    maxDevices,
                    expiryDate,
                    keyLast4: last4
                })
            )
        ]);

        return jsonResponse(
            {
                success: true,
                status: "ISSUED",
                customerId: safeCustomerId,
                licenseId,
                planCode: plan.planCode,
                licenseStatus: "PENDING",
                maxDevices,
                expiryDate,
                keyMasked: `HXL-****-****-****-${last4}`,
                requestId
            },
            201,
            {
                "Cache-Control": "no-store"
            }
        );

    } catch (error) {
        const reasonCode =
            error &&
            error.message === "LICENSE_VAULT_SECRET_MISSING"
                ? "LICENSE_VAULT_NOT_CONFIGURED"
                : error &&
                  error.message === "LICENSE_COLLISION"
                    ? "LICENSE_COLLISION"
                    : "ADMIN_ISSUE_LICENSE_FAILED";

        return jsonResponse(
            {
                success: false,
                status: "ERROR",
                reasonCode,
                requestId
            },
            500,
            {
                "Cache-Control": "no-store"
            }
        );
    }
}

async function handleAdminLicenseRenew(request, env, requestId, licenseId) {
    const authorization =
        verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    const contentType =
        request.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
        return validationError(
            "CONTENT_TYPE_JSON_REQUIRED",
            requestId,
            415
        );
    }

    let payload;

    try {
        payload = await request.json();
    } catch {
        return validationError(
            "INVALID_JSON_BODY",
            requestId
        );
    }

    const safeLicenseId =
        normalizeString(licenseId);

    if (!safeLicenseId) {
        return validationError(
            "LICENSE_ID_REQUIRED",
            requestId
        );
    }

    const hasRenewalDays =
        payload.renewalDays !== undefined &&
        payload.renewalDays !== null &&
        payload.renewalDays !== "";

    const hasNewExpiryDate =
        payload.newExpiryDate !== undefined &&
        payload.newExpiryDate !== null &&
        normalizeString(payload.newExpiryDate) !== "";

    if (hasRenewalDays === hasNewExpiryDate) {
        return validationError(
            "RENEWAL_DAYS_OR_NEW_EXPIRY_REQUIRED",
            requestId
        );
    }

    let renewalDays = null;

    if (hasRenewalDays) {
        renewalDays = Number(payload.renewalDays);

        if (
            !Number.isInteger(renewalDays) ||
            renewalDays < 1 ||
            renewalDays > 3650
        ) {
            return validationError(
                "RENEWAL_DAYS_INVALID",
                requestId
            );
        }
    }

    const amountMinor =
        payload.amountMinor === undefined ||
        payload.amountMinor === null ||
        payload.amountMinor === ""
            ? null
            : Number(payload.amountMinor);

    if (
        amountMinor !== null &&
        (
            !Number.isInteger(amountMinor) ||
            amountMinor < 0
        )
    ) {
        return validationError(
            "AMOUNT_MINOR_INVALID",
            requestId
        );
    }

    const currency =
        (
            normalizeString(payload.currency) ||
            "INR"
        ).toUpperCase();

    if (!/^[A-Z]{3}$/.test(currency)) {
        return validationError(
            "CURRENCY_INVALID",
            requestId
        );
    }

    const paymentReference =
        normalizeString(payload.paymentReference) || null;

    const notes =
        normalizeString(payload.notes) || null;

    try {
        const current =
            await env.DB
                .prepare(`
                    SELECT
                        l.*,
                        c.status AS customer_status
                    FROM licenses AS l
                    INNER JOIN customers AS c
                        ON c.customer_id = l.customer_id
                    WHERE l.license_id = ?
                    LIMIT 1
                `)
                .bind(safeLicenseId)
                .first();

        if (!current) {
            return jsonResponse({
                success: false,
                status: "NOT_FOUND",
                reasonCode: "LICENSE_NOT_FOUND",
                requestId
            }, 404);
        }

        const customerStatus =
            String(current.customer_status || "")
                .trim()
                .toUpperCase();

        if (customerStatus === "BLOCKED") {
            return jsonResponse({
                success: false,
                status: "DENIED",
                reasonCode: "CUSTOMER_BLOCKED",
                requestId
            }, 409);
        }

        if (customerStatus === "INACTIVE") {
            return jsonResponse({
                success: false,
                status: "DENIED",
                reasonCode: "CUSTOMER_INACTIVE",
                requestId
            }, 409);
        }

        if (customerStatus !== "ACTIVE") {
            return jsonResponse({
                success: false,
                status: "DENIED",
                reasonCode: "CUSTOMER_NOT_ACTIVE",
                requestId
            }, 409);
        }

        const oldExpiryDate =
            normalizeString(current.expiry_date);

        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(oldExpiryDate)
        ) {
            return validationError(
                "CURRENT_EXPIRY_INVALID",
                requestId
            );
        }

        const oldExpiry =
            new Date(
                oldExpiryDate + "T00:00:00.000Z"
            );

        if (Number.isNaN(oldExpiry.getTime())) {
            return validationError(
                "CURRENT_EXPIRY_INVALID",
                requestId
            );
        }

        /*
         * Renewal semantic rules:
         *
         * 1. If current expiry is today/future, renewalDays extends
         *    from the existing expiry.
         *
         * 2. If current expiry is already in the past, renewalDays
         *    extends from TODAY (UTC), so the customer receives the
         *    complete purchased renewal period.
         *
         * 3. A directly supplied newExpiryDate may not be in the past.
         *
         * 4. EXPIRED becomes ACTIVE only when the resulting expiry
         *    is today or in the future.
         */
        const now =
            new Date();

        const todayUtc =
            new Date(
                Date.UTC(
                    now.getUTCFullYear(),
                    now.getUTCMonth(),
                    now.getUTCDate()
                )
            );

        let newExpiryDate;
        let resultingExpiry;

        if (hasRenewalDays) {
            const baseDate =
                oldExpiry.getTime() >= todayUtc.getTime()
                    ? oldExpiry
                    : todayUtc;

            const calculated =
                new Date(baseDate.getTime());

            calculated.setUTCDate(
                calculated.getUTCDate() + renewalDays
            );

            newExpiryDate =
                calculated
                    .toISOString()
                    .slice(0, 10);

            resultingExpiry =
                calculated;
        } else {
            newExpiryDate =
                normalizeString(
                    payload.newExpiryDate
                );

            if (
                !/^\d{4}-\d{2}-\d{2}$/.test(
                    newExpiryDate
                )
            ) {
                return validationError(
                    "NEW_EXPIRY_DATE_INVALID",
                    requestId
                );
            }

            const requestedExpiry =
                new Date(
                    newExpiryDate +
                    "T00:00:00.000Z"
                );

            if (
                Number.isNaN(
                    requestedExpiry.getTime()
                ) ||
                requestedExpiry
                    .toISOString()
                    .slice(0, 10) !== newExpiryDate
            ) {
                return validationError(
                    "NEW_EXPIRY_DATE_INVALID",
                    requestId
                );
            }

            if (
                requestedExpiry.getTime() <
                todayUtc.getTime()
            ) {
                return validationError(
                    "NEW_EXPIRY_DATE_IN_PAST",
                    requestId
                );
            }

            if (
                requestedExpiry.getTime() <=
                oldExpiry.getTime()
            ) {
                return validationError(
                    "NEW_EXPIRY_MUST_BE_LATER",
                    requestId
                );
            }

            renewalDays =
                Math.round(
                    (
                        requestedExpiry.getTime() -
                        oldExpiry.getTime()
                    ) /
                    86400000
                );

            resultingExpiry =
                requestedExpiry;
        }

        const currentLicenseStatus =
            String(current.status || "")
                .trim()
                .toUpperCase();

        let newLicenseStatus =
            currentLicenseStatus;

        if (
            currentLicenseStatus === "EXPIRED" &&
            resultingExpiry.getTime() >= todayUtc.getTime()
        ) {
            newLicenseStatus = "ACTIVE";
        }

        /*
         * BLOCKED / DEACTIVATED stay unchanged.
         * PENDING stays PENDING.
         * ACTIVE stays ACTIVE.
         */

        const renewalId =
            "REN-" +
            Date.now().toString(36).toUpperCase() +
            "-" +
            crypto.randomUUID()
                .replace(/-/g, "")
                .slice(0, 8)
                .toUpperCase();

        const auditId =
            "AUD-" +
            crypto.randomUUID()
                .replace(/-/g, "")
                .toUpperCase();

        const createdAt =
            new Date().toISOString();

        const statements = [
            env.DB
                .prepare(`
                    INSERT INTO renewals (
                        renewal_id,
                        license_id,
                        old_expiry_date,
                        new_expiry_date,
                        renewal_days,
                        amount_minor,
                        currency,
                        payment_reference,
                        status,
                        notes,
                        created_at
                    )
                    VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?,
                        'COMPLETED', ?, ?
                    )
                `)
                .bind(
                    renewalId,
                    safeLicenseId,
                    oldExpiryDate,
                    newExpiryDate,
                    renewalDays,
                    amountMinor,
                    currency,
                    paymentReference,
                    notes,
                    createdAt
                ),

            env.DB
                .prepare(`
                    UPDATE licenses
                    SET
                        expiry_date = ?,
                        status = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE license_id = ?
                `)
                .bind(
                    newExpiryDate,
                    newLicenseStatus,
                    safeLicenseId
                ),

            env.DB
                .prepare(`
                    INSERT INTO audit_logs (
                        audit_id,
                        actor_type,
                        actor_id,
                        action,
                        entity_type,
                        entity_id,
                        result,
                        reason_code,
                        request_id,
                        metadata_json,
                        created_at
                    )
                    VALUES (
                        ?,
                        'ADMIN',
                        NULL,
                        'RENEW_LICENSE',
                        'LICENSE',
                        ?,
                        'SUCCESS',
                        'LICENSE_RENEWED',
                        ?,
                        ?,
                        ?
                    )
                `)
                .bind(
                    auditId,
                    safeLicenseId,
                    requestId,
                    JSON.stringify({
                        renewalId,
                        oldExpiryDate,
                        newExpiryDate,
                        renewalDays,
                        previousStatus:
                            currentLicenseStatus,
                        newStatus:
                            newLicenseStatus,
                        amountMinor,
                        currency,
                        paymentReference
                    }),
                    createdAt
                )
        ];

        await env.DB.batch(statements);

        /*
         * PHASE 6.9J - RENEWAL CONFIRMATION PRODUCTION BRIDGE
         *
         * Renewal is already committed at this point.
         * Notification failure must never roll back or convert a
         * successful license renewal into an API failure.
         */
        let renewalNotification = null;

        try {
            renewalNotification =
                await queueRenewalConfirmationEmail(
                    env,
                    safeLicenseId
                );

            /*
             * PHASE 6.9K - RENEWAL DELIVERY BRIDGE
             *
             * Renewal is already committed.
             * Email delivery failure must never roll back
             * or convert a successful renewal into failure.
             *
             * Current Resend configuration remains SAFE TEST MODE.
             */

            if (
                renewalNotification &&
                renewalNotification.queued === true &&
                renewalNotification.notificationId
            ) {
                let renewalDeliveryResult = null;

                try {
                    const renewalCustomer =
                        await env.DB.prepare(`
                            SELECT
                                c.name,
                                c.email
                            FROM licenses l
                            INNER JOIN customers c
                                ON c.customer_id = l.customer_id
                            WHERE l.license_id = ?
                            LIMIT 1
                        `)
                            .bind(safeLicenseId)
                            .first();

                    if (
                        renewalCustomer &&
                        normalizeString(renewalCustomer.email)
                    ) {
                        renewalDeliveryResult =
                            await sendRenewalConfirmationEmail(
                                env,
                                {
                                    customerName:
                                        normalizeString(
                                            renewalCustomer.name
                                        ) || "Customer",

                                    customerEmail:
                                        renewalCustomer.email,

                                    licenseId:
                                        safeLicenseId,

                                    oldExpiryDate,

                                    newExpiryDate
                                }
                            );
                    } else {
                        renewalDeliveryResult = {
                            success: false,
                            status: "SKIPPED",
                            reasonCode:
                                "CUSTOMER_EMAIL_MISSING"
                        };
                    }
                } catch (deliveryError) {
                    renewalDeliveryResult = {
                        success: false,
                        status: "ERROR",
                        reasonCode:
                            "RENEWAL_EMAIL_DELIVERY_FAILED"
                    };

                    console.error(
                        "Renewal confirmation email delivery failed",
                        {
                            licenseId: safeLicenseId,
                            requestId,
                            error:
                                deliveryError &&
                                deliveryError.message
                                    ? deliveryError.message
                                    : "UNKNOWN_ERROR"
                        }
                    );
                }

                try {
                    await env.DB.prepare(`
                        UPDATE notifications
                        SET status = ?
                        WHERE notification_id = ?
                    `)
                        .bind(
                            renewalDeliveryResult &&
                            renewalDeliveryResult.success === true
                                ? "SENT"
                                : "FAILED",

                            renewalNotification.notificationId
                        )
                        .run();
                } catch (notificationStatusError) {
                    console.error(
                        "Renewal notification status update failed",
                        {
                            licenseId: safeLicenseId,
                            requestId,
                            notificationId:
                                renewalNotification.notificationId,
                            error:
                                notificationStatusError &&
                                notificationStatusError.message
                                    ? notificationStatusError.message
                                    : "UNKNOWN_ERROR"
                        }
                    );
                }
            }
        } catch (notificationError) {
            renewalNotification = {
                queued: false,
                skipped: true,
                reasonCode:
                    "RENEWAL_NOTIFICATION_QUEUE_FAILED"
            };

            console.error(
                "Renewal confirmation notification failed",
                {
                    licenseId: safeLicenseId,
                    requestId,
                    error:
                        notificationError &&
                        notificationError.message
                            ? notificationError.message
                            : "UNKNOWN_ERROR"
                }
            );
        }

        return jsonResponse({
            success: true,
            status: "RENEWED",
            reasonCode: "LICENSE_RENEWED",
            renewalId,
            licenseId: safeLicenseId,
            oldExpiryDate,
            newExpiryDate,
            renewalDays,
            previousLicenseStatus:
                currentLicenseStatus,
            licenseStatus:
                newLicenseStatus,
            amountMinor,
            currency,
            requestId
        }, 200);

    } catch {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "LICENSE_RENEWAL_FAILED",
            requestId
        }, 500);
    }
}



/* ============================================================
   K7_DATA_MANAGEMENT_ENGINE_V1
   Protected Admin Data Management
   ============================================================ */

async function handleAdminDataManagementPreview(request, env, requestId) {
    const authorization = verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    try {
        const tables = [
            "customers",
            "licenses",
            "devices",
            "renewals",
            "activations",
            "license_vault",
            "notifications",
            "notification_automation_events",
            "download_events",
            "web_orders",
            "web_order_profiles",
            "web_order_plan_snapshots",
            "payment_events",
            "order_fulfillment_events",
            "customer_registrations",
            "business_events"
        ];

        const counts = {};

        for (const table of tables) {
            const row = await env.DB
                .prepare("SELECT COUNT(*) AS count FROM " + table)
                .first();

            counts[table] = Number(row && row.count || 0);
        }

        return jsonResponse({
            success: true,
            status: "OK",
            scope: "BUSINESS_DATA",
            counts,
            preserved: [
                "audit_logs",
                "business_plans",
                "business_plan_offers",
                "business_settings",
                "releases",
                "d1_migrations",
                "_cf_KV"
            ],
            confirmationRequired: "RESET BUSINESS DATA",
            requestId
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "DATA_MANAGEMENT_PREVIEW_FAILED",
            requestId
        }, 500);
    }
}




/* ============================================================
   K7_DATA_MANAGEMENT_CUSTOMER_DELETE_V1
   Protected Individual Customer Delete
   ============================================================ */

/* ============================================================
   K7 CUSTOMER LIFECYCLE V1
   ACTIVE -> DEACTIVATED -> ARCHIVED -> RESTORE
   Permanent cleanup intentionally NOT implemented.
   ============================================================ */

async function handleAdminCustomerLifecycleAction(
    request,
    env,
    requestId,
    customerId,
    action
) {
    const authorization =
        verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status,
        getAdminAuthorizationResponseHeaders(authorization));
    }

    const safeCustomerId =
        normalizeString(customerId);

    if (!safeCustomerId) {
        return validationError(
            "CUSTOMER_ID_REQUIRED",
            requestId
        );
    }

    const safeAction =
        String(action || "")
            .trim()
            .toUpperCase();

    if (![
        "DEACTIVATE",
        "ARCHIVE",
        "RESTORE"
    ].includes(safeAction)) {
        return validationError(
            "CUSTOMER_LIFECYCLE_ACTION_INVALID",
            requestId
        );
    }

    let payload = {};

    try {
        if (
            (request.headers.get("content-type") || "")
                .toLowerCase()
                .includes("application/json")
        ) {
            payload = await request.json();
        }
    } catch {
        return validationError(
            "INVALID_JSON_BODY",
            requestId
        );
    }

    const reasonCode =
        normalizeString(
            payload && payload.reasonCode
        ) || (
            safeAction === "DEACTIVATE"
                ? "ADMIN_CUSTOMER_DEACTIVATE"
                : safeAction === "ARCHIVE"
                    ? "ADMIN_CUSTOMER_ARCHIVE"
                    : "ADMIN_CUSTOMER_RESTORE"
        );

    try {
        const customer =
            await env.DB.prepare(`
                SELECT
                    customer_id,
                    status,
                    created_at
                FROM customers
                WHERE customer_id = ?
                LIMIT 1
            `)
            .bind(safeCustomerId)
            .first();

        if (!customer) {
            return jsonResponse({
                success: false,
                status: "NOT_FOUND",
                reasonCode: "CUSTOMER_NOT_FOUND",
                customerId: safeCustomerId,
                requestId
            }, 404);
        }

        const operationalStatus =
            String(customer.status || "")
                .trim()
                .toUpperCase();

        const lifecycle =
            await env.DB.prepare(`
                SELECT
                    customer_id,
                    lifecycle_status,
                    reason_code,
                    deactivated_at,
                    archived_at,
                    recovery_until,
                    last_action,
                    last_request_id,
                    created_at,
                    updated_at
                FROM customer_lifecycle
                WHERE customer_id = ?
                LIMIT 1
            `)
            .bind(safeCustomerId)
            .first();

        const lifecycleStatus =
            lifecycle
                ? String(
                    lifecycle.lifecycle_status || ""
                  ).trim().toUpperCase()
                : "ACTIVE";

        let nextLifecycleStatus;
        let nextOperationalStatus;

        if (safeAction === "DEACTIVATE") {
            if (
                operationalStatus !== "ACTIVE" ||
                lifecycleStatus !== "ACTIVE"
            ) {
                return jsonResponse({
                    success: false,
                    status: "CONFLICT",
                    reasonCode:
                        "CUSTOMER_DEACTIVATE_STATE_INVALID",
                    customerId: safeCustomerId,
                    operationalStatus,
                    lifecycleStatus,
                    requestId
                }, 409, {
                    "Cache-Control": "no-store"
                });
            }

            nextLifecycleStatus = "DEACTIVATED";
            nextOperationalStatus = "INACTIVE";
        }

        if (safeAction === "ARCHIVE") {
            if (
                operationalStatus !== "INACTIVE" ||
                lifecycleStatus !== "DEACTIVATED"
            ) {
                return jsonResponse({
                    success: false,
                    status: "CONFLICT",
                    reasonCode:
                        "CUSTOMER_ARCHIVE_STATE_INVALID",
                    customerId: safeCustomerId,
                    operationalStatus,
                    lifecycleStatus,
                    requestId
                }, 409, {
                    "Cache-Control": "no-store"
                });
            }

            nextLifecycleStatus = "ARCHIVED";
            nextOperationalStatus = "INACTIVE";
        }

        if (safeAction === "RESTORE") {
            if (
                operationalStatus !== "INACTIVE" ||
                ![
                    "DEACTIVATED",
                    "ARCHIVED"
                ].includes(lifecycleStatus)
            ) {
                return jsonResponse({
                    success: false,
                    status: "CONFLICT",
                    reasonCode:
                        "CUSTOMER_RESTORE_STATE_INVALID",
                    customerId: safeCustomerId,
                    operationalStatus,
                    lifecycleStatus,
                    requestId
                }, 409, {
                    "Cache-Control": "no-store"
                });
            }

            nextLifecycleStatus = "ACTIVE";
            nextOperationalStatus = "ACTIVE";
        }

        const now =
            new Date().toISOString();

        const auditId =
            "AUD-" +
            crypto.randomUUID()
                .replace(/-/g, "")
                .slice(0, 20)
                .toUpperCase();

        const archiveId =
            "CAR-" +
            crypto.randomUUID()
                .replace(/-/g, "")
                .slice(0, 20)
                .toUpperCase();

        /*
         * Snapshot references only.
         * Never include raw license keys, OTP hashes,
         * session tokens, device tokens or auth secrets.
         */

        const licensesResult =
            await env.DB.prepare(`
                SELECT
                    license_id,
                    plan_code,
                    status,
                    activation_date,
                    expiry_date,
                    created_at
                FROM licenses
                WHERE customer_id = ?
                ORDER BY created_at ASC
            `)
            .bind(safeCustomerId)
            .all();

        const licenses =
            licensesResult &&
            Array.isArray(licensesResult.results)
                ? licensesResult.results
                : [];

        const licenseRefs =
            licenses.map(row => ({
                licenseId: row.license_id || null
            }));

        const planHistory =
            licenses.map(row => ({
                licenseId: row.license_id || null,
                planCode: row.plan_code || null
            }));

        const statusHistory =
            licenses.map(row => ({
                licenseId: row.license_id || null,
                status: row.status || null,
                activationDate:
                    row.activation_date || null,
                expiryDate:
                    row.expiry_date || null
            }));

        /*
         * Orders are linked primarily by license_id.
         * No broad email-based ownership inference here.
         */

        let orderRefs = [];
        let paymentRefs = [];

        if (licenseRefs.length) {
            const ordersResult =
                await env.DB.prepare(`
                    SELECT
                        order_id,
                        license_id,
                        registration_id,
                        status,
                        payment_reference
                    FROM web_orders
                    WHERE license_id IN (
                        SELECT license_id
                        FROM licenses
                        WHERE customer_id = ?
                    )
                    ORDER BY created_at ASC
                `)
                .bind(safeCustomerId)
                .all();

            const orders =
                ordersResult &&
                Array.isArray(ordersResult.results)
                    ? ordersResult.results
                    : [];

            orderRefs =
                orders.map(row => ({
                    orderId: row.order_id || null,
                    licenseId: row.license_id || null,
                    registrationId:
                        row.registration_id || null,
                    status: row.status || null
                }));

            paymentRefs =
                orders
                    .filter(row =>
                        row.payment_reference
                    )
                    .map(row => ({
                        orderId: row.order_id || null,
                        paymentReference:
                            row.payment_reference
                    }));
        }

        /*
         * Registration references only.
         * Preserve IDs needed for historical traceability
         * without duplicating registration PII.
         */
        const registrationRefs =
            Array.from(
                new Set(
                    orderRefs
                        .map(row =>
                            normalizeString(
                                row.registrationId
                            )
                        )
                        .filter(Boolean)
                )
            ).map(registrationId => ({
                registrationId
            }));

        const snapshotStatement =
            env.DB.prepare(`
                INSERT INTO customer_archive_snapshots (
                    archive_id,
                    customer_id,
                    lifecycle_action,
                    reason_code,
                    registration_refs_json,
                    license_refs_json,
                    order_refs_json,
                    payment_refs_json,
                    plan_history_json,
                    status_history_json,
                    requested_by,
                    approved_by,
                    request_id,
                    audit_id,
                    created_at
                )
                SELECT
                    ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    'ADMIN',
                    NULL,
                    ?, ?, ?
                WHERE EXISTS (
                    SELECT 1
                    FROM customer_lifecycle
                    WHERE customer_id=?
                      AND lifecycle_status=?
                      AND last_request_id=?
                )
                  AND EXISTS (
                      SELECT 1
                      FROM customers
                      WHERE customer_id=?
                        AND status=?
                  )
            `)
            .bind(
                archiveId,
                safeCustomerId,
                safeAction,
                reasonCode,
                JSON.stringify(registrationRefs),
                JSON.stringify(licenseRefs),
                JSON.stringify(orderRefs),
                JSON.stringify(paymentRefs),
                JSON.stringify(planHistory),
                JSON.stringify(statusHistory),
                requestId,
                auditId,
                now,
                safeCustomerId,
                nextLifecycleStatus,
                requestId,
                safeCustomerId,
                nextOperationalStatus
            );

        let lifecycleStatement;

        if (safeAction === "DEACTIVATE") {
            lifecycleStatement =
                env.DB.prepare(`
                    INSERT INTO customer_lifecycle (
                        customer_id,
                        lifecycle_status,
                        reason_code,
                        deactivated_at,
                        archived_at,
                        recovery_until,
                        last_action,
                        last_request_id,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        ?,
                        'DEACTIVATED',
                        ?,
                        ?,
                        NULL,
                        NULL,
                        'DEACTIVATE',
                        ?,
                        ?,
                        ?
                    )
                    ON CONFLICT(customer_id)
                    DO UPDATE SET
                        lifecycle_status='DEACTIVATED',
                        reason_code=excluded.reason_code,
                        deactivated_at=excluded.deactivated_at,
                        archived_at=NULL,
                        recovery_until=NULL,
                        last_action='DEACTIVATE',
                        last_request_id=excluded.last_request_id,
                        updated_at=excluded.updated_at
                    WHERE customer_lifecycle.lifecycle_status='ACTIVE'
                `)
                .bind(
                    safeCustomerId,
                    reasonCode,
                    now,
                    requestId,
                    now,
                    now
                );
        }

        if (safeAction === "ARCHIVE") {
            lifecycleStatement =
                env.DB.prepare(`
                    UPDATE customer_lifecycle
                    SET
                        lifecycle_status='ARCHIVED',
                        reason_code=?,
                        archived_at=?,
                        last_action='ARCHIVE',
                        last_request_id=?,
                        updated_at=?
                    WHERE customer_id=?
                      AND lifecycle_status='DEACTIVATED'
                `)
                .bind(
                    reasonCode,
                    now,
                    requestId,
                    now,
                    safeCustomerId
                );
        }

        if (safeAction === "RESTORE") {
            lifecycleStatement =
                env.DB.prepare(`
                    UPDATE customer_lifecycle
                    SET
                        lifecycle_status='ACTIVE',
                        reason_code=?,
                        deactivated_at=NULL,
                        archived_at=NULL,
                        recovery_until=NULL,
                        last_action='RESTORE',
                        last_request_id=?,
                        updated_at=?
                    WHERE customer_id=?
                      AND lifecycle_status IN (
                          'DEACTIVATED',
                          'ARCHIVED'
                      )
                `)
                .bind(
                    reasonCode,
                    requestId,
                    now,
                    safeCustomerId
                );
        }

        const customerStatement =
            env.DB.prepare(`
                UPDATE customers
                SET
                    status=?,
                    updated_at=CURRENT_TIMESTAMP
                WHERE customer_id=?
                  AND status=?
                  AND EXISTS (
                      SELECT 1
                      FROM customer_lifecycle
                      WHERE customer_id=?
                        AND lifecycle_status=?
                        AND last_request_id=?
                  )
            `)
            .bind(
                nextOperationalStatus,
                safeCustomerId,
                operationalStatus,
                safeCustomerId,
                nextLifecycleStatus,
                requestId
            );

        const auditStatement =
            env.DB.prepare(`
                INSERT INTO audit_logs (
                    audit_id,
                    actor_type,
                    actor_id,
                    action,
                    entity_type,
                    entity_id,
                    result,
                    reason_code,
                    request_id,
                    metadata_json,
                    created_at
                )
                SELECT
                    ?,
                    'ADMIN',
                    NULL,
                    ?,
                    'CUSTOMER',
                    ?,
                    'SUCCESS',
                    ?,
                    ?,
                    ?,
                    ?
                WHERE EXISTS (
                    SELECT 1
                    FROM customer_lifecycle
                    WHERE customer_id=?
                      AND lifecycle_status=?
                      AND last_request_id=?
                )
                  AND EXISTS (
                      SELECT 1
                      FROM customers
                      WHERE customer_id=?
                        AND status=?
                  )
            `)
            .bind(
                auditId,
                "CUSTOMER_" + safeAction,
                safeCustomerId,
                reasonCode,
                requestId,
                JSON.stringify({
                    previousOperationalStatus:
                        operationalStatus,
                    previousLifecycleStatus:
                        lifecycleStatus,
                    newOperationalStatus:
                        nextOperationalStatus,
                    newLifecycleStatus:
                        nextLifecycleStatus,
                    archiveId
                }),
                now,
                safeCustomerId,
                nextLifecycleStatus,
                requestId,
                safeCustomerId,
                nextOperationalStatus
            );

        /*
         * D1 batch used consistently with the existing project.
         * Do not describe this as stronger transaction semantics
         * than D1 itself guarantees.
         */
        await env.DB.batch([
            lifecycleStatement,
            customerStatement,
            snapshotStatement,
            auditStatement
        ]);

        /*
         * Lifecycle hardening:
         * Re-read authoritative state after conditional writes.
         * Never return success for a stale/concurrent transition.
         */
        const verifiedState =
            await env.DB.prepare(`
                SELECT
                    c.status AS operational_status,
                    COALESCE(
                        cl.lifecycle_status,
                        'ACTIVE'
                    ) AS lifecycle_status,
                    cl.last_request_id
                FROM customers AS c
                LEFT JOIN customer_lifecycle AS cl
                    ON cl.customer_id = c.customer_id
                WHERE c.customer_id = ?
                LIMIT 1
            `)
            .bind(safeCustomerId)
            .first();

        const verifiedOperationalStatus =
            verifiedState
                ? String(
                    verifiedState.operational_status || ""
                  ).trim().toUpperCase()
                : "";

        const verifiedLifecycleStatus =
            verifiedState
                ? String(
                    verifiedState.lifecycle_status || ""
                  ).trim().toUpperCase()
                : "";

        const verifiedRequestId =
            verifiedState
                ? normalizeString(
                    verifiedState.last_request_id
                  )
                : "";

        if (
            !verifiedState ||
            verifiedOperationalStatus !==
                nextOperationalStatus ||
            verifiedLifecycleStatus !==
                nextLifecycleStatus ||
            verifiedRequestId !==
                normalizeString(requestId)
        ) {
            return jsonResponse({
                success: false,
                status: "CONFLICT",
                reasonCode:
                    "CUSTOMER_LIFECYCLE_CONCURRENT_CHANGE",
                customerId: safeCustomerId,
                requestId
            }, 409, {
                "Cache-Control": "no-store"
            });
        }

        return jsonResponse({
            success: true,
            status: nextLifecycleStatus,
            action: safeAction,
            customerId: safeCustomerId,
            operationalStatus:
                nextOperationalStatus,
            lifecycleStatus:
                nextLifecycleStatus,
            archiveId,
            auditId,
            requestId
        }, 200, {
            "Cache-Control": "no-store"
        });

    } catch (error) {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode:
                "CUSTOMER_LIFECYCLE_ACTION_FAILED",
            customerId: safeCustomerId,
            requestId
        }, 500, {
            "Cache-Control": "no-store"
        });
    }
}
async function handleAdminCustomerDeletePreview(
    request,
    env,
    requestId,
    customerId
) {
    const authorization =
        verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status,
        getAdminAuthorizationResponseHeaders(authorization));
    }

    const safeCustomerId =
        normalizeString(customerId);

    if (!safeCustomerId) {
        return validationError(
            "CUSTOMER_ID_REQUIRED",
            requestId
        );
    }

    try {
        const customer =
            await env.DB
                .prepare(
                    "SELECT customer_id, email FROM customers WHERE customer_id = ? LIMIT 1"
                )
                .bind(safeCustomerId)
                .first();

        if (!customer) {
            return jsonResponse({
                success: false,
                status: "NOT_FOUND",
                reasonCode: "CUSTOMER_NOT_FOUND",
                customerId: safeCustomerId,
                requestId
            }, 404);
        }

        const email =
            normalizeString(customer.email);

        async function count(sql, ...values) {
            const row =
                await env.DB
                    .prepare(sql)
                    .bind(...values)
                    .first();

            return Number(
                row && row.count || 0
            );
        }

        const counts = {
            customers: 1,

            licenses:
                await count(
                    "SELECT COUNT(*) AS count FROM licenses WHERE customer_id = ?",
                    safeCustomerId
                ),

            devices:
                await count(
                    "SELECT COUNT(*) AS count FROM devices WHERE license_id IN (SELECT license_id FROM licenses WHERE customer_id = ?)",
                    safeCustomerId
                ),

            renewals:
                await count(
                    "SELECT COUNT(*) AS count FROM renewals WHERE license_id IN (SELECT license_id FROM licenses WHERE customer_id = ?)",
                    safeCustomerId
                ),

            activations:
                await count(
                    "SELECT COUNT(*) AS count FROM activations WHERE license_id IN (SELECT license_id FROM licenses WHERE customer_id = ?)",
                    safeCustomerId
                ),

            notifications:
                await count(
                    "SELECT COUNT(*) AS count FROM notifications WHERE customer_id = ? OR license_id IN (SELECT license_id FROM licenses WHERE customer_id = ?)",
                    safeCustomerId,
                    safeCustomerId
                ),

            downloads:
                await count(
                    "SELECT COUNT(*) AS count FROM download_events WHERE customer_id = ? OR license_id IN (SELECT license_id FROM licenses WHERE customer_id = ?)",
                    safeCustomerId,
                    safeCustomerId
                ),

            orders:
                email
                    ? await count(
                        "SELECT COUNT(*) AS count FROM web_orders WHERE email = ?",
                        email
                    )
                    : 0,

            registrations:
                email
                    ? await count(
                        "SELECT COUNT(*) AS count FROM customer_registrations WHERE email = ?",
                        email
                    )
                    : 0
        };

        if (email) {
            counts.paymentEvents =
                await count(
                    "SELECT COUNT(*) AS count FROM payment_events WHERE order_id IN (SELECT order_id FROM web_orders WHERE email = ?)",
                    email
                );

            counts.fulfillmentEvents =
                await count(
                    "SELECT COUNT(*) AS count FROM order_fulfillment_events WHERE order_id IN (SELECT order_id FROM web_orders WHERE email = ?)",
                    email
                );

            counts.orderProfiles =
                await count(
                    "SELECT COUNT(*) AS count FROM web_order_profiles WHERE order_id IN (SELECT order_id FROM web_orders WHERE email = ?)",
                    email
                );

            counts.orderSnapshots =
                await count(
                    "SELECT COUNT(*) AS count FROM web_order_plan_snapshots WHERE order_id IN (SELECT order_id FROM web_orders WHERE email = ?)",
                    email
                );
        } else {
            counts.paymentEvents = 0;
            counts.fulfillmentEvents = 0;
            counts.orderProfiles = 0;
            counts.orderSnapshots = 0;
        }

        return jsonResponse({
            success: true,
            status: "OK",
            customer: {
                customerId:
                    customer.customer_id,
                email:
                    customer.email || null
            },
            counts,
            confirmationRequired:
                "DELETE CUSTOMER " +
                safeCustomerId,
            auditLogsPreserved: true,
            requestId
        });

    } catch (error) {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode:
                "CUSTOMER_DELETE_PREVIEW_FAILED",
            requestId
        }, 500);
    }
}


async function handleAdminCustomerDelete(
    request,
    env,
    requestId,
    customerId
) {
    const authorization =
        verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status,
        getAdminAuthorizationResponseHeaders(authorization));
    }

    const safeCustomerId =
        normalizeString(customerId);

    if (!safeCustomerId) {
        return validationError(
            "CUSTOMER_ID_REQUIRED",
            requestId
        );
    }

    let payload;

    try {
        payload = await request.json();
    } catch {
        return validationError(
            "INVALID_JSON_BODY",
            requestId
        );
    }

    /*
     * K7 safety lock:
     * Direct destructive customer deletion is disabled.
     * Final lifecycle:
     * ACTIVE -> DEACTIVATED -> ARCHIVED ->
     * protected cleanup with preserved audit history.
     */
    return jsonResponse({
        success: false,
        status: "LOCKED",
        reasonCode: "CUSTOMER_DELETE_LIFECYCLE_REQUIRED",
        customerId: safeCustomerId,
        requestId
    }, 409, {
        "Cache-Control": "no-store"
    });

    const expectedConfirmation =
        "DELETE CUSTOMER " +
        safeCustomerId;

    if (
        normalizeString(
            payload &&
            payload.confirmation
        ) !== expectedConfirmation
    ) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode:
                "CUSTOMER_DELETE_CONFIRMATION_REQUIRED",
            confirmationRequired:
                expectedConfirmation,
            requestId
        }, 400);
    }

    try {
        const customer =
            await env.DB
                .prepare(
                    "SELECT customer_id, email FROM customers WHERE customer_id = ? LIMIT 1"
                )
                .bind(safeCustomerId)
                .first();

        if (!customer) {
            return jsonResponse({
                success: false,
                status: "NOT_FOUND",
                reasonCode:
                    "CUSTOMER_NOT_FOUND",
                customerId:
                    safeCustomerId,
                requestId
            }, 404);
        }

        const email =
            normalizeString(customer.email);

        const auditId =
            "AUD-" +
            crypto.randomUUID()
                .replace(/-/g, "")
                .slice(0, 20)
                .toUpperCase();

        const deletedAt =
            new Date().toISOString();

        const statements = [];

        /*
         * Order child/event records first.
         * Orders are matched using the customer's email,
         * which is the existing web-order lookup key.
         */

        if (email) {
            statements.push(

                env.DB.prepare(
                    "DELETE FROM payment_events WHERE order_id IN (SELECT order_id FROM web_orders WHERE email = ?)"
                ).bind(email),

                env.DB.prepare(
                    "DELETE FROM order_fulfillment_events WHERE order_id IN (SELECT order_id FROM web_orders WHERE email = ?)"
                ).bind(email),

                env.DB.prepare(
                    "DELETE FROM web_order_plan_snapshots WHERE order_id IN (SELECT order_id FROM web_orders WHERE email = ?)"
                ).bind(email),

                env.DB.prepare(
                    "DELETE FROM web_order_profiles WHERE order_id IN (SELECT order_id FROM web_orders WHERE email = ?)"
                ).bind(email)
            );
        }

        /*
         * Customer/license activity.
         */

        statements.push(

            env.DB.prepare(
                "DELETE FROM notification_automation_events WHERE customer_id = ? OR license_id IN (SELECT license_id FROM licenses WHERE customer_id = ?)"
            ).bind(
                safeCustomerId,
                safeCustomerId
            ),

            env.DB.prepare(
                "DELETE FROM notifications WHERE customer_id = ? OR license_id IN (SELECT license_id FROM licenses WHERE customer_id = ?)"
            ).bind(
                safeCustomerId,
                safeCustomerId
            ),

            env.DB.prepare(
                "DELETE FROM download_events WHERE customer_id = ? OR license_id IN (SELECT license_id FROM licenses WHERE customer_id = ?)"
            ).bind(
                safeCustomerId,
                safeCustomerId
            ),

            env.DB.prepare(
                "DELETE FROM activations WHERE license_id IN (SELECT license_id FROM licenses WHERE customer_id = ?)"
            ).bind(
                safeCustomerId
            ),

            env.DB.prepare(
                "DELETE FROM renewals WHERE license_id IN (SELECT license_id FROM licenses WHERE customer_id = ?)"
            ).bind(
                safeCustomerId
            ),

            env.DB.prepare(
                "DELETE FROM devices WHERE license_id IN (SELECT license_id FROM licenses WHERE customer_id = ?)"
            ).bind(
                safeCustomerId
            ),

            env.DB.prepare(
                "DELETE FROM license_vault WHERE license_id IN (SELECT license_id FROM licenses WHERE customer_id = ?)"
            ).bind(
                safeCustomerId
            )
        );

        if (email) {
            statements.push(
                env.DB.prepare(
                    "DELETE FROM web_orders WHERE email = ?"
                ).bind(email),

                env.DB.prepare(
                    "DELETE FROM customer_registrations WHERE email = ?"
                ).bind(email)
            );
        }

        statements.push(

            env.DB.prepare(
                "DELETE FROM licenses WHERE customer_id = ?"
            ).bind(
                safeCustomerId
            ),

            env.DB.prepare(
                "DELETE FROM customers WHERE customer_id = ?"
            ).bind(
                safeCustomerId
            ),

            /*
             * Historical audit_logs are intentionally preserved.
             */

            env.DB.prepare(
                "INSERT INTO audit_logs (audit_id, actor_type, actor_id, action, entity_type, entity_id, result, reason_code, request_id, metadata_json, created_at) VALUES (?, 'ADMIN', NULL, 'DELETE_CUSTOMER', 'CUSTOMER', ?, 'SUCCESS', 'ADMIN_CUSTOMER_DELETE', ?, ?, ?)"
            ).bind(
                auditId,
                safeCustomerId,
                requestId,
                JSON.stringify({
                    customerId:
                        safeCustomerId,
                    email:
                        customer.email || null,
                    deletedAt
                }),
                deletedAt
            )
        );

        await env.DB.batch(statements);

        return jsonResponse({
            success: true,
            status: "DELETED",
            customerId:
                safeCustomerId,
            auditId,
            deletedAt,
            auditLogsPreserved: true,
            requestId
        });

    } catch (error) {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode:
                "CUSTOMER_DELETE_FAILED",
            requestId
        }, 500);
    }
}

async function handleAdminFactoryResetBusinessData(request, env, requestId) {
    const authorization = verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    const contentType = request.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
        return validationError(
            "CONTENT_TYPE_JSON_REQUIRED",
            requestId,
            415
        );
    }

    let payload;

    try {
        payload = await request.json();
    } catch {
        return validationError("INVALID_JSON_BODY", requestId);
    }

    const confirmation =
        normalizeString(payload && payload.confirmation);

    if (confirmation !== "RESET BUSINESS DATA") {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: "FACTORY_RESET_CONFIRMATION_REQUIRED",
            confirmationRequired: "RESET BUSINESS DATA",
            requestId
        }, 400);
    }

    try {
        const before = {};

        const countTables = [
            "customers",
            "licenses",
            "devices",
            "web_orders",
            "payment_events",
            "customer_registrations"
        ];

        for (const table of countTables) {
            const row = await env.DB
                .prepare("SELECT COUNT(*) AS count FROM " + table)
                .first();

            before[table] = Number(row && row.count || 0);
        }

        const auditId =
            "AUD-" +
            crypto.randomUUID()
                .replace(/-/g, "")
                .slice(0, 20)
                .toUpperCase();

        /*
         * IMPORTANT:
         * Dependency-safe order.
         *
         * Preserved:
         * audit_logs
         * business_plans
         * business_plan_offers
         * business_settings
         * releases
         * migrations / Cloudflare internal data
         */

        const statements = [

            /* Activity / transactional events */
            env.DB.prepare("DELETE FROM activations"),
            env.DB.prepare("DELETE FROM notification_automation_events"),
            env.DB.prepare("DELETE FROM notifications"),
            env.DB.prepare("DELETE FROM download_events"),
            env.DB.prepare("DELETE FROM business_events"),

            /* Order event history */
            env.DB.prepare("DELETE FROM payment_events"),
            env.DB.prepare("DELETE FROM order_fulfillment_events"),

            /* Order child records */
            env.DB.prepare("DELETE FROM web_order_plan_snapshots"),
            env.DB.prepare("DELETE FROM web_order_profiles"),

            /* License dependent records */
            env.DB.prepare("DELETE FROM renewals"),
            env.DB.prepare("DELETE FROM devices"),
            env.DB.prepare("DELETE FROM license_vault"),

            /* Orders may reference license IDs logically */
            env.DB.prepare("DELETE FROM web_orders"),

            /* Licenses restrict customer deletion */
            env.DB.prepare("DELETE FROM licenses"),

            /* Registration must be cleared for fresh onboarding */
            env.DB.prepare("DELETE FROM customer_registrations"),

            /* Customer last */
            env.DB.prepare("DELETE FROM customers"),

            /* Preserve audit history and record this reset */
            env.DB.prepare("INSERT INTO audit_logs (audit_id, actor_type, actor_id, action, entity_type, entity_id, result, reason_code, request_id, metadata_json, created_at) VALUES (?, 'ADMIN', NULL, 'FACTORY_RESET_BUSINESS_DATA', 'SYSTEM', 'BUSINESS_DATA', 'SUCCESS', 'ADMIN_FACTORY_RESET', ?, ?, CURRENT_TIMESTAMP)").bind(
                auditId,
                requestId,
                JSON.stringify({
                    before,
                    preserved: [
                        "audit_logs",
                        "business_plans",
                        "business_plan_offers",
                        "business_settings",
                        "releases"
                    ]
                })
            )
        ];

        await env.DB.batch(statements);

        return jsonResponse({
            success: true,
            status: "RESET",
            reasonCode: "BUSINESS_DATA_RESET_SUCCESS",
            before,
            preserved: [
                "audit_logs",
                "business_plans",
                "business_plan_offers",
                "business_settings",
                "releases"
            ],
            auditId,
            requestId
        });

    } catch (error) {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "BUSINESS_DATA_RESET_FAILED",
            requestId
        }, 500);
    }
}


/* ============================================================
   PHASE 6.6 - ADMIN DEVICE MANAGEMENT
   ============================================================ */

async function handleAdminDevicesList(request, env, requestId) {
    const authorization =
        verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    try {
        const url = new URL(request.url);

        const customerId =
            (url.searchParams.get("customerId") || "").trim();

        const licenseId =
            (url.searchParams.get("licenseId") || "").trim();

        const status =
            (url.searchParams.get("status") || "")
                .trim()
                .toUpperCase();

        const allowedStatuses = [
            "ACTIVE",
            "RESET",
            "DEACTIVATED"
        ];

        if (
            status &&
            !allowedStatuses.includes(status)
        ) {
            return jsonResponse({
                success: false,
                status: "ERROR",
                reasonCode: "DEVICE_STATUS_INVALID",
                requestId
            }, 400);
        }

        let sql = `
            SELECT
                d.device_id,
                d.license_id,
                l.customer_id,
                c.full_name AS customer_name,
                d.device_name,
                d.platform,
                d.app_version,
                d.status,
                d.activated_at,
                d.last_seen_at,
                d.deactivated_at,
                d.reset_at,
                d.created_at,
                d.updated_at
            FROM devices d
            INNER JOIN licenses l
                ON l.license_id = d.license_id
            LEFT JOIN customers c
                ON c.customer_id = l.customer_id
            WHERE 1 = 1
        `;

        const bindings = [];

        if (customerId) {
            sql += ` AND l.customer_id = ?`;
            bindings.push(customerId);
        }

        if (licenseId) {
            sql += ` AND d.license_id = ?`;
            bindings.push(licenseId);
        }

        if (status) {
            sql += ` AND d.status = ?`;
            bindings.push(status);
        }

        sql += `
            ORDER BY
                CASE d.status
                    WHEN 'ACTIVE' THEN 0
                    WHEN 'RESET' THEN 1
                    WHEN 'DEACTIVATED' THEN 2
                    ELSE 3
                END,
                d.created_at DESC
        `;

        let statement = env.DB.prepare(sql);

        if (bindings.length > 0) {
            statement =
                statement.bind(...bindings);
        }

        const result =
            await statement.all();

        const devices =
            result &&
            Array.isArray(result.results)
                ? result.results
                : [];

        return jsonResponse({
            success: true,
            status: "OK",
            devices,
            count: devices.length,
            filters: {
                customerId: customerId || null,
                licenseId: licenseId || null,
                status: status || null
            },
            requestId
        });

    } catch {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "DEVICE_LIST_FAILED",
            requestId
        }, 500);
    }
}


async function handleAdminDeviceResetById(
    request,
    env,
    requestId,
    deviceId
) {
    const authorization =
        verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    const safeDeviceId =
        typeof deviceId === "string"
            ? deviceId.trim()
            : "";

    if (!safeDeviceId) {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "DEVICE_ID_REQUIRED",
            requestId
        }, 400);
    }

    let device;

    try {
        device =
            await env.DB
                .prepare(`
                    SELECT
                        d.device_id,
                        d.license_id,
                        d.device_name,
                        d.platform,
                        d.app_version,
                        d.status,
                        d.activated_at,
                        d.last_seen_at,
                        l.customer_id,
                        l.status AS license_status,
                        l.expiry_date,
                        c.status AS customer_status
                    FROM devices d
                    INNER JOIN licenses l
                        ON l.license_id = d.license_id
                    LEFT JOIN customers c
                        ON c.customer_id = l.customer_id
                    WHERE d.device_id = ?
                    LIMIT 1
                `)
                .bind(safeDeviceId)
                .first();

    } catch {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "DEVICE_LOOKUP_FAILED",
            requestId
        }, 500);
    }

    if (!device) {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "DEVICE_NOT_FOUND",
            requestId
        }, 404);
    }

    if (
        String(device.status || "").toUpperCase() !==
        "ACTIVE"
    ) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: "DEVICE_NOT_ACTIVE",
            deviceId: safeDeviceId,
            deviceStatus: device.status,
            requestId
        }, 409);
    }

    const resetAt =
        new Date().toISOString();

    const activationId =
        `ACT-${crypto.randomUUID()
            .replace(/-/g, "")
            .toUpperCase()}`;

    const auditId =
        `AUD-${crypto.randomUUID()
            .replace(/-/g, "")
            .toUpperCase()}`;

    try {
        const statements = [

            env.DB
                .prepare(`
                    UPDATE devices
                    SET
                        status = 'RESET',
                        reset_at = ?,
                        deactivated_at = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE device_id = ?
                      AND status = 'ACTIVE'
                `)
                .bind(
                    resetAt,
                    resetAt,
                    safeDeviceId
                ),

            env.DB
                .prepare(`
                    INSERT INTO activations (
                        activation_id,
                        license_id,
                        device_id,
                        event_type,
                        result,
                        reason_code,
                        app_version,
                        created_at
                    )
                    VALUES (
                        ?,
                        ?,
                        ?,
                        'RESET_DEVICE',
                        'SUCCESS',
                        'ADMIN_DEVICE_RESET',
                        ?,
                        ?
                    )
                `)
                .bind(
                    activationId,
                    device.license_id,
                    safeDeviceId,
                    device.app_version || null,
                    resetAt
                ),

            env.DB
                .prepare(`
                    INSERT INTO audit_logs (
                        audit_id,
                        actor_type,
                        actor_id,
                        action,
                        entity_type,
                        entity_id,
                        result,
                        reason_code,
                        request_id,
                        metadata_json,
                        created_at
                    )
                    VALUES (
                        ?,
                        'ADMIN',
                        NULL,
                        'RESET_DEVICE',
                        'DEVICE',
                        ?,
                        'SUCCESS',
                        'ADMIN_DEVICE_RESET',
                        ?,
                        ?,
                        ?
                    )
                `)
                .bind(
                    auditId,
                    safeDeviceId,
                    requestId,
                    JSON.stringify({
                        licenseId: device.license_id,
                        customerId:
                            device.customer_id || null,
                        previousStatus:
                            device.status
                    }),
                    resetAt
                )
        ];

        await env.DB.batch(statements);

        return jsonResponse({
            success: true,
            status: "RESET",
            reasonCode: "DEVICE_RESET_SUCCESS",
            deviceId: safeDeviceId,
            licenseId: device.license_id,
            customerId:
                device.customer_id || null,
            previousStatus: "ACTIVE",
            deviceStatus: "RESET",
            resetAt,
            activationId,
            auditId,
            requestId
        });

    } catch {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "DEVICE_RESET_FAILED",
            requestId
        }, 500);
    }
}

async function handleAdminDeviceReset(request, env, requestId) {
    const authorization =
        verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    const contentType =
        request.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
        return validationError(
            "CONTENT_TYPE_JSON_REQUIRED",
            requestId,
            415
        );
    }

    let payload;

    try {
        payload = await request.json();
    } catch {
        return validationError(
            "INVALID_JSON_BODY",
            requestId
        );
    }

    const validation =
        validateDeviceResetPayload(payload);

    if (!validation.ok) {
        return validationError(
            validation.reasonCode,
            requestId
        );
    }

    let license;

    try {
        license = await findLicenseByRawKey(
            env,
            validation.value.licenseKey
        );
    } catch {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "LICENSE_LOOKUP_FAILED",
            requestId
        }, 500);
    }

    if (!license) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: "LICENSE_NOT_FOUND",
            requestId
        }, 404);
    }

    const statusValidation =
        validateCustomerAndLicenseStatus(license);

    if (!statusValidation.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: statusValidation.reasonCode,
            requestId
        }, 403);
    }

    let resetResult;

    try {
        resetResult =
            await resetActiveDevice(
                env,
                license,
                requestId
            );
    } catch {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "DEVICE_RESET_FAILED",
            requestId
        }, 500);
    }

    if (!resetResult.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: resetResult.reasonCode,
            requestId
        }, 409);
    }

    return jsonResponse({
        success: true,
        status: "RESET",
        licenseId: license.license_id,
        previousDeviceId:
            resetResult.previousDeviceId,
        resetAt:
            resetResult.resetAt,
        reasonCode: "DEVICE_RESET_SUCCESS",
        requestId
    }, 200);
}

async function handleActivate(request, env, requestId) {
    const contentType =
        request.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
        return validationError(
            "CONTENT_TYPE_JSON_REQUIRED",
            requestId,
            415
        );
    }

    let payload;

    try {
        payload = await request.json();
    } catch {
        return validationError(
            "INVALID_JSON_BODY",
            requestId
        );
    }

    const validation = validateActivationPayload(payload);

    if (!validation.ok) {
        return validationError(
            validation.reasonCode,
            requestId
        );
    }

    let license;

    try {
        license = await findLicenseByRawKey(
            env,
            validation.value.licenseKey
        );
    } catch {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "LICENSE_LOOKUP_FAILED",
            requestId
        }, 500);
    }

    if (!license) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: "LICENSE_NOT_FOUND",
            requestId
        }, 404);
    }

    const statusValidation =
        validateCustomerAndLicenseStatus(license);

    if (!statusValidation.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: statusValidation.reasonCode,
            requestId
        }, 403);
    }

    const activationLifecycle = await env.DB.prepare(`
        SELECT COALESCE(lifecycle_status, 'ACTIVE') AS lifecycle_status
        FROM customer_lifecycle
        WHERE customer_id = ?
        LIMIT 1
    `).bind(license.customer_id).first();

    if (
        activationLifecycle &&
        String(activationLifecycle.lifecycle_status || "ACTIVE")
            .trim()
            .toUpperCase() !== "ACTIVE"
    ) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: "CUSTOMER_LIFECYCLE_INACTIVE",
            requestId
        }, 403);
    }

    const expiryValidation =
        validateLicenseExpiry(license);

    if (!expiryValidation.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: expiryValidation.reasonCode,
            requestId
        }, 403);
    }

    let activation;

    try {
        activation = await activateFirstDevice(
            env,
            license,
            validation.value,
            requestId
        );
    } catch {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "DEVICE_ACTIVATION_FAILED",
            requestId
        }, 500);
    }

    if (!activation.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: activation.reasonCode,
            requestId
        }, 409);
    }

    return jsonResponse({
        success: true,
        status: "ACTIVE",
        licenseId: license.license_id,
        planCode: license.plan_code,
        expiryDate: license.expiry_date,
        deviceId: activation.deviceId,
        offlineGraceDays: license.offline_grace_days,
        reasonCode: activation.validated
            ? "DEVICE_VALIDATION_SUCCESS"
            : "ACTIVATION_SUCCESS",
        requestId
    }, 200);
}



/* K7 OFFLINE_GRACE SECURITY
   Authoritative runtime validation for an already activated device.
   No raw license key is required or returned.
*/
async function handleRuntimeLicenseValidation(request, env, requestId) {
    let payload;

    try {
        payload = await request.json();
    } catch (_) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: "INVALID_JSON_BODY",
            requestId
        }, 400);
    }

    const licenseId =
        typeof payload.licenseId === "string"
            ? payload.licenseId.trim()
            : "";

    const deviceToken =
        typeof payload.deviceToken === "string"
            ? payload.deviceToken.trim()
            : "";

    const appVersion =
        typeof payload.appVersion === "string"
            ? payload.appVersion.trim()
            : "";

    if (!licenseId) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: "LICENSE_ID_REQUIRED",
            requestId
        }, 400);
    }

    if (!deviceToken) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: "DEVICE_TOKEN_REQUIRED",
            requestId
        }, 400);
    }

    let license;

    try {
        license = await env.DB
            .prepare(`
                SELECT
                    l.license_id,
                    l.customer_id,
                    l.plan_code,
                    l.status,
                    l.max_devices,
                    l.expiry_date,
                    l.offline_grace_days,
                    c.status AS customer_status,
                    COALESCE(cl.lifecycle_status, 'ACTIVE') AS lifecycle_status
                FROM licenses AS l
                INNER JOIN customers AS c
                    ON c.customer_id = l.customer_id
                LEFT JOIN customer_lifecycle AS cl
                    ON cl.customer_id = c.customer_id
                WHERE l.license_id = ?
                LIMIT 1
            `)
            .bind(licenseId)
            .first();
    } catch (_) {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "RUNTIME_LICENSE_LOOKUP_FAILED",
            requestId
        }, 500);
    }

    const statusCheck =
        validateCustomerAndLicenseStatus(license);

    if (!statusCheck.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: statusCheck.reasonCode,
            requestId
        }, 403);
    }

    if (
        String(license.lifecycle_status || "ACTIVE")
            .trim()
            .toUpperCase() !== "ACTIVE"
    ) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: "CUSTOMER_LIFECYCLE_INACTIVE",
            requestId
        }, 403);
    }

    /*
       A cached runtime authorization must correspond to an
       actually ACTIVE server license. PENDING is valid only
       for first activation/bootstrap, not cached runtime access.
    */
    if (
        String(license.status || "")
            .trim()
            .toUpperCase() !== "ACTIVE"
    ) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: "LICENSE_NOT_ACTIVE",
            requestId
        }, 403);
    }

    const expiryCheck =
        validateLicenseExpiry(license);

    if (!expiryCheck.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: expiryCheck.reasonCode,
            requestId
        }, 403);
    }

    let deviceTokenHash;

    try {
        deviceTokenHash =
            await hashDeviceToken(deviceToken);
    } catch (_) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: "DEVICE_TOKEN_INVALID",
            requestId
        }, 400);
    }

    let device;

    try {
        device = await env.DB
            .prepare(`
                SELECT
                    device_id,
                    status
                FROM devices
                WHERE license_id = ?
                  AND device_token_hash = ?
                  AND status = 'ACTIVE'
                LIMIT 1
            `)
            .bind(
                license.license_id,
                deviceTokenHash
            )
            .first();
    } catch (_) {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "RUNTIME_DEVICE_LOOKUP_FAILED",
            requestId
        }, 500);
    }

    if (!device) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: "DEVICE_NOT_ACTIVE",
            requestId
        }, 403);
    }

    /*
       Successful online validation may update last-seen metadata.
       This does not create a device or activate a license.
    */
    try {
        await env.DB
            .prepare(`
                UPDATE devices
                SET
                    app_version = ?,
                    last_seen_at = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE device_id = ?
                  AND license_id = ?
                  AND status = 'ACTIVE'
            `)
            .bind(
                appVersion || null,
                new Date().toISOString(),
                device.device_id,
                license.license_id
            )
            .run();
    } catch (_) {
        /* Validation itself remains authoritative. */
    }

    return jsonResponse({
        success: true,
        status: "ACTIVE",
        licenseId: license.license_id,
        planCode: license.plan_code,
        expiryDate: license.expiry_date,
        deviceId: device.device_id,
        offlineGraceDays: license.offline_grace_days,
        reasonCode: "RUNTIME_VALIDATION_SUCCESS",
        requestId
    }, 200);
}

async function handleAdminReportsSummary(request, env, requestId) {
    const authorization = verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    try {
        const [
            customers,
            licenses,
            devices,
            renewals,
            recentRenewals
        ] = await Promise.all([
            env.DB.prepare(`
                SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN status='ACTIVE' THEN 1 ELSE 0 END) AS active,
                    SUM(CASE WHEN status='BLOCKED' THEN 1 ELSE 0 END) AS blocked,
                    SUM(CASE WHEN status='INACTIVE' THEN 1 ELSE 0 END) AS inactive
                FROM customers
            `).first(),

            env.DB.prepare(`
                SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN status='ACTIVE' THEN 1 ELSE 0 END) AS active,
                    SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending,
                    SUM(CASE WHEN status='BLOCKED' THEN 1 ELSE 0 END) AS blocked,
                    SUM(CASE WHEN status='DEACTIVATED' THEN 1 ELSE 0 END) AS deactivated,
                    SUM(
                        CASE
                            WHEN status='EXPIRED'
                              OR (expiry_date IS NOT NULL AND date(expiry_date) < date('now'))
                            THEN 1 ELSE 0
                        END
                    ) AS expired,
                    SUM(
                        CASE
                            WHEN expiry_date IS NOT NULL
                             AND date(expiry_date) >= date('now')
                             AND date(expiry_date) <= date('now','+30 day')
                            THEN 1 ELSE 0
                        END
                    ) AS expiring_30_days
                FROM licenses
            `).first(),

            env.DB.prepare(`
                SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN status='ACTIVE' THEN 1 ELSE 0 END) AS active,
                    SUM(CASE WHEN status='RESET' THEN 1 ELSE 0 END) AS reset,
                    SUM(CASE WHEN status='DEACTIVATED' THEN 1 ELSE 0 END) AS deactivated
                FROM devices
            `).first(),

            env.DB.prepare(`
                SELECT
                    COUNT(*) AS total_renewals,
                    COALESCE(SUM(amount_minor),0) AS total_amount_minor,
                    COALESCE(
                        SUM(
                            CASE
                                WHEN date(created_at) >= date('now','-30 day')
                                THEN amount_minor ELSE 0
                            END
                        ),0
                    ) AS last_30_days_amount_minor,
                    SUM(
                        CASE
                            WHEN date(created_at) >= date('now','-30 day')
                            THEN 1 ELSE 0
                        END
                    ) AS last_30_days_count
                FROM renewals
                WHERE status='COMPLETED'
            `).first(),

            env.DB.prepare(`
                SELECT
                    r.renewal_id,
                    r.license_id,
                    l.customer_id,
                    c.full_name AS customer_name,
                    r.old_expiry_date,
                    r.new_expiry_date,
                    r.renewal_days,
                    r.amount_minor,
                    r.currency,
                    r.payment_reference,
                    r.status,
                    r.created_at
                FROM renewals r
                LEFT JOIN licenses l ON l.license_id=r.license_id
                LEFT JOIN customers c ON c.customer_id=l.customer_id
                ORDER BY r.created_at DESC
                LIMIT 10
            `).all()
        ]);

        return jsonResponse({
            success: true,
            status: "OK",
            generatedAt: new Date().toISOString(),
            metrics: {
                customers: customers || {},
                licenses: licenses || {},
                devices: devices || {},
                renewals: renewals || {}
            },
            recentRenewals:
                recentRenewals && Array.isArray(recentRenewals.results)
                    ? recentRenewals.results
                    : [],
            requestId
        });

    } catch (error) {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "REPORT_SUMMARY_FAILED",
            requestId
        }, 500);
    }
}

async function handleAdminRenewalReport(request, env, requestId) {
    const authorization = verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    try {
        const url = new URL(request.url);

        const from =
            normalizeString(url.searchParams.get("from"));

        const to =
            normalizeString(url.searchParams.get("to"));

        const status =
            normalizeString(url.searchParams.get("status"))
                .toUpperCase();

        const conditions = [];
        const bindings = [];

        if (from) {
            conditions.push("date(r.created_at) >= date(?)");
            bindings.push(from);
        }

        if (to) {
            conditions.push("date(r.created_at) <= date(?)");
            bindings.push(to);
        }

        if (status) {
            conditions.push("r.status = ?");
            bindings.push(status);
        }

        const where =
            conditions.length
                ? "WHERE " + conditions.join(" AND ")
                : "";

        const sql = `
            SELECT
                r.renewal_id,
                r.license_id,
                l.customer_id,
                c.full_name AS customer_name,
                r.old_expiry_date,
                r.new_expiry_date,
                r.renewal_days,
                r.amount_minor,
                r.currency,
                r.payment_reference,
                r.status,
                r.notes,
                r.created_at
            FROM renewals r
            LEFT JOIN licenses l ON l.license_id=r.license_id
            LEFT JOIN customers c ON c.customer_id=l.customer_id
            ${where}
            ORDER BY r.created_at DESC
            LIMIT 5000
        `;

        const statement =
            bindings.length
                ? env.DB.prepare(sql).bind(...bindings)
                : env.DB.prepare(sql);

        const result = await statement.all();

        const rows =
            result && Array.isArray(result.results)
                ? result.results
                : [];

        const totalAmountMinor =
            rows.reduce(
                (sum, row) =>
                    sum + Number(row.amount_minor || 0),
                0
            );

        return jsonResponse({
            success: true,
            status: "OK",
            renewals: rows,
            count: rows.length,
            totalAmountMinor,
            requestId
        });

    } catch {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode: "RENEWAL_REPORT_FAILED",
            requestId
        }, 500);
    }
}



/* ============================================================
   PHASE 6.9 - EMAIL NOTIFICATION ENGINE
   6.9A Notification Model
   6.9B Expiry Reminder Queue
   6.9C Renewal Confirmation Queue
   ============================================================ */

const EMAIL_NOTIFICATION_CHANNEL = "EMAIL";

/* ============================================================
   PHASE 6.10BC - MULTI CHANNEL FOUNDATION
   Provider-neutral notification architecture.
   WhatsApp / SMS remain disabled until explicitly configured.
   ============================================================ */

const NOTIFICATION_CHANNELS = Object.freeze({
    EMAIL: "EMAIL",
    WHATSAPP: "WHATSAPP",
    SMS: "SMS"
});

const NOTIFICATION_PROVIDERS = Object.freeze({
    EMAIL: "RESEND",
    WHATSAPP: "MOCK",
    SMS: "MOCK"
});

const NOTIFICATION_CHANNEL_STATUS = Object.freeze({
    EMAIL: "ENABLED",
    WHATSAPP: "DISABLED",
    SMS: "DISABLED"
});

function normalizeNotificationChannel(value) {
    const channel =
        normalizeString(value).toUpperCase();

    if (
        channel === NOTIFICATION_CHANNELS.EMAIL ||
        channel === NOTIFICATION_CHANNELS.WHATSAPP ||
        channel === NOTIFICATION_CHANNELS.SMS
    ) {
        return channel;
    }

    return null;
}

function getNotificationProvider(channel) {
    const safeChannel =
        normalizeNotificationChannel(channel);

    if (!safeChannel) {
        return null;
    }

    return NOTIFICATION_PROVIDERS[safeChannel] || null;
}

function getNotificationChannelStatus(channel) {
    const safeChannel =
        normalizeNotificationChannel(channel);

    if (!safeChannel) {
        return "INVALID";
    }

    return NOTIFICATION_CHANNEL_STATUS[safeChannel] ||
        "DISABLED";
}

function isNotificationChannelEnabled(channel) {
    return (
        getNotificationChannelStatus(channel) ===
        "ENABLED"
    );
}

function maskMobileNumber(value) {
    const mobile =
        normalizeString(value)
            .replace(/[^\d+]/g, "");

    if (!mobile) {
        return null;
    }

    if (mobile.length <= 4) {
        return "*".repeat(mobile.length);
    }

    return (
        "*".repeat(
            Math.max(0, mobile.length - 4)
        ) +
        mobile.slice(-4)
    );
}

function maskNotificationDestination(
    channel,
    destination
) {
    const safeChannel =
        normalizeNotificationChannel(channel);

    if (
        safeChannel ===
        NOTIFICATION_CHANNELS.EMAIL
    ) {
        return maskEmailAddress(destination);
    }

    if (
        safeChannel ===
            NOTIFICATION_CHANNELS.WHATSAPP ||
        safeChannel ===
            NOTIFICATION_CHANNELS.SMS
    ) {
        return maskMobileNumber(destination);
    }

    return null;
}


/* ============================================================
   PHASE 6.10DEFG - CUSTOMER COMMUNICATION AND MESSAGE FOUNDATION

   D - Communication preferences
   E - WhatsApp message builders
   F - SMS message builders
   G - Safe mock provider

   No real WhatsApp/SMS provider is contacted.
   ============================================================ */

const DEFAULT_COMMUNICATION_PREFERENCES = Object.freeze({
    emailEnabled: true,
    whatsappEnabled: false,
    smsEnabled: false
});

function normalizeCommunicationPreferences(value = null) {
    const source =
        value &&
        typeof value === "object"
            ? value
            : {};

    return {
        emailEnabled:
            source.emailEnabled !== false,

        whatsappEnabled:
            source.whatsappEnabled === true,

        smsEnabled:
            source.smsEnabled === true
    };
}

function isCustomerChannelAllowed(
    preferences,
    channel
) {
    const safePreferences =
        normalizeCommunicationPreferences(
            preferences
        );

    const safeChannel =
        normalizeNotificationChannel(
            channel
        );

    switch (safeChannel) {
        case NOTIFICATION_CHANNELS.EMAIL:
            return safePreferences.emailEnabled;

        case NOTIFICATION_CHANNELS.WHATSAPP:
            return safePreferences.whatsappEnabled;

        case NOTIFICATION_CHANNELS.SMS:
            return safePreferences.smsEnabled;

        default:
            return false;
    }
}

function buildWhatsAppExpiryReminderMessage({
    customerName,
    licenseId,
    expiryDate,
    daysRemaining
}) {
    const name =
        normalizeString(customerName) ||
        "Customer";

    return [
        `Hello ${name},`,
        "",
        `Your Himanshu XL Tools license ${normalizeString(licenseId)} expires on ${normalizeString(expiryDate)}.`,
        `Days remaining: ${Number(daysRemaining) || 0}.`,
        "",
        "Please renew your license to continue using Himanshu XL Tools."
    ].join("\n");
}

function buildWhatsAppExpiredLicenseMessage({
    customerName,
    licenseId,
    expiryDate
}) {
    const name =
        normalizeString(customerName) ||
        "Customer";

    return [
        `Hello ${name},`,
        "",
        `Your Himanshu XL Tools license ${normalizeString(licenseId)} has expired.`,
        `Expiry date: ${normalizeString(expiryDate)}.`,
        "",
        "Please renew your license to restore access."
    ].join("\n");
}

function buildWhatsAppRenewalConfirmationMessage({
    customerName,
    licenseId,
    newExpiryDate
}) {
    const name =
        normalizeString(customerName) ||
        "Customer";

    return [
        `Hello ${name},`,
        "",
        "Your Himanshu XL Tools license renewal is confirmed.",
        `License: ${normalizeString(licenseId)}.`,
        `New expiry date: ${normalizeString(newExpiryDate)}.`,
        "",
        "Thank you."
    ].join("\n");
}

function buildSmsExpiryReminderMessage({
    licenseId,
    expiryDate,
    daysRemaining
}) {
    return (
        `Himanshu XL Tools: License ${normalizeString(licenseId)} ` +
        `expires ${normalizeString(expiryDate)} ` +
        `(${Number(daysRemaining) || 0} day(s) remaining). Please renew.`
    );
}

function buildSmsExpiredLicenseMessage({
    licenseId,
    expiryDate
}) {
    return (
        `Himanshu XL Tools: License ${normalizeString(licenseId)} ` +
        `expired on ${normalizeString(expiryDate)}. Please renew to restore access.`
    );
}

function buildSmsRenewalConfirmationMessage({
    licenseId,
    newExpiryDate
}) {
    return (
        `Himanshu XL Tools: Renewal confirmed for license ` +
        `${normalizeString(licenseId)}. New expiry: ` +
        `${normalizeString(newExpiryDate)}.`
    );
}

async function sendMockMessagingNotification({
    channel,
    destination,
    text
}) {
    const safeChannel =
        normalizeNotificationChannel(
            channel
        );

    if (
        safeChannel !==
            NOTIFICATION_CHANNELS.WHATSAPP &&
        safeChannel !==
            NOTIFICATION_CHANNELS.SMS
    ) {
        return {
            success: false,
            status: "ERROR",
            reasonCode:
                "MOCK_MESSAGING_CHANNEL_INVALID",
            provider: "MOCK"
        };
    }

    const safeDestination =
        normalizeString(destination);

    const safeText =
        normalizeString(text);

    if (!safeDestination) {
        return {
            success: false,
            status: "ERROR",
            reasonCode:
                "MOCK_DESTINATION_REQUIRED",
            provider: "MOCK",
            channel: safeChannel
        };
    }

    if (!safeText) {
        return {
            success: false,
            status: "ERROR",
            reasonCode:
                "MOCK_MESSAGE_REQUIRED",
            provider: "MOCK",
            channel: safeChannel
        };
    }

    /*
     * SAFE MOCK ONLY.
     * No network call.
     * No provider API.
     * No customer message.
     */
    return {
        success: true,
        status: "MOCK_SENT",
        provider: "MOCK",
        channel: safeChannel,
        destinationMasked:
            maskNotificationDestination(
                safeChannel,
                safeDestination
            ),
        networkRequestMade: false,
        realMessageSent: false
    };
}

async function testMessagingFoundation() {
    const qaMobile = "+910000000000";

    const whatsappText =
        buildWhatsAppExpiryReminderMessage({
            customerName: "QA Customer",
            licenseId: "QA-LICENSE-001",
            expiryDate: "2026-10-19",
            daysRemaining: 30
        });

    const smsText =
        buildSmsRenewalConfirmationMessage({
            licenseId: "QA-LICENSE-001",
            newExpiryDate: "2027-10-19"
        });

    const whatsapp =
        await sendMockMessagingNotification({
            channel:
                NOTIFICATION_CHANNELS.WHATSAPP,
            destination: qaMobile,
            text: whatsappText
        });

    const sms =
        await sendMockMessagingNotification({
            channel:
                NOTIFICATION_CHANNELS.SMS,
            destination: qaMobile,
            text: smsText
        });

    return {
        success:
            whatsapp.success === true &&
            sms.success === true &&
            whatsapp.networkRequestMade === false &&
            sms.networkRequestMade === false &&
            whatsapp.realMessageSent === false &&
            sms.realMessageSent === false,

        whatsapp,
        sms
    };
}

async function sendNotificationByChannel(
    env,
    {
        channel,
        destination,
        subject = "",
        html = "",
        text = ""
    }
) {
    const safeChannel =
        normalizeNotificationChannel(channel);

    if (!safeChannel) {
        return {
            success: false,
            status: "ERROR",
            reasonCode:
                "INVALID_NOTIFICATION_CHANNEL",
            provider: null
        };
    }

    if (
        safeChannel ===
        NOTIFICATION_CHANNELS.EMAIL
    ) {
        return sendEmailWithResend(
            env,
            {
                to: destination,
                subject,
                html,
                text
            }
        );
    }

    /*
     * WhatsApp / SMS intentionally disabled.
     * No paid provider call is allowed during
     * Phase 6.10 foundation development.
     */
    return {
        success: false,
        status: "DISABLED",
        reasonCode:
            safeChannel ===
            NOTIFICATION_CHANNELS.WHATSAPP
                ? "WHATSAPP_PROVIDER_NOT_CONFIGURED"
                : "SMS_PROVIDER_NOT_CONFIGURED",
        provider:
            getNotificationProvider(
                safeChannel
            ),
        channel: safeChannel,
        destinationMasked:
            maskNotificationDestination(
                safeChannel,
                destination
            )
    };
}


const EMAIL_NOTIFICATION_TYPES = Object.freeze({
    EXPIRY_30_DAYS: "EXPIRY_30_DAYS",
    EXPIRY_15_DAYS: "EXPIRY_15_DAYS",
    EXPIRY_7_DAYS: "EXPIRY_7_DAYS",
    EXPIRY_1_DAY: "EXPIRY_1_DAY",
    LICENSE_EXPIRED: "LICENSE_EXPIRED",
    RENEWAL_CONFIRMATION: "RENEWAL_CONFIRMATION"
});

function maskEmailAddress(value) {
    const email = normalizeString(value);

    if (!email || !email.includes("@")) {
        return "";
    }

    const parts = email.split("@");
    const local = parts[0] || "";
    const domain = parts.slice(1).join("@");

    if (!local || !domain) {
        return "";
    }

    const visible =
        local.length <= 2
            ? local.charAt(0)
            : local.slice(0, 2);

    return `${visible}${"*".repeat(
        Math.max(1, local.length - visible.length)
    )}@${domain}`;
}

function createNotificationId() {
    return `NTF-${Date.now()}-${crypto.randomUUID()
        .replace(/-/g, "")
        .slice(0, 12)
        .toUpperCase()}`;
}

function utcDateOnly(value) {
    const text = normalizeString(value);

    if (!text) {
        return null;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);

    if (!match) {
        return null;
    }

    return `${match[1]}-${match[2]}-${match[3]}`;
}

function daysBetweenUtcDates(fromDate, toDate) {
    const from = utcDateOnly(fromDate);
    const to = utcDateOnly(toDate);

    if (!from || !to) {
        return null;
    }

    const fromMs =
        Date.parse(`${from}T00:00:00.000Z`);

    const toMs =
        Date.parse(`${to}T00:00:00.000Z`);

    if (
        !Number.isFinite(fromMs) ||
        !Number.isFinite(toMs)
    ) {
        return null;
    }

    return Math.round(
        (toMs - fromMs) / 86400000
    );
}

function getExpiryNotificationType(daysRemaining) {
    switch (daysRemaining) {
        case 30:
            return EMAIL_NOTIFICATION_TYPES.EXPIRY_30_DAYS;

        case 15:
            return EMAIL_NOTIFICATION_TYPES.EXPIRY_15_DAYS;

        case 7:
            return EMAIL_NOTIFICATION_TYPES.EXPIRY_7_DAYS;

        case 1:
            return EMAIL_NOTIFICATION_TYPES.EXPIRY_1_DAY;

        case 0:
            return EMAIL_NOTIFICATION_TYPES.LICENSE_EXPIRED;

        default:
            return null;
    }
}

async function notificationAlreadyExists(
    env,
    customerId,
    licenseId,
    notificationType,
    scheduledDate
) {
    const existing =
        await env.DB.prepare(`
            SELECT notification_id
            FROM notifications
            WHERE customer_id = ?
              AND license_id = ?
              AND channel = ?
              AND notification_type = ?
              AND date(COALESCE(scheduled_at, created_at)) = date(?)
            LIMIT 1
        `)
            .bind(
                customerId,
                licenseId,
                EMAIL_NOTIFICATION_CHANNEL,
                notificationType,
                scheduledDate
            )
            .first();

    return Boolean(existing);
}

async function queueEmailNotification(
    env,
    {
        customerId,
        licenseId,
        notificationType,
        email,
        scheduledAt = null
    }
) {
    const safeCustomerId =
        normalizeString(customerId);

    const safeLicenseId =
        normalizeString(licenseId);

    const safeType =
        normalizeString(notificationType)
            .toUpperCase();

    const safeEmail =
        normalizeString(email);

    if (
        !safeCustomerId ||
        !safeLicenseId ||
        !safeType ||
        !safeEmail
    ) {
        return {
            queued: false,
            skipped: true,
            reasonCode: "NOTIFICATION_DATA_INCOMPLETE"
        };
    }

    const notificationId =
        createNotificationId();

    const destinationMasked =
        maskEmailAddress(safeEmail);

    await env.DB.prepare(`
        INSERT INTO notifications (
            notification_id,
            customer_id,
            license_id,
            channel,
            notification_type,
            destination_masked,
            status,
            scheduled_at,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, CURRENT_TIMESTAMP)
    `)
        .bind(
            notificationId,
            safeCustomerId,
            safeLicenseId,
            EMAIL_NOTIFICATION_CHANNEL,
            safeType,
            destinationMasked,
            scheduledAt
        )
        .run();

    return {
        queued: true,
        skipped: false,
        notificationId
    };
}

/* ============================================================
   PHASE 6.9E - EXPIRY REMINDER EMAIL
   SAFE TEST MODE:
   Actual customer address is NOT used for provider delivery.
   Resend delivery remains locked to delivered@resend.dev
   until a production sender/domain is approved.
   ============================================================ */

function escapeEmailHtml(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function buildExpiryReminderEmail({
    customerName,
    licenseId,
    expiryDate,
    daysRemaining,
    notificationType
}) {
    const safeCustomerName =
        normalizeString(customerName) || "Customer";

    const safeLicenseId =
        normalizeString(licenseId);

    const safeExpiryDate =
        normalizeString(expiryDate);

    const safeDays =
        Number.isFinite(Number(daysRemaining))
            ? Number(daysRemaining)
            : null;

    const reminderLabelMap = {
        EXPIRY_30_DAYS: "30 days",
        EXPIRY_15_DAYS: "15 days",
        EXPIRY_7_DAYS: "7 days",
        EXPIRY_1_DAY: "1 day"
    };

    const reminderLabel =
        reminderLabelMap[notificationType] ||
        (
            safeDays === 1
                ? "1 day"
                : `${safeDays} days`
        );

    const subject =
        `Himanshu XL Tools - License expires in ${reminderLabel}`;

    const text = [
        `Hello ${safeCustomerName},`,
        "",
        "This is a reminder that your Himanshu XL Tools license is approaching its expiry date.",
        "",
        `License ID: ${safeLicenseId}`,
        `Expiry Date: ${safeExpiryDate}`,
        `Time Remaining: ${reminderLabel}`,
        "",
        "Please renew your license before the expiry date to avoid interruption.",
        "",
        "Regards,",
        "Himanshu XL Tools"
    ].join("\n");

    const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;">
            <h2 style="margin-bottom:8px;">Himanshu XL Tools</h2>

            <p>Hello ${escapeEmailHtml(safeCustomerName)},</p>

            <p>
                This is a reminder that your
                <strong>Himanshu XL Tools</strong>
                license is approaching its expiry date.
            </p>

            <table style="border-collapse:collapse;margin:18px 0;">
                <tr>
                    <td style="padding:6px 18px 6px 0;"><strong>License ID</strong></td>
                    <td style="padding:6px 0;">${escapeEmailHtml(safeLicenseId)}</td>
                </tr>
                <tr>
                    <td style="padding:6px 18px 6px 0;"><strong>Expiry Date</strong></td>
                    <td style="padding:6px 0;">${escapeEmailHtml(safeExpiryDate)}</td>
                </tr>
                <tr>
                    <td style="padding:6px 18px 6px 0;"><strong>Time Remaining</strong></td>
                    <td style="padding:6px 0;">${escapeEmailHtml(reminderLabel)}</td>
                </tr>
            </table>

            <p>
                Please renew your license before the expiry date
                to avoid interruption.
            </p>

            <p>
                Regards,<br>
                <strong>Himanshu XL Tools</strong>
            </p>
        </div>
    `;

    return {
        subject,
        text,
        html
    };
}

/* ============================================================
   PHASE 6.9F - EXPIRED LICENSE EMAIL

   SAFE TEST MODE:
   Customer email is recorded only as intended recipient.
   Actual Resend delivery remains locked to RESEND_TEST_TO.
   ============================================================ */

/* ============================================================
   PHASE 6.9G - RENEWAL CONFIRMATION EMAIL

   SAFE TEST MODE:
   Intended customer email is masked only.
   Actual Resend delivery remains locked to RESEND_TEST_TO.
   ============================================================ */

/* ============================================================
   PHASE 6.9H - MANUAL ADMIN EMAIL

   SAFE TEST MODE:
   Admin supplies intended customer email + subject + message.
   Actual Resend delivery remains locked to RESEND_TEST_TO.
   No D1 mutation.
   ============================================================ */

function buildManualAdminEmail({
    customerName,
    subject,
    message
}) {
    const safeCustomerName =
        normalizeString(customerName) || "Customer";

    const safeSubject =
        normalizeString(subject) ||
        "Himanshu XL Tools - Message";

    const safeMessage =
        normalizeString(message);

    const text = [
        `Hello ${safeCustomerName},`,
        "",
        safeMessage,
        "",
        "Regards,",
        "Himanshu XL Tools"
    ].join("\n");

    const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;">
            <h2>Himanshu XL Tools</h2>

            <p>
                Hello ${escapeEmailHtml(safeCustomerName)},
            </p>

            <p style="white-space:pre-line;">
                ${escapeEmailHtml(safeMessage)}
            </p>

            <p>
                Regards,<br>
                <strong>Himanshu XL Tools</strong>
            </p>
        </div>
    `;

    return {
        subject: safeSubject,
        text,
        html
    };
}

async function sendManualAdminEmail(
    env,
    {
        customerName,
        customerEmail,
        subject,
        message
    }
) {
    const intendedRecipient =
        normalizeString(customerEmail);

    const safeMessage =
        normalizeString(message);

    if (!intendedRecipient) {
        return {
            success: false,
            status: "SKIPPED",
            reasonCode: "CUSTOMER_EMAIL_REQUIRED",
            provider: "RESEND",
            safeTestMode: true
        };
    }

    if (!safeMessage) {
        return {
            success: false,
            status: "SKIPPED",
            reasonCode: "MESSAGE_REQUIRED",
            provider: "RESEND",
            safeTestMode: true
        };
    }

    const email =
        buildManualAdminEmail({
            customerName,
            subject,
            message: safeMessage
        });

    const result =
        await sendEmailWithResend(
            env,
            {
                to: RESEND_TEST_TO,
                subject: email.subject,
                html: email.html,
                text: email.text
            }
        );

    return {
        ...result,

        safeTestMode: true,

        intendedRecipientMasked:
            maskEmailAddress(intendedRecipient),

        actualTestRecipient:
            RESEND_TEST_TO
    };
}

async function handleAdminManualEmail(
    request,
    env,
    requestId
) {
    const authorization =
        verifyAdminAuthorization(
            request,
            env
        );

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    let body;

    try {
        body = await request.json();
    }
    catch {
        return jsonResponse({
            success: false,
            status: "INVALID_REQUEST",
            reasonCode: "INVALID_JSON",
            requestId
        }, 400);
    }

    const customerName =
        normalizeString(body?.customerName);

    const customerEmail =
        normalizeString(body?.customerEmail);

    const subject =
        normalizeString(body?.subject);

    const message =
        normalizeString(body?.message);

    if (!customerEmail) {
        return jsonResponse({
            success: false,
            status: "INVALID_REQUEST",
            reasonCode: "CUSTOMER_EMAIL_REQUIRED",
            requestId
        }, 400);
    }

    if (!message) {
        return jsonResponse({
            success: false,
            status: "INVALID_REQUEST",
            reasonCode: "MESSAGE_REQUIRED",
            requestId
        }, 400);
    }

    const result =
        await sendManualAdminEmail(
            env,
            {
                customerName,
                customerEmail,
                subject,
                message
            }
        );

    return jsonResponse({
        success:
            result.success === true,

        status:
            result.status || "FAILED",

        notificationType:
            "MANUAL_ADMIN_EMAIL",

        provider:
            result.provider || null,

        providerMessageId:
            result.providerMessageId || null,

        safeTestMode:
            result.safeTestMode === true,

        intendedRecipientMasked:
            result.intendedRecipientMasked || null,

        actualTestRecipient:
            result.actualTestRecipient || null,

        d1Mutation: false,

        requestId
    }, result.success === true ? 200 : 502);
}

function buildRenewalConfirmationEmail({
    customerName,
    licenseId,
    oldExpiryDate,
    newExpiryDate
}) {
    const safeCustomerName =
        normalizeString(customerName) || "Customer";

    const safeLicenseId =
        normalizeString(licenseId);

    const safeOldExpiryDate =
        normalizeString(oldExpiryDate);

    const safeNewExpiryDate =
        normalizeString(newExpiryDate);

    const subject =
        "Himanshu XL Tools - License renewal confirmed";

    const text = [
        `Hello ${safeCustomerName},`,
        "",
        "Your Himanshu XL Tools license renewal has been confirmed successfully.",
        "",
        `License ID: ${safeLicenseId}`,
        `Previous Expiry Date: ${safeOldExpiryDate}`,
        `New Expiry Date: ${safeNewExpiryDate}`,
        "",
        "Your license will remain available according to the renewed validity period.",
        "",
        "Thank you for using Himanshu XL Tools.",
        "",
        "Regards,",
        "Himanshu XL Tools"
    ].join("\n");

    const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;">
            <h2>Himanshu XL Tools</h2>

            <p>
                Hello ${escapeEmailHtml(safeCustomerName)},
            </p>

            <p>
                Your <strong>Himanshu XL Tools</strong>
                license renewal has been confirmed successfully.
            </p>

            <table style="border-collapse:collapse;margin:18px 0;">
                <tr>
                    <td style="padding:6px 18px 6px 0;">
                        <strong>License ID</strong>
                    </td>
                    <td style="padding:6px 0;">
                        ${escapeEmailHtml(safeLicenseId)}
                    </td>
                </tr>

                <tr>
                    <td style="padding:6px 18px 6px 0;">
                        <strong>Previous Expiry Date</strong>
                    </td>
                    <td style="padding:6px 0;">
                        ${escapeEmailHtml(safeOldExpiryDate)}
                    </td>
                </tr>

                <tr>
                    <td style="padding:6px 18px 6px 0;">
                        <strong>New Expiry Date</strong>
                    </td>
                    <td style="padding:6px 0;">
                        ${escapeEmailHtml(safeNewExpiryDate)}
                    </td>
                </tr>

                <tr>
                    <td style="padding:6px 18px 6px 0;">
                        <strong>Status</strong>
                    </td>
                    <td style="padding:6px 0;">
                        Renewed
                    </td>
                </tr>
            </table>

            <p>
                Your license will remain available according
                to the renewed validity period.
            </p>

            <p>
                Thank you for using Himanshu XL Tools.
            </p>

            <p>
                Regards,<br>
                <strong>Himanshu XL Tools</strong>
            </p>
        </div>
    `;

    return {
        subject,
        text,
        html
    };
}

async function sendRenewalConfirmationEmail(
    env,
    {
        customerName,
        customerEmail,
        licenseId,
        oldExpiryDate,
        newExpiryDate
    }
) {
    const intendedRecipient =
        normalizeString(customerEmail);

    if (!intendedRecipient) {
        return {
            success: false,
            status: "SKIPPED",
            reasonCode: "CUSTOMER_EMAIL_REQUIRED",
            provider: "RESEND",
            safeTestMode: true
        };
    }

    const email =
        buildRenewalConfirmationEmail({
            customerName,
            licenseId,
            oldExpiryDate,
            newExpiryDate
        });

    const result =
        await sendEmailWithResend(
            env,
            {
                to: RESEND_TEST_TO,
                subject: email.subject,
                html: email.html,
                text: email.text
            }
        );

    return {
        ...result,
        safeTestMode: true,

        intendedRecipientMasked:
            maskEmailAddress(intendedRecipient),

        actualTestRecipient:
            RESEND_TEST_TO
    };
}

function buildExpiredLicenseEmail({
    customerName,
    licenseId,
    expiryDate
}) {
    const safeCustomerName =
        normalizeString(customerName) || "Customer";

    const safeLicenseId =
        normalizeString(licenseId);

    const safeExpiryDate =
        normalizeString(expiryDate);

    const subject =
        "Himanshu XL Tools - Your license has expired";

    const text = [
        `Hello ${safeCustomerName},`,
        "",
        "Your Himanshu XL Tools license has expired.",
        "",
        `License ID: ${safeLicenseId}`,
        `Expiry Date: ${safeExpiryDate}`,
        "",
        "Please renew your license to continue using Himanshu XL Tools.",
        "",
        "Regards,",
        "Himanshu XL Tools"
    ].join("\n");

    const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;">
            <h2 style="margin-bottom:8px;">Himanshu XL Tools</h2>

            <p>
                Hello ${escapeEmailHtml(safeCustomerName)},
            </p>

            <p>
                Your <strong>Himanshu XL Tools</strong>
                license has expired.
            </p>

            <table style="border-collapse:collapse;margin:18px 0;">
                <tr>
                    <td style="padding:6px 18px 6px 0;">
                        <strong>License ID</strong>
                    </td>

                    <td style="padding:6px 0;">
                        ${escapeEmailHtml(safeLicenseId)}
                    </td>
                </tr>

                <tr>
                    <td style="padding:6px 18px 6px 0;">
                        <strong>Expiry Date</strong>
                    </td>

                    <td style="padding:6px 0;">
                        ${escapeEmailHtml(safeExpiryDate)}
                    </td>
                </tr>

                <tr>
                    <td style="padding:6px 18px 6px 0;">
                        <strong>Status</strong>
                    </td>

                    <td style="padding:6px 0;">
                        Expired
                    </td>
                </tr>
            </table>

            <p>
                Please renew your license to continue using
                Himanshu XL Tools.
            </p>

            <p>
                Regards,<br>
                <strong>Himanshu XL Tools</strong>
            </p>
        </div>
    `;

    return {
        subject,
        text,
        html
    };
}

async function sendExpiredLicenseEmail(
    env,
    {
        customerName,
        customerEmail,
        licenseId,
        expiryDate
    }
) {
    const intendedRecipient =
        normalizeString(customerEmail);

    if (!intendedRecipient) {
        return {
            success: false,
            status: "SKIPPED",
            reasonCode: "CUSTOMER_EMAIL_REQUIRED",
            provider: "RESEND",
            safeTestMode: true
        };
    }

    const email =
        buildExpiredLicenseEmail({
            customerName,
            licenseId,
            expiryDate
        });

    /*
       Phase 6.9F SAFE TEST MODE.
       Do NOT send to customerEmail yet.
    */
    const result =
        await sendEmailWithResend(
            env,
            {
                to: RESEND_TEST_TO,
                subject: email.subject,
                html: email.html,
                text: email.text
            }
        );

    return {
        ...result,
        safeTestMode: true,

        intendedRecipientMasked:
            maskEmailAddress(intendedRecipient),

        actualTestRecipient:
            RESEND_TEST_TO
    };
}

async function sendExpiryReminderEmail(
    env,
    {
        customerName,
        customerEmail,
        licenseId,
        expiryDate,
        daysRemaining,
        notificationType
    }
) {
    const intendedRecipient =
        normalizeString(customerEmail);

    if (!intendedRecipient) {
        return {
            success: false,
            status: "SKIPPED",
            reasonCode: "CUSTOMER_EMAIL_REQUIRED",
            provider: "RESEND",
            safeTestMode: true
        };
    }

    const email =
        buildExpiryReminderEmail({
            customerName,
            licenseId,
            expiryDate,
            daysRemaining,
            notificationType
        });

    /*
       IMPORTANT:
       Phase 6.9E remains in SAFE TEST MODE.
       Never send to customerEmail here yet.
    */
    const result =
        await sendEmailWithResend(
            env,
            {
                to: RESEND_TEST_TO,
                subject: email.subject,
                html: email.html,
                text: email.text
            }
        );

    return {
        ...result,
        safeTestMode: true,
        intendedRecipientMasked:
            maskEmailAddress(intendedRecipient),
        actualTestRecipient:
            RESEND_TEST_TO
    };
}

async function queueExpiryEmailNotifications(
    env,
    referenceDate = null
) {
    const today =
        utcDateOnly(referenceDate) ||
        new Date().toISOString().slice(0, 10);

    const result =
        await env.DB.prepare(`
            SELECT
                l.license_id,
                l.customer_id,
                l.status AS license_status,
                l.expiry_date,
                c.full_name,
                c.email,
                c.status AS customer_status
            FROM licenses l
            INNER JOIN customers c
                ON c.customer_id = l.customer_id
            WHERE l.expiry_date IS NOT NULL
              AND c.email IS NOT NULL
              AND TRIM(c.email) <> ''
              AND UPPER(c.status) = 'ACTIVE'
              AND UPPER(l.status) IN (
                    'ACTIVE',
                    'EXPIRED'
              )
        `).all();

    const rows =
        result &&
        Array.isArray(result.results)
            ? result.results
            : [];

    let queued = 0;
    let skipped = 0;

    const details = [];

    for (const row of rows) {
        const daysRemaining =
            daysBetweenUtcDates(
                today,
                row.expiry_date
            );

        const notificationType =
            getExpiryNotificationType(
                daysRemaining
            );

        if (!notificationType) {
            continue;
        }

        const exists =
            await notificationAlreadyExists(
                env,
                row.customer_id,
                row.license_id,
                notificationType,
                today
            );

        if (exists) {
            skipped += 1;

            details.push({
                licenseId: row.license_id,
                notificationType,
                daysRemaining,
                status: "SKIPPED_DUPLICATE"
            });

            continue;
        }

        const queueResult =
            await queueEmailNotification(
                env,
                {
                    customerId:
                        row.customer_id,

                    licenseId:
                        row.license_id,

                    notificationType,

                    email:
                        row.email,

                    scheduledAt:
                        `${today}T00:00:00.000Z`
                }
            );

        let deliveryResult = null;

        if (queueResult.queued) {
            queued += 1;

            if (
                notificationType ===
                EMAIL_NOTIFICATION_TYPES.LICENSE_EXPIRED
            ) {
                deliveryResult =
                    await sendExpiredLicenseEmail(
                        env,
                        {
                            customerName:
                                row.full_name,

                            customerEmail:
                                row.email,

                            licenseId:
                                row.license_id,

                            expiryDate:
                                row.expiry_date
                        }
                    );

            } else {

                deliveryResult =
                    await sendExpiryReminderEmail(
                        env,
                        {
                            customerName:
                                row.full_name,

                            customerEmail:
                                row.email,

                            licenseId:
                                row.license_id,

                            expiryDate:
                                row.expiry_date,

                            daysRemaining,

                            notificationType
                        }
                    );
            }

            await env.DB.prepare(`
                UPDATE notifications
                SET status = ?
                WHERE notification_id = ?
            `)
                .bind(
                    deliveryResult.success
                        ? "SENT"
                        : "FAILED",
                    queueResult.notificationId
                )
                .run();

        } else {
            skipped += 1;
        }

        details.push({
            licenseId:
                row.license_id,

            notificationType,

            daysRemaining,

            status:
                !queueResult.queued
                    ? queueResult.reasonCode
                    : (
                        deliveryResult &&
                        deliveryResult.success
                            ? "SENT"
                            : "FAILED"
                    ),

            provider:
                deliveryResult
                    ? deliveryResult.provider || null
                    : null,

            providerMessageId:
                deliveryResult
                    ? deliveryResult.providerMessageId || null
                    : null,

            safeTestMode:
                deliveryResult
                    ? deliveryResult.safeTestMode === true
                    : true,

            intendedRecipientMasked:
                deliveryResult
                    ? deliveryResult.intendedRecipientMasked || null
                    : null,

            actualTestRecipient:
                deliveryResult
                    ? deliveryResult.actualTestRecipient || null
                    : null
        });
    }

    return {
        referenceDate: today,
        scanned: rows.length,
        queued,
        skipped,
        details
    };
}

async function queueRenewalConfirmationEmail(
    env,
    licenseId
) {
    const safeLicenseId =
        normalizeString(licenseId);

    if (!safeLicenseId) {
        return {
            queued: false,
            skipped: true,
            reasonCode: "LICENSE_ID_REQUIRED"
        };
    }

    const row =
        await env.DB.prepare(`
            SELECT
                l.license_id,
                l.customer_id,
                l.expiry_date,
                c.email
            FROM licenses l
            INNER JOIN customers c
                ON c.customer_id = l.customer_id
            WHERE l.license_id = ?
            LIMIT 1
        `)
            .bind(safeLicenseId)
            .first();

    if (!row) {
        return {
            queued: false,
            skipped: true,
            reasonCode: "LICENSE_NOT_FOUND"
        };
    }

    if (!normalizeString(row.email)) {
        return {
            queued: false,
            skipped: true,
            reasonCode: "CUSTOMER_EMAIL_MISSING"
        };
    }

    const today =
        new Date()
            .toISOString()
            .slice(0, 10);

    const exists =
        await notificationAlreadyExists(
            env,
            row.customer_id,
            row.license_id,
            EMAIL_NOTIFICATION_TYPES.RENEWAL_CONFIRMATION,
            today
        );

    if (exists) {
        return {
            queued: false,
            skipped: true,
            reasonCode: "NOTIFICATION_DUPLICATE"
        };
    }

    return queueEmailNotification(
        env,
        {
            customerId:
                row.customer_id,

            licenseId:
                row.license_id,

            notificationType:
                EMAIL_NOTIFICATION_TYPES
                    .RENEWAL_CONFIRMATION,

            email:
                row.email,

            scheduledAt:
                new Date().toISOString()
        }
    );
}



/* ============================================================
   K7_6_MAILJET_RUNTIME_TEST
   Protected Admin-only Mailjet delivery test.
   Does not modify D1 and does not replace Resend/OTP yet.
   ============================================================ */

const MAILJET_API_URL = "https://api.mailjet.com/v3.1/send";

async function sendEmailWithMailjet(
    env,
    {
        to,
        subject,
        html,
        text
    }
) {
    const apiKey =
        env && typeof env.MAILJET_API_KEY === "string"
            ? env.MAILJET_API_KEY.trim()
            : "";

    const secretKey =
        env && typeof env.MAILJET_SECRET_KEY === "string"
            ? env.MAILJET_SECRET_KEY.trim()
            : "";

    const fromEmail =
        normalizeString(env && env.MAILJET_FROM);

    const safeTo = normalizeString(to);
    const safeSubject = normalizeString(subject);

    if (!apiKey || !secretKey) {
        return {
            success: false,
            status: "ERROR",
            reasonCode: "MAILJET_CREDENTIALS_NOT_CONFIGURED",
            provider: "MAILJET"
        };
    }

    if (!fromEmail) {
        return {
            success: false,
            status: "ERROR",
            reasonCode: "MAILJET_FROM_NOT_CONFIGURED",
            provider: "MAILJET"
        };
    }

    if (!safeTo) {
        return {
            success: false,
            status: "ERROR",
            reasonCode: "EMAIL_RECIPIENT_REQUIRED",
            provider: "MAILJET"
        };
    }

    try {
        const auth =
            btoa(apiKey + ":" + secretKey);

        const response =
            await fetch(
                MAILJET_API_URL,
                {
                    method: "POST",
                    headers: {
                        "Authorization": "Basic " + auth,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        Messages: [
                            {
                                From: {
                                    Email: fromEmail,
                                    Name: "Himanshu XL Tools"
                                },
                                To: [
                                    {
                                        Email: safeTo
                                    }
                                ],
                                Subject: safeSubject,
                                TextPart:
                                    typeof text === "string"
                                        ? text
                                        : "",
                                HTMLPart:
                                    typeof html === "string"
                                        ? html
                                        : ""
                            }
                        ]
                    })
                }
            );

        let providerResult = null;

        try {
            providerResult = await response.json();
        } catch {
            providerResult = null;
        }

        const message =
            providerResult &&
            Array.isArray(providerResult.Messages)
                ? providerResult.Messages[0]
                : null;

        const sent =
            response.ok &&
            message &&
            String(message.Status || "").toLowerCase() === "success";

        const toResult =
            message &&
            Array.isArray(message.To)
                ? message.To[0]
                : null;

        return {
            success: Boolean(sent),
            status: sent ? "SENT" : "FAILED",
            reasonCode:
                sent
                    ? null
                    : "MAILJET_SEND_FAILED",
            provider: "MAILJET",
            providerMessageId:
                toResult && toResult.MessageID
                    ? String(toResult.MessageID)
                    : null
        };

    } catch {
        return {
            success: false,
            status: "ERROR",
            reasonCode: "MAILJET_REQUEST_FAILED",
            provider: "MAILJET"
        };
    }
}

async function handleAdminMailjetTest(
    request,
    env,
    requestId
) {
    const authorization =
        verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse(
            {
                success: false,
                status: "DENIED",
                reasonCode: authorization.reasonCode,
                requestId
            },
            authorization.status,
            getAdminAuthorizationResponseHeaders(
                authorization
            )
        );
    }

    let body;

    try {
        body = await request.json();
    } catch {
        return validationError(
            "INVALID_JSON_BODY",
            requestId
        );
    }

    const to =
        normalizeString(body && body.to);

    if (!/^\S+@\S+\.\S+$/.test(to)) {
        return validationError(
            "EMAIL_INVALID",
            requestId
        );
    }

    const result =
        await sendEmailWithMailjet(
            env,
            {
                to,
                subject:
                    "Himanshu XL Tools - Mailjet Runtime Test",
                text:
                    "Mailjet API runtime test successful.",
                html:
                    "<h2>Himanshu XL Tools</h2>" +
                    "<p>Mailjet API runtime test successful.</p>"
            }
        );

    return jsonResponse(
        {
            success: result.success,
            status: result.status,
            provider: result.provider,
            reasonCode:
                result.reasonCode || null,
            providerMessageId:
                result.providerMessageId || null,
            requestId
        },
        result.success ? 200 : 502,
        {
            "Cache-Control": "no-store"
        }
    );
}

/* END K7_6_MAILJET_RUNTIME_TEST */

/* ============================================================
   PHASE 6.9D - RESEND EMAIL PROVIDER
   TEST MODE ONLY
   FROM: onboarding@resend.dev
   TO: delivered@resend.dev
   ============================================================ */

const RESEND_API_URL = "https://api.resend.com/emails";
const RESEND_TEST_FROM = "Himanshu XL Tools <onboarding@resend.dev>";
const RESEND_TEST_TO = "delivered@resend.dev";

async function sendEmailWithResend(
    env,
    {
        to,
        subject,
        html,
        text,
        from
    }
) {
    const apiKey =
        env && typeof env.RESEND_API_KEY === "string"
            ? env.RESEND_API_KEY.trim()
            : "";

    if (!apiKey) {
        return {
            success: false,
            status: "ERROR",
            reasonCode: "RESEND_API_KEY_NOT_CONFIGURED",
            provider: "RESEND"
        };
    }

    const safeTo = normalizeString(to);
    const safeSubject = normalizeString(subject);

    if (!safeTo) {
        return {
            success: false,
            status: "ERROR",
            reasonCode: "EMAIL_RECIPIENT_REQUIRED",
            provider: "RESEND"
        };
    }

    if (!safeSubject) {
        return {
            success: false,
            status: "ERROR",
            reasonCode: "EMAIL_SUBJECT_REQUIRED",
            provider: "RESEND"
        };
    }

    try {
        const response = await fetch(
            RESEND_API_URL,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    from: normalizeString(from) || RESEND_TEST_FROM,
                    to: [safeTo],
                    subject: safeSubject,
                    html: typeof html === "string"
                        ? html
                        : undefined,
                    text: typeof text === "string"
                        ? text
                        : undefined
                })
            }
        );

        let providerResult = null;

        try {
            providerResult = await response.json();
        } catch {
            providerResult = null;
        }

        if (!response.ok) {
            return {
                success: false,
                status: "FAILED",
                reasonCode: "RESEND_SEND_FAILED",
                provider: "RESEND",
                httpStatus: response.status,
                providerError:
                    providerResult &&
                    typeof providerResult.message === "string"
                        ? providerResult.message
                        : null
            };
        }

        return {
            success: true,
            status: "SENT",
            provider: "RESEND",
            providerMessageId:
                providerResult &&
                typeof providerResult.id === "string"
                    ? providerResult.id
                    : null
        };

    } catch {
        return {
            success: false,
            status: "FAILED",
            reasonCode: "RESEND_REQUEST_FAILED",
            provider: "RESEND"
        };
    }
}

async function handleAdminTestEmail(
    request,
    env,
    requestId
) {
    const authorization =
        verifyAdminAuthorization(
            request,
            env
        );

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    const result =
        await sendEmailWithResend(
            env,
            {
                to: RESEND_TEST_TO,
                subject:
                    "Himanshu XL Tools - Resend Integration Test",
                text:
                    "Himanshu XL Tools Phase 6.9D Resend integration test completed.",
                html:
                    "<h2>Himanshu XL Tools</h2>" +
                    "<p>Phase 6.9D Resend integration test.</p>" +
                    "<p>If this email is delivered, Cloudflare Worker Ã¢â€ â€™ Resend integration is working.</p>"
            }
        );

    return jsonResponse({
        success: result.success,
        status: result.status,
        provider: result.provider,
        reasonCode:
            result.reasonCode || null,
        providerMessageId:
            result.providerMessageId || null,
        httpStatus:
            result.httpStatus || null,
        testRecipient:
            RESEND_TEST_TO,
        requestId
    }, result.success ? 200 : 502);
}

/* ============================================================
   PHASE 6.9E - SAFE EXPIRY REMINDER RUNTIME QA
   Synthetic data only.
   No customer/license/device mutation.
   Delivery locked to RESEND_TEST_TO.
   ============================================================ */

/* ============================================================
   PHASE 6.9F - SAFE EXPIRED LICENSE EMAIL RUNTIME QA

   Synthetic values only.
   No D1 reads/writes.
   No real customer/license/device data.
   Actual delivery locked to RESEND_TEST_TO.
   ============================================================ */

/* ============================================================
   PHASE 6.9G - SAFE RENEWAL EMAIL RUNTIME QA
   Synthetic data only. No D1 mutation.
   ============================================================ */

async function handleAdminTestRenewalEmail(
    request,
    env,
    requestId
) {
    const authorization =
        verifyAdminAuthorization(
            request,
            env
        );

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    const result =
        await sendRenewalConfirmationEmail(
            env,
            {
                customerName:
                    "Himanshu XL Tools QA Customer",

                customerEmail:
                    "qa-renewal-customer@example.invalid",

                licenseId:
                    "QA-LICENSE-RENEWAL-001",

                oldExpiryDate:
                    "2026-09-18",

                newExpiryDate:
                    "2027-09-18"
            }
        );

    const passed =
        result.success === true &&
        result.status === "SENT" &&
        result.provider === "RESEND" &&
        Boolean(result.providerMessageId) &&
        result.safeTestMode === true &&
        result.actualTestRecipient ===
            RESEND_TEST_TO;

    return jsonResponse({
        success: passed,

        status:
            passed
                ? "PASS"
                : "FAILED",

        notificationType:
            EMAIL_NOTIFICATION_TYPES.RENEWAL_CONFIRMATION,

        provider:
            result.provider || null,

        providerMessageId:
            result.providerMessageId || null,

        safeTestMode:
            result.safeTestMode === true,

        intendedRecipientMasked:
            result.intendedRecipientMasked || null,

        actualTestRecipient:
            result.actualTestRecipient || null,

        oldExpiryDate:
            "2026-09-18",

        newExpiryDate:
            "2027-09-18",

        d1Mutation: false,
        realCustomerUsed: false,
        realLicenseUsed: false,
        realDeviceUsed: false,

        requestId
    }, passed ? 200 : 502);
}

async function handleAdminTestExpiredEmail(
    request,
    env,
    requestId
) {
    const authorization =
        verifyAdminAuthorization(
            request,
            env
        );

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    const result =
        await sendExpiredLicenseEmail(
            env,
            {
                customerName:
                    "Himanshu XL Tools QA Customer",

                customerEmail:
                    "qa-expired-customer@example.invalid",

                licenseId:
                    "QA-LICENSE-EXPIRED-001",

                expiryDate:
                    "2026-09-18"
            }
        );

    const passed =
        result.success === true &&
        result.status === "SENT" &&
        result.provider === "RESEND" &&
        Boolean(result.providerMessageId) &&
        result.safeTestMode === true &&
        result.actualTestRecipient ===
            RESEND_TEST_TO;

    return jsonResponse({
        success: passed,

        status:
            passed
                ? "PASS"
                : "FAILED",

        notificationType:
            EMAIL_NOTIFICATION_TYPES.LICENSE_EXPIRED,

        provider:
            result.provider || null,

        providerMessageId:
            result.providerMessageId || null,

        safeTestMode:
            result.safeTestMode === true,

        intendedRecipientMasked:
            result.intendedRecipientMasked || null,

        actualTestRecipient:
            result.actualTestRecipient || null,

        d1Mutation: false,
        realCustomerUsed: false,
        realLicenseUsed: false,
        realDeviceUsed: false,

        requestId
    }, passed ? 200 : 502);
}

async function handleAdminTestExpiryReminders(
    request,
    env,
    requestId
) {
    const authorization =
        verifyAdminAuthorization(
            request,
            env
        );

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    const tests = [
        {
            notificationType: "EXPIRY_30_DAYS",
            daysRemaining: 30
        },
        {
            notificationType: "EXPIRY_15_DAYS",
            daysRemaining: 15
        },
        {
            notificationType: "EXPIRY_7_DAYS",
            daysRemaining: 7
        },
        {
            notificationType: "EXPIRY_1_DAY",
            daysRemaining: 1
        }
    ];

    const results = [];

    for (const test of tests) {

        const expiryDate =
            new Date(
                Date.now() +
                (
                    test.daysRemaining *
                    24 *
                    60 *
                    60 *
                    1000
                )
            )
                .toISOString()
                .slice(0, 10);

        const result =
            await sendExpiryReminderEmail(
                env,
                {
                    customerName:
                        "Himanshu XL Tools QA Customer",

                    customerEmail:
                        "qa-customer@example.invalid",

                    licenseId:
                        `QA-${test.notificationType}`,

                    expiryDate,

                    daysRemaining:
                        test.daysRemaining,

                    notificationType:
                        test.notificationType
                }
            );

        results.push({
            notificationType:
                test.notificationType,

            daysRemaining:
                test.daysRemaining,

            success:
                result.success === true,

            status:
                result.status || null,

            provider:
                result.provider || null,

            providerMessageId:
                result.providerMessageId || null,

            safeTestMode:
                result.safeTestMode === true,

            actualTestRecipient:
                result.actualTestRecipient || null
        });
    }

    const allSent =
        results.length === 4 &&
        results.every(
            item =>
                item.success === true &&
                item.status === "SENT" &&
                item.provider === "RESEND" &&
                item.safeTestMode === true &&
                item.actualTestRecipient === RESEND_TEST_TO
        );

    return jsonResponse({
        success: allSent,
        status:
            allSent
                ? "PASS"
                : "FAILED",
        testMode: true,
        d1Mutation: false,
        realCustomerUsed: false,
        expectedRecipient:
            RESEND_TEST_TO,
        tests: results,
        requestId
    }, allSent ? 200 : 502);
}

async function handleAdminGenerateEmailNotifications(
    request,
    env,
    requestId
) {
    const authorization =
        verifyAdminAuthorization(
            request,
            env
        );

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    try {
        const result =
            await queueExpiryEmailNotifications(
                env
            );

        return jsonResponse({
            success: true,
            status: "OK",
            channel:
                EMAIL_NOTIFICATION_CHANNEL,
            ...result,
            requestId
        });

    } catch (error) {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode:
                "EMAIL_NOTIFICATION_GENERATION_FAILED",
            requestId
        }, 500);
    }
}

async function handleAdminNotificationsList(
    request,
    env,
    requestId
) {
    const authorization =
        verifyAdminAuthorization(
            request,
            env
        );

    if (!authorization.ok) {
        return jsonResponse({
            success: false,
            status: "DENIED",
            reasonCode: authorization.reasonCode,
            requestId
        }, authorization.status, getAdminAuthorizationResponseHeaders(authorization));
    }

    try {
        const url =
            new URL(request.url);

        const status =
            normalizeString(
                url.searchParams.get("status")
            ).toUpperCase();

        const type =
            normalizeString(
                url.searchParams.get("type")
            ).toUpperCase();

        const licenseId =
            normalizeString(
                url.searchParams.get(
                    "licenseId"
                )
            );

        const conditions = [
            "channel = 'EMAIL'"
        ];

        const values = [];

        if (status) {
            conditions.push(
                "UPPER(status) = ?"
            );

            values.push(status);
        }

        if (type) {
            conditions.push(
                "UPPER(notification_type) = ?"
            );

            values.push(type);
        }

        if (licenseId) {
            conditions.push(
                "license_id = ?"
            );

            values.push(licenseId);
        }

        const sql = `
            SELECT
                notification_id,
                customer_id,
                license_id,
                channel,
                notification_type,
                destination_masked,
                status,
                provider_message_id,
                scheduled_at,
                sent_at,
                failed_at,
                error_code,
                created_at
            FROM notifications
            WHERE ${conditions.join(" AND ")}
            ORDER BY created_at DESC
            LIMIT 500
        `;

        const result =
            await env.DB
                .prepare(sql)
                .bind(...values)
                .all();

        const rows =
            result &&
            Array.isArray(result.results)
                ? result.results
                : [];

        return jsonResponse({
            success: true,
            status: "OK",
            notifications: rows,
            count: rows.length,
            requestId
        });

    } catch {
        return jsonResponse({
            success: false,
            status: "ERROR",
            reasonCode:
                "NOTIFICATIONS_LIST_FAILED",
            requestId
        }, 500);
    }
}


function base64UrlEncodeText(value) {
    const bytes = new TextEncoder().encode(String(value));
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecodeText(value) {
    const padded = String(value).replace(/-/g, "+").replace(/_/g, "/") + "===".slice((String(value).length + 3) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

async function hmacSha256Base64Url(secret, value) {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
    let binary = "";
    for (const byte of signature) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function createCustomerSessionToken(env, customerId, licenseId) {
    const secret = normalizeString(env && env.CUSTOMER_SESSION_SECRET);
    if (!secret) throw new Error("CUSTOMER_SESSION_SECRET is not configured.");
    const payload = base64UrlEncodeText(JSON.stringify({ customerId, licenseId, exp: Date.now() + 12 * 60 * 60 * 1000 }));
    return `${payload}.${await hmacSha256Base64Url(secret, payload)}`;
}

async function verifyCustomerSessionToken(request, env) {
    const auth = normalizeString(request.headers.get("authorization"));
    const match = /^Bearer\s+(.+)$/i.exec(auth);
    if (!match) return null;
    const parts = match[1].split(".");
    if (parts.length !== 2) return null;
    const secret = normalizeString(env && env.CUSTOMER_SESSION_SECRET);
    if (!secret) return null;
    const expected = await hmacSha256Base64Url(secret, parts[0]);
    if (expected !== parts[1]) return null;
    try {
        const payload = JSON.parse(base64UrlDecodeText(parts[0]));
        if (!payload.customerId || !payload.licenseId || Number(payload.exp) <= Date.now()) return null;
        return payload;
    } catch { return null; }
}

async function handleCustomerLogin(request, env, requestId) {
    try {
        const payload = await request.json();
        const email = normalizeString(payload && payload.email).toLowerCase();
        const licenseKey = normalizeLicenseKey(payload && payload.licenseKey);
        if (!email || !LICENSE_KEY_PATTERN.test(licenseKey)) return jsonResponse({ success:false, status:"DENIED", reasonCode:"INVALID_CREDENTIALS", requestId }, 401);
        const license = await findLicenseByRawKey(env, licenseKey);
        const state = validateCustomerAndLicenseStatus(license);
        if (!state.ok) return jsonResponse({ success:false, status:"DENIED", reasonCode:state.reasonCode, requestId }, 401);
        const customer = await env.DB.prepare("SELECT customer_id, full_name, email, status FROM customers WHERE customer_id=? LIMIT 1").bind(license.customer_id).first();
        if (!customer || normalizeString(customer.email).toLowerCase() !== email) return jsonResponse({ success:false, status:"DENIED", reasonCode:"INVALID_CREDENTIALS", requestId }, 401);
        const token = await createCustomerSessionToken(env, customer.customer_id, license.license_id);
        return jsonResponse({ success:true, status:"AUTHENTICATED", token, expiresInSeconds:43200, requestId });
    } catch (error) {
        return jsonResponse({ success:false, status:"ERROR", reasonCode:"CUSTOMER_LOGIN_FAILED", requestId }, 500);
    }
}


/* ============================================================
   K7.5 CUSTOMER SELF-SERVICE PROFILE
   ============================================================ */
async function handleCustomerProfileGet(request, env, requestId) {
    const session = await requireCustomerSession(request, env);

    if (!session) {
        return jsonResponse(
            {
                success:false,
                status:"DENIED",
                reasonCode:"CUSTOMER_SESSION_REQUIRED",
                requestId
            },
            401,
            {"Cache-Control":"no-store"}
        );
    }

    try {
        const row = await env.DB.prepare(`
            SELECT
                customer_id,
                full_name,
                email,
                mobile,
                company_name,
                country,
                status
            FROM customers
            WHERE customer_id=?
            LIMIT 1
        `).bind(session.customerId).first();

        if (!row) {
            return jsonResponse(
                {
                    success:false,
                    status:"NOT_FOUND",
                    reasonCode:"CUSTOMER_NOT_FOUND",
                    requestId
                },
                404,
                {"Cache-Control":"no-store"}
            );
        }

        return jsonResponse(
            {
                success:true,
                status:"OK",
                profile:{
                    customerId:row.customer_id,
                    fullName:row.full_name || "",
                    email:row.email || "",
                    mobile:row.mobile || "",
                    companyName:row.company_name || "",
                    country:row.country || "",
                    status:row.status || ""
                },
                requestId
            },
            200,
            {"Cache-Control":"no-store"}
        );
    } catch (error) {
        return jsonResponse(
            {
                success:false,
                status:"ERROR",
                reasonCode:"CUSTOMER_PROFILE_LOAD_FAILED",
                requestId
            },
            500,
            {"Cache-Control":"no-store"}
        );
    }
}

async function handleCustomerProfileUpdate(request, env, requestId) {
    const session = await requireCustomerSession(request, env);

    if (!session) {
        return jsonResponse(
            {
                success:false,
                status:"DENIED",
                reasonCode:"CUSTOMER_SESSION_REQUIRED",
                requestId
            },
            401,
            {"Cache-Control":"no-store"}
        );
    }

    let payload;

    try {
        payload = await request.json();
    } catch {
        return validationError("INVALID_JSON_BODY", requestId);
    }

    const fullName = normalizeString(payload && payload.fullName);
    const mobile = normalizeString(payload && payload.mobile);
    const companyName = normalizeString(payload && payload.companyName);
    const country = normalizeString(payload && payload.country);

    if (!fullName) {
        return validationError("FULL_NAME_REQUIRED", requestId);
    }

    if (fullName.length > 120) {
        return validationError("FULL_NAME_TOO_LONG", requestId);
    }

    if (mobile.length > 40) {
        return validationError("MOBILE_TOO_LONG", requestId);
    }

    if (companyName.length > 160) {
        return validationError("COMPANY_NAME_TOO_LONG", requestId);
    }

    if (country.length > 120) {
        return validationError("COUNTRY_TOO_LONG", requestId);
    }

    try {
        const exists = await env.DB.prepare(
            "SELECT customer_id FROM customers WHERE customer_id=? LIMIT 1"
        ).bind(session.customerId).first();

        if (!exists) {
            return jsonResponse(
                {
                    success:false,
                    status:"NOT_FOUND",
                    reasonCode:"CUSTOMER_NOT_FOUND",
                    requestId
                },
                404,
                {"Cache-Control":"no-store"}
            );
        }

        await env.DB.prepare(`
            UPDATE customers
            SET
                full_name=?,
                mobile=?,
                company_name=?,
                country=?,
                updated_at=CURRENT_TIMESTAMP
            WHERE customer_id=?
        `).bind(
            fullName,
            mobile || null,
            companyName || null,
            country || null,
            session.customerId
        ).run();

        return jsonResponse(
            {
                success:true,
                status:"SAVED",
                profile:{
                    customerId:session.customerId,
                    fullName,
                    mobile,
                    companyName,
                    country
                },
                requestId
            },
            200,
            {"Cache-Control":"no-store"}
        );
    } catch (error) {
        return jsonResponse(
            {
                success:false,
                status:"ERROR",
                reasonCode:"CUSTOMER_PROFILE_SAVE_FAILED",
                requestId
            },
            500,
            {"Cache-Control":"no-store"}
        );
    }
}
async function handleCustomerMe(request, env, requestId) {
    const session = await verifyCustomerSessionToken(request, env);
    if (!session) return jsonResponse({ success:false, status:"DENIED", reasonCode:"INVALID_SESSION", requestId }, 401);
    const row = await env.DB.prepare(`SELECT c.customer_id,c.full_name,c.email,c.company_name,c.country,c.status AS customer_status,l.license_id,l.license_key_last4,l.plan_code,l.status AS license_status,l.max_devices,l.activation_date,l.expiry_date,(SELECT COUNT(*) FROM devices d WHERE d.license_id=l.license_id AND d.status='ACTIVE') AS active_devices FROM customers c INNER JOIN licenses l ON l.customer_id=c.customer_id WHERE c.customer_id=? AND l.license_id=? LIMIT 1`).bind(session.customerId, session.licenseId).first();
    if (!row) return jsonResponse({ success:false, status:"NOT_FOUND", reasonCode:"ACCOUNT_NOT_FOUND", requestId }, 404);
    return jsonResponse({ success:true, status:"OK", account:{ customerId:row.customer_id, fullName:row.full_name, email:row.email, companyName:row.company_name, country:row.country, licenseId:row.license_id, licenseKeyMasked:`HXL-Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢-Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢-Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢-${row.license_key_last4 || "Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢"}`, planCode:row.plan_code, licenseStatus:row.license_status, maxDevices:row.max_devices, activeDevices:Number(row.active_devices || 0), activationDate:row.activation_date, expiryDate:row.expiry_date }, requestId });
}


/* ============================================================
   CENTRAL BUSINESS PLATFORM v1 - RECOVERY LAYER
   Additive DB-backed product/pricing + release management.
   Existing licensing, checkout, release fallback and notifications remain intact.
   ============================================================ */
async function getCentralPlan(env, planCode) {
    const code=(normalizeString(planCode)||"STANDARD").toUpperCase();
    try {
        return await env.DB.prepare(`SELECT plan_code,display_name,price_minor,currency,validity_days,max_devices,status,buy_enabled,updated_at FROM business_plans WHERE plan_code=? LIMIT 1`).bind(code).first();
    } catch (_) { return null; }
}
async function handlePublicPlans(request,env,requestId){
    try{const r=await env.DB.prepare(`SELECT plan_code,display_name,price_minor,currency,validity_days,max_devices,status,buy_enabled FROM business_plans WHERE status IN ('ACTIVE','COMING_SOON') ORDER BY price_minor ASC`).all();const plans=[];for(const row of (r.results||[])){const offer=await getPlanOffer(env,row.plan_code),regular=Number(row.price_minor),effective=calculateOfferPriceMinor(regular,offer);plans.push({...row,regular_price_minor:regular,effective_price_minor:effective,price_minor:effective,offer:publicOfferPayload(offer,regular)});}return jsonResponse({success:true,status:"OK",plans,requestId});}
    catch{return jsonResponse({success:false,status:"ERROR",reasonCode:"PLANS_UNAVAILABLE",requestId},503);}
}
async function handleAdminPlans(request,env,requestId){
    const a=verifyAdminAuthorization(request,env);if(!a.ok)return jsonResponse({success:false,status:"DENIED",reasonCode:a.reasonCode,requestId},a.status,getAdminAuthorizationResponseHeaders(a));
    if(request.method==="GET"){try{const r=await env.DB.prepare(`SELECT * FROM business_plans ORDER BY created_at ASC`).all();return jsonResponse({success:true,status:"OK",plans:r.results||[],requestId});}catch{return jsonResponse({success:false,status:"ERROR",reasonCode:"PLAN_LIST_FAILED",requestId},500);}}
    let p;try{p=await request.json();}catch{return validationError("INVALID_JSON_BODY",requestId);}
    const code=normalizeString(p.planCode).toUpperCase(),name=normalizeString(p.displayName),price=Number(p.priceMinor),currency=(normalizeString(p.currency)||"INR").toUpperCase(),days=Number(p.validityDays),devices=Number(p.maxDevices),status=(normalizeString(p.status)||"ACTIVE").toUpperCase(),buy=p.buyEnabled===false?0:1;
    if(!/^[A-Z0-9_-]{2,32}$/.test(code)||!name||!Number.isInteger(price)||price<0||!Number.isInteger(days)||days<1||!Number.isInteger(devices)||devices<1||!["ACTIVE","COMING_SOON","INACTIVE"].includes(status))return validationError("PLAN_INVALID",requestId);
    try{await env.DB.prepare(`INSERT INTO business_plans(plan_code,display_name,price_minor,currency,validity_days,max_devices,status,buy_enabled,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(plan_code) DO UPDATE SET display_name=excluded.display_name,price_minor=excluded.price_minor,currency=excluded.currency,validity_days=excluded.validity_days,max_devices=excluded.max_devices,status=excluded.status,buy_enabled=excluded.buy_enabled,updated_at=CURRENT_TIMESTAMP`).bind(code,name,price,currency,days,devices,status,buy).run();await env.DB.prepare(`INSERT INTO business_events(event_type,entity_type,entity_id,event_data) VALUES('PLAN_UPDATED','PLAN',?,?)`).bind(code,JSON.stringify({priceMinor:price,currency,validityDays:days,maxDevices:devices,status,buyEnabled:Boolean(buy)})).run();return jsonResponse({success:true,status:"SAVED",planCode:code,requestId});}catch{return jsonResponse({success:false,status:"ERROR",reasonCode:"PLAN_SAVE_FAILED",requestId},500);}
}
async function handleAdminOffers(request,env,requestId){
    const a=verifyAdminAuthorization(request,env);if(!a.ok)return jsonResponse({success:false,status:"DENIED",reasonCode:a.reasonCode,requestId},a.status,getAdminAuthorizationResponseHeaders(a));
    if(request.method==="GET"){try{const r=await env.DB.prepare(`SELECT * FROM business_plan_offers ORDER BY updated_at DESC`).all();return jsonResponse({success:true,status:"OK",offers:r.results||[],requestId});}catch{return jsonResponse({success:false,status:"ERROR",reasonCode:"OFFER_LIST_FAILED",requestId},500);}}
    let p;try{p=await request.json();}catch{return validationError("INVALID_JSON_BODY",requestId);}
    const planCode=(normalizeString(p.planCode)||"STANDARD").toUpperCase(),offerName=normalizeString(p.offerName),badgeText=normalizeString(p.badgeText),enabled=p.enabled===true?1:0,type=(normalizeString(p.discountType)||"PERCENT").toUpperCase();
    const percent=Number(p.discountPercent),flatMinor=Number(p.discountFlatMinor),startsAt=normalizeString(p.startsAt)||null,endsAt=normalizeString(p.endsAt)||null;
    if(!["PERCENT","FLAT"].includes(type)||!offerName)return validationError("OFFER_INVALID",requestId);
    const bps=type==="PERCENT"?Math.round(percent*100):0,flat=type==="FLAT"?Math.round(flatMinor):0;
    if((type==="PERCENT"&&(!Number.isFinite(percent)||percent<=0||percent>100))||(type==="FLAT"&&(!Number.isInteger(flat)||flat<=0)))return validationError("OFFER_DISCOUNT_INVALID",requestId);
    if(startsAt&&!Number.isFinite(Date.parse(startsAt)))return validationError("OFFER_START_INVALID",requestId);if(endsAt&&!Number.isFinite(Date.parse(endsAt)))return validationError("OFFER_END_INVALID",requestId);if(startsAt&&endsAt&&Date.parse(endsAt)<=Date.parse(startsAt))return validationError("OFFER_DATE_RANGE_INVALID",requestId);
    try{const plan=await getCentralPlan(env,planCode);if(!plan)return validationError("PLAN_NOT_FOUND",requestId,404);if(type==="FLAT"&&flat>=Number(plan.price_minor))return validationError("OFFER_DISCOUNT_TOO_LARGE",requestId);
      const offerId=`OFF-${planCode}`;await env.DB.prepare(`INSERT INTO business_plan_offers(offer_id,plan_code,offer_name,badge_text,enabled,discount_type,discount_percent_bps,discount_flat_minor,starts_at,ends_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(plan_code) DO UPDATE SET offer_name=excluded.offer_name,badge_text=excluded.badge_text,enabled=excluded.enabled,discount_type=excluded.discount_type,discount_percent_bps=excluded.discount_percent_bps,discount_flat_minor=excluded.discount_flat_minor,starts_at=excluded.starts_at,ends_at=excluded.ends_at,updated_at=CURRENT_TIMESTAMP`).bind(offerId,planCode,offerName,badgeText||null,enabled,type,bps,flat,startsAt,endsAt).run();await env.DB.prepare(`INSERT INTO business_events(event_type,entity_type,entity_id,event_data) VALUES('OFFER_UPDATED','PLAN',?,?)`).bind(planCode,JSON.stringify({offerName,badgeText,enabled:Boolean(enabled),discountType:type,discountPercent:type==="PERCENT"?percent:null,discountFlatMinor:type==="FLAT"?flat:null,startsAt,endsAt})).run();return jsonResponse({success:true,status:"SAVED",planCode,offerId,requestId});}catch(e){return jsonResponse({success:false,status:"ERROR",reasonCode:"OFFER_SAVE_FAILED",requestId},500);}
}

/* K5 â€” secure installer upload to Workers KV. */
async function handleAdminInstallerUpload(request, env, requestId) {
    const authorization = verifyAdminAuthorization(request, env);

    if (!authorization.ok) {
        return jsonResponse(
            {
                success:false,
                status:"DENIED",
                reasonCode:authorization.reasonCode,
                requestId
            },
            authorization.status,
            getAdminAuthorizationResponseHeaders(authorization)
        );
    }

    if (!env.INSTALLER_STORAGE ||
        typeof env.INSTALLER_STORAGE.put !== "function") {
        return jsonResponse(
            {
                success:false,
                status:"ERROR",
                reasonCode:"INSTALLER_STORAGE_UNAVAILABLE",
                requestId
            },
            503
        );
    }

    let form;

    try {
        form = await request.formData();
    } catch (_) {
        return validationError(
            "INSTALLER_UPLOAD_FORM_INVALID",
            requestId
        );
    }

    const file = form.get("installer");
    const version = normalizeString(form.get("version"));

    if (!file ||
        typeof file.arrayBuffer !== "function") {
        return validationError(
            "INSTALLER_FILE_REQUIRED",
            requestId
        );
    }

    if (!version) {
        return validationError(
            "RELEASE_VERSION_REQUIRED",
            requestId
        );
    }

    const fileName = normalizeString(file.name);

    if (!fileName ||
        !fileName.toLowerCase().endsWith(".exe")) {
        return validationError(
            "INSTALLER_EXE_REQUIRED",
            requestId
        );
    }

    const bytes = await file.arrayBuffer();

    if (!bytes || bytes.byteLength < 1) {
        return validationError(
            "INSTALLER_FILE_EMPTY",
            requestId
        );
    }

    const maxBytes = 25 * 1024 * 1024;

    if (bytes.byteLength > maxBytes) {
        return jsonResponse(
            {
                success:false,
                status:"DENIED",
                reasonCode:"INSTALLER_FILE_TOO_LARGE",
                maxBytes,
                requestId
            },
            413
        );
    }

    const digest =
        await crypto.subtle.digest("SHA-256", bytes);

    const sha256 =
        Array.from(new Uint8Array(digest))
            .map(b => b.toString(16).padStart(2,"0"))
            .join("")
            .toUpperCase();

    const safeVersion =
        version.replace(/[^A-Za-z0-9._-]/g, "_");

    const storageKey =
        `installer:${safeVersion}`;

    try {
        await env.INSTALLER_STORAGE.put(
            storageKey,
            bytes,
            {
                metadata:{
                    version,
                    fileName,
                    sha256,
                    sizeBytes:bytes.byteLength,
                    uploadedAt:new Date().toISOString()
                }
            }
        );
    } catch (_) {
        return jsonResponse(
            {
                success:false,
                status:"ERROR",
                reasonCode:"INSTALLER_STORAGE_WRITE_FAILED",
                requestId
            },
            500
        );
    }

    const origin = new URL(request.url).origin;

    const downloadUrl =
        `${origin}/customer/download`;

    return jsonResponse(
        {
            success:true,
            status:"UPLOADED",
            version,
            fileName,
            sha256,
            sizeBytes:bytes.byteLength,
            storageKey,
            downloadUrl,
            requestId
        },
        200,
        {"Cache-Control":"no-store"}
    );
}
async function handleAdminReleasesDb(request,env,requestId){
    const a=verifyAdminAuthorization(request,env);if(!a.ok)return jsonResponse({success:false,status:"DENIED",reasonCode:a.reasonCode,requestId},a.status,getAdminAuthorizationResponseHeaders(a));
    if(request.method==="GET"){try{const r=await env.DB.prepare(`SELECT * FROM releases ORDER BY updated_at DESC LIMIT 100`).all();return jsonResponse({success:true,status:"OK",releases:r.results||[],requestId});}catch{return jsonResponse({success:false,status:"ERROR",reasonCode:"RELEASE_LIST_FAILED",requestId},500);}}
    let p;try{p=await request.json();}catch{return validationError("INVALID_JSON_BODY",requestId);}
    const version=normalizeString(p.version),fileName=normalizeString(p.fileName),sha=normalizeString(p.sha256),date=normalizeString(p.releaseDate),notes=normalizeString(p.notes),url=normalizeString(p.downloadUrl),status=(normalizeString(p.status)||"DRAFT").toUpperCase();
    if(!version||!fileName||!["DRAFT","PUBLISHED","ARCHIVED"].includes(status))return validationError("RELEASE_INVALID",requestId);
    if(url){try{if(new URL(url).protocol!=="https:")return validationError("RELEASE_URL_HTTPS_REQUIRED",requestId);}catch{return validationError("RELEASE_URL_INVALID",requestId);}}
    try{if(status==="PUBLISHED")await env.DB.prepare(`UPDATE releases SET status='ARCHIVED',updated_at=CURRENT_TIMESTAMP WHERE status='PUBLISHED' AND version<>?`).bind(version).run();await env.DB.prepare(`INSERT INTO releases(version,file_name,sha256,release_date,notes,download_url,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(version) DO UPDATE SET file_name=excluded.file_name,sha256=excluded.sha256,release_date=excluded.release_date,notes=excluded.notes,download_url=excluded.download_url,status=excluded.status,updated_at=CURRENT_TIMESTAMP`).bind(version,fileName,sha||null,date||null,notes||null,url||null,status).run();await env.DB.prepare(`INSERT INTO business_events(event_type,entity_type,entity_id,event_data) VALUES('RELEASE_SAVED','RELEASE',?,?)`).bind(version,JSON.stringify({status,fileName})).run();return jsonResponse({success:true,status:"SAVED",version,requestId});}catch{return jsonResponse({success:false,status:"ERROR",reasonCode:"RELEASE_SAVE_FAILED",requestId},500);}
}
async function getPublishedCentralRelease(env){try{return await env.DB.prepare(`SELECT version,file_name,sha256,release_date,notes,download_url,status FROM releases WHERE status='PUBLISHED' ORDER BY updated_at DESC LIMIT 1`).first();}catch{return null;}}

export default {
    async fetch(request, env) {
        const requestId = createRequestId();
        const path = getSafePath(request);

        if (request.method === "OPTIONS") {
            const origin =
                normalizeString(request.headers.get("origin"));

            if (!ALLOWED_APP_ORIGINS.has(origin)) {
                return withCors(
                    jsonResponse({
                        success: false,
                        status: "DENIED",
                        reasonCode: "CORS_ORIGIN_NOT_ALLOWED",
                        requestId
                    }, 403),
                    request
                );
            }

            return withCors(
                new Response(null, {
                    status: 204,
                    headers: {
                        "Cache-Control": "no-store",
                        "X-Content-Type-Options": "nosniff"
                    }
                }),
                request
            );
        }

        if (request.method === "GET" && path === "/public/plans") { return withCors(await handlePublicPlans(request, env, requestId), request); }
        if ((request.method === "GET" || request.method === "POST") && path === "/admin/plans") { return withCors(await handleAdminPlans(request, env, requestId), request); }
        if ((request.method === "GET" || request.method === "POST") && path === "/admin/offers") { return withCors(await handleAdminOffers(request, env, requestId), request); }
        if (request.method === "POST" && path === "/admin/releases/upload") {
            return withCors(
                await handleAdminInstallerUpload(request, env, requestId),
                request
            );
        }
        if ((request.method === "GET" || request.method === "POST") && path === "/admin/releases") { return withCors(await handleAdminReleasesDb(request, env, requestId), request); }


        if (
            request.method === "POST" &&
            path === "/admin/mailjet-test"
        ) {
            return withCors(
                await handleAdminMailjetTest(
                    request,
                    env,
                    requestId
                ),
                request
            );
        }
        if (request.method === "POST" && path === "/customer/register") {
    return withCors(
        await handleCustomerRegistrationStart(request, env, requestId),
        request
    );
}

if (request.method === "POST" && path === "/customer/register/resend") {
    return withCors(
        await handleCustomerRegistrationResend(
            request,
            env,
            requestId
        ),
        request
    );
}
if (request.method === "POST" && path === "/customer/register/verify") {
    return withCors(
        await handleCustomerRegistrationVerify(request, env, requestId),
        request
    );
}
if (
    request.method === "POST" &&
    path === "/checkout/verified-order"
) {
    return withCors(
        await handleVerifiedCheckoutOrderCreate(
            request,
            env,
            requestId
        ),
        request
    );
}
if (request.method === "POST" && path === "/payments/cashfree/create-order") { return withCors(await handleCashfreeCreateOrder(request, env, requestId), request); }
        if (request.method === "POST" && path === "/payments/cashfree/verify") { return withCors(await handleCashfreeVerifyPayment(request, env, requestId), request); }
        if (request.method === "POST" && path === "/checkout/orders") { return withCors(await handleCheckoutOrderCreate(request, env, requestId), request); }
        if (
    request.method === "POST" &&
    path === "/qa/demo-payment"
) {
    return withCors(
        await handleQaDemoPayment(
            request,
            env,
            requestId
        ),
        request
    );
}

        if (request.method === "POST" && path === "/payments/webhook") { return withCors(await handlePaymentWebhook(request, env, requestId), request); }
        if (request.method === "GET" && path === "/customer/orders") { return withCors(await handleCustomerOrders(request, env, requestId), request); }
        if (request.method === "GET" && path === "/admin/orders") { return withCors(await handleAdminOrders(request, env, requestId), request); }
        if (request.method === "POST" && path === "/admin/orders/resend-license") { return withCors(await handleAdminResendOrderLicense(request, env, requestId), request); }
        if (request.method === "POST" && path === "/customer/login") {
            return withCors(await handleCustomerLogin(request, env, requestId), request);
        }

        
        /* K7.5 CUSTOMER SELF-SERVICE PROFILE */
        if (request.method === "GET" && path === "/customer/profile") {
            return withCors(
                await handleCustomerProfileGet(request, env, requestId),
                request
            );
        }

        if (request.method === "PUT" && path === "/customer/profile") {
            return withCors(
                await handleCustomerProfileUpdate(request, env, requestId),
                request
            );
        }
if (request.method === "GET" && path === "/customer/me") {
            return withCors(await handleCustomerMe(request, env, requestId), request);
        }

        if (request.method === "GET" && path === "/customer/release") {
            return withCors(await handleCustomerRelease(request, env, requestId), request);
        }

        if (request.method === "GET" && path === "/customer/download") {
            return withCors(await handleCustomerDownload(request, env, requestId), request);
        }

        if (request.method === "GET" && path === "/admin/release") {
            return withCors(await handleAdminRelease(request, env, requestId), request);
        }

        if (request.method === "GET" && path === "/health") {
            return withCors(
                jsonResponse({
                    success: true,
                    service: API_NAME,
                    version: API_VERSION,
                    status: "ok",
                    requestId
                }),
                request
            );
        }

        if (
            request.method === "POST" &&
            path === "/admin/notifications/test-email"
        ) {
            const response =
                await handleAdminTestEmail(
                    request,
                    env,
                    requestId
                );

            return withCors(
                response,
                request
            );
        }
                                                        if (
                request.method === "POST" &&
                path === "/admin/notifications/manual-email"
            ) {
                return withCors(
                    await handleAdminManualEmail(
                        request,
                        env,
                        requestId
                    )
                );
            }
if (
                request.method === "POST" &&
                path === "/admin/notifications/test-renewal-email"
            ) {
                return withCors(
                    await handleAdminTestRenewalEmail(
                        request,
                        env,
                        requestId
                    )
                );
            }
if (
                request.method === "POST" &&
                path === "/admin/notifications/test-expired-email"
            ) {
                return withCors(
                    await handleAdminTestExpiredEmail(
                        request,
                        env,
                        requestId
                    )
                );
            }
if (
                request.method === "POST" &&
                path === "/admin/notifications/test-expiry-reminders"
            ) {
                return withCors(
                    await handleAdminTestExpiryReminders(
                        request,
                        env,
                        requestId
                    )
                );
            }
if (
            request.method === "POST" &&
            path === "/admin/notifications/generate-expiry"
        ) {
            const response =
                await handleAdminGenerateEmailNotifications(
                    request,
                    env,
                    requestId
                );

            return withCors(
                response,
                request
            );
        }

        if (
            request.method === "GET" &&
            path === "/admin/notifications"
        ) {
            const response =
                await handleAdminNotificationsList(
                    request,
                    env,
                    requestId
                );

            return withCors(
                response,
                request
            );
        }
        if (
            request.method === "GET" &&
            path === "/admin/reports/summary"
        ) {
            const response =
                await handleAdminReportsSummary(
                    request,
                    env,
                    requestId
                );

            return withCors(response, request);
        }

        if (
            request.method === "GET" &&
            path === "/admin/reports/renewals"
        ) {
            const response =
                await handleAdminRenewalReport(
                    request,
                    env,
                    requestId
                );

            return withCors(response, request);
        }
        
        /* S2_INDIVIDUAL_STAFF_ACCOUNT_ROUTES_V2 */

        const staffAccountDeactivateMatchV2 =
            /^\/admin\/staff-accounts\/([^/]+)\/deactivate$/.exec(path);

        const staffAccountPasswordResetMatchV2 =
            /^\/admin\/staff-accounts\/([^/]+)\/password-reset$/.exec(path);

        if (
            request.method === "POST" &&
            path === "/staff/login"
        ) {
            return withCors(
                await handleStaffLoginVerifyV2(
                    request,
                    env,
                    requestId
                ),
                request
            );
        }

        if (
            request.method === "GET" &&
            path === "/admin/staff-accounts"
        ) {
            return withCors(
                await handleAdminStaffAccountListV2(
                    request,
                    env,
                    requestId
                ),
                request
            );
        }

        if (
            request.method === "POST" &&
            path === "/admin/staff-accounts"
        ) {
            return withCors(
                await handleAdminStaffAccountCreateV2(
                    request,
                    env,
                    requestId
                ),
                request
            );
        }

        if (
            request.method === "POST" &&
            staffAccountDeactivateMatchV2
        ) {
            return withCors(
                await handleAdminStaffAccountDeactivateV2(
                    request,
                    env,
                    requestId,
                    decodeURIComponent(
                        staffAccountDeactivateMatchV2[1]
                    )
                ),
                request
            );
        }

        if (
            request.method === "POST" &&
            staffAccountPasswordResetMatchV2
        ) {
            return withCors(
                await handleAdminStaffPasswordResetV2(
                    request,
                    env,
                    requestId,
                    decodeURIComponent(
                        staffAccountPasswordResetMatchV2[1]
                    )
                ),
                request
            );
        }

        /* END S2_INDIVIDUAL_STAFF_ACCOUNT_ROUTES_V2 */


        const staffUpdateMatch =
            /^\/admin\/staff\/([^/]+)\/update$/.exec(path);

        const staffDeactivateMatch =
            /^\/admin\/staff\/([^/]+)\/deactivate$/.exec(path);
        const teamUpdateMatch =
            /^\/admin\/staff-teams\/([^/]+)\/update$/.exec(path);

        const teamDeactivateMatch =
            /^\/admin\/staff-teams\/([^/]+)\/deactivate$/.exec(path);

        const teamMembersMatch =
            /^\/admin\/staff-teams\/([^/]+)\/members$/.exec(path);

        const teamMemberRemoveMatch =
            /^\/admin\/staff-teams\/([^/]+)\/members\/([^/]+)\/remove$/.exec(path);

        if (request.method === "GET" && path === "/admin/staff-teams") {
            return withCors(
                await handleAdminTeamList(request, env, requestId),
                request
            );
        }

        if (request.method === "POST" && path === "/admin/staff-teams") {
            return withCors(
                await handleAdminTeamCreate(request, env, requestId),
                request
            );
        }

        if (request.method === "POST" && teamUpdateMatch) {
            return withCors(
                await handleAdminTeamUpdate(
                    request,
                    env,
                    requestId,
                    decodeURIComponent(teamUpdateMatch[1])
                ),
                request
            );
        }

        if (request.method === "POST" && teamDeactivateMatch) {
            return withCors(
                await handleAdminTeamDeactivate(
                    request,
                    env,
                    requestId,
                    decodeURIComponent(teamDeactivateMatch[1])
                ),
                request
            );
        }

        if (request.method === "GET" && teamMembersMatch) {
            return withCors(
                await handleAdminTeamMembersList(
                    request,
                    env,
                    requestId,
                    decodeURIComponent(teamMembersMatch[1])
                ),
                request
            );
        }

        if (request.method === "POST" && teamMembersMatch) {
            return withCors(
                await handleAdminTeamMemberAdd(
                    request,
                    env,
                    requestId,
                    decodeURIComponent(teamMembersMatch[1])
                ),
                request
            );
        }

        if (request.method === "POST" && teamMemberRemoveMatch) {
            return withCors(
                await handleAdminTeamMemberRemove(
                    request,
                    env,
                    requestId,
                    decodeURIComponent(teamMemberRemoveMatch[1]),
                    decodeURIComponent(teamMemberRemoveMatch[2])
                ),
                request
            );
        }
        if (
            request.method === "GET" &&
            path === "/admin/staff"
        ) {
            const response =
                await handleAdminStaffList(
                    request,
                    env,
                    requestId
                );

            return withCors(response, request);
        }

        if (
            request.method === "POST" &&
            path === "/admin/staff"
        ) {
            const response =
                await handleAdminStaffCreate(
                    request,
                    env,
                    requestId
                );

            return withCors(response, request);
        }

        if (
            request.method === "POST" &&
            staffUpdateMatch
        ) {
            const response =
                await handleAdminStaffUpdate(
                    request,
                    env,
                    requestId,
                    decodeURIComponent(
                        staffUpdateMatch[1]
                    )
                );

            return withCors(response, request);
        }

        if (
            request.method === "POST" &&
            staffDeactivateMatch
        ) {
            const response =
                await handleAdminStaffDeactivate(
                    request,
                    env,
                    requestId,
                    decodeURIComponent(
                        staffDeactivateMatch[1]
                    )
                );

            return withCors(response, request);
        }
        if (
            request.method === "GET" &&
            path === "/admin/customers"
        ) {
            const response = await handleAdminCustomersList(request, env, requestId);
            return withCors(response, request);
        }

        if (
            request.method === "GET" &&
            path === "/admin/customers/archived"
        ) {
            const response =
                await handleAdminArchivedCustomersList(
                    request,
                    env,
                    requestId
                );

            return withCors(response, request);
        }

        const customerDetailMatch = /^\/admin\/customers\/([^/]+)$/.exec(path);
        const customerUpdateMatch = /^\/admin\/customers\/([^/]+)\/update$/.exec(path);
        const customerDeactivateMatch = /^\/admin\/customers\/([^/]+)\/deactivate$/.exec(path);
        const customerArchiveMatch = /^\/admin\/customers\/([^/]+)\/archive$/.exec(path);
        const customerRestoreMatch = /^\/admin\/customers\/([^/]+)\/restore$/.exec(path);
        const customerIssueLicenseMatch = /^\/admin\/customers\/([^/]+)\/issue-license$/.exec(path);
        const licenseUpdateMatch = /^\/admin\/licenses\/([^/]+)\/update$/.exec(path);
        const licenseVaultMatch = /^\/admin\/licenses\/([^/]+)\/vault$/.exec(path);
        const licenseRenewMatch = /^\/admin\/licenses\/([^/]+)\/renew$/.exec(path);
        const adminDeviceResetByIdMatch = /^\/admin\/devices\/([^/]+)\/reset$/.exec(path);

        if (request.method === "GET" && customerDetailMatch) {
            const response = await handleAdminCustomerDetail(request, env, requestId, decodeURIComponent(customerDetailMatch[1]));
            return withCors(response, request);
        }

        if (request.method === "POST" && path === "/admin/customers") {
            const response = await handleAdminCustomerCreate(request, env, requestId);
            return withCors(response, request);
        }

        if (request.method === "POST" && customerUpdateMatch) {
            const response = await handleAdminCustomerUpdate(request, env, requestId, decodeURIComponent(customerUpdateMatch[1]));
            return withCors(response, request);
        }

        if (request.method === "POST" && customerDeactivateMatch) {
            const response =
                await handleAdminCustomerLifecycleAction(
                    request,
                    env,
                    requestId,
                    decodeURIComponent(
                        customerDeactivateMatch[1]
                    ),
                    "DEACTIVATE"
                );
            return withCors(response, request);
        }

        if (request.method === "POST" && customerArchiveMatch) {
            const response =
                await handleAdminCustomerLifecycleAction(
                    request,
                    env,
                    requestId,
                    decodeURIComponent(
                        customerArchiveMatch[1]
                    ),
                    "ARCHIVE"
                );
            return withCors(response, request);
        }

        if (request.method === "POST" && customerRestoreMatch) {
            const response =
                await handleAdminCustomerLifecycleAction(
                    request,
                    env,
                    requestId,
                    decodeURIComponent(
                        customerRestoreMatch[1]
                    ),
                    "RESTORE"
                );
            return withCors(response, request);
        }

        if (request.method === "POST" && customerIssueLicenseMatch) {
            const response =
                await handleAdminCustomerIssueLicense(
                    request,
                    env,
                    requestId,
                    decodeURIComponent(
                        customerIssueLicenseMatch[1]
                    )
                );

            return withCors(response, request);
        }
        if (request.method === "GET" && path === "/admin/licenses") {
            const response = await handleAdminLicensesList(request, env, requestId);
            return withCors(response, request);
        }

        if (licenseVaultMatch && request.method === "POST") {
            const response = await handleAdminLicenseVaultStore(request, env, requestId, decodeURIComponent(licenseVaultMatch[1]));
            return withCors(response, request);
        }

        if (licenseVaultMatch && request.method === "GET") {
            const response = await handleAdminLicenseVaultRead(request, env, requestId, decodeURIComponent(licenseVaultMatch[1]));
            return withCors(response, request);
        }

        if (request.method === "POST" && licenseUpdateMatch) {
            const response = await handleAdminLicenseUpdate(request, env, requestId, decodeURIComponent(licenseUpdateMatch[1]));
            return withCors(response, request);
        }

        if (request.method === "POST" && licenseRenewMatch) {
            const response = await handleAdminLicenseRenew(
                request,
                env,
                requestId,
                decodeURIComponent(licenseRenewMatch[1])
            );
            return withCors(response, request);
        }


        /* K7 DATA MANAGEMENT ROUTES */



        /* K7 CUSTOMER DELETE ROUTES */

        const customerDeletePreviewMatch =
            path.match(
                /^\/admin\/customers\/([^/]+)\/delete-preview$/
            );

        if (
            request.method === "GET" &&
            customerDeletePreviewMatch
        ) {
            const response =
                await handleAdminCustomerDeletePreview(
                    request,
                    env,
                    requestId,
                    decodeURIComponent(
                        customerDeletePreviewMatch[1]
                    )
                );

            return withCors(
                response,
                request
            );
        }


        const customerDeleteMatch =
            path.match(
                /^\/admin\/customers\/([^/]+)\/delete$/
            );

        if (
            request.method === "POST" &&
            customerDeleteMatch
        ) {
            const response =
                await handleAdminCustomerDelete(
                    request,
                    env,
                    requestId,
                    decodeURIComponent(
                        customerDeleteMatch[1]
                    )
                );

            return withCors(
                response,
                request
            );
        }


        if (
            request.method === "GET" &&
            path === "/admin/data-management/preview"
        ) {
            const response =
                await handleAdminDataManagementPreview(
                    request,
                    env,
                    requestId
                );

            return withCors(response, request);
        }

        if (
            request.method === "POST" &&
            path === "/admin/data-management/factory-reset"
        ) {
            const response =
                await handleAdminFactoryResetBusinessData(
                    request,
                    env,
                    requestId
                );

            return withCors(response, request);
        }


        if (
            request.method === "GET" &&
            path === "/admin/devices"
        ) {
            const response =
                await handleAdminDevicesList(
                    request,
                    env,
                    requestId
                );

            return withCors(response, request);
        }

        if (
            request.method === "POST" &&
            adminDeviceResetByIdMatch
        ) {
            const response =
                await handleAdminDeviceResetById(
                    request,
                    env,
                    requestId,
                    decodeURIComponent(
                        adminDeviceResetByIdMatch[1]
                    )
                );

            return withCors(response, request);
        }

        if (
            request.method === "POST" &&
            path === "/admin/device-reset"
        ) {
            const response =
                await handleAdminDeviceReset(
                    request,
                    env,
                    requestId
                );

            return withCors(response, request);
        }


        if (
            request.method === "POST" &&
            path === "/runtime/validate"
        ) {
            const response =
                await handleRuntimeLicenseValidation(
                    request,
                    env,
                    requestId
                );

            return withCors(response, request);
        }
        if (request.method === "POST" && path === "/activate") {
            const response =
                await handleActivate(request, env, requestId);

            return withCors(response, request);
        }

        return withCors(
            jsonResponse({
                success: false,
                status: "NOT_FOUND",
                reasonCode: "ROUTE_NOT_FOUND",
                requestId
            }, 404),
            request
        );
    }
};

export {
    API_NAME,
    API_VERSION,
    PRODUCTION_APP_ORIGIN,
    LICENSE_KEY_PATTERN,
    normalizeLicenseKey,
    validateActivationPayload,
    validateDeviceResetPayload,
    getAdminAuthorizationToken,
    verifyAdminAuthorization,
    sha256Hex,
    findLicenseByRawKey,
    validateCustomerAndLicenseStatus,
    validateLicenseExpiry,
    hashDeviceToken,
    createDeviceId,
    resetActiveDevice,
    activateFirstDevice,
    EMAIL_NOTIFICATION_TYPES,
    maskEmailAddress,
    daysBetweenUtcDates,
    getExpiryNotificationType,
    queueEmailNotification,
    queueExpiryEmailNotifications,
    queueRenewalConfirmationEmail,
    handleAdminGenerateEmailNotifications,
    handleAdminNotificationsList,
    handleAdminReportsSummary,
    handleAdminRenewalReport,
    handleAdminCustomersList,
    handleAdminCustomerDetail,
    handleAdminCustomerCreate,
    handleAdminCustomerUpdate,
    handleAdminCustomerLifecycleAction,
    handleAdminCustomerIssueLicense,
    handleAdminLicensesList,
    handleAdminLicenseUpdate,
    handleAdminLicenseRenew,
    handleAdminCustomerDeletePreview,
    handleAdminCustomerDelete,
    handleAdminDataManagementPreview,
    handleAdminFactoryResetBusinessData,
    handleAdminDevicesList,
    handleAdminDeviceResetById,
    handleAdminDeviceReset,
    handleRuntimeLicenseValidation,
    handleActivate,
    jsonResponse,
    getCorsHeaders,
    withCors,
    createRequestId,
    getSafePath
};













































































