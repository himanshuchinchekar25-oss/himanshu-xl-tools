
window.s2DirectPasswordToggle = function (inputId, button) {
  const input = document.getElementById(inputId);

  if (!input || !button) {
    return false;
  }

  if (input.type === "password") {
    input.type = "text";
    button.textContent = "Hide Password";
    button.setAttribute("aria-label", "Hide password");
  } else {
    input.type = "password";
    button.textContent = "Show Password";
    button.setAttribute("aria-label", "Show password");
  }

  return false;
};
import "./admin-control-center.css";

const API_BASE =
  "https://himanshu-xl-tools-license-api.himanshuchinchekar25.workers.dev";

const SECRET_KEY =
  "himanshuXLTools.adminSessionSecret";

const state = {
  secret: "",
  customers: [],
  archivedCustomers: [],
  customerListMode: "normal",
  licenses: [],
  devices: [],
  reportSummary: null,
  renewals: [],
  orders: [],
  currentPage: "dashboard",
  resetDeviceId: null,
  vaultLicenseId: null,
  plans: [],
  offers: []
};

const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString();
}

function statusBadge(status) {
  const value =
    String(status || "UNKNOWN").toUpperCase();

  return `<span class="badge ${value.toLowerCase()}">${escapeHtml(value)}</span>`;
}

function setMessage(message, type = "") {
  const el = $("globalMessage");

  if (!message) {
    el.textContent = "";
    el.className = "global-message hidden";
    return;
  }

  el.textContent = message;
  el.className =
    `global-message ${type}`.trim();
}

function openModal(id) {
  $(id).classList.remove("hidden");
}

function closeModal(id) {
  $(id).classList.add("hidden");
}

async function api(
  path,
  options = {}
) {
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${state.secret}`
  };

  if (
    options.body &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] =
      "application/json";
  }

  const response =
    await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = {
      success: false,
      reasonCode: "INVALID_SERVER_RESPONSE"
    };
  }

  if (!response.ok) {
    const error =
      new Error(
        data.reasonCode ||
        data.status ||
        `HTTP_${response.status}`
      );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

async function healthCheck() {
  try {
    const response =
      await fetch(`${API_BASE}/health`);

    if (!response.ok) {
      throw new Error("HEALTH_FAILED");
    }

    $("apiDot").classList.add("online");
    $("apiStatus").textContent = "API Online";
  } catch {
    $("apiDot").classList.remove("online");
    $("apiStatus").textContent = "API Offline";
  }
}

async function verifyAdminSecret(secret) {
  state.secret = secret;

  await api("/admin/customers");

  sessionStorage.setItem(
    SECRET_KEY,
    secret
  );

  return true;
}

function showApp() {
  $("loginView").classList.add("hidden");
  $("appView").classList.remove("hidden");
}

function showLogin() {
  $("appView").classList.add("hidden");
  $("loginView").classList.remove("hidden");
}

async function login() {
  const secret =
    $("adminSecret").value.trim();

  $("loginStatus").textContent = "";

  if (!secret) {
    $("loginStatus").textContent =
      "Admin secret is required.";
    return;
  }

  $("loginButton").disabled = true;
  $("loginButton").textContent =
    "Signing in...";

  try {
    await verifyAdminSecret(secret);

    showApp();
    await loadAll();
  } catch (error) {
    state.secret = "";

    sessionStorage.removeItem(
      SECRET_KEY
    );

    $("loginStatus").textContent =
      error.status === 401 ||
      error.status === 403
        ? "Invalid admin secret."
        : `Login failed: ${error.message}`;
  } finally {
    $("loginButton").disabled = false;
    $("loginButton").textContent =
      "Sign In";
  }
}

function logout() {
  state.secret = "";

  sessionStorage.removeItem(
    SECRET_KEY
  );

  $("adminSecret").value = "";

  showLogin();
}

async function loadReleaseCenter() {
  const meta=$("adminReleaseMeta"), status=$("adminReleaseStatus"), count=$("adminDownloadCount");
  if(!meta||!status||!count)return;
  try {
    const data=await api("/admin/release");
    const r=data.release||{};
    meta.textContent=`v${r.version||"-"}  ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢  ${r.fileName||"-"}${r.releaseDate?"  ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢  "+r.releaseDate:""}${r.sha256?"  ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢  SHA-256 "+r.sha256:""}`;
    status.textContent=r.published&&r.downloadConfigured?"Published":"Not published";
    count.textContent=`${Number(data.downloads||0)} downloads`;
  } catch (error) {
    meta.textContent="Release metadata unavailable."; status.textContent="Check production configuration"; count.textContent="-";
  }
}


/* =========================================================
   K4 RELEASE MANAGER
   ========================================================= */

function releaseManagerEscape(value) {
  return escapeHtml(String(value ?? ""));
}

function fillReleaseManager(release) {
  if (!release) return;

  if ($("releaseVersion"))
    $("releaseVersion").value = release.version || "";

  if ($("releaseFileName"))
    $("releaseFileName").value =
      release.file_name || release.fileName || "";

  if ($("releaseSha256"))
    $("releaseSha256").value = release.sha256 || "";

  if ($("releaseDate"))
    $("releaseDate").value =
      String(release.release_date || release.releaseDate || "")
        .slice(0, 10);

  if ($("releasePublishStatus"))
    $("releasePublishStatus").value =
      String(release.status || "DRAFT").toUpperCase();

  if ($("releaseDownloadUrl"))
    $("releaseDownloadUrl").value =
      release.download_url || release.downloadUrl || "";

  if ($("releaseNotes"))
    $("releaseNotes").value = release.notes || "";
}

async function loadReleaseManager() {
  const body = $("releaseHistoryBody");
  const msg = $("releaseManagerMessage");

  if (!body) return;

  try {
    if (msg) msg.textContent = "Loading releases...";

    const data = await api("/admin/releases");
    const releases = Array.isArray(data.releases)
      ? data.releases
      : [];

    body.innerHTML = releases.length
      ? releases.map(r => `
          <tr>
            <td>${releaseManagerEscape(r.version || "-")}</td>
            <td>${releaseManagerEscape(r.file_name || "-")}</td>
            <td>${releaseManagerEscape(r.status || "-")}</td>
            <td>${releaseManagerEscape(r.release_date || "-")}</td>
            <td title="${releaseManagerEscape(r.sha256 || "")}">
              ${releaseManagerEscape(
                r.sha256
                  ? String(r.sha256).slice(0, 12) + "..."
                  : "-"
              )}
            </td>
            <td>
              <button
                type="button"
                class="secondary"
                data-release-edit="${releaseManagerEscape(r.version || "")}">
                Edit
              </button>
            </td>
          </tr>
        `).join("")
      : `<tr><td colspan="6">No releases found.</td></tr>`;

    body.querySelectorAll("[data-release-edit]").forEach(button => {
      button.addEventListener("click", () => {
        const version = button.dataset.releaseEdit;

        const selected = releases.find(
          r => String(r.version) === String(version)
        );

        if (selected) {
          fillReleaseManager(selected);

          if (msg)
            msg.textContent =
              `Loaded release ${selected.version} for editing.`;
        }
      });
    });

    const published =
      releases.find(
        r => String(r.status).toUpperCase() === "PUBLISHED"
      ) || releases[0];

    if (published) {
      fillReleaseManager(published);
    }

    if (msg)
      msg.textContent =
        releases.length
          ? `SUCCESS: ${releases.length} release(s) loaded.`
          : "No releases configured.";

  } catch (error) {
    console.error("Release Manager load failed", error);

    body.innerHTML =
      `<tr><td colspan="6">Release API unavailable.</td></tr>`;

    if (msg)
      msg.textContent =
        `ERROR: Releases could not be loaded - ${error.message}`;
  }
}


async function uploadInstallerRelease() {
  const input = $("releaseInstallerFile");
  const button = $("releaseUploadButton");
  const status = $("releaseUploadStatus");
  const version =
    String($("releaseVersion")?.value || "").trim();

  const file =
    input && input.files && input.files[0]
      ? input.files[0]
      : null;

  if (!version) {
    if (status)
      status.textContent =
        "ERROR: Enter release version first.";
    return;
  }

  if (!file) {
    if (status)
      status.textContent =
        "ERROR: Choose an installer file first.";
    return;
  }

  if (!/\.exe$/i.test(file.name)) {
    if (status)
      status.textContent =
        "ERROR: Installer must be an .exe file.";
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Uploading...";
  }

  if (status)
    status.textContent =
      "Uploading installer securely...";

  try {
    const form = new FormData();
    form.append("version", version);
    form.append("installer", file, file.name);

    /*
      Use the same API base + admin authorization mechanism
      already used by Admin Control Center.
    */
    if (!state.secret) {
      throw new Error("ADMIN_SESSION_REQUIRED");
    }

    const response = await fetch(
      `${API_BASE}/admin/releases/upload`,
      {
        method:"POST",
        headers:{
          Authorization:`Bearer ${state.secret}`
        },
        body:form,
        cache:"no-store"
      }
    );

    let result = null;

    try {
      result = await response.json();
    } catch (_) {}

    if (!response.ok ||
        !result ||
        result.success !== true) {
      throw new Error(
        result?.reasonCode ||
        `Upload failed (${response.status}).`
      );
    }

    if ($("releaseFileName"))
      $("releaseFileName").value =
        result.fileName || file.name;

    if ($("releaseSha256"))
      $("releaseSha256").value =
        result.sha256 || "";

    if ($("releaseFileSize"))
      $("releaseFileSize").value =
        `${Number(result.sizeBytes || file.size).toLocaleString()} bytes`;

    if ($("releaseDownloadUrl"))
      $("releaseDownloadUrl").value =
        result.downloadUrl || "";

    if (status)
      status.textContent =
        `SUCCESS: ${result.fileName} uploaded. SHA-256 verified by server.`;

  } catch (error) {
    console.error(
      "Installer upload failed",
      error
    );

    if (status)
      status.textContent =
        `ERROR: Installer was NOT uploaded - ${error.message}`;

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Upload Installer";
    }
  }
}
async function saveReleaseManager(event) {
  if (event) event.preventDefault();

  const button = $("releaseSaveButton");
  const msg = $("releaseManagerMessage");

  const version =
    String($("releaseVersion")?.value || "").trim();

  const fileName =
    String($("releaseFileName")?.value || "").trim();

  const sha256 =
    String($("releaseSha256")?.value || "").trim();

  const releaseDate =
    String($("releaseDate")?.value || "").trim();

  const status =
    String($("releasePublishStatus")?.value || "DRAFT")
      .trim()
      .toUpperCase();

  const downloadUrl =
    String($("releaseDownloadUrl")?.value || "").trim();

  const notes =
    String($("releaseNotes")?.value || "").trim();

  if (!version || !fileName) {
    if (msg)
      msg.textContent =
        "ERROR: Version and Installer File Name are required.";
    return;
  }

  if (sha256 && !/^[A-Fa-f0-9]{64}$/.test(sha256)) {
    if (msg)
      msg.textContent =
        "ERROR: SHA-256 must contain exactly 64 hexadecimal characters.";
    return;
  }

  if (
    downloadUrl &&
    !/^https:\/\//i.test(downloadUrl)
  ) {
    if (msg)
      msg.textContent =
        "ERROR: Download URL must use HTTPS.";
    return;
  }

  const payload = {
    version,
    fileName,
    sha256,
    releaseDate,
    notes,
    downloadUrl,
    status
  };

  if (button) {
    button.disabled = true;
    button.textContent =
      status === "PUBLISHED"
        ? "Publishing..."
        : "Saving...";
  }

  if (msg)
    msg.textContent =
      status === "PUBLISHED"
        ? "Publishing release..."
        : "Saving release...";

  try {
    const result = await api("/admin/releases", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (!result || result.success !== true) {
      throw new Error(
        result?.reasonCode ||
        "Release API did not confirm save."
      );
    }

    // Verify saved state from server.
    const verify = await api("/admin/releases");

    const saved =
      (verify.releases || []).find(
        r => String(r.version) === version
      );

    if (!saved) {
      throw new Error(
        "Saved release could not be verified from server."
      );
    }

    if (
      String(saved.status || "").toUpperCase() !== status
    ) {
      throw new Error(
        `Server status mismatch. Expected ${status}, received ${saved.status}.`
      );
    }

    if (msg) {
      msg.textContent =
        status === "PUBLISHED"
          ? `SUCCESS: Release ${version} published successfully.`
          : `SUCCESS: Release ${version} saved as ${status}.`;
    }

    await loadReleaseManager();
    await loadReleaseCenter();
    bindReleaseManager();
    await loadReleaseManager();

  } catch (error) {
    console.error("Release Manager save failed", error);

    if (msg)
      msg.textContent =
        `ERROR: Release was NOT saved - ${error.message}`;

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Save Release";
    }
  }
}

function bindReleaseManager() {
  const form = $("releaseManagerForm");
  const refresh = $("releaseRefreshButton");
  const upload = $("releaseUploadButton");

  if (upload && upload.dataset.bound !== "true") {
    upload.dataset.bound = "true";
    upload.addEventListener(
      "click",
      uploadInstallerRelease
    );
  }

  if (form && form.dataset.bound !== "true") {
    form.dataset.bound = "true";

    form.addEventListener(
      "submit",
      saveReleaseManager
    );
  }

  if (
    refresh &&
    refresh.dataset.bound !== "true"
  ) {
    refresh.dataset.bound = "true";

    refresh.addEventListener(
      "click",
      loadReleaseManager
    );
  }
}

async function loadOrdersCenter() {
  const orderBody=$("ordersBody"), paymentBody=$("paymentsBody");
  if(!orderBody && !paymentBody)return;
  try {
    const data=await api("/admin/orders"), orders=data.orders||[];
    state.orders=orders;
    const paid=orders.filter(isVerifiedPaidOrder);
    const revenue=paid.reduce((sum,o)=>sum+(Number(o.amount_minor)||0),0);
    if($("orderCount")) $("orderCount").textContent=`${orders.length} orders`;
    if($("paidOrderCount")) $("paidOrderCount").textContent=`${paid.length} fulfilled`;
    if($("paymentRevenue")) $("paymentRevenue").textContent=formatMoneyMinor(revenue,"INR");
    if(orderBody) orderBody.innerHTML=orders.length?orders.map(o=>`<tr><td>${escapeHtml(o.order_id||"-")}</td><td>${escapeHtml(o.full_name||o.email||"-")}</td><td>${escapeHtml(o.plan_code||"-")}</td><td>${o.amount_minor==null?"Not configured":formatMoneyMinor(o.amount_minor,o.currency||"INR")}</td><td>${escapeHtml(o.status||"-")}</td><td>${escapeHtml(o.payment_reference||"-")}</td><td>${escapeHtml(o.license_id||"-")}</td><td>${escapeHtml(o.created_at||"-")}</td><td>${o.license_id?`<button class="secondary" data-resend-order="${escapeHtml(o.order_id)}">Resend License</button>`:"-"}</td></tr>`).join(""):`<tr><td colspan="9">No website orders yet.</td></tr>`;
    if(paymentBody) paymentBody.innerHTML=paid.length?paid.map(o=>`<tr><td>${escapeHtml(o.order_id||"-")}</td><td>${escapeHtml(o.full_name||o.email||"-")}</td><td>${formatMoneyMinor(o.amount_minor,o.currency||"INR")}</td><td>${escapeHtml(o.status||"-")}</td><td>${escapeHtml(o.payment_reference||"-")}</td><td>${escapeHtml(o.created_at||"-")}</td></tr>`).join(""):`<tr><td colspan="6">No verified payments found.</td></tr>`;
    renderMasterDashboard();
  } catch { if(orderBody) orderBody.innerHTML=`<tr><td colspan="9">Orders API unavailable.</td></tr>`; if(paymentBody) paymentBody.innerHTML=`<tr><td colspan="6">Payments API unavailable.</td></tr>`; }
}

function isVerifiedPaidOrder(o){
  const s=String(o?.status||"").toUpperCase();
  return s==="PAID" || s.startsWith("FULFILLED");
}
function formatMoneyMinor(value,currency="INR"){
  const amount=(Number(value)||0)/100;
  try{return new Intl.NumberFormat("en-IN",{style:"currency",currency,maximumFractionDigits:2}).format(amount);}catch{return `${currency} ${amount.toFixed(2)}`;}
}


async function loadAll() {
  setMessage("");

  try {
    const [
      customersResult,
      licensesResult,
      devicesResult,
      reportSummaryResult,
      renewalReportResult
    ] = await Promise.all([
      api("/admin/customers"),
      api("/admin/licenses"),
      api("/admin/devices"),
      api("/admin/reports/summary"),
      api("/admin/reports/renewals")
    ]);

    state.customers =
      customersResult.customers || [];

    state.licenses =
      licensesResult.licenses || [];

    state.devices =
      devicesResult.devices || [];

    state.reportSummary =
      reportSummaryResult || null;

    state.renewals =
      renewalReportResult.renewals || [];

    renderAll();
    await loadReleaseCenter();
    bindReleaseManager();
    await loadReleaseManager();
    await loadOrdersCenter();
    await healthCheck();

  } catch (error) {

    if (
      error.status === 401 ||
      error.status === 403
    ) {
      logout();

      $("loginStatus").textContent =
        "Admin session expired or is invalid.";

      return;
    }

    setMessage(
      `Unable to refresh admin data: ${error.message}`,
      "error"
    );
  }
}

function renderAll() {
  renderOverview();
  renderMasterDashboard();
  bindMasterDashboard();
  renderCustomers();
  renderLicenses();
  renderDevices();
  renderReports();
}

function renderOverview() {
  const now = new Date();

  const in30Days =
    new Date(
      now.getTime() +
      30 * 24 * 60 * 60 * 1000
    );

  const activeLicenses =
    state.licenses.filter(
      (x) =>
        String(x.status).toUpperCase() ===
        "ACTIVE"
    );

  const activeDevices =
    state.devices.filter(
      (x) =>
        String(x.status).toUpperCase() ===
        "ACTIVE"
    );

  const expired =
    state.licenses.filter((x) => {
      const status =
        String(x.status || "").toUpperCase();

      if (status === "EXPIRED") {
        return true;
      }

      if (!x.expiry_date) {
        return false;
      }

      const expiry =
        new Date(`${x.expiry_date}T23:59:59Z`);

      return expiry < now;
    });

  const expiringSoon =
    state.licenses.filter((x) => {
      if (!x.expiry_date) return false;

      const expiry =
        new Date(`${x.expiry_date}T23:59:59Z`);

      return (
        expiry >= now &&
        expiry <= in30Days
      );
    });

  const blockedCustomers =
    state.customers.filter(
      (x) =>
        String(
          x.customer_status || x.status
        ).toUpperCase() === "BLOCKED"
    ).length;

  const blockedLicenses =
    state.licenses.filter(
      (x) =>
        String(x.status).toUpperCase() ===
        "BLOCKED"
    ).length;

  $("statCustomers").textContent =
    state.customers.length;

  $("statActiveLicenses").textContent =
    activeLicenses.length;

  const statActiveDevicesEl = $("statActiveDevices");
  if (statActiveDevicesEl) {
    statActiveDevicesEl.textContent = activeDevices.length;
  }

  $("statExpiring").textContent =
    expiringSoon.length;

  $("statExpired").textContent =
    expired.length;

  $("statBlocked").textContent =
    blockedCustomers +
    blockedLicenses;


  const recent =
    [...state.customers]
      .sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      )
      .slice(0, 6);

  $("recentCustomers").innerHTML =
    recent.length
      ? `<div class="mini-list">${recent.map((c) => `
          <div class="mini-row">
            <div>
              <div class="table-title">${escapeHtml(c.full_name)}</div>
              <div class="table-sub">${escapeHtml(c.email || c.customer_id)}</div>
            </div>
            ${statusBadge(c.customer_status || c.status)}
          </div>
        `).join("")}</div>`
      : `<div class="empty">No customers found.</div>`;


  const attention =
    [...state.licenses]
      .filter((license) => {
        const status =
          String(
            license.status || ""
          ).toUpperCase();

        return (
          status !== "ACTIVE" ||
          expiringSoon.some(
            (x) =>
              x.license_id ===
              license.license_id
          )
        );
      })
      .slice(0, 6);

  $("licenseAttention").innerHTML =
    attention.length
      ? `<div class="mini-list">${attention.map((l) => `
          <div class="mini-row">
            <div>
              <div class="table-title">${escapeHtml(l.license_id)}</div>
              <div class="table-sub">
                ${escapeHtml(l.customer_name || l.customer_id || "")}
                Ãƒâ€šÃ‚Â· ${escapeHtml(l.expiry_date || "No expiry")}
              </div>
            </div>
            ${statusBadge(l.status)}
          </div>
        `).join("")}</div>`
      : `<div class="empty">No license attention required.</div>`;

  renderOverviewVisuals({ activeLicenses, activeDevices, expired, expiringSoon });
}


function renderOverviewVisuals({ activeLicenses, activeDevices, expired, expiringSoon }) {
  const totalLicenses = state.licenses.length;
  const utilization = totalLicenses
    ? Math.round((activeLicenses.length / totalLicenses) * 100)
    : 0;

  const utilizationEl = $("overviewUtilization");
  if (utilizationEl) utilizationEl.textContent = `${utilization}%`;

  const totalEl = $("overviewLicenseTotal");
  if (totalEl) totalEl.textContent = totalLicenses;

  const activeCount = activeLicenses.length;
  const expiredCount = expired.length;
  const attentionCount = Math.max(0, totalLicenses - activeCount - expiredCount);
  const denominator = Math.max(totalLicenses, 1);
  const activePct = (activeCount / denominator) * 100;
  const attentionPct = (attentionCount / denominator) * 100;
  const donut = $("overviewLicenseDonut");
  if (donut) {
    donut.style.background = `conic-gradient(#16a34a 0 ${activePct}%, #f59e0b ${activePct}% ${activePct + attentionPct}%, #ef4444 ${activePct + attentionPct}% 100%)`;
  }

  const legend = $("overviewLicenseLegend");
  if (legend) {
    legend.innerHTML = `
      <div><i class="legend-dot active-dot"></i><span>Active</span><strong>${activeCount}</strong></div>
      <div><i class="legend-dot warning-dot"></i><span>Attention</span><strong>${attentionCount}</strong></div>
      <div><i class="legend-dot danger-dot"></i><span>Expired</span><strong>${expiredCount}</strong></div>
      <div><i class="legend-dot info-dot"></i><span>Expiring ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â¤30d</span><strong>${expiringSoon.length}</strong></div>`;
  }

  const chart = $("overviewActivityChart");
  if (!chart) return;
  const now = new Date();
  const months = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("en-US", { month: "short" }) });
  }
  const countFor = (items, bucket) => items.filter((item) => {
    const raw = item.created_at || item.createdAt || item.issued_at || item.start_date;
    if (!raw) return false;
    const d = new Date(raw);
    return !Number.isNaN(d.getTime()) && d.getFullYear() === bucket.year && d.getMonth() === bucket.month;
  }).length;
  const points = months.map((m) => ({ ...m, customers: countFor(state.customers, m), licenses: countFor(state.licenses, m) }));
  const max = Math.max(1, ...points.flatMap((p) => [p.customers, p.licenses]));
  chart.innerHTML = `<div class="bar-plot">${points.map((p) => `
    <div class="bar-month" title="${p.label}: ${p.customers} customers, ${p.licenses} licenses">
      <div class="bar-pair"><i class="bar customers-bar" style="height:${Math.max(4,(p.customers/max)*100)}%"></i><i class="bar licenses-bar" style="height:${Math.max(4,(p.licenses/max)*100)}%"></i></div>
      <span>${p.label}</span>
    </div>`).join("")}</div>
    <div class="chart-key"><span><i class="key-dot customer-key"></i>Customers</span><span><i class="key-dot license-key"></i>Licenses</span></div>`;
}

