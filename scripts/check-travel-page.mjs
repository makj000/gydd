import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const pageDir = process.argv[2] || "t/2026-austria-czech-7f4c9b2e6a31d8";
const pagePath = path.join(pageDir, "index.html");
const html = fs.readFileSync(pagePath, "utf8");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  if (start === -1) {
    throw new Error(`Missing function ${name}`);
  }

  const paramsEnd = html.indexOf(")", start);
  const bodyStart = html.indexOf("{", paramsEnd);
  let depth = 0;
  for (let index = bodyStart; index < html.length; index += 1) {
    const char = html[index];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return html.slice(start, index + 1);
      }
    }
  }

  throw new Error(`Unclosed function ${name}`);
}

function extractScripts() {
  const scripts = [];
  const scriptPattern = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptPattern.exec(html)) !== null) {
    scripts.push(match[1]);
  }
  return scripts;
}

function extractLocalImageRefs() {
  const refs = new Set();
  const patterns = [
    /\bsrc=["']([^"']+)["']/gi,
    /url\(["']?([^"')]+)["']?\)/gi,
    /\bphoto:\s*["']([^"']+)["']/gi
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const ref = match[1];
      if (
        ref.startsWith("photos/") ||
        ref.startsWith("calendar/") ||
        ref.endsWith(".svg")
      ) {
        refs.add(ref);
      }
    }
  }

  return [...refs];
}

for (const script of extractScripts()) {
  try {
    new Function(script);
  } catch (error) {
    fail(`JavaScript parse failed: ${error.message}`);
  }
}

const expectedDates = [
  "2026-07-29",
  "2026-07-30",
  "2026-07-31",
  "2026-08-01",
  "2026-08-02",
  "2026-08-03",
  "2026-08-04",
  "2026-08-05",
  "2026-08-06",
  "2026-08-07",
  "2026-08-08"
];

for (const date of expectedDates) {
  if (!html.includes(`data-date="${date}"`)) {
    fail(`Missing day section for ${date}`);
  }
}

const dayCount = (html.match(/<article\s+class="day"(?=\s|>)/g) || []).length;
if (dayCount !== expectedDates.length) {
  fail(`Expected ${expectedDates.length} day sections, found ${dayCount}`);
}

for (const requiredText of [
  "智能助手",
  "版本管理",
  "旅行记账",
  "百威酿酒厂参观",
  "圣维特大教堂",
  "Zwettler's Wirtshaus 晚餐已订位"
]) {
  if (!html.includes(requiredText)) {
    fail(`Missing required page text: ${requiredText}`);
  }
}

for (const ref of extractLocalImageRefs()) {
  const refPath = path.join(pageDir, ref);
  if (!fs.existsSync(refPath)) {
    fail(`Missing local asset: ${ref}`);
  }
}

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(
  [
    "function clientCanApplyChange() { return false; }",
    "signupRequestMode",
    "isDiningQuestion",
    "dayAssistantApplyMode",
    "daySuggestionCanApply"
  ].map((item) => (item.startsWith("function ") ? item : extractFunction(item))).join("\n"),
  sandbox
);

assert.equal(sandbox.dayAssistantApplyMode("午餐,你会建议在哪个饭馆?", {}), "dining");
assert.equal(sandbox.daySuggestionCanApply("午餐,你会建议在哪个饭馆?", { answer: "Gasthof Goldgasse" }), true);
assert.equal(sandbox.dayAssistantApplyMode("把上午安排改轻松一点", {}), "patch");
assert.equal(sandbox.dayAssistantApplyMode("统计人数，所有人都参加", {}), "signup");
assert.equal(sandbox.dayAssistantApplyMode("这天开放时间是什么?", {}), "");

if (process.exitCode) {
  process.exit();
}

console.log(`Travel page check passed for ${pageDir}`);
