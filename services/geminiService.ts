import { GoogleGenAI, Type } from "@google/genai";
import { FCA_PREDEFINED_RULES } from "./fcaPredefinedRules";
import { CONDITION_NAMES, OPERATOR_NAMES, ACTION_NAMES } from "./logicLibraryConfig";

const apiKey = typeof process !== "undefined" && process.env && (process.env.GEMINI_API_KEY || process.env.API_KEY);
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

/** Structured suggestion: map user statement to Logic Library block names so the canvas can build a full rule graph. */
export type StructuredSuggestionResult = {
  ruleName: string;
  description: string;
  conditionNames: string[];
  operatorName: string;
  actionNames: string[];
  _fromFallback?: boolean;
};

const SYSTEM_CONTEXT = `You are a UK FCA compliance expert. You translate a user's free-form compliance rule into a structured rule using ONLY the exact block names from the Logic Library below. Return condition names (one or more), one operator name, and action names (one or more) that match the user's intent. Key topics: PEPs (FG25/3, EDD), sanctions, high-risk jurisdictions, EDD, SAR, MLRO, source of funds, UBO, bearer shares, shell company indicators.`;

const LIBRARY_LISTS = `Available condition names (use exactly as listed): ${CONDITION_NAMES.join(", ")}.\nAvailable operator names (use exactly one): ${OPERATOR_NAMES.join(", ")}.\nAvailable action names (use exactly as listed): ${ACTION_NAMES.join(", ")}.`;

const EXAMPLE = `Example: User says "PEP or high-risk country then Manual EDD" → conditionNames: ["PEP List Match", "Country High Risk"], operatorName: "OR", actionNames: ["Manual EDD"], ruleName: "PEP or High-Risk – EDD", description: "FCA expects enhanced due diligence for PEPs and high-risk jurisdictions (FCG, FG25/3)."`;

function toUserFriendlyError(e: unknown): Error {
  const err = e as { error?: { code?: number; message?: string }; message?: string };
  const code = err?.error?.code;
  const message = err?.error?.message ?? err?.message ?? String(e);
  if (code === 429 || message.includes("429") || message.includes("quota") || message.includes("RESOURCE_EXHAUSTED")) {
    return new Error(
      "Gemini quota exceeded (free tier limit). Try again in a minute or check usage: https://ai.google.dev/gemini-api/docs/rate-limits"
    );
  }
  if (code === 401 || message.includes("API key") || message.includes("401")) {
    return new Error("Invalid Gemini API key. Check GEMINI_API_KEY in .env");
  }
  return e instanceof Error ? e : new Error(message);
}

function ruleToStructuredResult(
  r: (typeof FCA_PREDEFINED_RULES)[number],
  fallbackAction: string = "Flag Alert"
): StructuredSuggestionResult {
  const conditionNames = r.nodes.filter((n) => n.type === "CONDITION").map((n) => n.title);
  const opNode = r.nodes.find((n) => n.type === "OPERATOR");
  const actionNames = r.nodes.filter((n) => n.type === "ACTION").map((n) => n.title);
  return {
    ruleName: r.name,
    description: r.description,
    conditionNames,
    operatorName: opNode?.title ?? "OR",
    actionNames: actionNames.length ? actionNames : [fallbackAction],
    _fromFallback: true,
  };
}

const KEYWORD_TO_RULE_INDEX: [RegExp, number][] = [
  [/sanctions|sanction/, 1],
  [/pep|politically exposed|high-risk country|high risk country/, 0],
  [/jurisdiction|offshore|prohibited country/, 2],
  [/source of funds|ubo|beneficial owner/, 3],
  [/crypto|cbd|cannabis/, 4],
  [/sar|suspicious activity|adverse media/, 5],
  [/bearer share|shell compan/, 6],
  [/document|kyb|expir/, 7],
];

function getLocalSuggestion(prompt: string): StructuredSuggestionResult {
  const p = prompt.toLowerCase();
  for (const [re, idx] of KEYWORD_TO_RULE_INDEX) {
    if (re.test(p)) return ruleToStructuredResult(FCA_PREDEFINED_RULES[idx], "Flag Alert");
  }
  return ruleToStructuredResult(FCA_PREDEFINED_RULES[0], "Manual EDD");
}

async function suggestRuleLogicStructured(prompt: string): Promise<Omit<StructuredSuggestionResult, "_fromFallback">> {
  const contents = `${SYSTEM_CONTEXT}\n\n${LIBRARY_LISTS}\n\n${EXAMPLE}\n\nUser request: ${prompt}\n\nReturn a JSON object with ruleName, description, conditionNames (array of condition names from the list), operatorName (exactly one from the list), and actionNames (array of action names from the list). Use ONLY names from the lists above.`;

  let response;
  try {
    response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ruleName: { type: Type.STRING },
            description: { type: Type.STRING },
            conditionNames: { type: Type.ARRAY, items: { type: Type.STRING } },
            operatorName: { type: Type.STRING },
            actionNames: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["ruleName", "description", "conditionNames", "operatorName", "actionNames"],
        },
      },
    });
  } catch (e) {
    throw toUserFriendlyError(e);
  }

  const text = response?.text;
  if (!text || typeof text !== "string") {
    throw new Error("No response from model. Check your API key (GEMINI_API_KEY in .env) and network.");
  }

  try {
    const p = JSON.parse(text) as Record<string, unknown>;
    const conditionNames = Array.isArray(p.conditionNames) ? (p.conditionNames as string[]) : ["Country High Risk"];
    const actionNames = Array.isArray(p.actionNames) ? (p.actionNames as string[]) : ["Flag Alert"];
    return {
      ruleName: (p.ruleName as string) ?? "Suggested rule",
      description: (p.description as string) ?? "",
      conditionNames: conditionNames.length ? conditionNames : ["Country High Risk"],
      operatorName: (p.operatorName as string) ?? "OR",
      actionNames: actionNames.length ? actionNames : ["Flag Alert"],
    };
  } catch {
    throw new Error("Model did not return valid JSON. Try rephrasing your prompt.");
  }
}

/** Call Gemini first; on 429 or other API error, return a structured suggestion from the FCA library so the feature still works. */
export async function suggestRuleLogicWithFallback(prompt: string): Promise<StructuredSuggestionResult> {
  try {
    const out = await suggestRuleLogicStructured(prompt);
    return { ...out, _fromFallback: false };
  } catch {
    return getLocalSuggestion(prompt);
  }
}
