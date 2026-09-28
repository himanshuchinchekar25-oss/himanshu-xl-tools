import "./dashboard-view.css";


// ============================================================
// INDEPENDENT DASHBOARD VIEW — STORAGE
// ============================================================

const DASHBOARD_LAST_DRAFT_KEY =
  "HXLT_POWER_DASHBOARD_LAST_DRAFT";

const DASHBOARD_DRAFT_PREFIX =
  "HXLT_POWER_DASHBOARD_DRAFT_";

const DASHBOARD_VIEW_LAYOUT_PREFIX =
  "HXLT_POWER_DASHBOARD_VIEW_LAYOUT_";


// ============================================================
// VIEW STATE
// ============================================================

const dashboardViewState = {

  snapshot: null,

  slicerFilters: {},

  selectedObjectId: "",

  draggedObjectId: "",

  arrangeMode: false,

  screenMode: "auto",

  screenCapacity: null,

  undoStack: [],

  redoStack: []

};


// ============================================================
// INITIALIZE VIEW
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  initializeDashboardView
);


// ============================================================
// SCREEN CAPACITY - MEASUREMENT FOUNDATION
// ============================================================

function measureDashboardScreen() {
  const main =
    document.querySelector(".hxl-view-main");

  if (!main) {
    return;
  }

  const viewportWidth =
    document.documentElement.clientWidth;

  const viewportHeight =
    document.documentElement.clientHeight;

  const rectangle =
    main.getBoundingClientRect();

  const styles =
    window.getComputedStyle(main);

  const pixels = function (value) {
    return parseFloat(value) || 0;
  };

  const contentWidth = Math.max(
    0,
    main.clientWidth -
      pixels(styles.paddingLeft) -
      pixels(styles.paddingRight)
  );

  // Measure from the top of the page, independent of current scroll.
  const scrollTop = window.scrollY || 0;
  const documentTop = rectangle.top + scrollTop;

  const availableHeight = Math.max(
    0,
    viewportHeight - Math.max(0, documentTop)
  );

  const sections = [
    ["kpis", "viewKpiContainer"],
    ["charts", "viewChartContainer"],
    ["slicers", "viewSlicerContainer"],
    ["tables", "viewTableContainer"]
  ];

  const components = {};
  let contentBottom = documentTop + rectangle.height;

  sections.forEach(function (section) {
    const container = getViewElement(section[1]);
    let total = 0;
    let fullyVisible = 0;

    if (container) {
      Array.prototype.forEach.call(
        container.children,
        function (card) {
          if (
            !card.classList.contains("hxl-view-object") ||
            card.getClientRects().length === 0
          ) {
            return;
          }

          total += 1;

          const bounds = card.getBoundingClientRect();
          const top = bounds.top + scrollTop;
          const bottom = bounds.bottom + scrollTop;

          contentBottom = Math.max(contentBottom, bottom);

          const fitsHorizontally =
            bounds.left >= -1 &&
            bounds.right <= viewportWidth + 1;

          // getBoundingClientRect() values viewport-relative असतात.
// त्यामुळे vertical visibility सुद्धा त्याच coordinate
// system मध्ये calculate केली पाहिजे.
          const fitsVertically =
            bounds.top >= -1 &&
            bounds.bottom <= viewportHeight + 1;

          if (fitsHorizontally && fitsVertically) {
            fullyVisible += 1;
          }
        }
      );
    }

    components[section[0]] = {
      total: total,
      fullyVisibleAtTop: fullyVisible,
      outsideFirstScreen: total - fullyVisible
    };
  });

  const scrollNeeded = Math.max(
    0,
    Math.ceil(contentBottom - viewportHeight)
  );

  dashboardViewState.screenCapacity = {
    measuredAt: new Date().toISOString(),
    screenMode: dashboardViewState.screenMode,
    viewportWidth: viewportWidth,
    viewportHeight: viewportHeight,
    contentWidth: Math.round(contentWidth),
    documentTop: Math.round(documentTop),
    availableHeightAtTop: Math.round(availableHeight),
    scrollNeeded: scrollNeeded,
    components: components
  };

  dashboardViewState.screenCapacity.budget =
    estimateDashboardCapacityBudget(main, sections);

  const summary =
    getViewElement("screenCapacitySummary");

  if (summary) {
    const measurement = dashboardViewState.screenCapacity;

    const counts = sections.map(function (section) {
      const result = components[section[0]];

      return section[0].toUpperCase() + ": " +
        result.fullyVisibleAtTop + "/" + result.total;
    }).join(" | ");

        const totalCards = sections.reduce(
      function (total, section) {
        return total + components[section[0]].total;
      },
      0
    );

    const fullyVisibleCards = sections.reduce(
      function (total, section) {
        return total +
          components[section[0]].fullyVisibleAtTop;
      },
      0
    );

    const outsideCards =
      totalCards - fullyVisibleCards;

    let capacityStatus;
    let recommendation;

    if (totalCards === 0) {
      capacityStatus = "No cards";
      recommendation =
        "Add dashboard components in Studio.";
    } else if (outsideCards === 0 && scrollNeeded === 0) {
      capacityStatus = "Fits first screen";
      recommendation =
        "All cards fit within the first screen.";
    } else {
      capacityStatus = "Scrolling required";
      recommendation =
        outsideCards + " of " + totalCards +
        " cards are not fully visible on the first screen.";

      const healthPanel =
        getViewElement("healthPanel");

      if (healthPanel && !healthPanel.hidden) {
        recommendation +=
          " Close Health to free vertical space.";
      }

      if (measurement.screenMode === "compact") {
        recommendation +=
          " Try Auto screen to use more horizontal space.";
      }

      recommendation +=
        " Scroll down to view the remaining content.";
    }

    measurement.capacityStatus = capacityStatus;
    measurement.recommendation = recommendation;
    measurement.totalCards = totalCards;
    measurement.fullyVisibleCardsAtTop = fullyVisibleCards;
    measurement.outsideFirstScreen = outsideCards;

    const message =
      "Mode: " + measurement.screenMode +
      " | Viewport: " +
      viewportWidth + " x " + viewportHeight + " px" +
      " | Dashboard content width: " +
      measurement.contentWidth + " px\n" +
      "Available dashboard height at page top: " +
      measurement.availableHeightAtTop + " px\n" +
      "Fully visible cards at page top — " + counts +
      "\nScroll needed to reach dashboard bottom: " +
      scrollNeeded + " px\n" +
      "Screen capacity: " + capacityStatus +
      "\n" + recommendation +
      "\nStandalone card budget (Health closed, current section width): " +
      sections.map(function (section) {
        const estimate = measurement.budget[section[0]];
        return section[0].toUpperCase() + ": " +
          (estimate ? estimate.cards : "N/A");
      }).join(" | ") +
      "\nEach estimate assumes that section alone below the title. " +
      "Based on current card sizes and columns; do not add these counts.";

    summary.style.whiteSpace = "pre-line";

    if (summary.textContent !== message) {
      summary.textContent = message;
    }
  }
}


