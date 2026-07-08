// 关键词→skill 路由表（port of OMX keyword-detector）。
// 命中后 user-prompt-submit hook 注入"应调用 X skill"提示，提升路由确定性。
// 实现 TODO：从 catalog/manifest.json 的 triggers 字段自动生成此表（P3-b）。
export const KEYWORD_ROUTES = [
  { pattern: /analyze|investigate|why does|what'?s causing/i, skill: 'analyze' },
  { pattern: /deep\s?interview|clarify.*(spec|requirement)/i, skill: 'deep-interview' },
  { pattern: /\bplan\b|scope.*(idea|feature)|roadmap/i, skill: 'plan' },
  { pattern: /consensus plan|planner.*architect.*critic/i, skill: 'ralplan' },
  { pattern: /code review|review.*(pr|change|diff)/i, skill: 'code-review' },
  { pattern: /persistence.*(loop|until)|keep going until/i, skill: 'ralph' },
  { pattern: /parallel.*(agent|worker|fan.?out)/i, skill: 'ultrawork' },
  { pattern: /team.*(of agent|swarm|coordinate)/i, skill: 'team' },
  { pattern: /autopilot|end.?to.?end.*(deliver|pipeline)/i, skill: 'autopilot' },
];

// 返回命中的 skill 名（首个命中）；未命中返回 null。
export function routeByKeyword(text) {
  if (!text) return null;
  for (const r of KEYWORD_ROUTES) {
    if (r.pattern.test(text)) return r.skill;
  }
  return null;
}
