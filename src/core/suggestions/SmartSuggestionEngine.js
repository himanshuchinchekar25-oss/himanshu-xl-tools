/**
 * Universal recommendation engine.
 * It recommends by semantic role/pattern, never by a fixed workbook column.
 */
export function suggestKPIs(profile, semantic) {
  const pattern = profile?.pattern?.name || "";
  const suggestions = [];
  const add = (title, type, column, priority, formula = null) => {
    if (!column && !formula) return;
    suggestions.push({ title, type, column: column || "", priority, formula });
  };

  const amount = semantic?.amount || [];
  const measure = semantic?.measure || [];
  const quantity = semantic?.quantity || [];
  const entities = semantic?.entity || semantic?.name || [];

  // Pattern-aware recommendations first. The columns are discovered dynamically.
  if (/inventory/i.test(pattern)) {
    const stock = quantity.find(c => /stock|qty|quantity|units/i.test(c)) || quantity[0] || measure.find(c => /stock/i.test(c));
    const retail = amount.find(c => /retail|sale.?price|selling.?price/i.test(c));
    const cost = amount.find(c => /unit.?cost|cost/i.test(c));
    add("Total Stock", "SUM", stock, 100);
    add("Average Retail Price", "AVERAGE", retail, 95);
    if (stock && retail) add("Inventory Value", "FORMULA", "", 92, { operation: "SUMPRODUCT", columns: [stock, retail] });
    if (stock) add("Maximum Stock", "MAX", stock, 80);
    if (cost) add("Average Unit Cost", "AVERAGE", cost, 75);
    if (entities[0]) add("Product Count", "COUNTA", entities[0], 70);
  } else if (/employee/i.test(pattern)) {
    const salary = amount.find(c => /salary|wage|pay/i.test(c));
    const attendance = measure.find(c => /attendance|present/i.test(c));
    const overtime = measure.find(c => /overtime|hours/i.test(c));
    add("Employee Count", "COUNTA", entities[0], 100);
    add("Total Salary", "SUM", salary, 98);
    add("Average Salary", "AVERAGE", salary, 95);
    add("Average Attendance", "AVERAGE", attendance, 90);
    add("Total Overtime", "SUM", overtime, 75);
  } else if (/sales|transaction/i.test(pattern)) {
    const sales = amount.find(c => /sales|sale|revenue|amount|net/i.test(c)) || amount[0];
    const profit = amount.find(c => /profit|margin/i.test(c));
    add("Total Sales", "SUM", sales, 100);
    add("Total Profit", "SUM", profit, 98);
    add("Order Count", "COUNTA", entities.find(c => /order|invoice/i.test(c)) || entities[0], 95);
    add("Average Sales", "AVERAGE", sales, 85);
    add("Maximum Sales", "MAX", sales, 70);
  }

  // Universal fallback for unknown workbook types.
  if (suggestions.length < 4) {
    amount.slice(0, 3).forEach((column, i) => add(`Total ${column}`, "SUM", column, 65 - i));
    measure.slice(0, 3).forEach((column, i) => add(`Average ${column}`, "AVERAGE", column, 55 - i));
    if (entities[0]) add("Record Count", "COUNTA", entities[0], 60);
  }

  return uniqueSuggestions(suggestions).sort((a, b) => b.priority - a.priority).slice(0, 8);
}

export function suggestCharts(profile, semantic) {
  const charts = [];
  const date = semantic?.date?.[0];
  const category = semantic?.category?.[0] || semantic?.location?.[0];
  const measure = semantic?.amount?.[0] || semantic?.measure?.[0];

  if (date && measure) charts.push({ title: `${measure} Trend`, type: "Line", xAxis: date, yAxis: measure, aggregation: "SUM", priority: 95 });
  if (category && measure) charts.push({ title: `${measure} by ${category}`, type: "Column", xAxis: category, yAxis: measure, aggregation: "SUM", priority: 90 });
  if (category && measure) charts.push({ title: `${measure} Distribution`, type: "Bar", xAxis: category, yAxis: measure, aggregation: "SUM", priority: 70 });
  return charts.slice(0, 5);
}

export function suggestSlicers(profile, semantic) {
  return [...new Set([...(semantic?.category || []), ...(semantic?.location || []), ...(semantic?.status || [])])]
    .slice(0, 5)
    .map((column, i) => ({ column, title: column, priority: 90 - i }));
}

function uniqueSuggestions(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = `${item.type}|${item.column}|${item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