async function loadArchivedCustomers() {
  const result = await api("/admin/customers/archived");

  state.archivedCustomers =
    result && Array.isArray(result.customers)
      ? result.customers
      : [];

  return state.archivedCustomers;
}
function renderCustomers() {
  const search =
    normalize(
      $("customerSearch").value
    );

  const status =
    $("customerStatusFilter").value;

  const customerSource =
    state.customerListMode === "archived"
      ? state.archivedCustomers
      : state.customers;

  const rows =
    customerSource.filter((c) => {
      const customerStatus =
        String(
          c.customer_status ||
          c.status ||
          ""
        ).toUpperCase();

      const text =
        normalize(
          [
            c.customer_id,
            c.full_name,
            c.email,
            c.mobile,
            c.company_name
          ].join(" ")
        );

      return (
        (!search || text.includes(search)) &&
        (!status || customerStatus === status)
      );
    });

  $("customersBody").innerHTML =
    rows.length
      ? rows.map((c) => `
        <tr>
          <td>
            <div class="table-title">${escapeHtml(c.full_name)}</div>
            <div class="table-sub">${escapeHtml(c.customer_id)}</div>
          </td>

          <td>
            <div>${escapeHtml(c.email || "-")}</div>
            <div class="table-sub">${escapeHtml(c.mobile || "")}</div>
          </td>

          <td>${escapeHtml(c.company_name || "-")}</td>

          <td>${statusBadge(c.customer_status || c.status)}</td>

          <td>${escapeHtml(c.license_id || "-")}</td>

          <td>${escapeHtml(c.expiry_date || "-")}</td>

          <td>
            <button
              class="action-button"
              data-customer-360="${escapeHtml(c.customer_id)}"
            >
              View 360
            </button>
            ${state.customerListMode !== "archived" ? `
            <button
              class="action-button"
              data-edit-customer="${escapeHtml(c.customer_id)}"
            >
              Edit
            </button>
            ` : ""}
          </td>
        </tr>
      `).join("")
      : `
        <tr>
          <td colspan="8" class="empty">
            No customers found.
          </td>
        </tr>
      `;
}

function renderLicenses() {
  const search =
    normalize(
      $("licenseSearch").value
    );

  const status =
    $("licenseStatusFilter").value;

  const rows =
    state.licenses.filter((l) => {
      const text =
        normalize(
          [
            l.license_id,
            l.customer_id,
            l.customer_name,
            l.plan_code,
            l.license_key_last4
          ].join(" ")
        );

      return (
        (!search || text.includes(search)) &&
        (
          !status ||
          String(l.status).toUpperCase() ===
            status
        )
      );
    });

  $("licensesBody").innerHTML =
    rows.length
      ? rows.map((l) => `
        <tr>
          <td>
            <div class="table-title">${escapeHtml(l.license_id)}</div>
          </td>

          <td>
            <div>${escapeHtml(l.customer_name || "-")}</div>
            <div class="table-sub">${escapeHtml(l.customer_id || "")}</div>
          </td>

          <td><span class="table-sub">HXL- ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢  ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢  ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢  ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ - ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢  ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢  ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢  ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ - ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢  ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢  ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢  ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ -${escapeHtml(l.license_key_last4 || " ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢  ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢  ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢  ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ ")}</span></td>

          <td>${escapeHtml(l.plan_code || "-")}</td>

          <td>${statusBadge(l.status)}</td>

          <td>${escapeHtml(l.active_device_count ?? 0)} / ${escapeHtml(l.max_devices ?? 1)}</td>

          <td>${escapeHtml(l.expiry_date || "-")}</td>

          <td>
            <button class="action-button" data-vault-license="${escapeHtml(l.license_id)}">Vault</button>
            <button class="action-button" data-renew-license="${escapeHtml(l.license_id)}">Renew</button>
          </td>
        </tr>
      `).join("")
      : `
        <tr>
          <td colspan="8" class="empty">
            No licenses found.
          </td>
        </tr>
      `;
}

function renderDevices() {
  const search =
    normalize(
      $("deviceSearch").value
    );

  const status =
    $("deviceStatusFilter").value;

  const rows =
    state.devices.filter((d) => {
      const text =
        normalize(
          [
            d.device_id,
            d.device_name,
            d.customer_id,
            d.customer_name,
            d.license_id,
            d.platform,
            d.app_version
          ].join(" ")
        );

      return (
        (!search || text.includes(search)) &&
        (
          !status ||
          String(d.status).toUpperCase() ===
            status
        )
      );
    });

  $("devicesBody").innerHTML =
    rows.length
      ? rows.map((d) => {
          const active =
            String(d.status).toUpperCase() ===
            "ACTIVE";

          return `
            <tr>
              <td>
                <div class="table-title">${escapeHtml(d.device_name || "Unnamed Device")}</div>
                <div class="table-sub">${escapeHtml(d.device_id)}</div>
              </td>

              <td>
                <div>${escapeHtml(d.customer_name || "-")}</div>
                <div class="table-sub">${escapeHtml(d.customer_id || "")}</div>
              </td>

              <td>${escapeHtml(d.license_id)}</td>

              <td>${escapeHtml(d.platform || "-")}</td>

              <td>${escapeHtml(d.app_version || "-")}</td>

              <td>${statusBadge(d.status)}</td>

              <td>${formatDate(d.last_seen_at)}</td>

              <td>
                ${
                  active
                    ? `
                      <button
                        class="action-button danger-link"
                        data-reset-device="${escapeHtml(d.device_id)}"
                      >
                        Reset
                      </button>
                    `
                    : "-"
                }
              </td>
            </tr>
          `;
        }).join("")
      : `
        <tr>
          <td colspan="8" class="empty">
            No devices found.
          </td>
        </tr>
      `;
}



