(function(){"use strict";
const API="https://himanshu-xl-tools-license-api.himanshuchinchekar25.workers.dev";
const views=[...document.querySelectorAll(".view")],nav=[...document.querySelectorAll(".nav")],title=document.getElementById("pageTitle"),modal=document.getElementById("loginModal"),sidebar=document.querySelector(".sidebar");
const names={dashboard:"Customer Dashboard",profile:"My Profile",license:"My License",downloads:"Download Center",devices:"My Devices",updates:"Product Updates",orders:"Orders & Payments",support:"Support Center",security:"Security"};
let token=sessionStorage.getItem("hxl_customer_session")||"";
function show(id){views.forEach(v=>v.classList.toggle("active",v.id===id));nav.forEach(n=>n.classList.toggle("active",n.dataset.view===id));title.textContent=names[id]||"Customer Portal";sidebar.classList.remove("open");window.scrollTo({top:0,behavior:"smooth"});}
nav.forEach(n=>n.addEventListener("click",()=>show(n.dataset.view)));document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.go)));
function openLogin(){modal.classList.add("open");modal.setAttribute("aria-hidden","false");} function closeLogin(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true");}
document.getElementById("signInBtn").addEventListener("click",()=>token?signOut():openLogin());
const sideSignOutBtn=document.getElementById("sideSignOutBtn");if(sideSignOutBtn)sideSignOutBtn.addEventListener("click",signOut);document.querySelectorAll(".gated").forEach(b=>b.addEventListener("click",()=>token?show("downloads"):openLogin()));document.getElementById("closeModal").addEventListener("click",closeLogin);modal.addEventListener("click",e=>{if(e.target===modal)closeLogin();});document.getElementById("menuBtn").addEventListener("click",()=>sidebar.classList.toggle("open"));
function signOut(){sessionStorage.removeItem("hxl_customer_session");token="";location.reload();}
function setText(sel,value){const e=document.querySelector(sel);if(e)e.textContent=value==null?"â€”":value;}
function escapeHtml(v){return String(v||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","\'":"&#39;"}[c]||c));}
function initials(v){return String(v||"HX").trim().split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()||"HX";}

function renderProfile(profile){
    const customerId=document.getElementById("profileCustomerId");
    const email=document.getElementById("profileEmail");
    const fullName=document.getElementById("profileFullName");
    const mobile=document.getElementById("profileMobile");
    const companyName=document.getElementById("profileCompanyName");
    const country=document.getElementById("profileCountry");
    const notice=document.getElementById("profileCompletionNotice");

    if(customerId) customerId.value=profile.customerId||"";
    if(email) email.value=profile.email||"";
    if(fullName) fullName.value=profile.fullName||"";
    if(mobile) mobile.value=profile.mobile||"";
    if(companyName) companyName.value=profile.companyName||"";
    if(country) country.value=profile.country||"";

    const full=String(profile.fullName||"").trim();
    const first=full?full.split(/\s+/)[0]:"Customer";
    const welcome=document.getElementById("welcomeHeading");
    if(welcome&&full) welcome.innerHTML=`Welcome back, <em>${escapeHtml(first)}!</em>`;
    setText("#headerCustomerName",full||"Customer");
    setText("#headerCustomerEmail",profile.email||"Secure account");
    setText("#overviewName",full||"â€”");
    setText("#overviewEmail",profile.email||"â€”");
    setText("#overviewCompany",profile.companyName||"â€”");
    setText("#overviewCountry",profile.country||"â€”");
    const avatar=document.getElementById("headerAvatar");if(avatar&&full)avatar.textContent=initials(full);

    const incomplete=
        !String(profile.fullName||"").trim() ||
        !String(profile.mobile||"").trim() ||
        !String(profile.companyName||"").trim() ||
        !String(profile.country||"").trim();

    if(notice) notice.hidden=!incomplete;
}

async function loadProfile(){
    if(!token)return;

    const message=document.getElementById("profileMessage");

    try{
        const response=await fetch(
            API+"/customer/profile",
            {
                headers:{
                    Authorization:"Bearer "+token
                }
            }
        );

        const data=await response.json();

        if(!response.ok || !data.profile){
            throw new Error(data.reasonCode||"PROFILE_LOAD_FAILED");
        }

        renderProfile(data.profile);

        if(message) message.textContent="";
    }catch(error){
        if(message) message.textContent="Unable to load profile.";
    }
}

async function saveProfile(){
    if(!token){
        openLogin();
        return;
    }

    const button=document.getElementById("profileSaveBtn");
    const message=document.getElementById("profileMessage");

    const fullName=document.getElementById("profileFullName");
    const mobile=document.getElementById("profileMobile");
    const companyName=document.getElementById("profileCompanyName");
    const country=document.getElementById("profileCountry");

    if(!fullName)return;

    const payload={
        fullName:fullName.value.trim(),
        mobile:mobile?mobile.value.trim():"",
        companyName:companyName?companyName.value.trim():"",
        country:country?country.value.trim():""
    };

    if(!payload.fullName){
        if(message)message.textContent="Full Name is required.";
        fullName.focus();
        return;
    }

    if(button){
        button.disabled=true;
        button.textContent="Saving...";
    }

    if(message)message.textContent="";

    try{
        const response=await fetch(
            API+"/customer/profile",
            {
                method:"PUT",
                headers:{
                    Authorization:"Bearer "+token,
                    "Content-Type":"application/json"
                },
                body:JSON.stringify(payload)
            }
        );

        const data=await response.json();

        if(!response.ok){
            throw new Error(data.reasonCode||"PROFILE_SAVE_FAILED");
        }

        if(message)message.textContent="Profile saved successfully.";

        await loadProfile();

        /* Refresh account so all portal views use latest DB values. */
        const accountResponse=await fetch(
            API+"/customer/me",
            {
                headers:{
                    Authorization:"Bearer "+token
                }
            }
        );

        if(accountResponse.ok){
            const accountData=await accountResponse.json();
            if(accountData.account)renderAccount(accountData.account);
        }
    }catch(error){
        if(message)message.textContent="Unable to save profile.";
    }finally{
        if(button){
            button.disabled=false;
            button.textContent="Save Changes";
        }
    }
}

const profileForm=document.getElementById("customerProfileForm");

if(profileForm){
    profileForm.addEventListener("submit",async function(event){
        event.preventDefault();
        await saveProfile();
    });
}
async function loadRelease(){if(!token)return;try{const r=await fetch(API+"/customer/release",{headers:{Authorization:"Bearer "+token}});const d=await r.json();if(!r.ok||!d.release)throw new Error("release");const x=d.release;setText("#releaseName",`Himanshu XL Tools v${x.version}`);setText("#releaseMeta",`${x.fileName}${x.releaseDate?" â€¢ "+x.releaseDate:""}`);setText("#releaseHash",x.sha256?`SHA-256: ${x.sha256}`:"Checksum will be published with the release.");setText("#updateVersion",`Himanshu XL Tools v${x.version}`);setText("#updateNotes",x.notes);setText("#dashboardReleaseName",`Himanshu XL Tools v${x.version}`);setText("#dashboardReleaseMeta",`${x.fileName}${x.releaseDate?" â€¢ "+x.releaseDate:""}`);setText("#dashboardUpdateTitle",`Latest approved: v${x.version}`);setText("#dashboardUpdateText",x.notes||"Your approved release is ready.");const b=document.getElementById("downloadInstallerBtn");if(b){b.textContent=x.published&&x.downloadConfigured?"Download Setup":"Release unavailable";b.disabled=!(x.published&&x.downloadConfigured);}}catch{const b=document.getElementById("downloadInstallerBtn");if(b){b.textContent="Release unavailable";b.disabled=true;}}}
async function loadOrders(){if(!token)return;try{const r=await fetch(API+"/customer/orders",{headers:{Authorization:"Bearer "+token}}),d=await r.json();if(!r.ok)throw new Error("orders");const a=d.orders||[],e=document.getElementById("purchaseStatusText");const summary=a.length?`${a[0].order_id} â€¢ ${a[0].status} â€¢ ${a[0].plan_code}`:"No website orders yet.";if(e)e.textContent=summary;setText("#ordersPageStatus",summary);}catch{const e=document.getElementById("purchaseStatusText");if(e)e.textContent="Order history is temporarily unavailable.";setText("#ordersPageStatus","Order history is temporarily unavailable.");}}
function renderAccount(a){
    document.getElementById("signInBtn").textContent="Sign out";
    const chip=document.getElementById("accountChip");if(chip)chip.hidden=false;
    const side=document.getElementById("sideSignOutBtn");if(side)side.hidden=false;

    const rawMaskedKey = String(a.licenseKeyMasked || "");
const lastPart = rawMaskedKey.split("-").filter(Boolean).pop() || "****";
const safeMaskedKey = "HXL-****-****-****-" + lastPart.slice(-4);
setText("#license .license-card h3", safeMaskedKey);

    const ds=document.querySelectorAll("#license .detail-grid strong");
    if(ds.length>=4){
        ds[0].textContent=a.planCode||"â€”";
        ds[1].textContent=a.licenseStatus||"â€”";
        ds[2].textContent=a.expiryDate||"â€”";
        ds[3].textContent=`${a.activeDevices||0} / ${a.maxDevices||1}`;
    }

    const pill=document.querySelector("#license .pill");
    if(pill){
        pill.textContent=a.licenseStatus||"ACTIVE";
    }

    const licenseStatus=document.getElementById("dashboardLicenseStatus");
    const licenseMeta=document.getElementById("dashboardLicenseMeta");
    const deviceStatus=document.getElementById("dashboardDeviceStatus");
    const deviceMeta=document.getElementById("dashboardDeviceMeta");
    const renewalStatus=document.getElementById("dashboardRenewalStatus");
    const renewalMeta=document.getElementById("dashboardRenewalMeta");

    if(licenseStatus){
        licenseStatus.textContent=a.licenseStatus||"â€”";
    }

    setText("#dashboardPlanStatus",a.planCode||"â€”");
    setText("#dashboardPlanMeta",a.planCode?`${a.planCode} licensed plan`:"Plan information unavailable.");
    setText("#devicesActiveCount",`${a.activeDevices||0} / ${a.maxDevices||1}`);
    setText("#devicesLimit",a.maxDevices||1);
    setText("#devicesActiveMeta",(a.activeDevices||0)>0?"Device activation is active.":"No device activated yet.");
    setText("#dashboardDeviceSummary",`${a.activeDevices||0} of ${a.maxDevices||1} permitted device(s) currently active.`);

    if(licenseMeta){
        licenseMeta.textContent=a.planCode
            ? `${a.planCode} plan`
            : "License information available.";
    }

    if(deviceStatus){
        deviceStatus.textContent=
            `${a.activeDevices||0} / ${a.maxDevices||1} devices`;
    }

    if(deviceMeta){
        deviceMeta.textContent=
            (a.activeDevices||0)>0
                ? "Device activation is active."
                : "No device activated yet.";
    }

    if(renewalStatus){
        renewalStatus.textContent=a.expiryDate||"â€”";
    }

    if(renewalMeta){
        renewalMeta.textContent=a.expiryDate
            ? `License valid until ${a.expiryDate}.`
            : "Expiry information unavailable.";
    }
}
async function loadAccount(){if(!token)return;try{const r=await fetch(API+"/customer/me",{headers:{Authorization:"Bearer "+token}});if(!r.ok)throw new Error("session");renderAccount(await r.json().then(x=>x.account));await loadProfile();await loadRelease();await loadOrders();}catch{signOut();}}
const form=document.getElementById("customerLoginForm");if(form)form.addEventListener("submit",async e=>{e.preventDefault();const btn=form.querySelector("button[type=submit]"),msg=document.getElementById("loginMessage");btn.disabled=true;msg.textContent="Signing inâ€¦";try{const r=await fetch(API+"/customer/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:form.email.value.trim(),licenseKey:form.licenseKey.value.trim()})});const d=await r.json();if(!r.ok||!d.token)throw new Error(d.reasonCode||"LOGIN_FAILED");token=d.token;sessionStorage.setItem("hxl_customer_session",token);msg.textContent="Signed in securely.";closeLogin();await loadAccount();}catch(err){msg.textContent="Sign in failed. Check email and license key.";}finally{btn.disabled=false;}});
const dl=document.getElementById("downloadInstallerBtn");if(dl)dl.addEventListener("click",async e=>{if(!token)return;e.preventDefault();const oldText=dl.textContent;dl.disabled=true;dl.textContent="Preparing downloadâ€¦";try{const r=await fetch(API+"/customer/download",{headers:{Authorization:"Bearer "+token}});if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.reasonCode||"DOWNLOAD_FAILED");}const blob=await r.blob();const cd=r.headers.get("content-disposition")||"";const m=/filename="?([^";]+)"?/i.exec(cd);const name=m&&m[1]?m[1]:"HimanshuXLTools-Setup.exe";const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}catch(err){alert(err.message||"Download is not available yet.");}finally{dl.disabled=false;dl.textContent=oldText;}});
loadAccount();
})();


