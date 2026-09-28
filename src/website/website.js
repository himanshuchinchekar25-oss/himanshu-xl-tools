(function(){"use strict";const API_BASE="https://himanshu-xl-tools-license-api.himanshuchinchekar25.workers.dev";const $=id=>document.getElementById(id);function money(minor,currency){return new Intl.NumberFormat("en-IN",{style:"currency",currency:currency||"INR",maximumFractionDigits:2}).format(Number(minor||0)/100);}function show(id,on){const e=$(id);if(e)e.classList.toggle("hidden",!on);}async function loadPublicPricing(){try{const r=await fetch(`${API_BASE}/public/plans`,{headers:{Accept:"application/json"}});const data=await r.json();if(!r.ok||!data.success)throw new Error(data.reasonCode||`HTTP_${r.status}`);const p=(data.plans||[]).find(x=>String(x.plan_code).toUpperCase()==="STANDARD");if(!p)throw new Error("STANDARD_PLAN_NOT_FOUND");const regular=Number(p.regular_price_minor??p.price_minor),effective=Number(p.effective_price_minor??p.price_minor),offer=p.offer||{active:false};$("standardPlanName").textContent=p.display_name||"Standard";$("standardPrice").textContent=money(effective,p.currency);$("standardValidity").textContent=`${Number(p.validity_days)||365} days license`;$("standardDevices").textContent=`${Number(p.max_devices)||1} device`;$("standardBuyButton").disabled=Number(p.buy_enabled)!==1||String(p.status)!=="ACTIVE";$("standardBuyButton").textContent=$("standardBuyButton").disabled?"Currently unavailable":"Get Himanshu XL Tools";show("standardRegularPrice",offer.active);show("standardSaving",offer.active);show("standardOfferName",offer.active&&offer.name);show("standardOfferEnds",offer.active&&offer.ends_at);if(offer.active){$("standardRegularPrice").textContent=money(regular,p.currency);$("standardSaving").textContent=`You save ${money(regular-effective,p.currency)}`;$("standardOfferName").textContent=offer.name||"Special Offer";$("standardOfferBadge").textContent=offer.badge||"SPECIAL OFFER";if(offer.ends_at)$("standardOfferEnds").textContent=`Offer ends ${new Date(offer.ends_at).toLocaleString("en-IN")}`;}else{$("standardOfferBadge").textContent="STANDARD";}if(offer.ends_at){const ms=Date.parse(offer.ends_at)-Date.now();if(ms>0&&ms<2147483647)setTimeout(loadPublicPricing,ms+1000);}}catch(e){$("standardPrice").textContent="Price temporarily unavailable";$("pricingIntro").textContent="Please try again shortly.";}}document.getElementById("year").textContent=new Date().getFullYear();/* K7_6_REGISTRATION_FLOW */

let registrationId="";
let verifiedRegistration=null;

const registrationModal=$("customerRegistrationModal");
const accountStep=$("registrationStepAccount");
const verifyStep=$("registrationStepVerify");
const verifiedStep=$("registrationStepVerified");

function setRegistrationStep(step){
    if(accountStep)accountStep.classList.toggle("hidden",step!=="account");
    if(verifyStep)verifyStep.classList.toggle("hidden",step!=="verify");
    if(verifiedStep)verifiedStep.classList.toggle("hidden",step!=="verified");
}

function openRegistration(){
    if(!registrationModal)return;

    registrationModal.classList.add("open");
    registrationModal.setAttribute("aria-hidden","false");

    registrationId="";
    verifiedRegistration=null;

    const message=$("registrationMessage");
    const verifyMessage=$("verificationMessage");

    if(message){
        message.textContent="";
        message.classList.remove("error","success");
    }

    if(verifyMessage){
        verifyMessage.textContent="";
        verifyMessage.classList.remove("error","success");
    }

    setRegistrationStep("account");
}

function closeRegistration(){
    if(!registrationModal)return;

    registrationModal.classList.remove("open");
    registrationModal.setAttribute("aria-hidden","true");
}

document.querySelectorAll("[data-buy]").forEach(function(el){
    el.addEventListener("click",function(){
        openRegistration();
    });
});

const registrationClose=$("registrationClose");

if(registrationClose){
    registrationClose.addEventListener("click",closeRegistration);
}

if(registrationModal){
    registrationModal.addEventListener("click",function(event){
        if(event.target===registrationModal){
            closeRegistration();
        }
    });
}

const registrationForm=$("customerRegistrationForm");

if(registrationForm){
    registrationForm.addEventListener("submit",async function(event){
        event.preventDefault();

        const button=$("registrationContinueBtn");
        const message=$("registrationMessage");

        const payload={
            fullName:$("registrationFullName").value.trim(),
            email:$("registrationEmail").value.trim(),
            mobile:$("registrationMobile").value.trim(),
            companyName:$("registrationCompany").value.trim(),
            country:$("registrationCountry").value.trim()
        };

        if(message){
            message.textContent="";
            message.classList.remove("error","success");
        }

        button.disabled=true;
        button.textContent="Sending verification code...";

        try{
            const response=await fetch(
                API_BASE+"/customer/register",
                {
                    method:"POST",
                    headers:{
                        "Content-Type":"application/json",
                        Accept:"application/json"
                    },
                    body:JSON.stringify(payload)
                }
            );

            const data=await response.json();

            if(!response.ok || !data.registrationId){
                throw new Error(
                    data.reasonCode||
                    "REGISTRATION_START_FAILED"
                );
            }

            registrationId=data.registrationId;

            if(message){
                message.textContent=
                    "Verification code sent.";
                message.classList.add("success");
            }

            setRegistrationStep("verify");
            startOtpResendTimer(60);

            const otp=$("registrationOtp");
            if(otp)otp.focus();

        }catch(error){
            if(message){
                message.textContent=
                    error.message==="EMAIL_ALREADY_REGISTERED"
                    ? "This email already has a customer account. Please use Customer Login."
                    : "Unable to start registration. Please try again.";

                message.classList.add("error");
            }
        }finally{
            button.disabled=false;
            button.textContent="Continue";
        }
    });
}


/* K7_6_OTP_RESEND_UI */
let resendTimerHandle=null;
let resendRemaining=0;
let resendBusy=false;

function stopOtpResendTimer(){
    if(resendTimerHandle){
        clearInterval(resendTimerHandle);
        resendTimerHandle=null;
    }
}

function renderOtpResendState(){
    const button=$("registrationResendBtn");
    const timer=$("registrationResendTimer");
    const text=$("registrationResendText");

    if(timer){
        timer.textContent=String(
            Math.max(0,resendRemaining)
        );
    }

    if(button){
        button.disabled=
            resendBusy ||
            resendRemaining>0 ||
            !registrationId;

        button.textContent=
            resendBusy
                ?"Sending..."
                :"Resend Code";
    }

    if(text){
        if(resendRemaining>0){
            text.innerHTML=
                'Didn&#39;t receive the code? '+
                'Resend available in <strong id="registrationResendTimer">'+
                resendRemaining+
                '</strong>s';
        }else{
            text.textContent=
                "Didn't receive the code? You can resend it now.";
        }
    }
}

function startOtpResendTimer(seconds){
    stopOtpResendTimer();

    resendRemaining=
        Math.max(
            0,
            Number(seconds)||60
        );

    renderOtpResendState();

    if(resendRemaining<=0)return;

    resendTimerHandle=setInterval(function(){
        resendRemaining=Math.max(
            0,
            resendRemaining-1
        );

        renderOtpResendState();

        if(resendRemaining<=0){
            stopOtpResendTimer();
            renderOtpResendState();
        }
    },1000);
}

const resendButton=$("registrationResendBtn");

if(resendButton){
    resendButton.addEventListener(
        "click",
        async function(){

            if(
                resendBusy ||
                resendRemaining>0 ||
                !registrationId
            ){
                return;
            }

            const message=$("verificationMessage");

            resendBusy=true;
            renderOtpResendState();

            if(message){
                message.textContent="";
                message.classList.remove(
                    "error",
                    "success"
                );
            }

            try{
                const response=await fetch(
                    API_BASE+
                    "/customer/register/resend",
                    {
                        method:"POST",
                        headers:{
                            "Content-Type":
                                "application/json",
                            Accept:"application/json"
                        },
                        body:JSON.stringify({
                            registrationId
                        })
                    }
                );

                const data=await response.json();

                if(!response.ok){
                    if(
                        data.reasonCode===
                        "OTP_RESEND_COOLDOWN"
                    ){
                        startOtpResendTimer(
                            data.retryAfterSeconds||60
                        );

                        throw new Error(
                            "OTP_RESEND_COOLDOWN"
                        );
                    }

                    throw new Error(
                        data.reasonCode||
                        "OTP_RESEND_FAILED"
                    );
                }

                const otp=$("registrationOtp");
                if(otp){
                    otp.value="";
                    otp.focus();
                }

                if(message){
                    message.textContent=
                        "A new verification code was sent. The previous code is no longer valid.";
                    message.classList.add("success");
                }

                startOtpResendTimer(
                    data.resendCooldownSeconds||60
                );

            }catch(error){

                if(
                    message &&
                    error.message===
                    "OTP_RESEND_COOLDOWN"
                ){
                    message.textContent=
                        "Please wait before requesting another code.";
                    message.classList.add("error");
                }else if(message){
                    message.textContent=
                        "Unable to resend verification code. Please try again.";
                    message.classList.add("error");
                }

            }finally{
                resendBusy=false;
                renderOtpResendState();
            }
        }
    );
}
/* END K7_6_OTP_RESEND_UI */
const verificationForm=$("customerVerificationForm");

if(verificationForm){
    verificationForm.addEventListener("submit",async function(event){
        event.preventDefault();

        const button=$("registrationVerifyBtn");
        const message=$("verificationMessage");
        const code=$("registrationOtp").value.trim();

        if(!registrationId){
            setRegistrationStep("account");
            return;
        }

        if(message){
            message.textContent="";
            message.classList.remove("error","success");
        }

        button.disabled=true;
        button.textContent="Verifying...";

        try{
            const response=await fetch(
                API_BASE+"/customer/register/verify",
                {
                    method:"POST",
                    headers:{
                        "Content-Type":"application/json",
                        Accept:"application/json"
                    },
                    body:JSON.stringify({
                        registrationId,
                        code
                    })
                }
            );

            const data=await response.json();

            if(!response.ok){
                throw new Error(
                    data.reasonCode||
                    "VERIFICATION_FAILED"
                );
            }

            verifiedRegistration={
                registrationId,
                fullName:$("registrationFullName").value.trim(),
                email:$("registrationEmail").value.trim(),
                mobile:$("registrationMobile").value.trim(),
                companyName:$("registrationCompany").value.trim(),
                country:$("registrationCountry").value.trim()
            };

            if(message){
                message.textContent="Email verified.";
                message.classList.add("success");
            }

            setRegistrationStep("verified");

        }catch(error){
            if(message){
                if(error.message==="VERIFICATION_CODE_INCORRECT"){
                    message.textContent="Incorrect verification code.";
                }else if(error.message==="VERIFICATION_CODE_EXPIRED"){
                    message.textContent="Verification code expired. Start registration again.";
                }else{
                    message.textContent="Unable to verify email.";
                }

                message.classList.add("error");
            }
        }finally{
            button.disabled=false;
            button.textContent="Verify Email";
        }
    });
}

const registrationBack=$("registrationBackBtn");

if(registrationBack){
    registrationBack.addEventListener("click",function(){
        setRegistrationStep("account");
    });
}

const checkoutButton=$("registrationCheckoutBtn");

if(checkoutButton){
    checkoutButton.addEventListener("click",async function(){

        if(!verifiedRegistration || !registrationId){
            setRegistrationStep("account");
            return;
        }

        const originalText=checkoutButton.textContent;

        checkoutButton.disabled=true;
        checkoutButton.textContent="Creating secure order...";

        try{

            const response=await fetch(
                API_BASE+"/checkout/verified-order",
                {
                    method:"POST",
                    headers:{
                        "Content-Type":"application/json",
                        Accept:"application/json"
                    },
                    body:JSON.stringify({
                        registrationId,
                        planCode:"STANDARD"
                    })
                }
            );

            const data=await response.json();

            if(!response.ok || !data.order){
                throw new Error(
                    data.reasonCode||
                    "ORDER_CREATE_FAILED"
                );
            }

            sessionStorage.setItem(
                "hxl_pending_order",
                JSON.stringify({
                    orderId:data.order.orderId,
                    registrationId,
                    planCode:data.order.planCode,
                    amountMinor:data.order.amountMinor,
                    currency:data.order.currency
                })
            );

            /* K7_6_CASHFREE_SANDBOX_CHECKOUT */
            checkoutButton.textContent="Opening Cashfree checkout...";

            const paymentResponse=await fetch(API_BASE+"/payments/cashfree/create-order",{
                method:"POST",
                headers:{"Content-Type":"application/json",Accept:"application/json"},
                body:JSON.stringify({orderId:data.order.orderId,registrationId})
            });
            const paymentData=await paymentResponse.json();
            if(!paymentResponse.ok||!paymentData.paymentSessionId)throw new Error(paymentData.reasonCode||"CASHFREE_ORDER_CREATE_FAILED");

            if(typeof window.Cashfree!=="function"){
                await new Promise(function(resolve,reject){
                    const script=document.createElement("script");
                    script.src="https://sdk.cashfree.com/js/v3/cashfree.js";
                    script.onload=resolve; script.onerror=function(){reject(new Error("CASHFREE_SDK_LOAD_FAILED"));};
                    document.head.appendChild(script);
                });
            }

            const cashfree=window.Cashfree({mode:"sandbox"});
            await cashfree.checkout({paymentSessionId:paymentData.paymentSessionId,redirectTarget:"_modal"});

            checkoutButton.textContent="Verifying payment...";
            const verifyResponse=await fetch(API_BASE+"/payments/cashfree/verify",{
                method:"POST",
                headers:{"Content-Type":"application/json",Accept:"application/json"},
                body:JSON.stringify({orderId:data.order.orderId,registrationId})
            });
            const verifyData=await verifyResponse.json();
            if(!verifyResponse.ok||!(verifyData.success===true||verifyData.status==="FULFILLED"||verifyData.status==="FULFILLED_EMAIL_PENDING"||verifyData.status==="ALREADY_FULFILLED"))throw new Error(verifyData.reasonCode||verifyData.status||"PAYMENT_VERIFY_FAILED");

            sessionStorage.setItem("hxl_payment_result",JSON.stringify({orderId:data.order.orderId,status:verifyData.status||"FULFILLED",provider:"CASHFREE"}));
            checkoutButton.disabled=true;
            checkoutButton.textContent="Payment Successful - License Created";
            setTimeout(function(){window.location.href="customer-portal.html";},1800);

        }catch(error){

            checkoutButton.disabled=false;

            if(
                error.message==="EMAIL_VERIFICATION_REQUIRED"
            ){
                checkoutButton.textContent=
                    "Email verification required";
            }else{
                checkoutButton.textContent=originalText;
                alert(
                    "Unable to create secure order. Please try again."
                );
            }
        }
    });
}

/* END K7_6_REGISTRATION_FLOW */document.querySelectorAll("[data-portal]").forEach(function(el){el.addEventListener("click",function(){window.location.href="customer-portal.html";});});loadPublicPricing();})();