function reportMiniRow(label, value) {
  return `
    <div class="mini-row">
      <div class="table-title">${escapeHtml(label)}</div>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderReports() {
  const summary = state.reportSummary || {};
  const metrics = summary.metrics || {};

  const customers = metrics.customers || {};
  const licenses = metrics.licenses || {};
  const devices = metrics.devices || {};
  const renewals = metrics.renewals || {};

  $("reportCustomers").textContent =
    Number(customers.total || state.customers.length || 0);

  $("reportActiveLicenses").textContent =
    Number(licenses.active || 0);

  $("reportExpiring").textContent =
    Number(licenses.expiring_30_days || 0);

  $("reportExpired").textContent =
    Number(licenses.expired || 0);

  $("reportActiveDevices").textContent =
    Number(devices.active || 0);

  $("reportRevenue").textContent =
    formatMoneyMinor(
      renewals.total_amount_minor || 0,
      "INR"
    );

  $("reportLicenseHealth").innerHTML =
    '<div class="mini-list">' +
    reportMiniRow("Total Licenses", Number(licenses.total || 0)) +
    reportMiniRow("Active", Number(licenses.active || 0)) +
    reportMiniRow("Pending", Number(licenses.pending || 0)) +
    reportMiniRow("Blocked", Number(licenses.blocked || 0)) +
    reportMiniRow("Expired", Number(licenses.expired || 0)) +
    reportMiniRow("Deactivated", Number(licenses.deactivated || 0)) +
    reportMiniRow("Expiring in 30 Days", Number(licenses.expiring_30_days || 0)) +
    "</div>";

  $("reportCustomerDevice").innerHTML =
    '<div class="mini-list">' +
    reportMiniRow("Customers", Number(customers.total || 0)) +
    reportMiniRow("Active Customers", Number(customers.active || 0)) +
    reportMiniRow("Blocked Customers", Number(customers.blocked || 0)) +
    reportMiniRow("Devices", Number(devices.total || 0)) +
    reportMiniRow("Active Devices", Number(devices.active || 0)) +
    reportMiniRow("Reset Devices", Number(devices.reset || 0)) +
    reportMiniRow("Deactivated Devices", Number(devices.deactivated || 0)) +
    "</div>";

  renderRenewalReport();
}

function renderRenewalReport() {
  const rows = state.renewals || [];

  $("renewalReportBody").innerHTML =
    rows.length
      ? rows.map((r) => `
        <tr>
          <td>${escapeHtml(formatDate(r.created_at))}</td>
          <td>
            <div class="table-title">${escapeHtml(r.customer_name || "-")}</div>
            <div class="table-sub">${escapeHtml(r.customer_id || "")}</div>
          </td>
          <td>${escapeHtml(r.license_id || "-")}</td>
          <td>${escapeHtml(r.renewal_days ?? "-")}</td>
          <td>${escapeHtml(r.old_expiry_date || "-")}</td>
          <td>${escapeHtml(r.new_expiry_date || "-")}</td>
          <td>${escapeHtml(formatMoneyMinor(r.amount_minor, r.currency || "INR"))}</td>
          <td>${escapeHtml(r.payment_reference || "-")}</td>
          <td>${statusBadge(r.status)}</td>
        </tr>
      `).join("")
      : '<tr><td colspan="9" class="empty">No renewals found.</td></tr>';
}

async function applyReportFilters() {
  const params = new URLSearchParams();

  const from = $("reportFrom").value;
  const to = $("reportTo").value;
  const status = $("reportRenewalStatus").value;

  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (status) params.set("status", status);

  try {
    const result =
      await api(
        "/admin/reports/renewals" +
        (params.toString() ? "?" + params.toString() : "")
      );

    state.renewals =
      result.renewals || [];

    renderRenewalReport();

    setMessage(
      `Report loaded: ${state.renewals.length} renewal record(s).`,
      "success"
    );
  } catch (error) {
    setMessage(
      `Report filter failed: ${error.message}`,
      "error"
    );
  }
}

function csvEscape(value) {
  const text = String(value ?? "");

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return '"' + text.replace(/"/g, '""') + '"';
  }

  return text;
}

function downloadCsv(filename, headers, rows) {
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map(
      row => row.map(csvEscape).join(",")
    )
  ];

  const blob =
    new Blob(
      ["\uFEFF" + lines.join("\r\n")],
      { type: "text/csv;charset=utf-8" }
    );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

function exportCustomersCsv() {
  downloadCsv(
    "himanshu-xl-customers.csv",
    [
      "Customer ID",
      "Name",
      "Email",
      "Mobile",
      "Company",
      "Status",
      "License",
      "Expiry"
    ],
    state.customers.map(c => [
      c.customer_id,
      c.full_name,
      c.email,
      c.mobile,
      c.company_name,
      c.customer_status || c.status,
      c.license_id,
      c.expiry_date
    ])
  );
}

function exportLicensesCsv() {
  downloadCsv(
    "himanshu-xl-licenses.csv",
    [
      "License ID",
      "Customer ID",
      "Customer",
      "Plan",
      "Status",
      "Active Devices",
      "Max Devices",
      "Activation",
      "Expiry"
    ],
    state.licenses.map(l => [
      l.license_id,
      l.customer_id,
      l.customer_name,
      l.plan_code,
      l.status,
      l.active_device_count,
      l.max_devices,
      l.activation_date,
      l.expiry_date
    ])
  );
}

function exportDevicesCsv() {
  downloadCsv(
    "himanshu-xl-devices.csv",
    [
      "Device ID",
      "License ID",
      "Customer ID",
      "Customer",
      "Device Name",
      "Platform",
      "App Version",
      "Status",
      "Activated",
      "Last Seen"
    ],
    state.devices.map(d => [
      d.device_id,
      d.license_id,
      d.customer_id,
      d.customer_name,
      d.device_name,
      d.platform,
      d.app_version,
      d.status,
      d.activated_at,
      d.last_seen_at
    ])
  );
}

function exportRenewalsCsv() {
  downloadCsv(
    "himanshu-xl-renewals.csv",
    [
      "Created",
      "Renewal ID",
      "Customer ID",
      "Customer",
      "License ID",
      "Old Expiry",
      "New Expiry",
      "Renewal Days",
      "Amount Minor",
      "Currency",
      "Payment Reference",
      "Status"
    ],
    state.renewals.map(r => [
      r.created_at,
      r.renewal_id,
      r.customer_id,
      r.customer_name,
      r.license_id,
      r.old_expiry_date,
      r.new_expiry_date,
      r.renewal_days,
      r.amount_minor,
      r.currency,
      r.payment_reference,
      r.status
    ])
  );
}



/* ============================================================
   PHASE K2 - PRODUCTS & PRICING MANAGER
   ============================================================ */

async function loadPricingManager() {
  const message = $("pricingStatusMessage");

  if (!message) return;

  message.textContent = "Loading plan...";

  try {
    const result = await api("/admin/plans");

    state.plans =
      result.plans ||
      result.items ||
      result.data ||
      [];

    const plan =
      state.plans.find(
        (item) =>
          String(
            item.plan_code ||
            item.planCode ||
            ""
          ).toUpperCase() === "STANDARD"
      ) ||
      state.plans[0];

    if (!plan) {
      throw new Error("STANDARD_PLAN_NOT_FOUND");
    }

    const priceMinor =
      Number(
        plan.price_minor ??
        plan.priceMinor ??
        0
      );

    const validityDays =
      Number(
        plan.validity_days ??
        plan.validityDays ??
        365
      );

    const maxDevices =
      Number(
        plan.max_devices ??
        plan.maxDevices ??
        1
      );

    const buyEnabled =
      plan.buy_enabled ??
      plan.buyEnabled ??
      0;

    $("pricingPlanCode").value =
      plan.plan_code ||
      plan.planCode ||
      "STANDARD";

    $("pricingDisplayName").value =
      plan.display_name ||
      plan.displayName ||
      "Standard";

    $("pricingPrice").value =
      (priceMinor / 100).toFixed(0);

    $("pricingCurrency").value =
      plan.currency || "INR";

    $("pricingValidityDays").value =
      validityDays;

    $("pricingMaxDevices").value =
      maxDevices;

    $("pricingStatus").value =
      String(plan.status || "ACTIVE").toUpperCase();

    $("pricingBuyEnabled").value =
      Number(buyEnabled) === 1 ||
      buyEnabled === true
        ? "1"
        : "0";

    $("pricingCurrentPrice").textContent =
      formatMoneyMinor(
        priceMinor,
        plan.currency || "INR"
      );

    $("pricingCurrentValidity").textContent =
      `${validityDays} days`;

    $("pricingCurrentDevices").textContent =
      `${maxDevices} device${maxDevices === 1 ? "" : "s"}`;

    message.textContent =
      "Current production plan loaded.";

    await loadFestivalOffer(priceMinor, plan.currency || "INR");

  } catch (error) {
    message.textContent =
      `Unable to load plan: ${error.message}`;
  }
}


function toLocalDateTimeValue(value) {
  if (!value) return "";
  const d=new Date(value); if(Number.isNaN(d.getTime())) return "";
  const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,16);
}
function offerInputIso(id){const v=$(id)?.value;return v?new Date(v).toISOString():null;}
function updateOfferPreview(){
  const base=Math.round(Number($("pricingPrice")?.value||0)*100),type=$("offerDiscountType")?.value,percent=Number($("offerDiscountPercent")?.value||0),flat=Math.round(Number($("offerDiscountFlat")?.value||0)*100);
  let final=base;if(type==="PERCENT")final=Math.round(base*(100-Math.min(100,Math.max(0,percent)))/100);else final=base-flat;final=Math.max(0,final);
  if($("offerRegularPrice"))$("offerRegularPrice").textContent=formatMoneyMinor(base,$("pricingCurrency")?.value||"INR");
  if($("offerFinalPrice"))$("offerFinalPrice").textContent=formatMoneyMinor(final,$("pricingCurrency")?.value||"INR");
  if($("offerSaving"))$("offerSaving").textContent=formatMoneyMinor(Math.max(0,base-final),$("pricingCurrency")?.value||"INR");
}
function toggleOfferDiscountFields(){const pct=$("offerDiscountType")?.value==="PERCENT";$("offerPercentWrap")?.classList.toggle("hidden",!pct);$("offerFlatWrap")?.classList.toggle("hidden",pct);updateOfferPreview();}
async function loadFestivalOffer(priceMinor,currency){
  const msg=$("offerStatusMessage");if(!msg)return;
  try{const r=await api("/admin/offers");state.offers=r.offers||[];const o=state.offers.find(x=>String(x.plan_code||"").toUpperCase()==="STANDARD");
    if(o){$("offerEnabled").value=Number(o.enabled)===1?"1":"0";$("offerName").value=o.offer_name||"";$("offerBadge").value=o.badge_text||"";$("offerDiscountType").value=o.discount_type||"PERCENT";$("offerDiscountPercent").value=(Number(o.discount_percent_bps)||0)/100;$("offerDiscountFlat").value=((Number(o.discount_flat_minor)||0)/100).toFixed(0);$("offerStartsAt").value=toLocalDateTimeValue(o.starts_at);$("offerEndsAt").value=toLocalDateTimeValue(o.ends_at);msg.textContent="Saved offer loaded.";}else{msg.textContent="No festival offer configured yet.";}
    $("offerRegularPrice").textContent=formatMoneyMinor(priceMinor,currency);$("offerLiveBadge").textContent=$("offerEnabled").value==="1"?"Offer ON":"Offer OFF";toggleOfferDiscountFields();
  }catch(e){msg.textContent=`Unable to load offer: ${e.message}`;}
}
async function saveFestivalOffer(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const btn = $("offerSaveButton");
  const msg = $("offerStatusMessage");
  const enabled = $("offerEnabled").value === "1";
  const type = $("offerDiscountType").value;

  const payload = {
    planCode: "STANDARD",
    enabled,
    offerName: $("offerName").value.trim(),
    badgeText: $("offerBadge").value.trim(),
    discountType: type,
    discountPercent: Number($("offerDiscountPercent").value),
    discountFlatMinor:
      Math.round(Number($("offerDiscountFlat").value) * 100),
    startsAt: offerInputIso("offerStartsAt"),
    endsAt: offerInputIso("offerEndsAt")
  };

  if (!payload.offerName) {
    msg.textContent = "ERROR: Offer name is required.";
    return;
  }

  if (
    payload.startsAt &&
    payload.endsAt &&
    Date.parse(payload.endsAt) <= Date.parse(payload.startsAt)
  ) {
    msg.textContent =
      "ERROR: Offer end must be after start.";
    return;
  }

  btn.disabled = true;
  btn.textContent = enabled
    ? "Publishing..."
    : "Turning OFF...";

  msg.textContent = enabled
    ? "Publishing festival offer..."
    : "Turning festival offer OFF...";

  try {
    await api("/admin/offers", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    // IMPORTANT:
    // Read saved state back from server.
    const verify = await api("/admin/offers");

    const saved =
      verify?.offer ||
      verify?.data?.offer ||
      verify?.offers?.find?.(
        x => String(x.plan_code || x.planCode).toUpperCase() === "STANDARD"
      ) ||
      verify?.data?.find?.(
        x => String(x.plan_code || x.planCode).toUpperCase() === "STANDARD"
      ) ||
      null;

    if (!saved) {
      throw new Error("SERVER_VERIFY_NO_OFFER");
    }

    const serverEnabled =
      saved.enabled === true ||
      saved.enabled === 1 ||
      saved.enabled === "1";

    if (serverEnabled !== enabled) {
      throw new Error(
        `SERVER_VERIFY_MISMATCH_EXPECTED_${enabled ? "ON" : "OFF"}`
      );
    }

    if (enabled) {
      msg.textContent =
        "SUCCESS: Festival offer published successfully.";
      setMessage(
        "Festival offer published successfully.",
        "success"
      );
    } else {
      msg.textContent =
        "SUCCESS: Festival offer turned OFF. Regular price restored.";
      setMessage(
        "Festival offer turned OFF successfully.",
        "success"
      );
    }

    await loadPricingManager();

  } catch (e) {
    console.error("Festival offer save failed", e);

    msg.textContent =
      `ERROR: Festival offer was NOT saved - ${e.message}`;

    setMessage(
      `Festival offer save failed: ${e.message}`,
      "error"
    );

  } finally {
    btn.disabled = false;
    btn.textContent = "Save & Publish Offer";
  }
}
function bindFestivalOfferManager() {
  const form = $("offerForm");
  const button = $("offerSaveButton");

  if (!form || !button) {
    return;
  }

  if (form.dataset.bound === "true") {
    return;
  }

  form.dataset.bound = "true";

  // Prevent browser-native form submit.
  form.addEventListener("submit", event => {
    event.preventDefault();
  });

  // Direct explicit save action.
  button.addEventListener("click", event => {
    event.preventDefault();
    saveFestivalOffer(event);
  });

  $("offerDiscountType")?.addEventListener(
    "change",
    toggleOfferDiscountFields
  );

  [
    "pricingPrice",
    "offerDiscountPercent",
    "offerDiscountFlat"
  ].forEach(id =>
    $(id)?.addEventListener(
      "input",
      updateOfferPreview
    )
  );

  $("offerEnabled")?.addEventListener(
    "change",
    () => {
      $("offerLiveBadge").textContent =
        $("offerEnabled").value === "1"
          ? "Offer ON"
          : "Offer OFF";
    }
  );
}
async function savePricingPlan(event) {
  event.preventDefault();

  const button = $("pricingSaveButton");
  const message = $("pricingStatusMessage");

  const price =
    Number($("pricingPrice").value);

  const validityDays =
    Number($("pricingValidityDays").value);

  const maxDevices =
    Number($("pricingMaxDevices").value);

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    message.textContent =
      "Enter a valid price.";
    return;
  }

  if (
    !Number.isInteger(validityDays) ||
    validityDays < 1
  ) {
    message.textContent =
      "Enter valid license validity days.";
    return;
  }

  if (
    !Number.isInteger(maxDevices) ||
    maxDevices < 1
  ) {
    message.textContent =
      "Enter a valid device limit.";
    return;
  }

  const payload = {
    planCode:
      $("pricingPlanCode").value.trim() ||
      "STANDARD",

    displayName:
      $("pricingDisplayName").value.trim() ||
      "Standard",

    priceMinor:
      Math.round(price * 100),

    currency:
      $("pricingCurrency").value || "INR",

    validityDays,

    maxDevices,

    status:
      $("pricingStatus").value,

    buyEnabled:
      $("pricingBuyEnabled").value === "1"
  };

  button.disabled = true;
  button.textContent = "Saving...";
  message.textContent = "Saving plan...";

  try {
    const result =
      await api(
        "/admin/plans",
        {
          method: "POST",
          body: JSON.stringify(payload)
        }
      );

    if (
      result.success === false ||
      result.status === "ERROR"
    ) {
      throw new Error(
        result.reasonCode ||
        "PLAN_SAVE_FAILED"
      );
    }

    message.textContent =
      "Plan saved successfully.";

    setMessage(
      "STANDARD plan saved successfully.",
      "success"
    );

    await loadPricingManager();

  } catch (error) {
    message.textContent =
      `Plan save failed: ${error.message}`;

    setMessage(
      `Plan save failed: ${error.message}`,
      "error"
    );

  } finally {
    button.disabled = false;
    button.textContent = "Save Plan";
  }
}


function bindPricingManager() {
  // Festival Offer has its own form and must always be bound independently.
  bindFestivalOfferManager();

  const form = $("pricingForm");

  if (
    !form ||
    form.dataset.bound === "true"
  ) {
    return;
  }

  form.dataset.bound = "true";

  form.addEventListener(
    "submit",
    savePricingPlan
  );

  $("pricingRefreshButton")
    ?.addEventListener(
      "click",
      loadPricingManager
    );
}

function switchPage(page) {
  state.currentPage = page;

  document
    .querySelectorAll(".nav-item")
    .forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.page === page
      );
    });

  document
    .querySelectorAll(".page")
    .forEach((section) => {
      section.classList.toggle(
        "active",
        section.id === `page-${page}`
      );
    });

  const titles = {
    dashboard: [
      "Dashboard",
      "Overview of your business, customers and licenses"
    ],
    customers: [
      "Customers",
      "Customer accounts and status"
    ],
    licenses: [
      "Licenses",
      "Plans, expiry and renewals"
    ],
    devices: [
      "Devices",
      "Device binding management"
    ],
    reports: [
      "Dashboard & Reports",
      "License health, renewals and revenue"
    ],
    pricing: [
      "Products & Pricing",
      "Manage plan price, validity and website availability"
    ],
    payments: ["Payments", "Verified payment transactions and revenue"],
    orders: ["Orders", "Customer purchase orders and fulfillment"],
    renewals: ["Renewals", "Customer renewal history and revenue"],
    downloads: [
      "Release Center",
      "Published installer and download activity"
    ],
    notifications: [
      "Notifications",
      "Customer communication and delivery history"
    ],
    settings: [
      "Business Settings",
      "Central platform configuration"
    ]
  };

  const [title, subtitle] =
    titles[page] || titles.dashboard;

  $("pageTitle").textContent = title;
  $("pageSubtitle").textContent = subtitle;


  if (page === "pricing") {
    bindPricingManager();
    loadPricingManager();
  }
  $("newCustomerButton").style.display =
    page === "customers" ||
    page === "dashboard"
      ? ""
      : "none";
}

function openNewCustomer() {
  $("customerModalTitle").textContent =
    "New Customer";

  $("editCustomerId").value = "";
  $("customerFullName").value = "";
  $("customerEmail").value = "";
  $("customerMobile").value = "";
  $("customerCompany").value = "";
  $("customerCountry").value = "IN";
  $("customerFormStatus").value = "ACTIVE";
  $("customerNotes").value = "";

  openModal("customerModal");
}

function k7Money(minor, currency = "INR") {
  const value = Number(minor || 0) / 100;
  try { return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency || "INR" }).format(value); }
  catch { return `${currency || "INR"} ${value.toFixed(2)}`; }
}

function k7Rows(items, renderer, emptyText) {
  return Array.isArray(items) && items.length
    ? items.map(renderer).join("")
    : `<tr><td colspan="8" class="empty">${escapeHtml(emptyText)}</td></tr>`;
}

async function openCustomer360(customerId) {


  customerId = String(customerId || "").trim();
  console.log("[K7 Customer360] customerId =", customerId);
  setMessage("");
  const body = $("customer360Body");
  body.innerHTML = `<div class="customer360-loading">Loading Customer 360...</div>`;
  openModal("customer360Modal");
  try {
    const result = await api(`/admin/customers/${encodeURIComponent(customerId)}`);
    const c = result.customer || {};
    const lifecycle = result.lifecycle || { status: "ACTIVE" };
    const lifecycleStatus =
      String(lifecycle.status || "ACTIVE")
        .trim()
        .toUpperCase();

    const deactivateButton =
      document.getElementById(
        "customer360DeactivateCustomer"
      );

    const archiveButton =
      document.getElementById(
        "customer360ArchiveCustomer"
      );

    const restoreButton =
      document.getElementById(
        "customer360RestoreCustomer"
      );

    const issueLicenseButton =
      document.getElementById(
        "customer360IssueLicense"
      );

    const deleteButton =
      document.getElementById(
        "customer360DeleteCustomer"
      );

    if (issueLicenseButton) {
      issueLicenseButton.classList.add("hidden");
      issueLicenseButton.dataset.customerId =
        String(customerId || "");

      if (
        lifecycleStatus === "ACTIVE" &&
        String(c.status || "")
          .trim()
          .toUpperCase() === "ACTIVE"
      ) {
        issueLicenseButton.classList.remove("hidden");
      }
    }

    if (deleteButton) {
      deleteButton.dataset.deleteCustomer =
        customerId;
    }

    for (const button of [
      deactivateButton,
      archiveButton,
      restoreButton
    ]) {
      if (!button) continue;

      button.classList.add("hidden");
      button.dataset.customerId =
        String(customerId || "");
    }

    if (
      lifecycleStatus === "ACTIVE" &&
      deactivateButton
    ) {
      deactivateButton.classList.remove("hidden");
    }

    if (lifecycleStatus === "DEACTIVATED") {
      if (archiveButton) {
        archiveButton.classList.remove("hidden");
      }

      if (restoreButton) {
        restoreButton.textContent = "Reactivate Customer";
        restoreButton.classList.remove("hidden");
      }
    }

    if (
      lifecycleStatus === "ARCHIVED" &&
      restoreButton
    ) {
      
      restoreButton.textContent = "Restore Customer";
      restoreButton.classList.remove("hidden");
    }

    const licenses = result.licenses || [], devices = result.devices || [], orders = result.orders || [];
    const payments = result.payments || [], renewals = result.renewals || [], activity = result.activity || [];
    $("customer360Title").textContent = c.full_name ? `${c.full_name} - Customer 360` : "Customer 360";
    body.innerHTML = `
      <div class="customer360-summary">
        <div><span>Customer ID</span><strong>${escapeHtml(c.customer_id || "-")}</strong></div>
        <div><span>Status</span><strong>${statusBadge(c.status || "-")}</strong></div>
        <div><span>Lifecycle</span><strong>${statusBadge(lifecycleStatus)}</strong></div>
        <div><span>Licenses</span><strong>${licenses.length}</strong></div><div><span>Devices</span><strong>${devices.length}</strong></div>
        <div><span>Orders</span><strong>${orders.length}</strong></div><div><span>Payments</span><strong>${payments.length}</strong></div>
      </div>
      <section class="customer360-section"><h3>Customer Profile</h3><div class="customer360-profile">
        <div><span>Name</span><strong>${escapeHtml(c.full_name || "-")}</strong></div><div><span>Email</span><strong>${escapeHtml(c.email || "-")}</strong></div>
        <div><span>Mobile</span><strong>${escapeHtml(c.mobile || "-")}</strong></div><div><span>Company</span><strong>${escapeHtml(c.company_name || "-")}</strong></div>
        <div><span>Region</span><strong>${escapeHtml(c.country || "-")}</strong></div><div><span>Created</span><strong>${escapeHtml(c.created_at || "-")}</strong></div>
      </div></section>
      <section class="customer360-section"><h3>Licenses</h3><div class="table-wrap"><table><thead><tr><th>License</th><th>Plan</th><th>Status</th><th>Device Limit</th><th>Activation</th><th>Expiry</th></tr></thead><tbody>
        ${k7Rows(licenses,l=>`<tr><td>${escapeHtml(l.license_id||"-")}</td><td>${escapeHtml(l.plan_code||"-")}</td><td>${statusBadge(l.status||"-")}</td><td>${escapeHtml(l.max_devices??"-")}</td><td>${escapeHtml(l.activation_date||"-")}</td><td>${escapeHtml(l.expiry_date||"-")}</td></tr>`,"No licenses found.")}
      </tbody></table></div></section>
      <section class="customer360-section"><h3>Devices</h3><div class="table-wrap"><table><thead><tr><th>Device</th><th>Name</th><th>Platform</th><th>Version</th><th>Status</th><th>Last Seen</th></tr></thead><tbody>
        ${k7Rows(devices,d=>`<tr><td>${escapeHtml(d.device_id||"-")}</td><td>${escapeHtml(d.device_name||"-")}</td><td>${escapeHtml(d.platform||"-")}</td><td>${escapeHtml(d.app_version||"-")}</td><td>${statusBadge(d.status||"-")}</td><td>${escapeHtml(d.last_seen_at||"-")}</td></tr>`,"No devices found.")}
      </tbody></table></div></section>
      <section class="customer360-section"><h3>Orders</h3><div class="table-wrap"><table><thead><tr><th>Order</th><th>Plan</th><th>Amount</th><th>Status</th><th>Payment Ref</th><th>Date</th></tr></thead><tbody>
        ${k7Rows(orders,o=>`<tr><td>${escapeHtml(o.order_id||"-")}</td><td>${escapeHtml(o.plan_code||"-")}</td><td>${escapeHtml(k7Money(o.amount_minor,o.currency))}</td><td>${statusBadge(o.status||"-")}</td><td>${escapeHtml(o.payment_reference||"-")}</td><td>${escapeHtml(o.created_at||"-")}</td></tr>`,"No orders found.")}
      </tbody></table></div></section>
      <section class="customer360-section"><h3>Payments</h3><div class="table-wrap"><table><thead><tr><th>Event</th><th>Order</th><th>Payment Reference</th><th>Status</th><th>Date</th></tr></thead><tbody>
        ${k7Rows(payments,p=>`<tr><td>${escapeHtml(p.event_id||"-")}</td><td>${escapeHtml(p.order_id||"-")}</td><td>${escapeHtml(p.payment_reference||"-")}</td><td>${statusBadge(p.status||"-")}</td><td>${escapeHtml(p.created_at||"-")}</td></tr>`,"No payment events found.")}
      </tbody></table></div></section>
      <section class="customer360-section"><h3>Renewal / Expiry</h3><div class="table-wrap"><table><thead><tr><th>Renewal</th><th>License</th><th>Old Expiry</th><th>New Expiry</th><th>Days</th><th>Status</th></tr></thead><tbody>
        ${k7Rows(renewals,r=>`<tr><td>${escapeHtml(r.renewal_id||"-")}</td><td>${escapeHtml(r.license_id||"-")}</td><td>${escapeHtml(r.old_expiry_date||"-")}</td><td>${escapeHtml(r.new_expiry_date||"-")}</td><td>${escapeHtml(r.renewal_days??"-")}</td><td>${statusBadge(r.status||"-")}</td></tr>`,"No renewals found.")}
      </tbody></table></div></section>
      <section class="customer360-section"><h3>Activity Timeline</h3><div class="customer360-timeline">
        ${activity.length ? activity.map(a=>`<div class="customer360-event"><span>${escapeHtml(a.at||"-")}</span><div><small>${escapeHtml(a.type||"ACTIVITY")}</small><strong>${escapeHtml(a.label||"-")}</strong></div></div>`).join("") : `<div class="empty">No activity found.</div>`}
      </div></section>`;
  } catch (error) {
    body.innerHTML = `<div class="empty">Unable to load Customer 360: ${escapeHtml(error.message || "Unknown error")} | Customer ID: ${escapeHtml(customerId)} ${escapeHtml(customerId)}</div>`;
  }
}

/* K7_ADMIN_ISSUE_LICENSE_UI_V1 */

function openIssueLicense(customerId) {
  const safeCustomerId =
    String(customerId || "").trim();

  if (!safeCustomerId) {
    setMessage(
      "Unable to issue license: Customer ID is missing.",
      "error"
    );
    return;
  }

  $("issueLicenseCustomerId").value =
    safeCustomerId;

  $("issueLicensePlan").value =
    "STANDARD";

  $("issueLicenseValidityDays").value =
    "365";

  $("issueLicenseMaxDevices").value =
    "1";

  $("issueLicenseMessage").textContent =
    "";

  openModal("issueLicenseModal");
}


async function issueCustomerLicense() {
  const customerId =
    String(
      $("issueLicenseCustomerId").value || ""
    ).trim();

  const planCode =
    String(
      $("issueLicensePlan").value || "STANDARD"
    )
      .trim()
      .toUpperCase();

  const validityDays =
    Number(
      $("issueLicenseValidityDays").value
    );

  const maxDevices =
    Number(
      $("issueLicenseMaxDevices").value
    );

  const message =
    $("issueLicenseMessage");

  const button =
    $("issueLicenseConfirm");

  if (!customerId) {
    message.textContent =
      "Customer ID is required.";
    return;
  }

  if (
    !Number.isInteger(validityDays) ||
    validityDays < 1 ||
    validityDays > 3650
  ) {
    message.textContent =
      "Enter a valid license duration.";
    return;
  }

  if (
    !Number.isInteger(maxDevices) ||
    maxDevices < 1 ||
    maxDevices > 100
  ) {
    message.textContent =
      "Enter a valid device limit.";
    return;
  }

  button.disabled = true;
  message.textContent =
    "Issuing license...";

  try {
    const result =
      await api(
        "/admin/customers/" +
        encodeURIComponent(customerId) +
        "/issue-license",
        {
          method: "POST",
          body: JSON.stringify({
            planCode,
            validityDays,
            maxDevices
          })
        }
      );

    closeModal("issueLicenseModal");

    await loadAll();
    await openCustomer360(customerId);

    setMessage(
      "License issued successfully. " +
      (result.keyMasked
        ? `Key: ${result.keyMasked}`
        : "")
    );

  } catch (error) {
    message.textContent =
      error && error.message
        ? error.message
        : "Unable to issue license.";
  } finally {
    button.disabled = false;
  }
}

async function executeCustomerLifecycleAction(
  customerId,
  action
) {
  const safeCustomerId =
    String(customerId || "").trim();

  const safeAction =
    String(action || "")
      .trim()
      .toLowerCase();

  if (
    !safeCustomerId ||
    !["deactivate", "archive", "restore"]
      .includes(safeAction)
  ) {
    return;
  }

  const labels = {
    deactivate: "Deactivate Customer",
    archive: "Archive Customer",
    restore: "Restore Customer"
  };

  const confirmed =
    window.confirm(
      labels[safeAction] +
      "?\n\nLicenses, devices, orders and payments will not be deleted."
    );

  if (!confirmed) {
    return;
  }

  try {
    await api(
      "/admin/customers/" +
      encodeURIComponent(safeCustomerId) +
      "/" +
      safeAction,
      {
        method: "POST",
        body: JSON.stringify({
          reasonCode:
            "ADMIN_CUSTOMER_" +
            safeAction.toUpperCase()
        })
      }
    );

    if (safeAction === "restore") {
      state.customerListMode = "normal";
      state.archivedCustomers = [];

      const archivedButton =
        $("archivedCustomersButton");

      if (archivedButton) {
        archivedButton.textContent =
          "Archived Customers";
      }

      $("customerSearch").value = "";
      $("customerStatusFilter").value = "";
    }

    await loadAll();
    await openCustomer360(safeCustomerId);

    setMessage(
      labels[safeAction] +
      " completed successfully."
    );
  } catch (error) {
    setMessage(
      error && error.message
        ? error.message
        : "Customer lifecycle action failed.",
      "error"
    );
  }
}

async function openEditCustomer(customerId) {
  setMessage("");

  try {
    const result =
      await api(
        `/admin/customers/${encodeURIComponent(customerId)}`
      );

    const c =
      result.customer || result;

    $("customerModalTitle").textContent =
      "Edit Customer";

    $("editCustomerId").value =
      customerId;

    $("customerFullName").value =
      c.full_name || "";

    $("customerEmail").value =
      c.email || "";

    $("customerMobile").value =
      c.mobile || "";

    $("customerCompany").value =
      c.company_name || "";

    $("customerCountry").value =
      c.country || "IN";

    $("customerFormStatus").value =
      c.status ||
      c.customer_status ||
      "ACTIVE";

    $("customerNotes").value =
      c.notes || "";

    openModal("customerModal");

  } catch (error) {
    setMessage(
      `Unable to load customer: ${error.message}`,
      "error"
    );
  }
}

async function saveCustomer(event) {
  event.preventDefault();

  const customerId =
    $("editCustomerId").value.trim();

  const body = {
    fullName:
      $("customerFullName").value.trim(),

    email:
      $("customerEmail").value.trim(),

    mobile:
      $("customerMobile").value.trim(),

    companyName:
      $("customerCompany").value.trim(),

    country:
      $("customerCountry").value
        .trim()
        .toUpperCase(),

    status:
      $("customerFormStatus").value,

    notes:
      $("customerNotes").value.trim()
  };

  try {
    if (customerId) {
      await api(
        `/admin/customers/${encodeURIComponent(customerId)}/update`,
        {
          method: "POST",
          body: JSON.stringify(body)
        }
      );
    } else {
      await api(
        "/admin/customers",
        {
          method: "POST",
          body: JSON.stringify(body)
        }
      );
    }

    closeModal("customerModal");

    setMessage(
      customerId
        ? "Customer updated successfully."
        : "Customer created successfully.",
      "success"
    );

    await loadAll();

  } catch (error) {
    setMessage(
      `Customer save failed: ${error.message}`,
      "error"
    );
  }
}

function openRenew(licenseId) {
  $("renewLicenseId").value =
    licenseId;

  $("renewLicenseLabel").textContent =
    licenseId;

  $("renewalDays").value = "365";
  $("renewAmount").value = "";
  $("renewPaymentReference").value = "";
  $("renewNotes").value = "";

  openModal("renewModal");
}

async function renewLicense(event) {
  event.preventDefault();

  const licenseId =
    $("renewLicenseId").value;

  const renewalDays =
    Number($("renewalDays").value);

  const amountRupees =
    $("renewAmount").value.trim();

  const body = {
    renewalDays,
    currency: "INR",
    paymentReference:
      $("renewPaymentReference").value.trim(),

    notes:
      $("renewNotes").value.trim()
  };

  if (amountRupees !== "") {
    body.amountMinor =
      Math.round(
        Number(amountRupees) * 100
      );
  }

  try {
    await api(
      `/admin/licenses/${encodeURIComponent(licenseId)}/renew`,
      {
        method: "POST",
        body: JSON.stringify(body)
      }
    );

    closeModal("renewModal");

    setMessage(
      `License ${licenseId} renewed successfully.`,
      "success"
    );

    await loadAll();

  } catch (error) {
    setMessage(
      `License renewal failed: ${error.message}`,
      "error"
    );
  }
}

function requestDeviceReset(deviceId) {
  state.resetDeviceId = deviceId;

  $("confirmText").textContent =
    `Reset device ${deviceId}? ` +
    "The current device binding will be released.";

  openModal("confirmModal");
}

async function confirmDeviceReset() {
  const deviceId =
    state.resetDeviceId;

  if (!deviceId) return;

  $("confirmReset").disabled = true;

  try {
    await api(
      `/admin/devices/${encodeURIComponent(deviceId)}/reset`,
      {
        method: "POST",
        body: JSON.stringify({})
      }
    );

    closeModal("confirmModal");

    state.resetDeviceId = null;

    setMessage(
      `Device ${deviceId} reset successfully.`,
      "success"
    );

    await loadAll();

  } catch (error) {
    setMessage(
      `Device reset failed: ${error.message}`,
      "error"
    );
  } finally {
    $("confirmReset").disabled = false;
  }
}


function renderMasterDashboard() {
  const customers = Array.isArray(state.customers) ? state.customers : [];
  const licenses = Array.isArray(state.licenses) ? state.licenses : [];
  const devices = Array.isArray(state.devices) ? state.devices : [];

  const now = new Date();
  const soon = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

  const activeLicenses = licenses.filter((item) => {
    const status = String(item.status || "").toUpperCase();
    const expiry = item.expires_at || item.expiry_date || item.expires_on;
    const expiryDate = expiry ? new Date(expiry) : null;

    return status === "ACTIVE" &&
      (!expiryDate || Number.isNaN(expiryDate.getTime()) || expiryDate >= now);
  });

  const expiredLicenses = licenses.filter((item) => {
    const status = String(item.status || "").toUpperCase();
    const expiry = item.expires_at || item.expiry_date || item.expires_on;
    const expiryDate = expiry ? new Date(expiry) : null;

    return status === "EXPIRED" ||
      (
        expiryDate &&
        !Number.isNaN(expiryDate.getTime()) &&
        expiryDate < now
      );
  });

  const expiringLicenses = activeLicenses.filter((item) => {
    const expiry = item.expires_at || item.expiry_date || item.expires_on;
    if (!expiry) return false;

    const date = new Date(expiry);

    return !Number.isNaN(date.getTime()) &&
      date >= now &&
      date <= soon;
  });

  const blockedLicenses = licenses.filter((item) => {
    const status = String(item.status || "").toUpperCase();
    return status === "BLOCKED" || status === "REVOKED";
  });

  const activeDevices = devices.filter(
    (item) => String(item.status || "").toUpperCase() === "ACTIVE"
  );

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
  };

  setText("statCustomers", customers.length);
  setText("statActiveLicenses", activeLicenses.length);
  setText("statActiveDevices", activeDevices.length);
  const orders = Array.isArray(state.orders) ? state.orders : [];
  const paidOrders = orders.filter(isVerifiedPaidOrder);
  const revenueMinor = paidOrders.reduce((sum,o)=>sum+(Number(o.amount_minor)||0),0);
  setText("statRevenue", formatMoneyMinor(revenueMinor,"INR"));
  setText("statExpired", expiredLicenses.length);
  setText("statExpiring", expiringLicenses.length);
  setText("statBlocked", blockedLicenses.length);

  const utilization = licenses.length
    ? Math.round((activeLicenses.length / licenses.length) * 100)
    : 0;

  setText("dashboardUtilization", utilization + "%");
  setText("dashboardLicenseTotal", licenses.length);

  const activity = document.getElementById("dashboardActivityChart");

  if (activity) {
    const days = Number(document.getElementById("dashboardPeriod")?.value || 30);
    const cutoff = new Date(Date.now() - days*86400000);
    const periodOrders = paidOrders.filter(o => !o.created_at || new Date(o.created_at) >= cutoff);
    const periodRevenue = periodOrders.reduce((sum,o)=>sum+(Number(o.amount_minor)||0),0)/100;
    const periodActivations = devices.filter(d => !d.created_at || new Date(d.created_at) >= cutoff).length;
    const rows = [
      ["Sales (INR)", Math.round(periodRevenue)],
      ["Activations", periodActivations]
    ];

    const max = Math.max(1, ...rows.map((row) => row[1]));

    activity.innerHTML = rows.map(([label, value]) => {
      const width = Math.max(4, Math.round((value / max) * 100));

      return `
        <div class="dashboard-bar-row">
          <div class="dashboard-bar-meta">
            <span>${escapeHtml(label)}</span>
            <strong>${value}</strong>
          </div>
          <div class="dashboard-bar-track">
            <div
              class="dashboard-bar-value"
              style="width:${width}%"
            ></div>
          </div>
        </div>
      `;
    }).join("");
  }

  // Dashboard license-status categories must be mutually exclusive.
  // "Active Licenses" KPI still includes licenses expiring soon, while the donut
  // separates those licenses into the Expiring segment.
  const expiringSet = new Set(expiringLicenses);
  const expiredSet = new Set(expiredLicenses);
  const activeStatusLicenses = activeLicenses.filter((item) => !expiringSet.has(item));
  const activeStatusSet = new Set(activeStatusLicenses);
  const otherLicenses = licenses.filter((item) =>
    !activeStatusSet.has(item) &&
    !expiringSet.has(item) &&
    !expiredSet.has(item)
  );

  const total = Math.max(licenses.length, 1);

  const activePct =
    Math.round((activeStatusLicenses.length / total) * 100);

  const expiringPct =
    Math.round((expiringLicenses.length / total) * 100);

  const expiredPct =
    Math.round((expiredLicenses.length / total) * 100);

  const used =
    activePct + expiringPct + expiredPct;

  const otherPct = Math.max(0, 100 - used);

  const donut =
    document.getElementById("dashboardLicenseDonut");

  if (donut) {
    const a = activePct;
    const b = Math.min(100, a + expiringPct);
    const c = Math.min(100, b + expiredPct);

    donut.style.background =
      `conic-gradient(
        #22c55e 0 ${a}%,
        #f59e0b ${a}% ${b}%,
        #ef4444 ${b}% ${c}%,
        #94a3b8 ${c}% 100%
      )`;
  }

  const legend =
    document.getElementById("dashboardLicenseLegend");

  if (legend) {
    legend.innerHTML = `
      <div><i class="legend-dot active-dot"></i><span>Active</span><strong>${activeStatusLicenses.length}</strong></div>
      <div><i class="legend-dot warning-dot"></i><span>Expiring</span><strong>${expiringLicenses.length}</strong></div>
      <div><i class="legend-dot expired-dot"></i><span>Expired</span><strong>${expiredLicenses.length}</strong></div>
      <div><i class="legend-dot other-dot"></i><span>Other</span><strong>${otherLicenses.length}</strong></div>
    `;
  }


  const renewalBody=document.getElementById("dashboardRenewalsBody");
  if(renewalBody){
    const rows=(Array.isArray(state.renewals)?state.renewals:[]).slice(0,50);
    renewalBody.innerHTML=rows.length?rows.map(r=>`<tr><td>${escapeHtml(r.customer_name||r.customer_id||"-")}</td><td>${escapeHtml(r.license_id||"-")}</td><td>${escapeHtml(r.renewal_days??"-")}</td><td>${escapeHtml(r.old_expiry_date||"-")}</td><td>${escapeHtml(r.new_expiry_date||"-")}</td><td>${formatMoneyMinor(r.amount_minor||0,r.currency||"INR")}</td><td>${escapeHtml(r.payment_reference||"-")}</td><td>${escapeHtml(r.created_at||"-")}</td></tr>`).join(""):`<tr><td colspan="8">No renewals found.</td></tr>`;
  }

  const badge =
    document.getElementById("adminNotificationBadge");

  if (badge) {
    const attention =
      expiringLicenses.length +
      expiredLicenses.length +
      blockedLicenses.length;

    badge.textContent = String(attention);
    badge.classList.toggle("hidden", attention === 0);
  }
}

function bindMasterDashboard() {
  const period=document.getElementById("dashboardPeriod");
  if(period && !period.dataset.bound){period.dataset.bound="1";period.addEventListener("change",renderMasterDashboard);}
  const search = document.getElementById("adminGlobalSearch");

  if (search && !search.dataset.bound) {
    search.dataset.bound = "1";

    search.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;

      const value = search.value.trim();
      if (!value) return;

      switchPage("customers");

      const customerSearch =
        document.getElementById("customerSearch");

      if (customerSearch) {
        customerSearch.value = value;
        customerSearch.dispatchEvent(new Event("input"));
        customerSearch.focus();
      }
    });
  }

  document
    .querySelectorAll("[data-dashboard-nav]")
    .forEach((button) => {
      if (button.dataset.bound) return;

      button.dataset.bound = "1";

      button.addEventListener("click", () => {
        switchPage(button.dataset.dashboardNav);
      });
    });

  const addCustomer =
    document.getElementById("dashboardAddCustomer");

  if (addCustomer && !addCustomer.dataset.bound) {
    addCustomer.dataset.bound = "1";
    addCustomer.addEventListener("click", openNewCustomer);
  }

  const notifications =
    document.getElementById("adminNotificationButton");

  if (notifications && !notifications.dataset.bound) {
    notifications.dataset.bound = "1";

    notifications.addEventListener("click", () => {
      switchPage("notifications");
    });
  }
}

function bindEvents() {
  $("loginButton")
    .addEventListener("click", login);

  $("adminSecret")
    .addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Enter") {
          login();
        }
      }
    );

  $("logoutButton")
    .addEventListener("click", logout);

  $("refreshButton")
    .addEventListener(
      "click",
      loadAll
    );

  $("newCustomerButton")
    .addEventListener(
      "click",
      openNewCustomer
    );

  $("customerForm")
    .addEventListener(
      "submit",
      saveCustomer
    );

  $("renewForm")
    .addEventListener(
      "submit",
      renewLicense
    );

  $("confirmCancel")
    .addEventListener(
      "click",
      () => {
        state.resetDeviceId = null;
        closeModal("confirmModal");
      }
    );

  $("confirmReset")
    .addEventListener(
      "click",
      confirmDeviceReset
    );

  document
    .querySelectorAll(".nav-item")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () =>
          switchPage(
            button.dataset.page
          )
      );
    });

  document
    .querySelectorAll("[data-close]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () =>
          closeModal(
            button.dataset.close
          )
      );
    });

  $("customerSearch")
    .addEventListener(
      "input",
      renderCustomers
    );

  $("customerStatusFilter")
    .addEventListener(
      "change",
      renderCustomers
    );

  $("archivedCustomersButton")
    .addEventListener(
      "click",
      async () => {
        const button =
          $("archivedCustomersButton");

        if (state.customerListMode === "archived") {
          state.customerListMode = "normal";

          $("customerSearch").value = "";
          $("customerStatusFilter").value = "";

          button.textContent =
            "Archived Customers";

          renderCustomers();
          return;
        }

        try {
          button.disabled = true;

          await loadArchivedCustomers();

          state.customerListMode =
            "archived";

          $("customerSearch").value = "";
          $("customerStatusFilter").value = "";

          button.textContent =
            "Back to Customers";

          renderCustomers();
        } catch (error) {
          console.error(
            "Unable to load archived customers.",
            error
          );
        } finally {
          button.disabled = false;
        }
      }
    );
  $("licenseSearch")
    .addEventListener(
      "input",
      renderLicenses
    );

  $("licenseStatusFilter")
    .addEventListener(
      "change",
      renderLicenses
    );

  $("deviceSearch")
    .addEventListener(
      "input",
      renderDevices
    );

  $("deviceStatusFilter")
    .addEventListener(
      "change",
      renderDevices
    );

  $("reportApplyButton")
    .addEventListener(
      "click",
      applyReportFilters
    );

  $("exportCustomersCsv")
    .addEventListener(
      "click",
      exportCustomersCsv
    );

  $("exportLicensesCsv")
    .addEventListener(
      "click",
      exportLicensesCsv
    );

  $("exportDevicesCsv")
    .addEventListener(
      "click",
      exportDevicesCsv
    );

  $("exportRenewalsCsv")
    .addEventListener(
      "click",
      exportRenewalsCsv
    );

  document.addEventListener(
    "click",
    (event) => {
      const customer360 = event.target.closest("[data-customer-360]");
      if (customer360) {
        let customerId =
          String(
            customer360.getAttribute("data-customer-360") || ""
          ).trim();

        if (!customerId) {
          const row = customer360.closest("tr");

          if (row) {
            const displayedId =
              row.querySelector(".table-sub")?.textContent || "";

            customerId = String(displayedId).trim();
          }
        }

        if (!customerId) {
          setMessage(
            "Unable to open Customer 360: Customer ID is missing.",
            "error"
          );
          return;
        }

        openCustomer360(customerId);
        return;
      }

      const edit =
        event.target.closest(
          "[data-edit-customer]"
        );

      if (edit) {
        openEditCustomer(
          edit.dataset.editCustomer
        );

        return;
      }

      const renew =
        event.target.closest(
          "[data-renew-license]"
        );

      if (renew) {
        openRenew(
          renew.dataset.renewLicense
        );

        return;
      }

      const reset =
        event.target.closest(
          "[data-reset-device]"
        );

      if (reset) {
        requestDeviceReset(
          reset.dataset.resetDevice
        );
      }
    }
  );
}

async function bootstrap() {
  bindPricingManager();
  bindEvents();
  await healthCheck();

  const existing =
    sessionStorage.getItem(
      SECRET_KEY
    );

  if (!existing) {
    showLogin();
    return;
  }

  try {
    await verifyAdminSecret(existing);

    showApp();
    await loadAll();

  } catch {
    sessionStorage.removeItem(
      SECRET_KEY
    );

    state.secret = "";

    showLogin();

    $("loginStatus").textContent =
      "Please sign in again.";
  }
}

bootstrap();




/* ============================================================
   K7_DATA_MANAGEMENT_UI_V1
   Admin Data Management UI
   ============================================================ */

const dataManagementState = {
  preview: null,
  action: null,
  customerId: null,
  confirmationRequired: ""
};


function dmElement(id) {
  return document.getElementById(id);
}


function dmNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}


function dmSetMessage(
  message,
  isError = false
) {
  const element =
    dmElement("dataManagementMessage");

  if (!element) {
    return;
  }

  element.textContent =
    String(message || "");

  element.style.color =
    isError ? "#b42318" : "";
}


function dmGetCount(
  counts,
  ...keys
) {
  if (!counts) {
    return 0;
  }

  for (const key of keys) {
    if (
      Object.prototype.hasOwnProperty.call(
        counts,
        key
      )
    ) {
      return dmNumber(counts[key]);
    }
  }

  return 0;
}


function renderDataManagementPreview(
  data
) {
  const counts =
    data &&
    data.counts
      ? data.counts
      : {};

  const customers =
    dmGetCount(
      counts,
      "customers"
    );

  const licenses =
    dmGetCount(
      counts,
      "licenses"
    );

  const devices =
    dmGetCount(
      counts,
      "devices"
    );

  const orders =
    dmGetCount(
      counts,
      "webOrders",
      "orders"
    );

  const payments =
    dmGetCount(
      counts,
      "paymentEvents",
      "payments"
    );

  const customerElement =
    dmElement("dmCustomers");

  const licenseElement =
    dmElement("dmLicensesDevices");

  const orderElement =
    dmElement("dmOrdersPayments");

  if (customerElement) {
    customerElement.textContent =
      customers + " customers";
  }

  if (licenseElement) {
    licenseElement.textContent =
      licenses +
      " licenses / " +
      devices +
      " devices";
  }

  if (orderElement) {
    orderElement.textContent =
      orders +
      " orders / " +
      payments +
      " payment events";
  }

  const resetButton =
    dmElement(
      "factoryResetBusinessDataButton"
    );

  if (resetButton) {
    resetButton.disabled = false;
  }
}


async function loadDataManagementPreview() {
  const button =
    dmElement(
      "dataManagementPreviewButton"
    );

  if (button) {
    button.disabled = true;
    button.textContent =
      "Loading Preview...";
  }

  dmSetMessage(
    "Loading protected business-data preview..."
  );

  try {
    const data =
      await api(
        "/admin/data-management/preview"
      );

    dataManagementState.preview =
      data;

    renderDataManagementPreview(
      data
    );

    dmSetMessage(
      "Preview loaded. No data has been deleted."
    );

  } catch (error) {
    dmSetMessage(
      error &&
      error.message
        ? error.message
        : "Unable to load Data Management preview.",
      true
    );

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent =
        "Preview Business Data";
    }
  }
}


function openDataManagementConfirmation(
  options = {}
) {
  const title =
    dmElement(
      "dataManagementConfirmTitle"
    );

  const text =
    dmElement(
      "dataManagementConfirmText"
    );

  const input =
    dmElement(
      "dataManagementConfirmationInput"
    );

  const required =
    dmElement(
      "dataManagementConfirmationRequired"
    );

  const confirmButton =
    dmElement(
      "dataManagementConfirmAction"
    );

  const message =
    dmElement(
      "dataManagementConfirmMessage"
    );

  dataManagementState.action =
    options.action || null;

  dataManagementState.customerId =
    options.customerId || null;

  dataManagementState.confirmationRequired =
    String(
      options.confirmationRequired || ""
    );

  if (title) {
    title.textContent =
      options.title ||
      "Confirm Action";
  }

  if (text) {
    text.textContent =
      options.message ||
      "Review this protected action.";
  }

  if (required) {
    required.textContent =
      "Required: " +
      dataManagementState
        .confirmationRequired;
  }

  if (input) {
    input.value = "";
  }

  if (message) {
    message.textContent = "";
  }

  if (confirmButton) {
    confirmButton.disabled = true;
    confirmButton.textContent =
      options.buttonText ||
      "Confirm";
  }

  openModal(
    "dataManagementConfirmModal"
  );

  if (input) {
    input.focus();
  }
}


async function openFactoryResetConfirmation() {
  if (!dataManagementState.preview) {
    await loadDataManagementPreview();

    if (!dataManagementState.preview) {
      return;
    }
  }

  openDataManagementConfirmation({
    action:
      "factory-reset",

    title:
      "Factory Reset Business Data",

    message:
      "This removes customer and business transactional data. Audit history, products, pricing, releases and system configuration remain preserved.",

    confirmationRequired:
      "RESET BUSINESS DATA",

    buttonText:
      "Factory Reset"
  });
}


async function openCustomerDeleteConfirmation(
  customerId
) {
  const safeCustomerId =
    String(customerId || "").trim();

  if (!safeCustomerId) {
    return;
  }

  try {
    const preview =
      await api(
        "/admin/customers/" +
        encodeURIComponent(
          safeCustomerId
        ) +
        "/delete-preview"
      );

    const counts =
      preview &&
      preview.counts
        ? preview.counts
        : {};

    const totalLinked =
      Object.values(counts)
        .reduce(
          (sum, value) =>
            sum + dmNumber(value),
          0
        );

    openDataManagementConfirmation({
      action:
        "customer-delete",

      customerId:
        safeCustomerId,

      title:
        "Delete Customer",

      message:
        "Customer " +
        safeCustomerId +
        " has " +
        totalLinked +
        " linked business records in this delete preview. Historical audit logs remain preserved.",

      confirmationRequired:
        preview.confirmationRequired ||
        (
          "DELETE CUSTOMER " +
          safeCustomerId
        ),

      buttonText:
        "Delete Customer"
    });

  } catch (error) {
    dmSetMessage(
      error &&
      error.message
        ? error.message
        : "Unable to load customer delete preview.",
      true
    );
  }
}


async function executeDataManagementAction() {
  const input =
    dmElement(
      "dataManagementConfirmationInput"
    );

  const button =
    dmElement(
      "dataManagementConfirmAction"
    );

  const message =
    dmElement(
      "dataManagementConfirmMessage"
    );

  const confirmation =
    input
      ? input.value.trim()
      : "";

  if (
    confirmation !==
    dataManagementState
      .confirmationRequired
  ) {
    if (message) {
      message.textContent =
        "Confirmation text does not match.";
    }

    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent =
      "Processing...";
  }

  try {
    if (
      dataManagementState.action ===
      "factory-reset"
    ) {
      await api(
        "/admin/data-management/factory-reset",
        {
          method: "POST",
          body: JSON.stringify({
            confirmation
          })
        }
      );

      closeModal(
        "dataManagementConfirmModal"
      );

      dataManagementState.preview =
        null;

      await loadAll();
      await loadDataManagementPreview();

      dmSetMessage(
        "Business data factory reset completed."
      );

      return;
    }

    if (
      dataManagementState.action ===
      "customer-delete"
    ) {
      const customerId =
        dataManagementState.customerId;

      await api(
        "/admin/customers/" +
        encodeURIComponent(
          customerId
        ) +
        "/delete",
        {
          method: "POST",
          body: JSON.stringify({
            confirmation
          })
        }
      );

      closeModal(
        "dataManagementConfirmModal"
      );

      if (
        dmElement("customer360Modal") &&
        !dmElement(
          "customer360Modal"
        ).classList.contains("hidden")
      ) {
        closeModal(
          "customer360Modal"
        );
      }

      await loadAll();

      dataManagementState.preview =
        null;

      dmSetMessage(
        "Customer deleted successfully."
      );

      return;
    }

    throw new Error(
      "Unknown Data Management action."
    );

  } catch (error) {
    if (message) {
      message.textContent =
        error &&
        error.message
          ? error.message
          : "Protected action failed.";
    }

    if (button) {
      button.disabled = false;
    }
  }
}


/*
 * Event wiring is delegated so it works
 * with existing Customer 360 rendering.
 */

document.addEventListener(
  "click",
  (event) => {

    const previewButton =
      event.target.closest(
        "#dataManagementPreviewButton"
      );

    if (previewButton) {
      loadDataManagementPreview();
      return;
    }


    const factoryResetButton =
      event.target.closest(
        "#factoryResetBusinessDataButton"
      );

    if (factoryResetButton) {
      openFactoryResetConfirmation();
      return;
    }


    const issueLicenseButton =
      event.target.closest(
        "#customer360IssueLicense"
      );

    if (issueLicenseButton) {
      openIssueLicense(
        issueLicenseButton.dataset.customerId
      );
      return;
    }

    const issueLicenseConfirm =
      event.target.closest(
        "#issueLicenseConfirm"
      );

    if (issueLicenseConfirm) {
      issueCustomerLicense();
      return;
    }

    const deactivateCustomerButton =
      event.target.closest(
        "#customer360DeactivateCustomer"
      );

    if (deactivateCustomerButton) {
      executeCustomerLifecycleAction(
        deactivateCustomerButton.dataset.customerId,
        "deactivate"
      );
      return;
    }

    const archiveCustomerButton =
      event.target.closest(
        "#customer360ArchiveCustomer"
      );

    if (archiveCustomerButton) {
      executeCustomerLifecycleAction(
        archiveCustomerButton.dataset.customerId,
        "archive"
      );
      return;
    }

    const restoreCustomerButton =
      event.target.closest(
        "#customer360RestoreCustomer"
      );

    if (restoreCustomerButton) {
      executeCustomerLifecycleAction(
        restoreCustomerButton.dataset.customerId,
        "restore"
      );
      return;
    }

    const deleteCustomerButton =
      event.target.closest(
        "[data-delete-customer]"
      );

    if (deleteCustomerButton) {
      openCustomerDeleteConfirmation(
        deleteCustomerButton.dataset
          .deleteCustomer
      );

      return;
    }


    const confirmAction =
      event.target.closest(
        "#dataManagementConfirmAction"
      );

    if (confirmAction) {
      executeDataManagementAction();
    }
  }
);


document.addEventListener(
  "input",
  (event) => {

    if (
      event.target.id !==
      "dataManagementConfirmationInput"
    ) {
      return;
    }

    const button =
      dmElement(
        "dataManagementConfirmAction"
      );

    if (!button) {
      return;
    }

    button.disabled =
      event.target.value.trim() !==
      dataManagementState
        .confirmationRequired;
  }
);

/* ============================================================
   PHASE 6.10H - ADMIN NOTIFICATION CONTROLS
   ============================================================ */

function getNotificationElement(id) {
  return document.getElementById(id);
}


function setNotificationResult(
  message,
  type = "info"
) {
  const element =
    getNotificationElement(
      "notificationResult"
    );

  if (!element) {
    return;
  }

  element.textContent =
    String(message || "");

  element.classList.remove(
    "hidden",
    "success",
    "error",
    "info"
  );

  element.classList.add(type);
}


function clearNotificationResult() {
  const element =
    getNotificationElement(
      "notificationResult"
    );

  if (!element) {
    return;
  }

  element.textContent = "";
  element.classList.add("hidden");
}


function updateNotificationChannelUi() {

  const channelElement =
    getNotificationElement(
      "notificationChannel"
    );

  if (!channelElement) {
    return;
  }

  const channel =
    String(
      channelElement.value || "EMAIL"
    ).toUpperCase();

  const subjectRow =
    getNotificationElement(
      "notificationSubjectRow"
    );

  const destinationHelp =
    getNotificationElement(
      "notificationDestinationHelp"
    );

  const sendButton =
    getNotificationElement(
      "notificationSendButton"
    );

  if (channel === "EMAIL") {

    if (subjectRow) {
      subjectRow.style.display = "";
    }

    if (destinationHelp) {
      destinationHelp.textContent =
        "Enter customer email address.";
    }

    if (sendButton) {
      sendButton.textContent =
        "Send Email";
    }

    return;
  }

  if (subjectRow) {
    subjectRow.style.display = "none";
  }

  if (destinationHelp) {
    destinationHelp.textContent =
      "Enter mobile number. Mock mode only.";
  }

  if (sendButton) {

    sendButton.textContent =
      channel === "WHATSAPP"
        ? "Run WhatsApp Mock"
        : "Run SMS Mock";
  }
}


function clearNotificationForm() {

  [
    "notificationCustomerName",
    "notificationDestination",
    "notificationSubject",
    "notificationMessage"
  ].forEach((id) => {

    const element =
      getNotificationElement(id);

    if (element) {
      element.value = "";
    }
  });

  clearNotificationResult();
}


function maskAdminNotificationDestination(
  value
) {
  const text =
    String(value || "").trim();

  if (!text) {
    return "-";
  }

  if (text.includes("@")) {

    const parts = text.split("@");

    if (parts.length !== 2) {
      return "***";
    }

    const local = parts[0];
    const domain = parts[1];

    return (
      (local.slice(0, 2) || "*") +
      "***@" +
      domain
    );
  }

  const digits =
    text.replace(/\D/g, "");

  if (digits.length <= 4) {
    return "****";
  }

  return (
    "*".repeat(
      Math.max(
        4,
        digits.length - 4
      )
    ) +
    digits.slice(-4)
  );
}


async function runLocalMessagingMock(
  channel,
  destination,
  message
) {

  const safeChannel =
    String(channel || "").toUpperCase();

  if (
    safeChannel !== "WHATSAPP" &&
    safeChannel !== "SMS"
  ) {
    throw new Error(
      "INVALID_MOCK_CHANNEL"
    );
  }

  if (!String(destination || "").trim()) {
    throw new Error(
      "DESTINATION_REQUIRED"
    );
  }

  if (!String(message || "").trim()) {
    throw new Error(
      "MESSAGE_REQUIRED"
    );
  }

  /*
   * SAFE ADMIN UI MOCK.
   * No fetch().
   * No provider request.
   * No real message.
   */
  return {
    success: true,
    status: "MOCK_SENT",
    provider: "MOCK",
    channel: safeChannel,
    destinationMasked:
      maskAdminNotificationDestination(
        destination
      ),
    networkRequestMade: false,
    realMessageSent: false
  };
}


async function submitAdminNotification(
  event
) {

  event.preventDefault();

  clearNotificationResult();

  const channel =
    String(
      getNotificationElement(
        "notificationChannel"
      )?.value || "EMAIL"
    ).toUpperCase();

  const customerName =
    String(
      getNotificationElement(
        "notificationCustomerName"
      )?.value || ""
    ).trim();

  const destination =
    String(
      getNotificationElement(
        "notificationDestination"
      )?.value || ""
    ).trim();

  const subject =
    String(
      getNotificationElement(
        "notificationSubject"
      )?.value || ""
    ).trim();

  const message =
    String(
      getNotificationElement(
        "notificationMessage"
      )?.value || ""
    ).trim();

  if (!destination) {
    setNotificationResult(
      "Destination is required.",
      "error"
    );
    return;
  }

  if (!message) {
    setNotificationResult(
      "Message is required.",
      "error"
    );
    return;
  }

  const sendButton =
    getNotificationElement(
      "notificationSendButton"
    );

  if (sendButton) {
    sendButton.disabled = true;
  }

  try {

    if (channel === "EMAIL") {

      const result =
        await api(
          "/admin/notifications/manual-email",
          {
            method: "POST",
            body: JSON.stringify({
              customerName,
              customerEmail:
                destination,
              subject,
              message
            })
          }
        );

      setNotificationResult(
        result?.success
          ? "Email request completed successfully."
          : (
              result?.reasonCode ||
              "Email request failed."
            ),
        result?.success
          ? "success"
          : "error"
      );

      await loadNotificationHistory();

      return;
    }

    const result =
      await runLocalMessagingMock(
        channel,
        destination,
        message
      );

    setNotificationResult(
      `${result.channel} mock passed. ` +
      `Destination: ${result.destinationMasked}. ` +
      `No real message was sent.`,
      "success"
    );

  }
  catch (error) {

    setNotificationResult(
      error?.message ||
      "Notification request failed.",
      "error"
    );
  }
  finally {

    if (sendButton) {
      sendButton.disabled = false;
    }
  }
}


function notificationStatusBadge(
  status
) {

  const value =
    String(status || "UNKNOWN")
      .toUpperCase();

  const safe =
    typeof escapeHtml === "function"
      ? escapeHtml(value)
      : value;

  return (
    `<span class="status-badge ` +
    `${value.toLowerCase()}">` +
    `${safe}</span>`
  );
}


