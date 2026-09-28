const DATE_HEADER_RE = /(date|time|month|year|day|dob|birth|joining|created|updated)/i;
const ID_HEADER_RE = /(^|\b)(id|code|no|number|sku|emp[- ]?id|order[- ]?id|invoice[- ]?no)(\b|$)/i;
const MEASURE_HEADER_RE = /(amount|sales|sale|revenue|price|cost|profit|salary|wage|stock|quantity|qty|total|value|balance|rate|percentage|percent|margin|attendance|overtime|hours)/i;
const CATEGORY_HEADER_RE = /(category|type|region|zone|state|city|country|department|dept|designation|status|class|group|supplier|vendor|branch|product|customer|segment)/i;
const NAME_HEADER_RE = /(name|employee|customer|client|product|person|staff|supplier|vendor|company|item)/i;

function isBlank(v) {
  return v === null || v === undefined || String(v).trim() === "";
}

function isNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

function looksLikeDate(v) {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return true;
  if (typeof v !== "string" || !v.trim()) return false;
  const text = v.trim();
  if (!/^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/.test(text)) return false;
  const d = new Date(text);
  return !Number.isNaN(d.getTime());
}

function uniqueCount(values) {
  const set = new Set(values.filter(v => !isBlank(v)).map(v => String(v)));
  return set.size;
}

export function profileData(values) {
  const rows = Array.isArray(values) ? values : [];
  const headers = Array.isArray(rows[0])
    ? rows[0].map((v, i) => String(v ?? "").trim() || `Column ${i + 1}`)
    : [];

  const dataRows = rows.slice(headers.length ? 1 : 0);
  const columns = headers.map((name, index) => {
    const sample = dataRows.map(row => row?.[index]).filter(v => !isBlank(v));
    const numericCount = sample.filter(isNumber).length;
    const dateCount = sample.filter(looksLikeDate).length;
    const textCount = sample.filter(v => typeof v === "string" && v.trim() !== "").length;
    const blankCount = dataRows.length - sample.length;
    const uniqueValues = uniqueCount(sample);
    const lower = name.toLowerCase();

    let dataType = "mixed";
    if (sample.length === 0) dataType = "blank";
    else if (numericCount / sample.length >= 0.8) dataType = "number";
    else if (dateCount / sample.length >= 0.8 || DATE_HEADER_RE.test(lower)) dataType = "date";
    else if (textCount / sample.length >= 0.8) dataType = "text";

    return {
      index,
      name,
      dataType,
      nonBlankCount: sample.length,
      blankCount,
      uniqueCount: uniqueValues,
      uniquenessRatio: sample.length ? uniqueValues / sample.length : 0,
      numericRatio: sample.length ? numericCount / sample.length : 0,
      dateRatio: sample.length ? dateCount / sample.length : 0,
      sampleValues: sample.slice(0, 5)
    };
  });

  const numericColumns = columns.filter(c => c.dataType === "number");
  const dateColumns = columns.filter(c => c.dataType === "date");
  const textColumns = columns.filter(c => c.dataType === "text");

  const duplicateRows = countDuplicateRows(dataRows);

  return {
    rows: dataRows.length,
    columns: headers.length,
    headers,
    columnsProfile: columns,
    numericColumns,
    dateColumns,
    textColumns,
    blankCells: columns.reduce((sum, c) => sum + c.blankCount, 0),
    duplicateRows,
    pattern: detectPattern(columns, dataRows.length),
    quality: calculateQuality(dataRows.length, headers.length, duplicateRows, columns)
  };
}

function countDuplicateRows(rows) {
  const seen = new Set();
  let duplicates = 0;
  rows.forEach(row => {
    const key = JSON.stringify(row ?? []);
    if (seen.has(key)) duplicates++;
    else seen.add(key);
  });
  return duplicates;
}

function detectPattern(columns, rowCount) {
  const names = columns.map(c => c.name).join(" ").toLowerCase();
  const hasDate = columns.some(c => c.dataType === "date");
  const hasMeasure = columns.some(c => c.dataType === "number" || MEASURE_HEADER_RE.test(c.name));
  const hasCategory = columns.some(c => CATEGORY_HEADER_RE.test(c.name));
  const hasInventory = /(stock|inventory|warehouse|sku|unit cost|retail price)/i.test(names);
  const hasEmployee = /(employee|emp[- ]?id|salary|attendance|overtime|designation|pf|esi|hra)/i.test(names);
  const hasSales = /(sales|revenue|order|invoice|profit|customer)/i.test(names);

  if (hasInventory) return { name: "Retail Inventory", confidence: 0.9 };
  if (hasEmployee) return { name: "Employee Data", confidence: 0.9 };
  if (hasSales) return { name: "Sales / Transaction Data", confidence: 0.85 };
  if (hasDate && hasCategory && hasMeasure) return { name: "Time-Series / Analytical Data", confidence: 0.75 };
  if (rowCount > 0 && hasMeasure) return { name: "General Analytical Data", confidence: 0.6 };
  return { name: "General Data", confidence: 0.45 };
}

function calculateQuality(rows, cols, duplicateRows, profiles) {
  if (!rows || !cols) return { score: 0, label: "Empty" };
  const totalCells = rows * cols;
  const blankRatio = profiles.reduce((s, c) => s + c.blankCount, 0) / totalCells;
  const duplicateRatio = duplicateRows / rows;
  const score = Math.max(0, Math.min(100, Math.round(100 - blankRatio * 60 - duplicateRatio * 25)));
  return { score, label: score >= 90 ? "Excellent" : score >= 75 ? "Good" : score >= 55 ? "Needs Review" : "Poor" };
}

export const profilerPatterns = { DATE_HEADER_RE, ID_HEADER_RE, MEASURE_HEADER_RE, CATEGORY_HEADER_RE, NAME_HEADER_RE };
