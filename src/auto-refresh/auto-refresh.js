Office.onReady(function () {

  const refreshConnections =
    document.getElementById("refreshConnections");

  const refreshPivots =
    document.getElementById("refreshPivots");

  const recalculateFormulas =
    document.getElementById("recalculateFormulas");

  const intervalSection =
    document.getElementById("intervalSection");

  const intervalInput =
    document.getElementById("intervalInput");

  const refreshInfoBtn =
    document.getElementById("refreshInfoBtn");

  const refreshNowBtn =
    document.getElementById("refreshNowBtn");

  const startBtn =
    document.getElementById("startBtn");

  const stopBtn =
    document.getElementById("stopBtn");

  const status =
    document.getElementById("status");


  if (
    !refreshConnections ||
    !refreshPivots ||
    !recalculateFormulas ||
    !intervalInput ||
    !refreshInfoBtn ||
    !refreshNowBtn ||
    !startBtn ||
    !stopBtn ||
    !status
  ) {
    return;
  }


  let autoRefreshTimer = null;
  let nextRefreshAt = null;


  Office.context.ui.addHandlerAsync(
    Office.EventType.DialogParentMessageReceived,

    function (arg) {

      try {

        const payload =
          JSON.parse(arg.message);


        if (
          payload.type ===
          "HXL_AUTO_REFRESH_INFO"
        ) {

          status.textContent =
            "Ready.\n" +
            "Workbook: " +
            (payload.workbookName || "Current Workbook") +
            "\nActive Sheet: " +
            (payload.sheetName || "-");

          return;
        }


        if (
          payload.type ===
          "HXL_AUTO_REFRESH_RESULT"
        ) {

          if (payload.success) {

            const timeText =
              payload.time || "";

            status.textContent =
              "Refresh completed successfully." +
              (
                timeText
                  ? "\nLast refresh: " + timeText
                  : ""
              ) +
              (
                nextRefreshAt
                  ? "\nNext refresh: " +
                    nextRefreshAt.toLocaleTimeString()
                  : ""
              );

          } else {

            status.textContent =
              "Error: " +
              (
                payload.message ||
                "Refresh failed."
              );

          }


          return;
        }

      } catch (error) {

        console.error(
          "Auto Refresh message error:",
          error
        );

        status.textContent =
          "Unable to process Auto Refresh response.";

      }

    }
  );


  document
    .querySelectorAll(
      'input[name="refreshMode"]'
    )
    .forEach(function (radio) {

      radio.addEventListener(
        "change",
        function () {

          updateModeUI();

        }
      );

    });


  refreshInfoBtn.addEventListener(
    "click",
    function () {

      requestInfo();

    }
  );


  refreshNowBtn.addEventListener(
    "click",
    function () {

      runRefresh();

    }
  );


  startBtn.addEventListener(
    "click",
    function () {

      startAutoRefresh();

    }
  );


  stopBtn.addEventListener(
    "click",
    function () {

      stopAutoRefresh();

    }
  );


  function getMode() {

    const selected =
      document.querySelector(
        'input[name="refreshMode"]:checked'
      );


    return selected
      ? selected.value
      : "now";

  }


  function updateModeUI() {

    const mode =
      getMode();


    if (mode === "auto") {

      intervalSection.style.display =
        "block";

      refreshNowBtn.style.display =
        "none";

      startBtn.style.display =
        "inline-block";

      stopBtn.style.display =
        "inline-block";

    } else {

      intervalSection.style.display =
        "none";

      refreshNowBtn.style.display =
        "inline-block";

      startBtn.style.display =
        "none";

      stopBtn.style.display =
        "none";

    }

  }


  function getTargets() {

    return {
      connections:
        !!refreshConnections.checked,

      pivots:
        !!refreshPivots.checked,

      calculate:
        !!recalculateFormulas.checked
    };

  }


  function validateTargets() {

    const targets =
      getTargets();


    if (
      !targets.connections &&
      !targets.pivots &&
      !targets.calculate
    ) {

      status.textContent =
        "Select at least one refresh target.";

      return false;

    }


    return true;

  }


  function requestInfo() {

    status.textContent =
      "Reading workbook information...";


    Office.context.ui.messageParent(
      JSON.stringify({
        type:
          "HXL_GET_AUTO_REFRESH_INFO"
      })
    );

  }


  function runRefresh() {

    if (
      !validateTargets()
    ) {
      return;
    }


    const targets =
      getTargets();


    status.textContent =
      "Refreshing workbook...";


    Office.context.ui.messageParent(
      JSON.stringify({

        type:
          "HXL_RUN_AUTO_REFRESH",

        targets:
          targets

      })
    );

  }


  function startAutoRefresh() {

    if (
      !validateTargets()
    ) {
      return;
    }


    const minutes =
      Number(intervalInput.value);


    if (
      !Number.isFinite(minutes) ||
      minutes < 1 ||
      minutes > 1440
    ) {

      status.textContent =
        "Interval must be between 1 and 1440 minutes.";

      return;

    }


    stopAutoRefresh(false);


    runRefresh();


    const intervalMs =
      minutes * 60 * 1000;


    nextRefreshAt =
      new Date(
        Date.now() + intervalMs
      );


    autoRefreshTimer =
      setInterval(
        function () {

          runRefresh();

          nextRefreshAt =
            new Date(
              Date.now() + intervalMs
            );

        },
        intervalMs
      );


    startBtn.disabled =
      true;

    stopBtn.disabled =
      false;


    status.textContent =
      "Auto Refresh started." +
      "\nInterval: " +
      minutes +
      " minute(s)." +
      "\nNext refresh: " +
      nextRefreshAt.toLocaleTimeString();

  }


  function stopAutoRefresh(showStatus) {

    if (
      autoRefreshTimer !== null
    ) {

      clearInterval(
        autoRefreshTimer
      );

      autoRefreshTimer =
        null;

    }


    nextRefreshAt =
      null;


    startBtn.disabled =
      false;

    stopBtn.disabled =
      true;


    if (
      showStatus !== false
    ) {

      status.textContent =
        "Auto Refresh stopped.";

    }

  }


  updateModeUI();

  requestInfo();

});