function renderNotificationHistory(
  notifications
) {

  const body =
    getNotificationElement(
      "notificationsBody"
    );

  if (!body) {
    return;
  }

  const rows =
    Array.isArray(notifications)
      ? notifications
      : [];

  if (!rows.length) {

    body.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty">
            No notification records found.
          </div>
        </td>
      </tr>
    `;

    return;
  }

  body.innerHTML =
    rows.map((item) => {

      const created =
        item.created_at ||
        item.createdAt ||
        "-";

      const customer =
        item.customer_name ||
        item.customerName ||
        item.customer_id ||
        "-";

      const channel =
        item.channel ||
        "EMAIL";

      const type =
        item.notification_type ||
        item.notificationType ||
        "-";

      const status =
        item.status ||
        "-";

      const destination =
        item.destination_masked ||
        item.destinationMasked ||
        item.recipient_masked ||
        item.recipientMasked ||
        "-";

      return `
        <tr>
          <td>${escapeHtml(String(created))}</td>
          <td>${escapeHtml(String(customer))}</td>
          <td>${escapeHtml(String(channel))}</td>
          <td>${escapeHtml(String(type))}</td>
          <td>${notificationStatusBadge(status)}</td>
          <td>${escapeHtml(String(destination))}</td>
        </tr>
      `;

    }).join("");
}


async function loadNotificationHistory() {

  const body =
    getNotificationElement(
      "notificationsBody"
    );

  if (!body) {
    return;
  }

  body.innerHTML = `
    <tr>
      <td colspan="6">
        <div class="empty">
          Loading notifications...
        </div>
      </td>
    </tr>
  `;

  try {

    const result =
      await api(
        "/admin/notifications"
      );

    const notifications =
      result?.notifications ||
      result?.items ||
      result?.data ||
      [];

    renderNotificationHistory(
      notifications
    );

  }
  catch (error) {

    body.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty">
            Unable to load notification history.
          </div>
        </td>
      </tr>
    `;

    setNotificationResult(
      error?.message ||
      "Unable to load notification history.",
      "error"
    );
  }
}