function estimateDashboardCapacityBudget(main, sections) {
  const health = getViewElement("healthPanel");
  const wasHidden = health ? health.hidden : true;
  const savedScrollX = window.scrollX;
  const savedScrollY = window.scrollY;
  const budget = {};
  const px = function (value) { return parseFloat(value) || 0; };

  // Read the Health-closed layout synchronously; restore before painting.
  try {
    if (health) health.hidden = true;
    const title = main.querySelector(".hxl-view-dashboard-head");
    const viewportHeight = document.documentElement.clientHeight;
    const viewportWidth = document.documentElement.clientWidth;
    const scrollTop = window.scrollY || 0;
    const titleBottom = title
      ? title.getBoundingClientRect().bottom + scrollTop
      : main.getBoundingClientRect().top + scrollTop;
    const bottomPadding = px(window.getComputedStyle(main).paddingBottom);

    sections.forEach(function (section) {
      const container = getViewElement(section[1]);
      const cards = container ? Array.prototype.filter.call(
        container.children, function (card) {
          return card.classList.contains("hxl-view-object") &&
            card.getClientRects().length > 0;
        }
      ) : [];
      if (!cards.length) {
        budget[section[0]] = null;
        return;
      }

      const containerStyles = window.getComputedStyle(container);
      const bounds = cards.map(function (card) {
        return card.getBoundingClientRect();
      });
      const firstTop = Math.min.apply(null, bounds.map(function (b) {
        return b.top;
      }));
      const columns = bounds.filter(function (b) {
        return Math.abs(b.top - firstTop) < 1;
      }).length;
      const maxHeight = Math.max.apply(null, cards.map(function (card, i) {
        const style = window.getComputedStyle(card);
        return bounds[i].height + Math.max(0, px(style.marginTop)) +
          Math.max(0, px(style.marginBottom));
      }));
      const gap = Math.max(0, px(containerStyles.rowGap));
      const wrapper = container.closest(".hxl-view-card");
      const block = wrapper || container;
      const blockStyles = window.getComputedStyle(block);
      const group = block.parentElement;
      const separation = group && group.classList.contains("hxl-view-content-grid")
        ? px(window.getComputedStyle(group).marginTop)
        : px(blockStyles.marginTop);
      const overhead = Math.max(0,
        container.getBoundingClientRect().top - block.getBoundingClientRect().top
      ) + px(blockStyles.paddingBottom) + px(blockStyles.borderBottomWidth);
      const height = Math.max(0,
        viewportHeight - titleBottom - separation - overhead - bottomPadding
      );
      const horizontalFit = bounds.every(function (b) {
        return b.left >= 0 && b.right <= viewportWidth;
      });
      const rows = horizontalFit && maxHeight > 0
        ? Math.max(0, Math.floor((height + gap) / (maxHeight + gap)))
        : 0;
      budget[section[0]] = {
        cards: rows * columns,
        rows: rows,
        columns: columns,
        availableHeight: Math.floor(height)
      };
    });
  } finally {
    if (health) health.hidden = wasHidden;
    if (window.scrollX !== savedScrollX || window.scrollY !== savedScrollY) {
      window.scrollTo(savedScrollX, savedScrollY);
    }
  }
  return budget;
}


function initializeDashboardScreenMeasurement() {
  if (initializeDashboardScreenMeasurement.started) {
    return;
  }

  initializeDashboardScreenMeasurement.started = true;

  let pendingFrame = null;

  const scheduleMeasurement = function () {
    if (pendingFrame !== null) {
      window.cancelAnimationFrame(pendingFrame);
    }

    pendingFrame = window.requestAnimationFrame(
      function () {
        pendingFrame = null;
        measureDashboardScreen();
      }
    );
  };

  window.addEventListener(
    "resize",
    scheduleMeasurement
  );

  const main =
    document.querySelector(".hxl-view-main");

  if (
    main &&
    typeof window.ResizeObserver === "function"
  ) {
    const observer =
      new window.ResizeObserver(scheduleMeasurement);

    observer.observe(main);

    initializeDashboardScreenMeasurement.observer =
      observer;
  }

  scheduleMeasurement();
}


function initializeDashboardView() {

  initializeViewControls();

  loadDashboardView();

  initializeDashboardScreenMeasurement();

}


// ============================================================
// ELEMENT HELPER
// ============================================================

function getViewElement(id) {

  return document.getElementById(id);

}


// ============================================================
// STATUS
// ============================================================

function setViewStatus(message) {

  const status =
    getViewElement("viewStatus");


  if (!status) {
    return;
  }


  status.textContent =
    String(message || "Ready");


  window.clearTimeout(
    setViewStatus.timer
  );


  setViewStatus.timer =
    window.setTimeout(
      function () {

        status.textContent =
          "Ready";

      },
      3500
    );

}


// ============================================================
// READ SAVED DASHBOARD
// ============================================================

function getSavedDashboardSnapshot() {

  try {

    const dashboardId =
      localStorage.getItem(
        DASHBOARD_LAST_DRAFT_KEY
      );


    if (!dashboardId) {
      return null;
    }


    const storageKey =
      DASHBOARD_DRAFT_PREFIX +
      String(dashboardId);


    const savedText =
      localStorage.getItem(
        storageKey
      );


    if (!savedText) {
      return null;
    }


    const snapshot =
      JSON.parse(savedText);


    if (
      !snapshot ||
      typeof snapshot !== "object"
    ) {
      return null;
    }


    return snapshot;

  }
  catch (error) {

    console.warn(
      "Unable to read dashboard snapshot:",
      error
    );


    return null;

  }

}


// ============================================================
// LOAD AND RENDER DASHBOARD
// ============================================================

function loadDashboardView() {

  setViewStatus(
    "Loading dashboard..."
  );


  const snapshot =
    getSavedDashboardSnapshot();


  dashboardViewState.snapshot =
    snapshot;


    if (!snapshot) {
    showDashboardEmptyState();

    updateDashboardHealth({});

    const healthBadge = getViewElement("healthBadge");

    if (healthBadge) {
      healthBadge.textContent = "No data";
    }

    window.requestAnimationFrame(function () {
      measureDashboardScreen();
    });

    setViewStatus(
      "Dashboard data is not available"
    );

    return;
  }


  hideDashboardEmptyState();

  renderDashboardHeader(snapshot);

  renderDashboardKpis(snapshot);

  renderDashboardSlicers(snapshot);

  renderDashboardCharts(snapshot);

  renderDashboardTables(snapshot);

    applyDashboardViewLayout(
    getSavedDashboardViewLayout()
  );

  updateDashboardHealth(snapshot);

  updateViewRefreshTime(snapshot);

  setViewStatus(
    "Dashboard loaded"
  );

}


// ============================================================
// EMPTY STATE
// ============================================================

function showDashboardEmptyState() {

  const emptyState =
    getViewElement("viewEmptyState");

  const containers = [
    "viewKpiContainer",
    "viewSlicerContainer",
    "viewChartContainer",
    "viewTableContainer"
  ];


  if (emptyState) {
    emptyState.hidden = false;
  }


  containers.forEach(
    function (id) {

      const element =
        getViewElement(id);


      if (element) {
        element.innerHTML = "";
      }

    }
  );

}


function hideDashboardEmptyState() {

  const emptyState =
    getViewElement("viewEmptyState");


  if (emptyState) {
    emptyState.hidden = true;
  }

}


// ============================================================
// HEADER
// ============================================================

function renderDashboardHeader(snapshot) {

  const title =
    getViewElement(
      "viewDashboardTitle"
    );

  const meta =
    getViewElement(
      "viewDashboardMeta"
    );

  const currency =
    getViewElement(
      "viewDashboardCurrency"
    );


  if (title) {

    title.textContent =
      snapshot.dashboardTitle ||
      "Sales Performance Dashboard";

  }


  if (meta) {

    const rowCount =
      Number(snapshot.rowCount || 0);

    const columnCount =
      Number(snapshot.columnCount || 0);


    meta.textContent =
      rowCount +
      " rows • " +
      columnCount +
      " columns";

  }


  if (currency) {

    currency.textContent =
      snapshot.currency ||
      "INR";

  }

}


// ============================================================
// KPI RENDERER
// ============================================================

function renderDashboardKpis(snapshot) {

  const container =
    getViewElement(
      "viewKpiContainer"
    );

  const kpis =
    Array.isArray(snapshot.kpis)
      ? snapshot.kpis
      : [];


  if (!container) {
    return;
  }


  container.innerHTML = "";


  kpis.forEach(
    function (kpi, index) {

      const card =
        document.createElement("article");


      card.className =
        "hxl-view-kpi-card hxl-view-object";


      card.dataset.objectId =
        getDashboardObjectId(
          "kpi",
          kpi,
          index
        );


      const title =
        document.createElement("div");


      title.className =
        "hxl-view-kpi-title";


      title.textContent =
        kpi.title ||
        kpi.column ||
        "KPI";


      const value =
        document.createElement("div");


      value.className =
        "hxl-view-kpi-value";


      value.textContent =
        getKpiDisplayValue(
          snapshot,
          kpi
        );


      card.appendChild(title);

      card.appendChild(value);

      initializeDashboardObject(card);

      container.appendChild(card);

    }
  );

}


// ============================================================
// KPI VALUE
// ============================================================

function getKpiDisplayValue(
  snapshot,
  kpi
) {

  if (
    kpi.value !== undefined &&
    kpi.value !== null &&
    kpi.value !== ""
  ) {

    return formatDashboardValue(
      kpi.value,
      kpi.format,
      snapshot.currency
    );

  }


  const calculatedValue =
    calculateDashboardKpiValue(
      snapshot,
      kpi
    );


  if (calculatedValue === null) {
    return "—";
  }


  return formatDashboardValue(
    calculatedValue,
    kpi.format,
    snapshot.currency
  );

}


// ============================================================
// CALCULATE KPI FROM SAVED SOURCE VALUES
// ============================================================

