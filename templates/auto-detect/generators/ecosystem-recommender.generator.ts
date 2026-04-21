import {
  buildHookSnippet,
  dedupeRecommendations,
  inferEcosystem,
  type EcosystemRecommendation,
  type GeneratorContext,
  type RecommendationItem,
} from './base-generator.js';
import type { RecommendationSummaryItem, SimplifiedRecommendation } from '../run-contract.js';

function nodeRecommendations(contextName: string): RecommendationItem[] {
  return [
    {
      id: 'node-root-truth',
      title: 'Node.js root truth pack',
      why: 'Node 项目通常同时存在 package.json、脚本和多种工具链，适合把事实、协议和局部规则分层收敛。',
      tips: [
        '把脚本入口与安装/校验命令写进 AGENTS.md，避免散在 README 和 package.json。',
        '如果有 eslint/prettier/test 命令，把它们同步进可读的事实层。',
      ],
      hookCode: buildHookSnippet('node', contextName),
      confidence: 0.94,
    },
    {
      id: 'node-incremental-merge',
      title: 'Node incremental merge',
      why: 'Node 仓库更容易出现脚本和文档同时变更，增量合并能降低覆盖风险。',
      tips: [
        '优先替换 Harness marker 区块，而不是重写整份文档。',
        '对生成结果输出 diff 预览，再决定是否写回。',
      ],
      hookCode: `const mergeStrategy = existingContent ? 'incremental' : 'create';\nconst canOverwrite = false;`,
      confidence: 0.9,
    },
  ];
}

function pythonRecommendations(contextName: string): RecommendationItem[] {
  return [
    {
      id: 'python-virtualenv-truth',
      title: 'Python venv-aware truth pack',
      why: 'Python 项目常同时存在 pyproject.toml、requirements.txt 和虚拟环境约束，适合把运行时、命令和依赖边界写清楚。',
      tips: [
        '把启动、测试、格式化和依赖安装命令同步到 AGENTS.md。',
        '如果有多环境支持，明确最小支持版本与推荐虚拟环境用法。',
      ],
      hookCode: buildHookSnippet('python', contextName),
      confidence: 0.92,
    },
    {
      id: 'python-merge-safe',
      title: 'Python merge-safe docs',
      why: 'Python 仓库的配置文件往往较短，直接 overwrite 风险更高，先提示再合并更稳。',
      tips: [
        '优先用局部 override，避免把项目级说明扩散到所有目录。',
        '为生成器保留明确的 marker 区块，方便后续自动更新。',
      ],
      hookCode: `strategy = 'prompt' if existing_content else 'incremental'`,
      confidence: 0.87,
    },
  ];
}

function goRecommendations(contextName: string): RecommendationItem[] {
  return [
    {
      id: 'go-module-truth',
      title: 'Go module truth pack',
      why: 'Go 项目通常围绕 go.mod、go test 和 gofmt 形成稳定边界，适合把构建、测试和模块信息集中记录。',
      tips: [
        '把 `go test ./...`、`gofmt`、`go vet` 等命令写入事实层。',
        '如果存在多个模块，说明各模块职责和入口。',
      ],
      hookCode: buildHookSnippet('go', contextName),
      confidence: 0.93,
    },
    {
      id: 'go-safe-overwrite-guard',
      title: 'Go safe overwrite guard',
      why: 'Go 仓库经常要求干净、可重复的构建，生成器应默认保留已有内容并给出 diff。',
      tips: [
        '对已经有人编辑过的文档使用 incremental 或 prompt，而不是 overwrite。',
        '将风险等级和冲突等级同时返回给上层编排器。',
      ],
      hookCode: `if len(existingContent) > 0 {\n    strategy = "incremental"\n}`,
      confidence: 0.89,
    },
  ];
}

function genericRecommendations(contextName: string): RecommendationItem[] {
  return [
    {
      id: 'generic-root-truth',
      title: 'Generic root truth pack',
      why: '当检测结果不足以锁定特定生态时，先给出保守的根级真值模板，避免误导。',
      tips: [
        '先写 AGENTS.md、CLAUDE.md 和 steering/ 索引，再考虑工具私有规则。',
        '保持所有自动生成内容都能被 diff 和回滚。',
      ],
      hookCode: `const harness = { action: 'prompt', markers: ['HARNESS_DYNAMIC_SECTION_START', 'HARNESS_DYNAMIC_SECTION_END'] };`,
      confidence: 0.72,
    },
  ];
}

