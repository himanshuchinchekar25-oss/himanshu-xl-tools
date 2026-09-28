/**
 * Universal Data Context
 * Common normalized representation shared by all Himanshu XL Tools engines.
 */
export function createDataContext({ workbookName = "", sheetName = "", address = "", values = [] } = {}) {
  const safeValues = Array.isArray(values) ? values : [];
  const headers = Array.isArray(safeValues[0])
    ? safeValues[0].map((v, i) => String(v ?? "").trim() || `Column ${i + 1}`)
    : [];

  return {
    workbookName,
    sheetName,
    address,
    values: safeValues,
    headers,
    rowCount: Math.max(0, safeValues.length - (headers.length ? 1 : 0)),
    columnCount: headers.length,
    hasHeader: headers.length > 0,
    profile: null,
    semantic: null,
    suggestions: []
  };
}