function calculateDashboardKpiValue(
  snapshot,
  kpi
) {

    const sourceValues =
    getDashboardFilteredSourceValues(
      snapshot
    );


  if (
    sourceValues.length < 2 ||
    !Array.isArray(sourceValues[0])
  ) {
    return null;
  }


  const headers =
    sourceValues[0];

  const targetColumn =
    String(kpi.column || "")
      .trim()
      .toLowerCase();


  const columnIndex =
    headers.findIndex(
      function (header) {

        return (
          String(header || "")
            .trim()
            .toLowerCase() ===
          targetColumn
        );

      }
    );


  if (columnIndex === -1) {
    return null;
  }


  const rawValues =
    sourceValues
      .slice(1)
      .filter(
        function (row) {
          return Array.isArray(row);
        }
      )
      .map(
        function (row) {
          return row[columnIndex];
        }
      );


  const nonBlankValues =
    rawValues.filter(
      function (value) {

        return (
          value !== null &&
          value !== undefined &&
          String(value).trim() !== ""
        );

      }
    );


  const numericValues =
    nonBlankValues
      .map(
        function (value) {

          if (typeof value === "number") {
            return value;
          }


          const cleaned =
            String(value)
              .replace(
                /[,₹$€£%\s]/g,
                ""
              )
              .trim();


          return cleaned
            ? Number(cleaned)
            : NaN;

        }
      )
      .filter(
        function (value) {

          return Number.isFinite(value);

        }
      );


  const aggregation =
    String(
      kpi.aggregation ||
      "SUM"
    )
      .trim()
      .toUpperCase();


  if (aggregation === "COUNT") {

    return numericValues.length;

  }


  if (
    aggregation === "COUNTA" ||
    aggregation === "COUNT A"
  ) {

    return nonBlankValues.length;

  }


  if (aggregation === "AVERAGE") {

    if (numericValues.length === 0) {
      return 0;
    }


    return numericValues.reduce(
      function (total, value) {
        return total + value;
      },
      0
    ) / numericValues.length;

  }


  if (aggregation === "MIN") {

    return numericValues.length
      ? Math.min.apply(
          Math,
          numericValues
        )
      : 0;

  }


  if (aggregation === "MAX") {

    return numericValues.length
      ? Math.max.apply(
          Math,
          numericValues
        )
      : 0;

  }


  if (
    aggregation === "UNIQUE COUNT" ||
    aggregation === "UNIQUECOUNT" ||
    aggregation === "DISTINCT COUNT"
  ) {

    return new Set(
      nonBlankValues.map(
        function (value) {
          return String(value);
        }
      )
    ).size;

  }


  return numericValues.reduce(
    function (total, value) {
      return total + value;
    },
    0
  );

}


function formatDashboardValue(
  value,
  format,
  currency
) {

  const numericValue =
    Number(value);


  if (!Number.isFinite(numericValue)) {
    return String(value || "—");
  }


  if (
    String(format || "")
      .toLowerCase() ===
    "currency"
  ) {

    try {

      return new Intl.NumberFormat(
        "en-IN",
        {
          style: "currency",
          currency:
            currency || "INR",
          maximumFractionDigits: 2
        }
      ).format(numericValue);

    }
    catch (error) {

      return numericValue
        .toLocaleString("en-IN");

    }

  }


  return numericValue
    .toLocaleString("en-IN");

}


// ============================================================
// SLICER RENDERER
// ============================================================

function renderDashboardSlicers(snapshot) {

  const container =
    getViewElement(
      "viewSlicerContainer"
    );

  const count =
    getViewElement(
      "viewSlicerCount"
    );

  const slicers =
    Array.isArray(snapshot.slicers)
      ? snapshot.slicers
      : [];


  if (count) {
    count.textContent =
      String(slicers.length);
  }


  if (!container) {
    return;
  }


  container.innerHTML = "";


  slicers.forEach(
    function (slicer, index) {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "hxl-view-slicer-card hxl-view-object";


      card.dataset.objectId =
        getDashboardObjectId(
          "slicer",
          slicer,
          index
        );


      card.dataset.objectType =
        "slicer";


      const title =
        document.createElement(
          "label"
        );


      const selectId =
        "dashboardSlicer-" +
        index;


      title.setAttribute(
        "for",
        selectId
      );


      title.textContent =
        slicer.title ||
        slicer.column ||
        "Dashboard Slicer";


      const type =
        document.createElement(
          "span"
        );


      type.className =
        "hxl-view-slicer-type";


      type.textContent =
        slicer.type ||
        "Category Slicer";


      const select =
        document.createElement(
          "select"
        );


      select.id =
        selectId;


      select.className =
        "hxl-view-slicer-select";


      const allOption =
        document.createElement(
          "option"
        );


      allOption.value = "";

      allOption.textContent =
        "All";


      select.appendChild(
        allOption
      );


      const options =
        getDashboardSlicerOptions(
          snapshot,
          slicer
        );


      options.forEach(
        function (optionItem) {

          const option =
            document.createElement(
              "option"
            );


          option.value =
            optionItem.value;


          option.textContent =
            optionItem.label;


          select.appendChild(
            option
          );

        }
      );


      const column =
        String(
          slicer.column ||
          ""
        );


      select.value =
        dashboardViewState
          .slicerFilters[column] ||
        "";


      select.addEventListener(
        "change",
        function () {

          applyDashboardSlicerFilter(
            slicer,
            select.value
          );

        }
      );


      card.appendChild(title);

      card.appendChild(type);

      card.appendChild(select);

      initializeDashboardObject(card);

      container.appendChild(card);

    }
  );

}


// ============================================================
// BUILD UNIQUE SLICER OPTIONS
// ============================================================

function getDashboardSlicerOptions(
  snapshot,
  slicer
) {

    const sourceValues =
    Array.isArray(snapshot.sourceValues)
      ? snapshot.sourceValues
      : [];


  if (
    sourceValues.length < 2 ||
    !Array.isArray(sourceValues[0])
  ) {
    return [];
  }


  const headers =
    sourceValues[0];


  const targetColumn =
    String(slicer.column || "")
      .trim()
      .toLowerCase();


  const columnIndex =
    headers.findIndex(
      function (header) {

        return (
          String(header || "")
            .trim()
            .toLowerCase() ===
          targetColumn
        );

      }
    );


  if (columnIndex === -1) {
    return [];
  }


  const isDateSlicer =
    isDashboardDateSlicer(
      slicer
    );


  const optionMap = {};


  sourceValues
    .slice(1)
    .forEach(
      function (row) {

        if (!Array.isArray(row)) {
          return;
        }


        const rawValue =
          row[columnIndex];


        if (
          rawValue === null ||
          rawValue === undefined ||
          String(rawValue).trim() === ""
        ) {
          return;
        }


        const value =
          isDateSlicer
            ? normalizeDashboardChartLabel(
                rawValue,
                {
                  xAxis: "Date"
                }
              )
            : String(rawValue)
                .trim();


        if (!optionMap[value]) {

          optionMap[value] = {
            value: value,
            label: value
          };

        }

      }
    );


  return Object.keys(optionMap)
    .sort(
      function (first, second) {

        if (isDateSlicer) {
          return 0;
        }


        return first.localeCompare(
          second
        );

      }
    )
    .map(
      function (key) {
        return optionMap[key];
      }
    );

}


// ============================================================
// SLICER TYPE
// ============================================================

function isDashboardDateSlicer(slicer) {

  const type =
    String(slicer.type || "")
      .trim()
      .toLowerCase();

  const column =
    String(slicer.column || "")
      .trim()
      .toLowerCase();


  return (
    type === "timeline" ||
    type === "date slicer" ||
    column.indexOf("date") !== -1
  );

}


// ============================================================
// APPLY SLICER SELECTION
// ============================================================

function applyDashboardSlicerFilter(
  slicer,
  selectedValue
) {

  const column =
    String(slicer.column || "");


  if (!column) {
    return;
  }


  if (selectedValue) {

    dashboardViewState
      .slicerFilters[column] =
      selectedValue;

  }
  else {

    delete dashboardViewState
      .slicerFilters[column];

  }


  const filterSummary =
    getViewElement(
      "viewFilterSummary"
    );


  const activeCount =
    Object.keys(
      dashboardViewState
        .slicerFilters
    ).length;


  if (filterSummary) {

    filterSummary.textContent =
      activeCount
        ? activeCount +
          " filter" +
          (
            activeCount === 1
              ? ""
              : "s"
          )
        : "All data";

  }


  refreshDashboardFilteredObjects();

}


// ============================================================
// REFRESH OBJECTS AFTER FILTER CHANGE
// ============================================================

