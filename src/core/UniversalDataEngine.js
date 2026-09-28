import { createDataContext } from "./context/UniversalDataContext.js";
import { profileData } from "./profiler/DataProfiler.js";
import { inferSemanticRoles } from "./semantic/SemanticEngine.js";
import { suggestKPIs, suggestCharts, suggestSlicers } from "./suggestions/SmartSuggestionEngine.js";

export function analyzeUniversalData({ workbookName = "", sheetName = "", address = "", values = [] } = {}) {
  const context = createDataContext({ workbookName, sheetName, address, values });
  context.profile = profileData(values);
  context.semantic = inferSemanticRoles(context.profile);
  context.suggestions = {
    kpis: suggestKPIs(context.profile, context.semantic),
    charts: suggestCharts(context.profile, context.semantic),
    slicers: suggestSlicers(context.profile, context.semantic)
  };
  return context;
}

export function formatUniversalAnalysis(context) {
  const p = context?.profile;
  return {
    detectedType: p?.pattern?.name || "General Data",
    confidence: p?.pattern?.confidence || 0,
    rows: p?.rows || 0,
    columns: p?.columns || 0,
    quality: p?.quality || null,
    headers: p?.headers || [],
    semantic: context?.semantic || {},
    suggestions: context?.suggestions || { kpis: [], charts: [], slicers: [] }
  };
}
