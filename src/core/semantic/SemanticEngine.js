import { profilerPatterns } from "../profiler/DataProfiler.js";

const { DATE_HEADER_RE, ID_HEADER_RE, MEASURE_HEADER_RE, CATEGORY_HEADER_RE, NAME_HEADER_RE } = profilerPatterns;

export function inferSemanticRoles(profile) {
  const roles = {
    id: [], name: [], entity: [], category: [], subcategory: [], date: [],
    quantity: [], amount: [], currency: [], percentage: [], status: [], location: [], description: [], measure: []
  };

  (profile?.columnsProfile || []).forEach(col => {
    const name = col.name;
    const lower = name.toLowerCase();

    if (ID_HEADER_RE.test(lower) || (col.uniquenessRatio >= 0.95 && col.dataType === "text")) roles.id.push(name);
    if (NAME_HEADER_RE.test(lower)) roles.name.push(name);
    if (NAME_HEADER_RE.test(lower)) roles.entity.push(name);
    if (CATEGORY_HEADER_RE.test(lower) && !/product|customer|supplier|vendor/i.test(lower)) roles.category.push(name);
    if (/sub.?category|sub.?group|class/i.test(lower)) roles.subcategory.push(name);
    if (col.dataType === "date" || DATE_HEADER_RE.test(lower)) roles.date.push(name);
    if (/quantity|qty|units|count|pieces|pcs/i.test(lower)) roles.quantity.push(name);
    if (MEASURE_HEADER_RE.test(lower) || col.dataType === "number") roles.measure.push(name);
    if (/sales|sale|revenue|amount|price|cost|profit|salary|wage|value|balance/i.test(lower)) roles.amount.push(name);
    if (/currency|amount|price|cost|sales|revenue|profit|salary|wage|value/i.test(lower)) roles.currency.push(name);
    if (/percent|percentage|margin|rate/i.test(lower)) roles.percentage.push(name);
    if (/status|state|stage|active|inactive/i.test(lower)) roles.status.push(name);
    if (/region|zone|state|city|country|location|address|branch/i.test(lower)) roles.location.push(name);
    if (/description|remarks|comment|note|details/i.test(lower)) roles.description.push(name);
  });

  return roles;
}