function refreshDashboardFilteredObjects() {

  const snapshot =
    dashboardViewState.snapshot;


  if (!snapshot) {
    return;
  }


    renderDashboardKpis(snapshot);

  renderDashboardCharts(snapshot);

  renderDashboardTables(snapshot);

  applyDashboardViewLayout(
    getSavedDashboardViewLayout()
  );

  updateDashboardHealth(snapshot);


  setViewStatus(
    "Dashboard filter applied"
  );

}


// ============================================================
// CHART RENDERER
// ============================================================

function renderDashboardCharts(snapshot) {

  const container =
    getViewElement(
      "viewChartContainer"
    );

  const count =
    getViewElement(
      "viewChartCount"
    );

  const charts =
    Array.isArray(snapshot.charts)
      ? snapshot.charts
      : [];


  if (count) {
    count.textContent =
      String(charts.length);
  }


  if (!container) {
    return;
  }


  container.innerHTML = "";


  charts.forEach(
    function (chart, index) {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "hxl-view-chart-card hxl-view-object";


      card.dataset.objectId =
        getDashboardObjectId(
          "chart",
          chart,
          index
        );


      card.dataset.objectType =
        "chart";


      const heading =
        document.createElement(
          "div"
        );


      heading.className =
        "hxl-view-chart-heading";


      const title =
        document.createElement(
          "strong"
        );


      title.textContent =
        chart.title ||
        "Dashboard Chart";


      const detail =
        document.createElement(
          "span"
        );


      detail.textContent =
        (
          chart.type ||
          chart.chartType ||
          "Column"
        ) +
        " • " +
        (
          chart.aggregation ||
          "SUM"
        );


      heading.appendChild(title);

      heading.appendChild(detail);


      const canvas =
        document.createElement(
          "canvas"
        );


      canvas.className =
        "hxl-view-chart-canvas";

      canvas.width = 760;

      canvas.height = 280;


      const chartData =
        buildDashboardChartData(
          snapshot,
          chart
        );


      card.appendChild(heading);

      card.appendChild(canvas);

      initializeDashboardObject(card);

      container.appendChild(card);


      drawDashboardChart(
        canvas,
        chartData,
        chart
      );

    }
  );

}


// ============================================================
// BUILD CHART DATA FROM SAVED SOURCE VALUES
// ============================================================

function buildDashboardChartData(
  snapshot,
  chart
) {

    const sourceValues =
    getDashboardFilteredSourceValues(
      snapshot
    );


  if (
    sourceValues.length < 2 ||
    !Array.isArray(sourceValues[0])
  ) {

    return {
      labels: [],
      values: []
    };

  }


  const headers =
    sourceValues[0];


  const xColumn =
    String(
      chart.xAxis ||
      chart.categoryColumn ||
      ""
    )
      .trim()
      .toLowerCase();


  const yColumn =
    String(
      chart.yAxis ||
      chart.valueColumn ||
      ""
    )
      .trim()
      .toLowerCase();


  const xIndex =
    headers.findIndex(
      function (header) {

        return (
          String(header || "")
            .trim()
            .toLowerCase() ===
          xColumn
        );

      }
    );


  const yIndex =
    headers.findIndex(
      function (header) {

        return (
          String(header || "")
            .trim()
            .toLowerCase() ===
          yColumn
        );

      }
    );


  if (
    xIndex === -1 ||
    yIndex === -1
  ) {

    return {
      labels: [],
      values: []
    };

  }


  const groupedValues = {};


  sourceValues
    .slice(1)
    .forEach(
      function (row) {

        if (!Array.isArray(row)) {
          return;
        }


        const label =
          normalizeDashboardChartLabel(
            row[xIndex],
            chart
          );


        const numericValue =
          parseDashboardNumber(
            row[yIndex]
          );


        if (
          !label ||
          !Number.isFinite(
            numericValue
          )
        ) {
          return;
        }


        if (!groupedValues[label]) {

          groupedValues[label] = {
            sum: 0,
            count: 0,
            values: []
          };

        }


        groupedValues[label].sum +=
          numericValue;

        groupedValues[label].count +=
          1;

        groupedValues[label]
          .values
          .push(numericValue);

      }
    );


  const aggregation =
    String(
      chart.aggregation ||
      "SUM"
    )
      .trim()
      .toUpperCase();


  let chartItems =
    Object.keys(groupedValues)
      .map(
        function (label) {

          const group =
            groupedValues[label];

          let value =
            group.sum;


          if (
            aggregation ===
            "AVERAGE"
          ) {

            value =
              group.count
                ? group.sum /
                  group.count
                : 0;

          }
          else if (
            aggregation ===
            "COUNT"
          ) {

            value =
              group.count;

          }
          else if (
            aggregation ===
            "MIN"
          ) {

            value =
              Math.min.apply(
                Math,
                group.values
              );

          }
          else if (
            aggregation ===
            "MAX"
          ) {

            value =
              Math.max.apply(
                Math,
                group.values
              );

          }


          return {
            label: label,
            value: value
          };

        }
      );


  const chartType =
    String(
      chart.type ||
      chart.chartType ||
      "Column"
    )
      .trim()
      .toLowerCase();


  if (
    chartType === "bar" ||
    chartType === "column" ||
    chartType === "pie" ||
    chartType === "doughnut"
  ) {

    chartItems.sort(
      function (first, second) {

        return (
          second.value -
          first.value
        );

      }
    );

  }


  const itemLimit =
    getDashboardChartItemLimit(
      chart.topBottom,
      chartItems.length
    );


  chartItems =
    chartItems.slice(
      0,
      itemLimit
    );


  return {

    labels:
      chartItems.map(
        function (item) {
          return item.label;
        }
      ),

    values:
      chartItems.map(
        function (item) {
          return item.value;
        }
      )

  };

}


// ============================================================
// CHART VALUE HELPERS
// ============================================================

function parseDashboardNumber(value) {

  if (typeof value === "number") {
    return value;
  }


  const cleaned =
    String(value || "")
      .replace(
        /[,₹$€£%\s]/g,
        ""
      )
      .trim();


  return cleaned
    ? Number(cleaned)
    : NaN;

}


function normalizeDashboardChartLabel(
  value,
  chart
) {

  const rawValue =
    String(value || "")
      .trim();


  if (!rawValue) {
    return "";
  }


  const xAxis =
    String(chart.xAxis || "")
      .trim()
      .toLowerCase();


  if (
    xAxis.indexOf("date") === -1
  ) {
    return rawValue;
  }


  const numericDate =
    Number(value);

  let parsedDate;


  // ==========================================================
  // EXCEL SERIAL DATE
  // Excel day 25569 = 01-Jan-1970
  // ==========================================================

  if (
    Number.isFinite(numericDate) &&
    numericDate > 1 &&
    numericDate < 2958466
  ) {

    parsedDate =
      new Date(
        Math.round(
          (
            numericDate -
            25569
          ) *
          86400000
        )
      );

  }
  else {

    parsedDate =
      new Date(rawValue);

  }


  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return rawValue;
  }


  return parsedDate
    .toLocaleDateString(
      "en-US",
      {
        month: "short",
        year: "numeric",
        timeZone: "UTC"
      }
    );

}


function getDashboardChartItemLimit(
  topBottom,
  itemCount
) {

  const match =
    String(topBottom || "")
      .match(/\d+/);


  if (!match) {
    return itemCount;
  }


  return Math.max(
    1,
    Math.min(
      Number(match[0]),
      itemCount
    )
  );

}


// ============================================================
// CANVAS CHART DRAWING
// ============================================================

function drawDashboardChart(
  canvas,
  chartData,
  chart
) {

  const context =
    canvas.getContext("2d");


  if (!context) {
    return;
  }


  const labels =
    chartData.labels || [];

  const values =
    chartData.values || [];


  context.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  if (values.length === 0) {

    context.fillStyle =
      "#64748b";

    context.font =
      "15px Segoe UI";

    context.textAlign =
      "center";

    context.fillText(
      "Chart data is not available",
      canvas.width / 2,
      canvas.height / 2
    );

    return;

  }


  const chartType =
    String(
      chart.type ||
      chart.chartType ||
      "Column"
    )
      .trim()
      .toLowerCase();


  if (
    chartType === "pie" ||
    chartType === "doughnut"
  ) {

    drawDashboardPieChart(
      context,
      canvas,
      labels,
      values,
      chartType
    );

    return;

  }


  if (
    chartType === "line" ||
    chartType === "area" ||
    chartType === "combo" ||
    chartType === "scatter"
  ) {

    drawDashboardLineChart(
      context,
      canvas,
      labels,
      values,
      chartType
    );

    return;

  }


  drawDashboardBarChart(
    context,
    canvas,
    labels,
    values,
    chartType
  );

}