async function runNotificationQuickTest(
  path,
  label
) {

  clearNotificationResult();

  try {

    const result =
      await api(
        path,
        {
          method: "POST",
          body: JSON.stringify({})
        }
      );

    setNotificationResult(
      result?.success
        ? `${label} completed successfully.`
        : (
            result?.reasonCode ||
            `${label} failed.`
          ),
      result?.success
        ? "success"
        : "error"
    );

    await loadNotificationHistory();

  }
  catch (error) {

    setNotificationResult(
      error?.message ||
      `${label} failed.`,
      "error"
    );
  }
}


function bindNotificationControls() {

  const form =
    getNotificationElement(
      "notificationForm"
    );

  if (!form || form.dataset.bound === "true") {
    return;
  }

  form.dataset.bound = "true";

  form.addEventListener(
    "submit",
    submitAdminNotification
  );

  getNotificationElement(
    "notificationChannel"
  )?.addEventListener(
    "change",
    updateNotificationChannelUi
  );

  getNotificationElement(
    "notificationClearButton"
  )?.addEventListener(
    "click",
    clearNotificationForm
  );

  getNotificationElement(
    "notificationRefreshButton"
  )?.addEventListener(
    "click",
    loadNotificationHistory
  );

  getNotificationElement(
    "testEmailProviderButton"
  )?.addEventListener(
    "click",
    () =>
      runNotificationQuickTest(
        "/admin/notifications/test-email",
        "Email provider test"
      )
  );

  getNotificationElement(
    "testExpiryReminderButton"
  )?.addEventListener(
    "click",
    () =>
      runNotificationQuickTest(
        "/admin/notifications/test-expiry-reminders",
        "Expiry reminder test"
      )
  );

  getNotificationElement(
    "testExpiredEmailButton"
  )?.addEventListener(
    "click",
    () =>
      runNotificationQuickTest(
        "/admin/notifications/test-expired-email",
        "Expired license email test"
      )
  );

  getNotificationElement(
    "testRenewalEmailButton"
  )?.addEventListener(
    "click",
    () =>
      runNotificationQuickTest(
        "/admin/notifications/test-renewal-email",
        "Renewal email test"
      )
  );

  updateNotificationChannelUi();
}