function bundleRecommendations(context: GeneratorContext): RecommendationItem[] {
  const frameworks = new Set(context.detected.frameworks.map((item) => item.toLowerCase()));
  const tools = new Set(context.detected.tools.map((item) => item.toLowerCase()));
  const commandNames = new Set(context.detected.commands.map((item) => item.name.toLowerCase()));
  const items: RecommendationItem[] = [];

  if (['react', 'next', 'vite'].some((item) => frameworks.has(item))) {
    items.push({
      id: 'bundle-frontend-excellence',
      title: 'Frontend Excellence Bundle',
      why: '检测到前端框架信号，适合启用 UI 设计、可访问性和浏览器验证相关建议。',
      tips: ['把视觉验收、组件边界和截图验证写进推荐报告。', '保持 Cursor/IDE 私有规则只是镜像，不替代根级真值。'],
      hookCode: `bundle: frontend-excellence\nwhen: frameworks include react|next|vite`,
      confidence: 0.91,
    });
  }

  if (tools.has('mcp')) {
    items.push({
      id: 'bundle-mcp-productivity',
      title: 'MCP Productivity Bundle',
      why: '检测到 MCP 配置或依赖，适合推荐 context/documentation/browser/repository 类 MCP 能力。',
      tips: ['只生成 MCP 推荐，不自动安装 server。', '把 MCP 用途写成可审查的适配说明。'],
      hookCode: `bundle: mcp-productivity\nwhen: tools include mcp`,
      confidence: 0.9,
    });
  }

  if (frameworks.has('pytest') || commandNames.has('test')) {
    items.push({
      id: 'bundle-tdd-quality',
      title: 'TDD + Quality Bundle',
      why: '检测到测试命令或测试框架，适合推荐测试驱动和质量门禁工作流。',
      tips: ['把测试命令写入 AGENTS.md。', 'silent 模式只自动写入低风险质量建议。'],
      hookCode: `bundle: tdd-quality\nwhen: commands include test or frameworks include pytest`,
      confidence: 0.88,
    });
  }

  if (['react', 'next', 'vite', 'express', 'nestjs', 'fastapi', 'django'].some((item) => frameworks.has(item))) {
    items.push({
      id: 'bundle-browser-web-verification',
      title: 'Browser / Web Verification Bundle',
      why: '检测到 Web 应用框架，适合推荐 Playwright、截图和端到端验证路径。',
      tips: ['先用 dry-run 查看推荐，不自动安装浏览器依赖。', '把验证命令和截图产物保持可回滚。'],
      hookCode: `bundle: browser-web-verification\nwhen: web frameworks detected`,
      confidence: 0.86,
    });
  }

  if (tools.has('cursor')) {
    items.push({
      id: 'bundle-cursor-mirror-guidance',
      title: 'Cursor Mirror Guidance',
      why: '检测到 Cursor 规则，适合生成根级真值优先的 Cursor mirror 建议。',
      tips: ['Cursor rules 只做兼容镜像。', '冲突时以 AGENTS.md / CLAUDE.md 为准。'],
      hookCode: `bundle: cursor-mirror-guidance\nwhen: tools include cursor`,
      confidence: 0.89,
    });
  }

  return items;
}

export function recommendEcosystem(context: GeneratorContext): EcosystemRecommendation {
  const ecosystem = inferEcosystem(context);
  const contextName = (context.projectName ?? 'Project').replace(/[^A-Za-z0-9]+/g, '');
  let recommendations: RecommendationItem[];

  if (ecosystem === 'node') {
    recommendations = nodeRecommendations(contextName);
  } else if (ecosystem === 'python') {
    recommendations = pythonRecommendations(contextName);
  } else if (ecosystem === 'go') {
    recommendations = goRecommendations(contextName);
  } else {
    recommendations = genericRecommendations(contextName);
  }

  recommendations = dedupeRecommendations(recommendations);
  recommendations = dedupeRecommendations([...recommendations, ...bundleRecommendations(context)]);

  const score = ecosystem === 'generic' ? 0.55 : ecosystem === 'node' ? 0.93 : ecosystem === 'python' ? 0.91 : 0.92;
  const reason =
    ecosystem === 'node'
      ? 'Detected JavaScript/TypeScript/package-manager signals, so Node-oriented rules have the highest leverage.'
      : ecosystem === 'python'
        ? 'Detected Python packaging signals, so Python rules best preserve local dependency and runtime clarity.'
        : ecosystem === 'go'
          ? 'Detected Go module signals, so Go rules fit the build/test workflow most naturally.'
          : 'Detection signals were mixed or sparse, so the recommender falls back to a generic root-truth pack.';

  return {
    ecosystem,
    score,
    reason,
    recommendations,
  };
}

export function selectSimplifiedRecommendation(
  context: GeneratorContext,
  recommendation: EcosystemRecommendation,
  fullReport: string,
): SimplifiedRecommendation {
  const sorted = [...recommendation.recommendations].sort((a, b) => b.confidence - a.confidence);
  const fallback = sorted[0] ?? {
    id: 'root-truth',
    title: 'Add root truth files',
    why: 'Harness needs a small canonical fact and protocol layer before tool-specific mirrors are useful.',
    tips: [],
    hookCode: '',
    confidence: recommendation.score,
  };
  return {
    mustHave: toSummaryItem(fallback),
    suggested: toSummaryItem(sorted.find((item) => item.id !== fallback.id) ?? fallback),
    warning: inferTopWarning(context),
    fullReport,
  };
}

export default recommendEcosystem;

function toSummaryItem(item: RecommendationItem): RecommendationSummaryItem {
  return {
    id: item.id,
    title: item.title,
    why: item.why,
    confidence: item.confidence,
  };
}

function inferTopWarning(context: GeneratorContext): string {
  const files = new Set((context.existingFiles ?? []).map((item) => item.toLowerCase()));
  const tools = new Set(context.detected.tools.map((item) => item.toLowerCase()));

  if ((files.has('agents.md') || files.has('claude.md')) && tools.has('cursor')) {
    return 'Existing root truth and Cursor rules should stay aligned; review conflicts before applying updates.';
  }
  if (tools.has('claude-code') && tools.has('cursor')) {
    return 'Multiple AI tool surfaces detected; keep AGENTS.md and CLAUDE.md as the source of truth.';
  }
  if (recommendationHasSparseSignals(context)) {
    return 'Detection signals are sparse; review summary.md before applying generated files.';
  }
  return 'Review conflicts and non-low-risk changes before applying the plan.';
}

function recommendationHasSparseSignals(context: GeneratorContext): boolean {
  return context.detected.tools.length <= 1 && context.detected.frameworks.length === 0 && context.detected.commands.length === 0;
}