// ============================================================
// COLUMN / BAR CHART
// ============================================================

function drawDashboardBarChart(
  context,
  canvas,
  labels,
  values,
  chartType
) {

  const left = 52;
  const top = 24;
  const bottom = 48;
  const chartWidth =
    canvas.width - left - 20;
  const chartHeight =
    canvas.height - top - bottom;

  const maximum =
    Math.max.apply(
      Math,
      values.concat([1])
    );

  const gap = 12;

  const barWidth =
    Math.max(
      10,
      (
        chartWidth -
        gap * values.length
      ) /
      values.length
    );


  context.strokeStyle =
    "#cbd5e1";

  context.beginPath();

  context.moveTo(
    left,
    top
  );

  context.lineTo(
    left,
    top + chartHeight
  );

  context.lineTo(
    left + chartWidth,
    top + chartHeight
  );

  context.stroke();


  values.forEach(
    function (value, index) {

      const height =
        (
          Number(value) /
          maximum
        ) *
        chartHeight;

      const x =
        left +
        gap / 2 +
        index *
        (barWidth + gap);

      const y =
        top +
        chartHeight -
        height;


      context.fillStyle =
        chartType === "bar"
          ? "#14b8a6"
          : "#2563eb";

      context.fillRect(
        x,
        y,
        barWidth,
        height
      );


      context.save();

      context.fillStyle =
        "#475569";

      context.font =
        "11px Segoe UI";

      context.textAlign =
        "center";

      context.translate(
        x + barWidth / 2,
        top + chartHeight + 10
      );

      context.rotate(
        -Math.PI / 5
      );

      context.fillText(
        String(labels[index])
          .slice(0, 16),
        0,
        0
      );

      context.restore();

    }
  );

}


// ============================================================
// LINE / AREA / COMBO CHART
// ============================================================

function drawDashboardLineChart(
  context,
  canvas,
  labels,
  values,
  chartType
) {

  const left = 52;
  const top = 24;
  const bottom = 48;
  const chartWidth =
    canvas.width - left - 20;
  const chartHeight =
    canvas.height - top - bottom;

  const maximum =
    Math.max.apply(
      Math,
      values.concat([1])
    );

  const step =
    values.length > 1
      ? chartWidth /
        (values.length - 1)
      : chartWidth;


  const points =
    values.map(
      function (value, index) {

        return {

          x:
            left +
            step * index,

          y:
            top +
            chartHeight -
            (
              Number(value) /
              maximum
            ) *
            chartHeight

        };

      }
    );


  context.strokeStyle =
    "#cbd5e1";

  context.beginPath();

  context.moveTo(
    left,
    top
  );

  context.lineTo(
    left,
    top + chartHeight
  );

  context.lineTo(
    left + chartWidth,
    top + chartHeight
  );

  context.stroke();


  if (chartType === "area") {

    context.beginPath();

    context.moveTo(
      points[0].x,
      top + chartHeight
    );


    points.forEach(
      function (point) {

        context.lineTo(
          point.x,
          point.y
        );

      }
    );


    context.lineTo(
      points[
        points.length - 1
      ].x,
      top + chartHeight
    );

    context.closePath();

    context.fillStyle =
      "rgba(37, 99, 235, 0.18)";

    context.fill();

  }


  context.beginPath();

  points.forEach(
    function (point, index) {

      if (index === 0) {

        context.moveTo(
          point.x,
          point.y
        );

      }
      else {

        context.lineTo(
          point.x,
          point.y
        );

      }

    }
  );


  context.strokeStyle =
    chartType === "combo"
      ? "#7c3aed"
      : "#2563eb";

  context.lineWidth = 3;

  context.stroke();


  points.forEach(
    function (point, index) {

      context.beginPath();

      context.arc(
        point.x,
        point.y,
        4,
        0,
        Math.PI * 2
      );

      context.fillStyle =
        "#ffffff";

      context.fill();

      context.strokeStyle =
        "#2563eb";

      context.lineWidth = 2;

      context.stroke();


      if (
        index === 0 ||
        index ===
          points.length - 1
      ) {

        context.fillStyle =
          "#475569";

        context.font =
          "11px Segoe UI";

        context.textAlign =
          index === 0
            ? "left"
            : "right";

        context.fillText(
          String(labels[index])
            .slice(0, 18),
          point.x,
          top + chartHeight + 20
        );

      }

    }
  );

}


// ============================================================
// PIE / DOUGHNUT CHART
// ============================================================

function drawDashboardPieChart(
  context,
  canvas,
  labels,
  values,
  chartType
) {

  const colors = [
    "#2563eb",
    "#14b8a6",
    "#f59e0b",
    "#7c3aed",
    "#ef4444",
    "#0ea5e9",
    "#84cc16",
    "#f97316",
    "#6366f1",
    "#ec4899"
  ];

  const total =
    values.reduce(
      function (sum, value) {
        return sum + Number(value);
      },
      0
    );

  const centerX =
    canvas.width * 0.33;

  const centerY =
    canvas.height / 2;

  const radius =
    Math.min(
      100,
      canvas.height * 0.36
    );

  let startAngle =
    -Math.PI / 2;


  values.forEach(
    function (value, index) {

      const sliceAngle =
        total
          ? (
              Number(value) /
              total
            ) *
            Math.PI *
            2
          : 0;


      context.beginPath();

      context.moveTo(
        centerX,
        centerY
      );

      context.arc(
        centerX,
        centerY,
        radius,
        startAngle,
        startAngle + sliceAngle
      );

      context.closePath();

      context.fillStyle =
        colors[
          index %
          colors.length
        ];

      context.fill();


      startAngle +=
        sliceAngle;

    }
  );


  if (chartType === "doughnut") {

    context.beginPath();

    context.arc(
      centerX,
      centerY,
      radius * 0.52,
      0,
      Math.PI * 2
    );

    context.fillStyle =
      "#ffffff";

    context.fill();

  }


  labels.slice(0, 8).forEach(
    function (label, index) {

      const legendY =
        46 +
        index * 25;


      context.fillStyle =
        colors[
          index %
          colors.length
        ];

      context.fillRect(
        canvas.width * 0.62,
        legendY - 10,
        12,
        12
      );


      context.fillStyle =
        "#334155";

      context.font =
        "12px Segoe UI";

      context.textAlign =
        "left";

      context.fillText(
        String(label).slice(0, 22),
        canvas.width * 0.62 + 20,
        legendY
      );

    }
  );

}


// ============================================================
// TABLE RENDERER
// ============================================================