/*
 * Existing navigation is data-page based.
 * This listener only adds notification-specific
 * loading and does not replace existing navigation.
 */
document.addEventListener(
  "click",
  (event) => {

    const button =
      event.target.closest(
        '[data-page="notifications"]'
      );

    if (!button) {
      return;
    }

    window.setTimeout(
      () => {
        bindNotificationControls();
        loadNotificationHistory();
      },
      0
    );
  }
);


document.addEventListener(
  "DOMContentLoaded",
  () => {
    bindNotificationControls();
  }
);


// STEP 6: Secure License Vault UI
(function bindLicenseVault() {
  const modal = $("vaultModal");
  const key = $("vaultLicenseKey");
  const msg = $("vaultMessage");
  const revealButton = $("vaultReveal");
  const copyButton = $("vaultCopy");
  const storeButton = $("vaultStore");
  const doneButton = $("vaultDone");
  const closeButton = $("vaultClose");
  const licenseIdDisplay = $("vaultLicenseIdDisplay");

  if (
    !modal ||
    !key ||
    !msg ||
    !revealButton ||
    !copyButton ||
    !storeButton
  ) {
    return;
  }

  function setVaultMessage(message, type = "") {
    msg.textContent = message || "";
    msg.className = `vault-status-message ${type}`.trim();
  }

  function resetVaultVisibility() {
    key.type = "password";
    revealButton.textContent = "Show";
    revealButton.title = "Reveal license key";
  }

  function closeVault() {
    key.value = "";
    resetVaultVisibility();
    setVaultMessage("");
    state.vaultLicenseId = null;
    closeModal("vaultModal");
  }

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-vault-license]");

    if (!button) {
      return;
    }

    state.vaultLicenseId = button.dataset.vaultLicense;

    $("vaultTitle").textContent = "License Vault";

    if (licenseIdDisplay) {
      licenseIdDisplay.textContent =
        state.vaultLicenseId || "-";
    }

    key.value = "";
    resetVaultVisibility();
    setVaultMessage("");

    openModal("vaultModal");
  });

  if (closeButton) {
    closeButton.addEventListener("click", closeVault);
  }

  if (doneButton) {
    doneButton.addEventListener("click", closeVault);
  }

  storeButton.addEventListener("click", async () => {
    const value = key.value.trim();

    if (!value) {
      setVaultMessage(
        "Enter the original license key before storing.",
        "warning"
      );
      key.focus();
      return;
    }

    storeButton.disabled = true;
    setVaultMessage(
      "Encrypting and storing license key...",
      "loading"
    );

    try {
      await api(
        `/admin/licenses/${encodeURIComponent(
          state.vaultLicenseId
        )}/vault`,
        {
          method: "POST",
          body: JSON.stringify({
            licenseKey: value
          })
        }
      );

      key.value = "";
      resetVaultVisibility();

      setVaultMessage(
        "License key stored securely in the vault.",
        "success"
      );
    } catch (error) {
      setVaultMessage(
        error.message || "Unable to store the license key.",
        "error"
      );
    } finally {
      storeButton.disabled = false;
    }
  });

  revealButton.addEventListener("click", async () => {
    if (key.value && key.type === "text") {
      resetVaultVisibility();
      setVaultMessage(
        "License key hidden.",
        "success"
      );
      return;
    }

    if (key.value && key.type === "password") {
      key.type = "text";
      revealButton.textContent = "Hide";
      revealButton.title = "Hide license key";
      return;
    }

    revealButton.disabled = true;

    setVaultMessage(
      "Retrieving license key securely...",
      "loading"
    );

    try {
      const data = await api(
        `/admin/licenses/${encodeURIComponent(
          state.vaultLicenseId
        )}/vault`
      );

      key.value = data.licenseKey || "";
      key.type = "text";

      revealButton.textContent = "Hide";
      revealButton.title = "Hide license key";

      setVaultMessage(
        "License key revealed for this admin session only.",
        "success"
      );
    } catch (error) {
      resetVaultVisibility();

      setVaultMessage(
        error.message ||
          "License key is not stored in the vault yet.",
        "error"
      );
    } finally {
      revealButton.disabled = false;
    }
  });

  copyButton.addEventListener("click", async () => {
    if (!key.value) {
      setVaultMessage(
        "Reveal the license key before copying.",
        "warning"
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(key.value);

      setVaultMessage(
        "License key copied to clipboard.",
        "success"
      );
    } catch (error) {
      setVaultMessage(
        "Unable to copy the license key.",
        "error"
      );
    }
  });
})();

// Professional Overview quick actions / navigation.
document.addEventListener("click", (event) => {
  const pageButton = event.target.closest("[data-overview-page]");
  if (pageButton) {
    switchPage(pageButton.dataset.overviewPage);
    return;
  }
  if (event.target.closest("#overviewAddCustomer")) {
    openNewCustomer();
  }
});

// STEP 9: Admin resend of fulfilled license email.
document.addEventListener("click", async (event)=>{
  const button=event.target.closest("[data-resend-order]"); if(!button)return;
  const orderId=button.dataset.resendOrder; button.disabled=true; const oldText=button.textContent; button.textContent="Sending...";
  try{const result=await api("/admin/orders/resend-license",{method:"POST",body:JSON.stringify({orderId})}); setMessage(`License email ${result.status||"sent"} (${result.deliveryMode||"safe mode"}).`,"success");}
  catch(error){setMessage(`License email resend failed: ${error.message||"UNKNOWN"}`,"error");}
  finally{button.disabled=false;button.textContent=oldText;}
});


/* ============================================================
   S1_STAFF_TEAM_UI_V1
   Staff + Team Management
   ============================================================ */

(function initS1StaffTeamManagement() {
  const s1 = {
    staff: [],
    teams: [],
    selectedTeamId: ""
  };

  function el(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(value) {
    if (!value) return "â€”";

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return String(value);
    }

    return parsed.toLocaleString();
  }

  function staffMessage(message) {
    const node = el("staffManagementMessage");
    if (node) node.textContent = message || "";
  }

  function teamMessage(message) {
    const node = el("teamManagementMessage");
    if (node) node.textContent = message || "";
  }

  function membershipMessage(message) {
    const node = el("teamMembershipMessage");
    if (node) node.textContent = message || "";
  }

  function renderStaff() {
    const body = el("staffManagementBody");
    const count = el("staffManagementCount");

    if (!body) return;

    if (count) {
      const active = s1.staff.filter(
        (item) => item.status === "ACTIVE"
      ).length;

      count.textContent =
        `${s1.staff.length} staff Â· ${active} active`;
    }

    if (!s1.staff.length) {
      body.innerHTML =
        '<tr><td colspan="5">No staff records.</td></tr>';
      renderMembershipStaffOptions();
      return;
    }

    body.innerHTML = s1.staff.map((item) => {
      const id = escapeHtml(item.staff_id);
      const active = item.status === "ACTIVE";

      return `
        <tr>
          <td>${escapeHtml(item.full_name)}</td>
          <td>${escapeHtml(item.email)}</td>
          <td>${escapeHtml(item.status)}</td>
          <td>${escapeHtml(formatDate(item.created_at))}</td>
          <td>
            <button
              type="button"
              class="secondary"
              data-s1-staff-edit="${id}"
            >Edit</button>

            ${
              active
                ? `<button
                     type="button"
                     class="secondary"
                     data-s1-staff-deactivate="${id}"
                   >Deactivate</button>`
                : ""
            }
          </td>
        </tr>
      `;
    }).join("");

    renderMembershipStaffOptions();
  }

  function renderTeams() {
    const body = el("teamManagementBody");
    const count = el("teamManagementCount");

    if (!body) return;

    if (count) {
      const active = s1.teams.filter(
        (item) => item.status === "ACTIVE"
      ).length;

      count.textContent =
        `${s1.teams.length} teams Â· ${active} active`;
    }

    if (!s1.teams.length) {
      body.innerHTML =
        '<tr><td colspan="5">No teams.</td></tr>';
      return;
    }

    body.innerHTML = s1.teams.map((item) => {
      const id = escapeHtml(item.team_id);
      const active = item.status === "ACTIVE";

      return `
        <tr>
          <td>${escapeHtml(item.team_name)}</td>
          <td>${escapeHtml(item.description || "â€”")}</td>
          <td>${escapeHtml(item.status)}</td>
          <td>${escapeHtml(item.member_count || 0)}</td>
          <td>
            ${
              active
                ? `
                  <button
                    type="button"
                    class="secondary"
                    data-s1-team-members="${id}"
                  >Members</button>

                  <button
                    type="button"
                    class="secondary"
                    data-s1-team-edit="${id}"
                  >Edit</button>

                  <button
                    type="button"
                    class="secondary"
                    data-s1-team-deactivate="${id}"
                  >Deactivate</button>
                `
                : ""
            }
          </td>
        </tr>
      `;
    }).join("");
  }

  function renderMembershipStaffOptions() {
    const select = el("teamMembershipStaffId");

    if (!select) return;

    const activeStaff = s1.staff.filter(
      (item) => item.status === "ACTIVE"
    );

    select.innerHTML =
      '<option value="">Select staff</option>' +
      activeStaff.map((item) => `
        <option value="${escapeHtml(item.staff_id)}">
          ${escapeHtml(item.full_name)} (${escapeHtml(item.email)})
        </option>
      `).join("");
  }

  async function loadStaffManagement() {
    const result = await api("/admin/staff");
    s1.staff = result.staff || [];
    renderStaff();
  }

  async function loadTeamManagement() {
    const result = await api("/admin/staff-teams");
    s1.teams = result.teams || [];
    renderTeams();
  }

  async function loadS1Management() {
    if (!state.secret) return;

    staffMessage("Loading...");
    teamMessage("Loading...");

    try {
      await Promise.all([
        loadStaffManagement(),
        loadTeamManagement()
      ]);

      staffMessage("");
      teamMessage("");
    } catch (error) {
      const message =
        error && error.message
          ? error.message
          : "Unable to load Staff & Team Management.";

      staffMessage(message);
      teamMessage(message);
    }
  }

  function resetStaffForm() {
    el("staffManagementEditId").value = "";
    el("staffManagementName").value = "";
    el("staffManagementEmail").value = "";

    el("staffManagementSave").textContent = "Add Staff";
    el("staffManagementCancelEdit").classList.add("hidden");
  }

  function resetTeamForm() {
    el("teamManagementEditId").value = "";
    el("teamManagementName").value = "";
    el("teamManagementDescription").value = "";

    el("teamManagementSave").textContent = "Add Team";
    el("teamManagementCancelEdit").classList.add("hidden");
  }

  async function saveStaff(event) {
    event.preventDefault();

    const staffId =
      el("staffManagementEditId").value.trim();

    const fullName =
      el("staffManagementName").value.trim();

    const email =
      el("staffManagementEmail").value.trim();

    if (!fullName || !email) {
      staffMessage("Full name and email are required.");
      return;
    }

    staffMessage(
      staffId ? "Updating staff..." : "Creating staff..."
    );

    try {
      await api(
        staffId
          ? `/admin/staff/${encodeURIComponent(staffId)}/update`
          : "/admin/staff",
        {
          method: "POST",
          body: JSON.stringify({
            fullName,
            email
          })
        }
      );

      resetStaffForm();
      await loadStaffManagement();

      staffMessage(
        staffId
          ? "Staff updated successfully."
          : "Staff created successfully."
      );
    } catch (error) {
      staffMessage(
        error && error.message
          ? error.message
          : "Staff operation failed."
      );
    }
  }

  async function deactivateStaff(staffId) {
    if (!window.confirm(
      "Deactivate this staff record? No staff data will be deleted."
    )) {
      return;
    }

    staffMessage("Deactivating staff...");

    try {
      await api(
        `/admin/staff/${encodeURIComponent(staffId)}/deactivate`,
        { method: "POST" }
      );

      await loadStaffManagement();
      staffMessage("Staff deactivated.");
    } catch (error) {
      staffMessage(
        error && error.message
          ? error.message
          : "Staff deactivation failed."
      );
    }
  }

  async function saveTeam(event) {
    event.preventDefault();

    const teamId =
      el("teamManagementEditId").value.trim();

    const teamName =
      el("teamManagementName").value.trim();

    const description =
      el("teamManagementDescription").value.trim();

    if (!teamName) {
      teamMessage("Team name is required.");
      return;
    }

    teamMessage(
      teamId ? "Updating team..." : "Creating team..."
    );

    try {
      await api(
        teamId
          ? `/admin/staff-teams/${encodeURIComponent(teamId)}/update`
          : "/admin/staff-teams",
        {
          method: "POST",
          body: JSON.stringify({
            teamName,
            description
          })
        }
      );

      resetTeamForm();
      await loadTeamManagement();

      teamMessage(
        teamId
          ? "Team updated successfully."
          : "Team created successfully."
      );
    } catch (error) {
      teamMessage(
        error && error.message
          ? error.message
          : "Team operation failed."
      );
    }
  }

  async function deactivateTeam(teamId) {
    if (!window.confirm(
      "Deactivate this team? Existing membership history will not be deleted."
    )) {
      return;
    }

    teamMessage("Deactivating team...");

    try {
      await api(
        `/admin/staff-teams/${encodeURIComponent(teamId)}/deactivate`,
        { method: "POST" }
      );

      await loadTeamManagement();

      if (s1.selectedTeamId === teamId) {
        closeMembership();
      }

      teamMessage("Team deactivated.");
    } catch (error) {
      teamMessage(
        error && error.message
          ? error.message
          : "Team deactivation failed."
      );
    }
  }

  async function openMembership(teamId) {
    const team = s1.teams.find(
      (item) => item.team_id === teamId
    );

    if (!team) return;

    s1.selectedTeamId = teamId;

    el("teamMembershipTeamId").value = teamId;
    el("teamMembershipTitle").textContent =
      `${team.team_name} Members`;

    el("teamMembershipPanel").classList.remove("hidden");

    renderMembershipStaffOptions();
    membershipMessage("Loading members...");

    try {
      const result = await api(
        `/admin/staff-teams/${encodeURIComponent(teamId)}/members`
      );

      const members = result.members || [];
      const body = el("teamMembershipBody");

      if (!members.length) {
        body.innerHTML =
          '<tr><td colspan="5">No members assigned.</td></tr>';
      } else {
        body.innerHTML = members.map((item) => `
          <tr>
            <td>${escapeHtml(item.full_name)}</td>
            <td>${escapeHtml(item.email)}</td>
            <td>${escapeHtml(item.status)}</td>
            <td>${escapeHtml(formatDate(item.added_at))}</td>
            <td>
              <button
                type="button"
                class="secondary"
                data-s1-member-remove="${escapeHtml(item.staff_id)}"
              >Remove</button>
            </td>
          </tr>
        `).join("");
      }

      membershipMessage("");
    } catch (error) {
      membershipMessage(
        error && error.message
          ? error.message
          : "Unable to load members."
      );
    }
  }

  function closeMembership() {
    s1.selectedTeamId = "";

    el("teamMembershipTeamId").value = "";
    el("teamMembershipPanel").classList.add("hidden");

    el("teamMembershipBody").innerHTML =
      '<tr><td colspan="5">No team selected.</td></tr>';

    membershipMessage("");
  }

  async function addMember(event) {
    event.preventDefault();

    const teamId =
      el("teamMembershipTeamId").value.trim();

    const staffId =
      el("teamMembershipStaffId").value.trim();

    if (!teamId || !staffId) {
      membershipMessage("Select an active staff member.");
      return;
    }

    membershipMessage("Adding member...");

    try {
      await api(
        `/admin/staff-teams/${encodeURIComponent(teamId)}/members`,
        {
          method: "POST",
          body: JSON.stringify({ staffId })
        }
      );

      el("teamMembershipStaffId").value = "";

      await Promise.all([
        openMembership(teamId),
        loadTeamManagement()
      ]);

      membershipMessage("Member added successfully.");
    } catch (error) {
      membershipMessage(
        error && error.message
          ? error.message
          : "Unable to add member."
      );
    }
  }

  async function removeMember(staffId) {
    const teamId = s1.selectedTeamId;

    if (!teamId) return;

    if (!window.confirm(
      "Remove this staff member from the team?"
    )) {
      return;
    }

    membershipMessage("Removing member...");

    try {
      await api(
        `/admin/staff-teams/${encodeURIComponent(teamId)}` +
        `/members/${encodeURIComponent(staffId)}/remove`,
        { method: "POST" }
      );

      await Promise.all([
        openMembership(teamId),
        loadTeamManagement()
      ]);

      membershipMessage("Member removed successfully.");
    } catch (error) {
      membershipMessage(
        error && error.message
          ? error.message
          : "Unable to remove member."
      );
    }
  }

  function bindS1Events() {
    const staffForm = el("staffManagementForm");
    const teamForm = el("teamManagementForm");
    const membershipForm = el("teamMembershipForm");

    if (!staffForm || !teamForm || !membershipForm) {
      return;
    }

    staffForm.addEventListener("submit", saveStaff);
    teamForm.addEventListener("submit", saveTeam);
    membershipForm.addEventListener("submit", addMember);

    el("staffTeamRefreshButton")
      .addEventListener("click", loadS1Management);

    el("staffManagementCancelEdit")
      .addEventListener("click", resetStaffForm);

    el("teamManagementCancelEdit")
      .addEventListener("click", resetTeamForm);

    el("teamMembershipClose")
      .addEventListener("click", closeMembership);

    el("staffManagementBody")
      .addEventListener("click", (event) => {
        const edit =
          event.target.closest("[data-s1-staff-edit]");

        const deactivate =
          event.target.closest("[data-s1-staff-deactivate]");

        if (edit) {
          const staffId =
            edit.dataset.s1StaffEdit;

          const staff = s1.staff.find(
            (item) => item.staff_id === staffId
          );

          if (!staff) return;

          el("staffManagementEditId").value =
            staff.staff_id;

          el("staffManagementName").value =
            staff.full_name || "";

          el("staffManagementEmail").value =
            staff.email || "";

          el("staffManagementSave").textContent =
            "Save Changes";

          el("staffManagementCancelEdit")
            .classList.remove("hidden");
        }

        if (deactivate) {
          deactivateStaff(
            deactivate.dataset.s1StaffDeactivate
          );
        }
      });

    el("teamManagementBody")
      .addEventListener("click", (event) => {
        const edit =
          event.target.closest("[data-s1-team-edit]");

        const deactivate =
          event.target.closest("[data-s1-team-deactivate]");

        const members =
          event.target.closest("[data-s1-team-members]");

        if (edit) {
          const teamId =
            edit.dataset.s1TeamEdit;

          const team = s1.teams.find(
            (item) => item.team_id === teamId
          );

          if (!team) return;

          el("teamManagementEditId").value =
            team.team_id;

          el("teamManagementName").value =
            team.team_name || "";

          el("teamManagementDescription").value =
            team.description || "";

          el("teamManagementSave").textContent =
            "Save Changes";

          el("teamManagementCancelEdit")
            .classList.remove("hidden");
        }

        if (deactivate) {
          deactivateTeam(
            deactivate.dataset.s1TeamDeactivate
          );
        }

        if (members) {
          openMembership(
            members.dataset.s1TeamMembers
          );
        }
      });

    el("teamMembershipBody")
      .addEventListener("click", (event) => {
        const remove =
          event.target.closest("[data-s1-member-remove]");

        if (remove) {
          removeMember(
            remove.dataset.s1MemberRemove
          );
        }
      });
  }

  document.addEventListener(
    "DOMContentLoaded",
    bindS1Events
  );

  /*
   * loadAll() remains the existing central loader.
   * Refresh Staff/Team after successful authenticated app load.
   */
  const originalLoadAll = window.loadAll;

  window.s1LoadStaffTeamManagement =
    loadS1Management;

  /*
   * Existing loadAll is function-scoped in this bundle, so hook
   * authenticated navigation/refresh without changing its source.
   */
  document.addEventListener("click", (event) => {
    const button =
      event.target.closest("[data-page='settings']");

    if (button && state.secret) {
      setTimeout(loadS1Management, 0);
    }
  });

  window.addEventListener("load", () => {
    if (state.secret) {
      loadS1Management();
    }
  });
})();




/* ============================================================
 * S2_INDIVIDUAL_STAFF_ACCOUNTS_UI_V1
 * ============================================================ */