function renderDashboardTables(snapshot) {

  const container =
    getViewElement(
      "viewTableContainer"
    );

  const count =
    getViewElement(
      "viewTableCount"
    );

  const tables =
    snapshot &&
    Array.isArray(snapshot.tables)
      ? snapshot.tables
      : [];


  if (count) {

    count.textContent =
      String(
        tables.length
      );

  }


  if (!container) {
    return;
  }


  container.innerHTML =
    "";


  if (
    tables.length === 0
  ) {

    const emptyState =
      document.createElement(
        "div"
      );

    emptyState.className =
      "hxl-view-table-empty";

    emptyState.textContent =
      "No Smart Tables configured.";

    container.appendChild(
      emptyState
    );

    return;

  }


  const sourceValues =
    getDashboardFilteredSourceValues(
      snapshot
    );


  const headers =
    Array.isArray(
      sourceValues
    ) &&
    Array.isArray(
      sourceValues[0]
    )
      ? sourceValues[0]
      : [];


  const dataRows =
    Array.isArray(
      sourceValues
    )
      ? sourceValues
          .slice(1)
          .filter(
            function (row) {

              return Array.isArray(
                row
              );

            }
          )
      : [];


  function normalizeHeader(
    value
  ) {

    return String(
      value || ""
    )
      .trim()
      .toLowerCase();

  }


  function findHeaderIndex(
    columnName
  ) {

    const target =
      normalizeHeader(
        columnName
      );


    return headers.findIndex(
      function (header) {

        return (
          normalizeHeader(
            header
          ) ===
          target
        );

      }
    );

  }


  function toNumber(
    value
  ) {

    if (
      typeof value ===
      "number"
    ) {

      return Number.isFinite(
        value
      )
        ? value
        : 0;

    }


    const cleaned =
      String(
        value || ""
      )
        .replace(
          /[,\s₹$€£%]/g,
          ""
        )
        .trim();


    const numeric =
      Number(
        cleaned
      );


    return Number.isFinite(
      numeric
    )
      ? numeric
      : 0;

  }


  function formatTableValue(
    value
  ) {

    const currency =
      String(
        snapshot &&
        snapshot.currency ||
        "INR"
      )
        .trim()
        .toUpperCase();


    try {

      return new Intl.NumberFormat(
        "en-IN",
        {
          style:
            "currency",

          currency:
            currency,

          maximumFractionDigits:
            2
        }
      ).format(
        Number(value) || 0
      );

    }
    catch (error) {

      return Number(
        value || 0
      ).toLocaleString(
        "en-IN"
      );

    }

  }


  function buildTableData(
    table
  ) {

    const groupColumn =
      String(
        table.groupColumn ||
        table.categoryColumn ||
        table.groupBy ||
        table.column ||
        ""
      ).trim();


    const valueColumn =
      String(
        table.valueColumn ||
        table.measure ||
        ""
      ).trim();


    const groupIndex =
      findHeaderIndex(
        groupColumn
      );

    const valueIndex =
      findHeaderIndex(
        valueColumn
      );


    if (
      groupIndex < 0 ||
      valueIndex < 0
    ) {

      return {
        success: false,
        groupColumn:
          groupColumn,
        valueColumn:
          valueColumn,
        rows: []
      };

    }


    const grouped =
      {};


    dataRows.forEach(
      function (row) {

        const rawGroup =
          row[groupIndex];

        const label =
          String(
            rawGroup === null ||
            rawGroup === undefined ||
            rawGroup === ""
              ? "(Blank)"
              : rawGroup
          );


        if (!grouped[label]) {

          grouped[label] = {
            sum: 0,
            count: 0,
            min: null,
            max: null
          };

        }


        const numericValue =
          toNumber(
            row[valueIndex]
          );


        grouped[label].sum +=
          numericValue;

        grouped[label].count +=
          1;


        grouped[label].min =
          grouped[label].min ===
          null
            ? numericValue
            : Math.min(
                grouped[label].min,
                numericValue
              );


        grouped[label].max =
          grouped[label].max ===
          null
            ? numericValue
            : Math.max(
                grouped[label].max,
                numericValue
              );

      }
    );


    const aggregation =
      String(
        table.aggregation ||
        "SUM"
      )
        .trim()
        .toUpperCase();


    let resultRows =
      Object.keys(
        grouped
      ).map(
        function (label) {

          const group =
            grouped[label];

          let value =
            group.sum;


          if (
            aggregation ===
            "COUNT"
          ) {

            value =
              group.count;

          }
          else if (
            aggregation ===
            "AVERAGE"
          ) {

            value =
              group.count
                ? group.sum /
                  group.count
                : 0;

          }
          else if (
            aggregation ===
            "MIN"
          ) {

            value =
              group.min ===
              null
                ? 0
                : group.min;

          }
          else if (
            aggregation ===
            "MAX"
          ) {

            value =
              group.max ===
              null
                ? 0
                : group.max;

          }


          return {
            label:
              label,
            value:
              value
          };

        }
      );


    const limitData =
      String(
        table.limitData ||
        table.topBottom ||
        "Show All"
      )
        .trim()
        .toLowerCase();


    const match =
      limitData.match(
        /(top|bottom)\s*(\d+)/
      );


    if (match) {

      const direction =
        match[1];

      const limit =
        Number(
          match[2]
        );


      resultRows.sort(
        function (a, b) {

          return direction ===
            "bottom"
              ? a.value -
                b.value
              : b.value -
                a.value;

        }
      );


      resultRows =
        resultRows.slice(
          0,
          limit
        );

    }


    return {
      success: true,
      groupColumn:
        groupColumn,
      valueColumn:
        valueColumn,
      aggregation:
        aggregation,
      rows:
        resultRows
    };

  }


  tables.forEach(
    function (
      table,
      index
    ) {

      const card =
        document.createElement(
          "article"
        );

      card.className =
        "hxl-view-object hxl-view-table-card";

      card.dataset.objectId =
        getDashboardObjectId(
          "table",
          table,
          index
        );


      const title =
        document.createElement(
          "h4"
        );

      title.className =
        "hxl-view-table-title";

      title.textContent =
        table.title ||
        "Smart Table";


      card.appendChild(
        title
      );


      const result =
        buildTableData(
          table
        );


      if (!result.success) {

        const errorState =
          document.createElement(
            "div"
          );

        errorState.className =
          "hxl-view-table-error";

        errorState.textContent =
          "Unable to render table: column mapping is missing.";

        card.appendChild(
          errorState
        );


        initializeDashboardObject(
          card
        );

        container.appendChild(
          card
        );

        return;

      }


      const meta =
        document.createElement(
          "div"
        );

      meta.className =
        "hxl-view-table-meta";

      meta.textContent =
        result.groupColumn +
        " • " +
        result.valueColumn +
        " • " +
        result.aggregation;


      card.appendChild(
        meta
      );


      const tableElement =
        document.createElement(
          "table"
        );

      tableElement.className =
        "hxl-view-data-table";


      const thead =
        document.createElement(
          "thead"
        );

      const headerRow =
        document.createElement(
          "tr"
        );


      const groupHeader =
        document.createElement(
          "th"
        );

      groupHeader.textContent =
        result.groupColumn;


      const valueHeader =
        document.createElement(
          "th"
        );

      valueHeader.textContent =
        result.valueColumn;


      headerRow.appendChild(
        groupHeader
      );

      headerRow.appendChild(
        valueHeader
      );

      thead.appendChild(
        headerRow
      );

      tableElement.appendChild(
        thead
      );


      const tbody =
        document.createElement(
          "tbody"
        );


      result.rows.forEach(
        function (rowData) {

          const row =
            document.createElement(
              "tr"
            );


          const labelCell =
            document.createElement(
              "td"
            );

          labelCell.textContent =
            rowData.label;


          const valueCell =
            document.createElement(
              "td"
            );

          valueCell.className =
            "hxl-view-table-value";

          valueCell.textContent =
            result.aggregation ===
            "COUNT"
              ? String(
                  rowData.value
                )
              : formatTableValue(
                  rowData.value
                );


          row.appendChild(
            labelCell
          );

          row.appendChild(
            valueCell
          );

          tbody.appendChild(
            row
          );

        }
      );


      tableElement.appendChild(
        tbody
      );


      if (
        String(
          table.grandTotal ||
          "Yes"
        ).toLowerCase() !==
        "no"
      ) {

        const tfoot =
          document.createElement(
            "tfoot"
          );

        const totalRow =
          document.createElement(
            "tr"
          );


        const totalLabel =
          document.createElement(
            "th"
          );

        totalLabel.textContent =
          "Grand Total";


        const totalValue =
          document.createElement(
            "th"
          );


        const grandTotal =
          result.rows.reduce(
            function (
              sum,
              rowData
            ) {

              return (
                sum +
                Number(
                  rowData.value ||
                  0
                )
              );

            },
            0
          );


        totalValue.textContent =
          result.aggregation ===
          "COUNT"
            ? String(
                grandTotal
              )
            : formatTableValue(
                grandTotal
              );


        totalRow.appendChild(
          totalLabel
        );

        totalRow.appendChild(
          totalValue
        );

        tfoot.appendChild(
          totalRow
        );

        tableElement.appendChild(
          tfoot
        );

      }


      card.appendChild(
        tableElement
      );


      initializeDashboardObject(
        card
      );


      container.appendChild(
        card
      );

    }
  );

}


// ============================================================
// GENERIC OBJECT COLLECTION
// ============================================================

function renderObjectCollection(
  containerId,
  countId,
  collection,
  objectType,
  getLabel
) {

  const container =
    getViewElement(containerId);

  const count =
    getViewElement(countId);

  const items =
    Array.isArray(collection)
      ? collection
      : [];


  if (count) {

    count.textContent =
      String(items.length);

  }


  if (!container) {
    return;
  }


  container.innerHTML = "";


  items.forEach(
    function (item, index) {

      const card =
        document.createElement("article");


      card.className =
        "hxl-view-card hxl-view-object";


      card.style.padding =
        "14px";


      card.style.marginBottom =
        "10px";


      card.dataset.objectId =
        getDashboardObjectId(
          objectType,
          item,
          index
        );


      card.dataset.objectType =
        objectType;


      card.textContent =
        getLabel(item);


      initializeDashboardObject(card);

      container.appendChild(card);

    }
  );

}