(function bindS2IndividualStaffAccounts() {
  "use strict";

  const s2 = {
    accounts: [],
    staff: []
  };

  function s2El(id) {
    return document.getElementById(id);
  }

  function s2Safe(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function s2Message(text) {
    const target = s2El("staffAccountsMessage");

    if (target) {
      target.textContent = text || "";
    }
  }

  function s2Date(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString();
  }

  function s2AccountId(account) {
    return account.account_id || account.accountId || "";
  }

  function s2StaffId(account) {
    return account.staff_id || account.staffId || "";
  }

  function s2RenderStaff() {
    const select = s2El("staffAccountStaffId");

    if (!select) return;

    const current = select.value;

    const active = s2.staff.filter(
      (item) =>
        String(item.status || "").toUpperCase() === "ACTIVE"
    );

    select.innerHTML =
      '<option value="">Select active staff</option>' +
      active.map((item) => {
        const id =
          item.staff_id ||
          item.staffId ||
          "";

        const name =
          item.full_name ||
          item.fullName ||
          item.name ||
          id;

        return (
          '<option value="' +
          s2Safe(id) +
          '">' +
          s2Safe(name) +
          " (" +
          s2Safe(id) +
          ")" +
          "</option>"
        );
      }).join("");

    if (
      current &&
      Array.from(select.options).some(
        (option) => option.value === current
      )
    ) {
      select.value = current;
    }
  }

  function s2RenderAccounts() {
    const body = s2El("staffAccountsBody");
    const count = s2El("staffAccountsCount");

    if (!body || !count) return;

    count.textContent =
      s2.accounts.length +
      (s2.accounts.length === 1
        ? " account"
        : " accounts");

    if (!s2.accounts.length) {
      body.innerHTML =
        '<tr><td colspan="7">No staff accounts found.</td></tr>';

      return;
    }

    body.innerHTML = s2.accounts.map((account) => {
      const id = s2AccountId(account);
      const sid = s2StaffId(account);

      const name =
        account.full_name ||
        account.fullName ||
        sid ||
        "-";

      const email =
        account.login_email ||
        account.loginEmail ||
        "-";

      const status =
        String(
          account.status || "UNKNOWN"
        ).toUpperCase();

      const failures =
        account.failed_login_count ??
        account.failedLoginCount ??
        0;

      const lastLogin =
        account.last_login_at ||
        account.lastLoginAt;

      const created =
        account.created_at ||
        account.createdAt;

      const inactive =
        status === "INACTIVE";

      return (
        "<tr>" +

        "<td>" +
        s2Safe(name) +
        "<br><small>" +
        s2Safe(sid) +
        "</small></td>" +

        "<td>" +
        s2Safe(email) +
        "</td>" +

        "<td>" +
        s2Safe(status) +
        "</td>" +

        "<td>" +
        s2Safe(failures) +
        "</td>" +

        "<td>" +
        s2Safe(s2Date(lastLogin)) +
        "</td>" +

        "<td>" +
        s2Safe(s2Date(created)) +
        "</td>" +

        "<td>" +

        '<button type="button" class="secondary" ' +
        'data-s2-reset="' +
        s2Safe(id) +
        '">' +
        "Reset Password" +
        "</button> " +

        (
          inactive
            ? ""
            : (
              '<button type="button" class="danger" ' +
              'data-s2-deactivate="' +
              s2Safe(id) +
              '">' +
              "Deactivate" +
              "</button>"
            )
        ) +

        "</td>" +
        "</tr>"
      );
    }).join("");
  }

  async function s2LoadAccounts() {
    if (!state.secret) return;

    s2Message("Loading staff accounts...");

    try {
      const results = await Promise.all([
        api("/admin/staff-accounts"),
        api("/admin/staff")
      ]);

      const accountResult = results[0];
      const staffResult = results[1];

      s2.accounts =
        Array.isArray(accountResult.accounts)
          ? accountResult.accounts
          : [];

      s2.staff =
        Array.isArray(staffResult.staff)
          ? staffResult.staff
          : (
              Array.isArray(staffResult.staffMembers)
                ? staffResult.staffMembers
                : []
            );

      s2RenderStaff();
      s2RenderAccounts();

      s2Message("");
    }
    catch (error) {
      s2Message(
        error && error.message
          ? error.message
          : "Unable to load staff accounts."
      );
    }
  }

  async function s2CreateAccount(event) {
    event.preventDefault();

    const staffSelect =
      s2El("staffAccountStaffId");

    const emailInput =
      s2El("staffAccountLoginEmail");

    const passwordInput =
      s2El("staffAccountPassword");

    const staffId =
      staffSelect.value.trim();

    const loginEmail =
      emailInput.value.trim();

    const password =
      passwordInput.value;

    if (!staffId || !loginEmail || !password) {
      s2Message(
        "Staff, login email and password are required."
      );

      return;
    }

    if (
      password.length < 12 ||
      password.length > 128
    ) {
      s2Message(
        "Password must be 12-128 characters."
      );

      return;
    }

    s2Message("Creating staff account...");

    try {
      const result = await api(
        "/admin/staff-accounts",
        {
          method: "POST",
          body: JSON.stringify({
            staffId,
            loginEmail,
            password
          })
        }
      );

      passwordInput.value = "";

      s2Message(
        "Account created: " +
        (result.accountId || "CREATED")
      );

      await s2LoadAccounts();
    }
    catch (error) {
      passwordInput.value = "";

      s2Message(
        error && error.message
          ? error.message
          : "Unable to create staff account."
      );
    }
  }

  let s2ResetPasswordAccountId = "";

  function s2ClearResetPasswordModal() {
    const password =
      $("s2ResetPasswordNew");

    const confirmPassword =
      $("s2ResetPasswordConfirm");

    const message =
      $("s2ResetPasswordMessage");

    const submit =
      $("s2ResetPasswordSubmit");

    if (password) {
      password.value = "";
      password.type = "password";
    }

    if (confirmPassword) {
      confirmPassword.value = "";
      confirmPassword.type = "password";
    }

    const toggleNew =
      $("s2ResetPasswordToggleNew");

    const toggleConfirm =
      $("s2ResetPasswordToggleConfirm");

    if (toggleNew) {
      toggleNew.textContent = "Show Password";
      toggleNew.setAttribute(
        "aria-label",
        "Show new password"
      );
    }

    if (toggleConfirm) {
      toggleConfirm.textContent = "Show Password";
      toggleConfirm.setAttribute(
        "aria-label",
        "Show confirmed password"
      );
    }

    if (message) {
      message.textContent = "";
      message.className =
        "s2-password-message";
    }

    if (submit) {
      submit.disabled = false;
      submit.textContent =
        "Reset Password";
    }
  }

  function s2CloseResetPasswordModal() {
    s2ClearResetPasswordModal();
    s2ResetPasswordAccountId = "";
    closeModal("s2ResetPasswordModal");
  }

  async function s2ResetPassword(accountId) {
    if (!accountId) return;

    s2ResetPasswordAccountId =
      String(accountId);

    s2ClearResetPasswordModal();

    openModal("s2ResetPasswordModal");

    const password =
      $("s2ResetPasswordNew");

    if (password) {
      window.setTimeout(function () {
        password.focus();
      }, 0);
    }
  }

  function s2TogglePasswordVisibility(
    inputId,
    buttonId
  ) {
    const input = $(inputId);
    const button = $(buttonId);

    if (!input || !button) return;

    if (input.type === "password") {
      input.type = "text";

      button.textContent =
        "Hide Password";

      button.setAttribute(
        "aria-label",
        "Hide password"
      );
    }
    else {
      input.type = "password";

      button.textContent =
        "Show Password";

      button.setAttribute(
        "aria-label",
        "Show password"
      );
    }
  }

  async function s2SubmitResetPassword() {
    const accountId =
      s2ResetPasswordAccountId;

    if (!accountId) return;

    const passwordInput =
      $("s2ResetPasswordNew");

    const confirmInput =
      $("s2ResetPasswordConfirm");

    const message =
      $("s2ResetPasswordMessage");

    const submit =
      $("s2ResetPasswordSubmit");

    if (
      !passwordInput ||
      !confirmInput ||
      !message ||
      !submit
    ) {
      return;
    }

    const password =
      passwordInput.value;

    const confirmation =
      confirmInput.value;

    message.className =
      "s2-password-message";

    if (
      password.length < 12 ||
      password.length > 128
    ) {
      message.textContent =
        "Password must be 12-128 characters.";

      passwordInput.focus();
      return;
    }

    if (password !== confirmation) {
      message.textContent =
        "Passwords do not match.";

      confirmInput.focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = "Resetting...";

    message.textContent =
      "Resetting password...";

    try {
      const result = await api(
        "/admin/staff-accounts/" +
        encodeURIComponent(accountId) +
        "/password-reset",
        {
          method: "POST",
          body: JSON.stringify({
            password
          })
        }
      );

      passwordInput.value = "";
      confirmInput.value = "";

      message.className =
        "s2-password-message success";

      message.textContent =
        result.status === "PASSWORD_RESET"
          ? "Password reset successfully."
          : "Password reset completed.";

      s2Message(
        result.status === "PASSWORD_RESET"
          ? "Password reset successfully."
          : "Password reset completed."
      );

      await s2LoadAccounts();

      window.setTimeout(function () {
        s2CloseResetPasswordModal();
      }, 700);
    }
    catch (error) {
      passwordInput.value = "";
      confirmInput.value = "";

      message.className =
        "s2-password-message";

      message.textContent =
        error && error.message
          ? error.message
          : "Unable to reset password.";

      submit.disabled = false;
      submit.textContent =
        "Reset Password";

      passwordInput.focus();
    }
  }
  async function s2Deactivate(accountId) {
    if (!accountId) return;

    if (
      !window.confirm(
        "Deactivate this staff login account?"
      )
    ) {
      return;
    }

    s2Message(
      "Deactivating staff account..."
    );

    try {
      const result = await api(
        "/admin/staff-accounts/" +
        encodeURIComponent(accountId) +
        "/deactivate",
        {
          method: "POST"
        }
      );

      s2Message(
        result.status === "DEACTIVATED"
          ? "Staff account deactivated."
          : "Staff account already inactive."
      );

      await s2LoadAccounts();
    }
    catch (error) {
      s2Message(
        error && error.message
          ? error.message
          : "Unable to deactivate staff account."
      );
    }
  }

  function s2BindResetPasswordVisibility() {
    const newButton =
      $("s2ResetPasswordToggleNew");

    const confirmButton =
      $("s2ResetPasswordToggleConfirm");

    if (
      newButton &&
      newButton.dataset.s2VisibilityBound !== "1"
    ) {
      newButton.addEventListener(
        "click",
        function (event) {
          event.preventDefault();

          s2TogglePasswordVisibility(
            "s2ResetPasswordNew",
            "s2ResetPasswordToggleNew"
          );
        }
      );

      newButton.dataset.s2VisibilityBound = "1";
    }

    if (
      confirmButton &&
      confirmButton.dataset.s2VisibilityBound !== "1"
    ) {
      confirmButton.addEventListener(
        "click",
        function (event) {
          event.preventDefault();

          s2TogglePasswordVisibility(
            "s2ResetPasswordConfirm",
            "s2ResetPasswordToggleConfirm"
          );
        }
      );

      confirmButton.dataset.s2VisibilityBound = "1";
    }
  }
  function s2BindEvents() {
    s2BindResetPasswordVisibility();
    const form =
      s2El("staffAccountCreateForm");

    const refresh =
      s2El("staffAccountsRefreshButton");

    const body =
      s2El("staffAccountsBody");

    if (!form || !refresh || !body) {
      return;
    }

    form.addEventListener(
      "submit",
      s2CreateAccount
    );

    refresh.addEventListener(
      "click",
      s2LoadAccounts
    );

    body.addEventListener(
      "click",
      (event) => {
        const reset =
          event.target.closest(
            "[data-s2-reset]"
          );

        const deactivate =
          event.target.closest(
            "[data-s2-deactivate]"
          );

        if (reset) {
          s2ResetPassword(
            reset.dataset.s2Reset
          );

          return;
        }

        if (deactivate) {
          s2Deactivate(
            deactivate.dataset.s2Deactivate
          );
        }
      }
    );

    document.addEventListener(
      "click",
      (event) => {
        const settings =
          event.target.closest(
            "[data-page='settings']"
          );

        if (settings && state.secret) {
          setTimeout(
            s2LoadAccounts,
            0
          );
        }
      }
    );

    window.addEventListener(
      "load",
      () => {
        if (state.secret) {
          s2LoadAccounts();
        }
      }
    );
  }
  window.s2LoadStaffAccounts =
    s2LoadAccounts;

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      function () {
        s2BindEvents();
      },
      { once: true }
    );
  } else {
    s2BindEvents();
  }

  const s2ResetClose =
    $("s2ResetPasswordClose");

  const s2ResetCancel =
    $("s2ResetPasswordCancel");

  const s2ResetSubmit =
    $("s2ResetPasswordSubmit");

  const s2ResetToggleNew =
    $("s2ResetPasswordToggleNew");

  const s2ResetToggleConfirm =
    $("s2ResetPasswordToggleConfirm");

  const s2ResetNewInput =
    $("s2ResetPasswordNew");

  const s2ResetConfirmInput =
    $("s2ResetPasswordConfirm");

  if (s2ResetClose) {
    s2ResetClose.addEventListener(
      "click",
      s2CloseResetPasswordModal
    );
  }

  if (s2ResetCancel) {
    s2ResetCancel.addEventListener(
      "click",
      s2CloseResetPasswordModal
    );
  }

  if (s2ResetSubmit) {
    s2ResetSubmit.addEventListener(
      "click",
      s2SubmitResetPassword
    );
  }


  function s2ResetPasswordEnterHandler(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      s2SubmitResetPassword();
    }
  }

  if (s2ResetNewInput) {
    s2ResetNewInput.addEventListener(
      "keydown",
      s2ResetPasswordEnterHandler
    );
  }

  if (s2ResetConfirmInput) {
    s2ResetConfirmInput.addEventListener(
      "keydown",
      s2ResetPasswordEnterHandler
    );
  }
})();

/* END S2_INDIVIDUAL_STAFF_ACCOUNTS_UI_V1 */









// SYSTEM SETTINGS V2 FUNCTIONAL NAV
(function () {
  "use strict";

  function initSystemSettingsV2() {
    const settingsPage = document.getElementById("page-settings");
    if (!settingsPage) return;

    const navButtons = Array.from(
      settingsPage.querySelectorAll("[data-settings-target]")
    );

    if (!navButtons.length) return;

    const contentHost =
      settingsPage.querySelector(".hxl-settings-main") ||
      settingsPage.querySelector(".hxl-settings-content") ||
      settingsPage.querySelector(".settings-content") ||
      settingsPage;

    /* HXL_SETTINGS_TARGET_PANE_INTEGRATION_V1 */
    const existingStaffPanel =
      document.getElementById("staffTeamManagementPanel");

    const existingStaffAccountsPanel =
      document.getElementById("staffAccountsPanel");

    const existingDataManagementPanel =
      document.getElementById("dataManagementPanel");

    /* HXL_SETTINGS_DANGER_ZONE_INTEGRATION_V1 */
    const existingFactoryResetPanel =
      document.getElementById("factoryResetBusinessDataPanel");

    function ensurePane(name, title, subtitle) {
      let pane = settingsPage.querySelector(
        '[data-settings-pane="' + name + '"]'
      );

      if (pane) return pane;

      pane = document.createElement("section");
      pane.className = "hxl-settings-pane";
      pane.dataset.settingsPane = name;
      pane.hidden = true;

      pane.innerHTML =
        '<div class="hxl-settings-page-heading">' +
          '<div>' +
            '<h2>' + title + '</h2>' +
            '<p>' + subtitle + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="hxl-settings-empty-card">' +
          '<span class="hxl-settings-empty-icon">âš™</span>' +
          '<div>' +
            '<strong>' + title + '</strong>' +
            '<p>This settings area is ready for the existing protected controls.</p>' +
          '</div>' +
        '</div>';

      contentHost.appendChild(pane);
      return pane;
    }

    const paneInfo = {
      overview: [
        "Overview",
        "System health, configuration status and quick actions."
      ],
      staff: [
        "Staff & Access",
        "Manage staff, teams, permissions and access."
      ],
      security: [
        "Security",
        "MFA, sessions, access policies and security controls."
      ],
      licensing: [
        "Licensing",
        "License vault, activation rules, expiry and renewal."
      ],
      notifications: [
        "Notifications",
        "Email, WhatsApp, SMS, templates and notification rules."
      ],
      production: [
        "Production",
        "Environment, deployment, portals and API services."
      ],
      data: [
        "Data Management",
        "Protected business data and operational records."
      ],
      audit: [
        "Audit & Logs",
        "Admin, security, system and API activity."
      ],
      danger: [
        "Danger Zone",
        "Protected destructive operations requiring explicit confirmation."
      ]
    };

    Object.keys(paneInfo).forEach(function (name) {
      ensurePane(name, paneInfo[name][0], paneInfo[name][1]);
    });

    const staffPane =
      settingsPage.querySelector('[data-settings-pane="staff"]');

    if (existingStaffPanel && staffPane) {
      const empty = staffPane.querySelector(".hxl-settings-empty-card");
      if (empty) empty.remove();

      if (!staffPane.contains(existingStaffPanel)) {
        staffPane.appendChild(existingStaffPanel);
      }

      existingStaffPanel.style.marginTop = "0";
      existingStaffPanel.style.gridColumn = "1 / -1";
      existingStaffPanel.style.width = "100%";
    }

    /*
     * Target Settings pane integration.
     * Existing DOM nodes are moved, not cloned.
     * Existing IDs and event listeners remain intact.
     */

    if (existingStaffAccountsPanel && staffPane) {
      if (!staffPane.contains(existingStaffAccountsPanel)) {
        staffPane.appendChild(existingStaffAccountsPanel);
      }

      existingStaffAccountsPanel.style.marginTop = "18px";
      existingStaffAccountsPanel.style.gridColumn = "1 / -1";
      existingStaffAccountsPanel.style.width = "100%";
    }

    const dataPane =
      settingsPage.querySelector('[data-settings-pane="data"]');

    if (existingDataManagementPanel && dataPane) {
      const empty = dataPane.querySelector(".hxl-settings-empty-card");
      if (empty) empty.remove();

      if (!dataPane.contains(existingDataManagementPanel)) {
        dataPane.appendChild(existingDataManagementPanel);
      }

      existingDataManagementPanel.style.marginTop = "0";
      existingDataManagementPanel.style.gridColumn = "1 / -1";
      existingDataManagementPanel.style.width = "100%";
    }

    const dangerPane =
      settingsPage.querySelector('[data-settings-pane="danger"]');

    if (existingFactoryResetPanel && dangerPane) {
      const empty =
        dangerPane.querySelector(".hxl-settings-empty-card");

      if (empty) empty.remove();

      if (!dangerPane.contains(existingFactoryResetPanel)) {
        dangerPane.appendChild(existingFactoryResetPanel);
      }

      existingFactoryResetPanel.style.marginTop = "0";
      existingFactoryResetPanel.style.gridColumn = "1 / -1";
      existingFactoryResetPanel.style.width = "100%";
    }

    function activateSettingsPane(target) {
      const validTarget = paneInfo[target] ? target : "overview";

      settingsPage
        .querySelectorAll("[data-settings-pane]")
        .forEach(function (pane) {
          const active = pane.dataset.settingsPane === validTarget;
          pane.hidden = !active;
          pane.classList.toggle("active", active);
        });

      navButtons.forEach(function (button) {
        const active =
          button.dataset.settingsTarget === validTarget;

        button.classList.toggle("active", active);
        button.setAttribute(
          "aria-current",
          active ? "page" : "false"
        );
      });

      settingsPage.dataset.activeSettingsPane = validTarget;
    }

    navButtons.forEach(function (button) {
      if (button.dataset.hxlSettingsBound === "1") return;

      button.dataset.hxlSettingsBound = "1";

      button.addEventListener("click", function (event) {
        event.preventDefault();
        activateSettingsPane(button.dataset.settingsTarget);
      });
    });

    const initiallyActive =
      navButtons.find(function (button) {
        return button.classList.contains("active");
      });

    activateSettingsPane(
      initiallyActive
        ? initiallyActive.dataset.settingsTarget
        : "overview"
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initSystemSettingsV2,
      { once: true }
    );
  } else {
    initSystemSettingsV2();
  }
})();