// ============================================================
// OBJECT IDENTIFICATION AND SELECTION FOUNDATION
// ============================================================

function getDashboardObjectId(
  objectType,
  item,
  index
) {

  return String(
    item.id ||
    item.objectId ||
    objectType + "-" + index
  );

}


function initializeDashboardObject(element) {

  element.draggable =
    dashboardViewState.arrangeMode;


  element.addEventListener(
    "click",
    function () {

      selectDashboardObject(
        element.dataset.objectId
      );

    }
  );


  element.addEventListener(
    "dragstart",
    function (event) {

      if (!dashboardViewState.arrangeMode) {
        event.preventDefault();
        return;
      }


      dashboardViewState.draggedObjectId =
        String(
          element.dataset.objectId || ""
        );


      element.classList.add(
        "is-dragging"
      );


      if (event.dataTransfer) {

        event.dataTransfer.effectAllowed =
          "move";

        event.dataTransfer.setData(
          "text/plain",
          dashboardViewState
            .draggedObjectId
        );

      }

    }
  );


  element.addEventListener(
    "dragover",
    function (event) {

      if (!dashboardViewState.arrangeMode) {
        return;
      }


      const draggedElement =
        findDashboardObjectElement(
          dashboardViewState
            .draggedObjectId
        );


      if (
        !draggedElement ||
        draggedElement === element ||
        draggedElement.parentElement !==
          element.parentElement
      ) {
        return;
      }

            


      event.preventDefault();


      if (event.dataTransfer) {
        event.dataTransfer.dropEffect =
          "move";
      }

    }
  );


  element.addEventListener(
    "drop",
    function (event) {

      if (!dashboardViewState.arrangeMode) {
        return;
      }


      event.preventDefault();


      const draggedElement =
        findDashboardObjectElement(
          dashboardViewState
            .draggedObjectId
        );


      const container =
        element.parentElement;


      if (
        !draggedElement ||
        !container ||
        draggedElement === element ||
        draggedElement.parentElement !==
          container
      ) {
        return;
      }

            const previousLayout =
        captureDashboardViewLayout();


      const targetRectangle =
        element.getBoundingClientRect();


      const placeAfter =
        event.clientY >
          targetRectangle.top +
          targetRectangle.height / 2;


      if (placeAfter) {

        container.insertBefore(
          draggedElement,
          element.nextSibling
        );

      } else {

        container.insertBefore(
          draggedElement,
          element
        );

      }


      selectDashboardObject(
        draggedElement.dataset.objectId
      );

            dashboardViewState.undoStack.push(
        previousLayout
      );


      if (
        dashboardViewState.undoStack
          .length > 50
      ) {

        dashboardViewState.undoStack
          .shift();

      }


      dashboardViewState.redoStack = [];


            updateDashboardHistoryButtons();


      saveDashboardViewLayout(
        captureDashboardViewLayout()
      );


      setViewStatus(
        "Dashboard object moved"
      );

    }
  );


  element.addEventListener(
    "dragend",
    function () {

      element.classList.remove(
        "is-dragging"
      );


      dashboardViewState.draggedObjectId =
        "";

    }
  );

}


function findDashboardObjectElement(
  objectId
) {

  const expectedId =
    String(objectId || "");


  const elements =
    document.querySelectorAll(
      ".hxl-view-object"
    );


  for (
    let index = 0;
    index < elements.length;
    index += 1
  ) {

    if (
      elements[index].dataset.objectId ===
      expectedId
    ) {
      return elements[index];
    }

  }


  return null;

}


function captureDashboardViewLayout() {

  const containerIds = [
    "viewKpiContainer",
    "viewSlicerContainer",
    "viewChartContainer",
    "viewTableContainer"
  ];

  const layout = {};


  containerIds.forEach(
    function (containerId) {

      const container =
        getViewElement(containerId);

      const objectIds = [];


      if (container) {

        Array.prototype.forEach.call(
          container.children,
          function (element) {

            if (
              element.classList.contains(
                "hxl-view-object"
              )
            ) {

              objectIds.push(
                String(
                  element.dataset.objectId || ""
                )
              );

            }

          }
        );

      }


      layout[containerId] =
        objectIds;

    }
  );


  return layout;

}

function getDashboardViewLayoutStorageKey() {

  const snapshot =
    dashboardViewState.snapshot;


  const projectDashboardId =
    snapshot &&
    snapshot.project &&
    snapshot.project.dashboardId
      ? String(
          snapshot.project.dashboardId
        )
      : "";


  const lastDraftDashboardId =
    localStorage.getItem(
      DASHBOARD_LAST_DRAFT_KEY
    );


  const dashboardId =
    projectDashboardId ||
    String(
      lastDraftDashboardId || ""
    );


  if (!dashboardId) {
    return "";
  }


  return (
    DASHBOARD_VIEW_LAYOUT_PREFIX +
    dashboardId
  );

}


function saveDashboardViewLayout(layout) {

  const storageKey =
    getDashboardViewLayoutStorageKey();


  if (!storageKey) {
    return;
  }


  try {

    localStorage.setItem(
      storageKey,
      JSON.stringify(layout)
    );

  } catch (error) {

    console.warn(
      "Unable to save dashboard layout:",
      error
    );

  }

}


function getSavedDashboardViewLayout() {

  const storageKey =
    getDashboardViewLayoutStorageKey();


  if (!storageKey) {
    return null;
  }


  try {

    const savedText =
      localStorage.getItem(
        storageKey
      );


    if (!savedText) {
      return null;
    }


    const layout =
      JSON.parse(savedText);


    return (
      layout &&
      typeof layout === "object"
    )
      ? layout
      : null;

  } catch (error) {

    console.warn(
      "Unable to read dashboard layout:",
      error
    );


    return null;

  }

}


function applyDashboardViewLayout(layout) {

  if (
    !layout ||
    typeof layout !== "object"
  ) {
    return;
  }


  Object.keys(layout).forEach(
    function (containerId) {

      const container =
        getViewElement(containerId);

      const objectIds =
        Array.isArray(layout[containerId])
          ? layout[containerId]
          : [];


      if (!container) {
        return;
      }


      objectIds.forEach(
        function (objectId) {

          let matchingElement = null;


          Array.prototype.some.call(
            container.children,
            function (element) {

              if (
                element.dataset.objectId ===
                objectId
              ) {

                matchingElement = element;
                return true;

              }


              return false;

            }
          );


          if (matchingElement) {

            container.appendChild(
              matchingElement
            );

          }

        }
      );

    }
  );

}


function updateDashboardHistoryButtons() {

  const undoButton =
    getViewElement("undoBtn");

  const redoButton =
    getViewElement("redoBtn");


  if (undoButton) {

    undoButton.disabled =
      dashboardViewState.undoStack
        .length === 0;

  }


  if (redoButton) {

    redoButton.disabled =
      dashboardViewState.redoStack
        .length === 0;

  }

}


function undoDashboardLayout() {

  if (
    dashboardViewState.undoStack
      .length === 0
  ) {
    return;
  }


  const currentLayout =
    captureDashboardViewLayout();

  const previousLayout =
    dashboardViewState.undoStack.pop();


  dashboardViewState.redoStack.push(
    currentLayout
  );


  applyDashboardViewLayout(
    previousLayout
  );

    saveDashboardViewLayout(
    captureDashboardViewLayout()
  );

  updateDashboardHistoryButtons();

    

  setViewStatus(
    "Dashboard arrangement undone"
  );

}


function redoDashboardLayout() {

  if (
    dashboardViewState.redoStack
      .length === 0
  ) {
    return;
  }


  const currentLayout =
    captureDashboardViewLayout();

  const nextLayout =
    dashboardViewState.redoStack.pop();


  dashboardViewState.undoStack.push(
    currentLayout
  );


  applyDashboardViewLayout(
    nextLayout
  );

    saveDashboardViewLayout(
    captureDashboardViewLayout()
  );

  updateDashboardHistoryButtons();

  setViewStatus(
    "Dashboard arrangement redone"
  );

}


function selectDashboardObject(objectId) {

  dashboardViewState.selectedObjectId =
    String(objectId || "");


  document
    .querySelectorAll(
      ".hxl-view-object"
    )
    .forEach(
      function (element) {

        element.classList.toggle(
          "is-selected",
          element.dataset.objectId ===
            dashboardViewState
              .selectedObjectId
        );

      }
    );

}


// ============================================================
// HEALTH
// ============================================================

function updateDashboardHealth(snapshot) {

  const badge =
    getViewElement("healthBadge");

  const healthGrid =
    getViewElement("healthGrid");


  const counts = {

    KPIs:
      Array.isArray(snapshot.kpis)
        ? snapshot.kpis.length
        : 0,

    Charts:
      Array.isArray(snapshot.charts)
        ? snapshot.charts.length
        : 0,

    Slicers:
      Array.isArray(snapshot.slicers)
        ? snapshot.slicers.length
        : 0,

    Tables:
      Array.isArray(snapshot.tables)
        ? snapshot.tables.length
        : 0

  };


  if (badge) {
    badge.textContent = "Good";
  }


  if (!healthGrid) {
    return;
  }


  healthGrid.innerHTML = "";


  Object.keys(counts).forEach(
    function (label) {

      const item =
        document.createElement("div");


      item.className =
        "hxl-view-card";


      item.style.padding =
        "12px";


      item.textContent =
        label +
        ": " +
        counts[label];


      healthGrid.appendChild(item);

    }
  );

}


// ============================================================
// REFRESH TIME
// ============================================================

function updateViewRefreshTime(snapshot) {

  const updatedAt =
    getViewElement("viewUpdatedAt");


  if (!updatedAt) {
    return;
  }


  const savedAt =
    snapshot.lastRefreshedAt ||
    (
      snapshot.draftMeta &&
      snapshot.draftMeta.savedAt
    ) ||
    (
      snapshot.project &&
      snapshot.project.updatedAt
    );


  updatedAt.textContent =
    savedAt
      ? "Last refreshed: " +
        new Date(savedAt)
          .toLocaleString()
      : "Last refreshed: Never";

}


// ============================================================
// DASHBOARD VIEW REFRESH
// ============================================================

function refreshDashboardView() {

  const refreshButton =
    getViewElement("refreshDashboardBtn");


  if (
    refreshButton &&
    refreshButton.disabled
  ) {
    return;
  }


  if (refreshButton) {
    refreshButton.disabled = true;
  }


  setViewStatus(
    "Refreshing dashboard..."
  );


  try {

    loadDashboardView();


    const updatedAt =
      getViewElement("viewUpdatedAt");


    if (updatedAt) {

      updatedAt.textContent =
        "Last refreshed: " +
        new Date().toLocaleString();

    }


    setViewStatus(
      "Dashboard refreshed"
    );

  } catch (error) {

    console.error(
      "Dashboard refresh failed:",
      error
    );


    setViewStatus(
      "Dashboard refresh failed"
    );

  } finally {

    if (refreshButton) {
      refreshButton.disabled = false;
    }

  }

}

  bindViewClick(
    "undoBtn",
    undoDashboardLayout
  );


  bindViewClick(
    "redoBtn",
    redoDashboardLayout
  );


// ============================================================
// CONTROLS
// ============================================================

function initializeViewControls() {

  bindViewClick(
    "refreshDashboardBtn",
    refreshDashboardView
  );


  bindViewClick(
    "healthBtn",
    toggleDashboardHealth
  );


  bindViewClick(
    "layoutEditBtn",
    toggleArrangeMode
  );


  bindViewClick(
    "editDashboardBtn",
    openDashboardStudio
  );


  bindViewClick(
    "emptyEditDashboardBtn",
    openDashboardStudio
  );


  bindViewClick(
    "viewCloseBtn",
    closeDashboardViewWindow
  );


  bindViewClick(
    "viewMinimizeBtn",
    function () {

      setViewStatus(
        "Minimize is controlled by the browser"
      );

    }
  );


  bindViewClick(
    "viewMaximizeBtn",
    toggleBrowserFullscreen
  );


  const screenMode =
    getViewElement(
      "screenModeSelect"
    );


  if (screenMode) {

    screenMode.addEventListener(
      "change",
      function () {

        setDashboardScreenMode(
          screenMode.value
        );

      }
    );

  }

}


function bindViewClick(
  elementId,
  handler
) {

  const element =
    getViewElement(elementId);


  if (element) {

    element.addEventListener(
      "click",
      handler
    );

  }

}


// ============================================================
// TOOLBAR ACTIONS
// ============================================================

function toggleDashboardHealth() {

  const panel =
    getViewElement("healthPanel");


  if (!panel) {
    return;
  }


    panel.hidden =
    !panel.hidden;

  window.requestAnimationFrame(function () {
    measureDashboardScreen();

    window.requestAnimationFrame(function () {
      measureDashboardScreen();
    });
  });

}


function toggleArrangeMode() {

  const app =
    getViewElement(
      "dashboardViewApp"
    );

  const button =
    getViewElement(
      "layoutEditBtn"
    );


  dashboardViewState.arrangeMode =
    !dashboardViewState.arrangeMode;

    document
    .querySelectorAll(
      ".hxl-view-object"
    )
    .forEach(
      function (element) {

        element.draggable =
          dashboardViewState.arrangeMode;

      }
    );


  if (app) {

    app.classList.toggle(
      "is-arranging",
      dashboardViewState.arrangeMode
    );

  }


  if (button) {

    button.classList.toggle(
      "is-active",
      dashboardViewState.arrangeMode
    );


    button.textContent =
      dashboardViewState.arrangeMode
        ? "Done Arranging"
        : "Arrange";

  }

}


function setDashboardScreenMode(mode) {

  const app =
    getViewElement(
      "dashboardViewApp"
    );


  dashboardViewState.screenMode =
    String(mode || "auto");


  if (app) {

    app.dataset.screenMode =
      dashboardViewState.screenMode;

  }


    window.requestAnimationFrame(
    measureDashboardScreen
  );

  setViewStatus(
    "Screen mode: " +
    dashboardViewState.screenMode
  );

}


function openDashboardStudio() {

  window.location.href =
    "power-dashboard.html";

}


function closeDashboardViewWindow() {

  window.close();


  window.setTimeout(
    function () {

      if (!window.closed) {

        window.location.href =
          "power-dashboard.html";

      }

    },
    150
  );

}


function toggleBrowserFullscreen() {

  if (!document.fullscreenElement) {

    document.documentElement
      .requestFullscreen()
      .catch(
        function () {

          setViewStatus(
            "Fullscreen is not available"
          );

        }
      );

    return;

  }


  document.exitFullscreen();

}

// ============================================================
// FILTER SOURCE VALUES USING ACTIVE SLICERS
// ============================================================

function getDashboardFilteredSourceValues(
  snapshot
) {

  const sourceValues =
    Array.isArray(snapshot.sourceValues)
      ? snapshot.sourceValues
      : [];


  if (
    sourceValues.length < 2 ||
    !Array.isArray(sourceValues[0])
  ) {
    return sourceValues;
  }


  const activeFilters =
    dashboardViewState
      .slicerFilters || {};


  const filterColumns =
    Object.keys(activeFilters);


  if (filterColumns.length === 0) {
    return sourceValues;
  }


  const headers =
    sourceValues[0];


  const resolvedFilters =
    filterColumns
      .map(
        function (column) {

          const columnIndex =
            headers.findIndex(
              function (header) {

                return (
                  String(header || "")
                    .trim()
                    .toLowerCase() ===
                  String(column || "")
                    .trim()
                    .toLowerCase()
                );

              }
            );


          return {

            column:
              column,

            columnIndex:
              columnIndex,

            selectedValue:
              String(
                activeFilters[column] ||
                ""
              ),

            isDate:
              String(column || "")
                .trim()
                .toLowerCase()
                .indexOf("date") !== -1

          };

        }
      )
      .filter(
        function (filter) {

          return (
            filter.columnIndex !== -1 &&
            filter.selectedValue
          );

        }
      );


  if (resolvedFilters.length === 0) {
    return sourceValues;
  }


  const filteredRows =
    sourceValues
      .slice(1)
      .filter(
        function (row) {

          if (!Array.isArray(row)) {
            return false;
          }


          return resolvedFilters.every(
            function (filter) {

              const rawValue =
                row[
                  filter.columnIndex
                ];


              const comparableValue =
                filter.isDate
                  ? normalizeDashboardChartLabel(
                      rawValue,
                      {
                        xAxis: "Date"
                      }
                    )
                  : String(
                      rawValue === null ||
                      rawValue === undefined
                        ? ""
                        : rawValue
                    ).trim();


              return (
                comparableValue
                  .toLowerCase() ===
                filter.selectedValue
                  .trim()
                  .toLowerCase()
              );

            }
          );

        }
      );


  return [
    headers
  ].concat(
    filteredRows
  );

}