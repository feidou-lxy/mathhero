import type { GenerationPlan } from "@/lib/profile/generationPlan";
import { formatSkillList } from "@/lib/profile/generationPlan";
import {
  formatBasicTopicOverview,
  formatExtensionTopicOverview,
  GRADE2_FIXED_ADVANCED_COUNT,
  GRADE2_FIXED_BASIC_COUNT,
  GRADE2_TOPIC_LABELS,
  GRADE2_TOPIC_SPECS,
} from "@/lib/curriculum/grade2";
import { FOCUS_TRAINING_SKILLS } from "@/lib/curriculum/difficultyBalance";
import {
  PROFILE_SKILLS,
  SKILL_LABELS,
  type ProfileSkill,
  type StudentProfile,
} from "@/lib/types/profile";
import type { PracticeLevel } from "@/lib/types/practice";
import type { AdvancedDifficultyTier } from "@/lib/curriculum/difficultyBalance";

function tierDifficultyHint(tier: GenerationPlan["difficultyTier"]): string {
  switch (tier) {
    case "hard":
      return `基础题难度偏高：
- 加减法：100 以内，必须含进位/退位
- 乘法：2/5/10 口诀，可含稍大因数
- 除法：2/5/10 整除，可含两步情境
- 应用题：两步，数字可至 50`;
    case "easy":
      return `基础题难度偏低：
- 加减法：50 以内，进位/退位数字偏小
- 乘法：仅 2 和 5 的口诀，因数≤5
- 除法：被除数≤20，除数 2 或 5
- 应用题：数字≤20，情境非常直观`;
    default:
      return `基础题难度适中：
- 加减法：100 以内含进位/退位
- 乘法：2/5/10 表内乘法
- 除法：2/5/10 表内除法，整除
- 应用题：两步为主，数字≤30`;
  }
}

function advancedTierHint(tier: AdvancedDifficultyTier): string {
  switch (tier) {
    case "hard":
      return `拓展题（浅奥）难度偏高 — 学生基础题正确率高，可增加思维挑战：
- 多步推理、复杂规律、3 步应用
- 数字可至 100，仍不超二年级认知`;
    case "easy":
      return `拓展题（浅奥）难度偏低 — 学生基础题错误较多，降低思维难度：
- 简单数列规律、AB 图形交替
- 单条件推理，数字≤20，步骤≤2`;
    default:
      return `拓展题（浅奥）难度适中：
- 3-5 项找规律，2 步推理或巧算
- 思维有挑战但不超纲`;
  }
}

function skillDifficultyHint(
  skill: ProfileSkill,
  profile: StudentProfile,
  plan: GenerationPlan,
): string {
  const stats = profile.skills[skill];
  const name = SKILL_LABELS[skill];
  const tag = `${name}（${stats.levelLabel} ${stats.accuracy}%）`;
  const isFocus = plan.balance?.focusSkills.includes(skill);
  const focusNote = isFocus ? "【重点训练，可适当加练或略提难度】" : "";

  if (stats.total === 0) {
    return `${tag}：暂无历史，按本次整体难度出题${focusNote}`;
  }

  switch (skill) {
    case "addition":
      if (stats.level === "proficient") return `${tag}：100 以内含进位加法，数字可更大${focusNote}`;
      if (stats.level === "needs_improvement") return `${tag}：50 以内简单进位加法，数字偏小${focusNote}`;
      return `${tag}：100 以内进位加法，适中难度${focusNote}`;
    case "subtraction":
      if (stats.level === "proficient") return `${tag}：100 以内含退位减法${focusNote}`;
      if (stats.level === "needs_improvement") return `${tag}：50 以内简单退位减法${focusNote}`;
      return `${tag}：100 以内退位减法${focusNote}`;
    case "multiplication":
      if (stats.level === "proficient") return `${tag}：2/5/10 乘法熟练，可含 10×较大数${focusNote}`;
      if (stats.level === "needs_improvement") return `${tag}：仅 2 和 5 的乘法，因数≤5${focusNote}`;
      return `${tag}：2/5/10 表内乘法${focusNote}`;
    case "division":
      if (stats.level === "proficient") return `${tag}：2/5/10 除法熟练，含平均分与包含除法${focusNote}`;
      if (stats.level === "needs_improvement") return `${tag}：除数 2 或 5，被除数≤20，情境化平均分${focusNote}`;
      return `${tag}：2/5/10 表内除法，整除，优先出平均分情境${focusNote}`;
    case "two_step_word":
      if (stats.level === "proficient") return `${tag}：两步应用题，数字可至 50${focusNote}`;
      if (stats.level === "needs_improvement") return `${tag}：两步应用题，每步数字≤10，情境直观${focusNote}`;
      return `${tag}：两步应用题，数字≤30${focusNote}`;
    case "time_money":
      if (stats.level === "proficient") return `${tag}：时间/钱币综合，可含找零${focusNote}`;
      if (stats.level === "needs_improvement") return `${tag}：整点/半点或整元购物，一步计算${focusNote}`;
      return `${tag}：时间或钱币，一步或两步${focusNote}`;
    case "pattern_sequence":
      if (plan.balance?.advancedTier === "hard") return `${tag}：数列规律可含倍数/交替，项数 5 个${focusNote}`;
      if (plan.balance?.advancedTier === "easy") return `${tag}：简单 +1/+2 等差规律${focusNote}`;
      return `${tag}：3-5 项数列找下一项${focusNote}`;
    case "logic_reasoning":
      if (plan.balance?.advancedTier === "hard") return `${tag}：2-3 个条件推理${focusNote}`;
      if (plan.balance?.advancedTier === "easy") return `${tag}：单条件排序或排除${focusNote}`;
      return `${tag}：简单逻辑，答案为整数${focusNote}`;
    case "shape_pattern":
      if (plan.balance?.advancedTier === "hard") return `${tag}：图形周期规律，项数可至 10${focusNote}`;
      if (plan.balance?.advancedTier === "easy") return `${tag}：AB 交替或 AAB 简单规律${focusNote}`;
      return `${tag}：图形排列找规律${focusNote}`;
    case "multi_step_word":
      if (plan.balance?.advancedTier === "hard") return `${tag}：3 步应用题，情境略丰富${focusNote}`;
      if (plan.balance?.advancedTier === "easy") return `${tag}：暂不优先，若出现则 2 步、数字≤20${focusNote}`;
      return `${tag}：2-3 步浅奥应用题${focusNote}`;
    case "clever_calc":
      if (plan.balance?.advancedTier === "hard") return `${tag}：凑整/拆分巧算，三数相加${focusNote}`;
      if (plan.balance?.advancedTier === "easy") return `${tag}：简单凑十或凑整（如 9+6）${focusNote}`;
      return `${tag}：拆分或凑整巧算${focusNote}`;
  }
}

export function buildProfileDifficultySection(
  profile: StudentProfile | undefined,
  plan: GenerationPlan,
  level: PracticeLevel = 2,
): string {
  const p = profile;
  if (!p) return "";

  const skillHints = PROFILE_SKILLS.map((skill) =>
    skillDifficultyHint(skill, p, plan),
  );

  const weakHint =
    plan.weakSkills.length > 0
      ? `薄弱项（${formatSkillList(plan.weakSkills)}）对应题型应降低数字难度，题干更直观。`
      : "暂无明显薄弱项，题型按 slot 均衡分布。";

  const weakRankingHint =
    plan.weakSkillsRanked.length > 0
      ? `薄弱项排序（最薄弱优先加练）：${plan.weakSkillsRanked
          .slice(0, 5)
          .map((skill, index) => {
            const stats = p?.skills[skill];
            const label = SKILL_LABELS[skill];
            if (!stats || stats.total === 0) return `${index + 1}. ${label}（未练习）`;
            return `${index + 1}. ${label}（${stats.accuracy}%）`;
          })
          .join("；")}`
      : "";

  const masteryHint =
    plan.masteryView && plan.masteryView.practicedSkillCount > 0
      ? `整体掌握率：${plan.masteryView.overallMasteryRate}%（已练习 ${plan.masteryView.practicedSkillCount}/${plan.masteryView.totalSkillCount} 个知识点）`
      : "";

  const strongHint =
    plan.strongSkills.length > 0
      ? `强项（${formatSkillList(plan.strongSkills)}）对应题型可适当提高数字难度。`
      : "";

  const balanceSection =
    level === 2 && plan.balance
      ? `
【难度平衡机制 — 必须遵守】
- 基础题历史正确率：${plan.balance.basicHasHistory ? `${plan.balance.basicAccuracy}%` : "暂无记录"}
- 基础题难度档位：${plan.balance.basicTierLabel}
- 拓展题思维难度：${plan.balance.advancedTierLabel}（由基础题表现自动调节：基础正确率高 → 拓展更难；基础错误多 → 拓展更易）
- 重点训练（权重更高）：${plan.balance.focusSkills.map((s) => SKILL_LABELS[s]).join("、")}（除法、应用题优先加强）
- 每次练习必须同时包含：计算题 + 应用题 + 思维题`
      : "";

  const focusHint =
    level === 2
      ? `- 除法（division）与应用题（two_step_word）为重点训练项，题干可略丰富、情境化`
      : "";

  const curriculumNote =
    level === 2
      ? `
二年级完整体系 — 基础题范围：
${formatBasicTopicOverview()}

二年级完整体系 — 拓展题范围（浅奥）：
${formatExtensionTopicOverview()}`
      : "";

  const advancedHint =
    level === 2 && plan.balance
      ? advancedTierHint(plan.balance.advancedTier)
      : "拓展题固定 2 道浅奥题，注重思维训练，不超二年级认知。";

  return `
【基于学生历史表现的出题要求 — 必须遵守】
历史总正确率：${plan.hasHistory ? `${plan.overallAccuracy}%` : "暂无记录，按适中难度"}
本次基础题难度：${plan.difficultyLabel}
${balanceSection}
${tierDifficultyHint(plan.difficultyTier)}
${advancedHint}
${curriculumNote}

各知识点难度（按实际题型）：
${skillHints.map((h, i) => `${i + 1}. ${h}`).join("\n")}

题目配比：
- 共 ${plan.total} 题：${plan.basicCount} 道基础题 + ${plan.wordProblemCount} 道拓展题（浅奥）
- ${advancedHint.split("\n")[0]}
${focusHint}
- ${weakHint}
${weakRankingHint ? `- ${weakRankingHint}` : ""}
${masteryHint ? `- ${masteryHint}` : ""}
${strongHint ? `- ${strongHint}` : ""}`;
}

export function buildGrade2StructureSection(plan: GenerationPlan): string {
  if (!plan.topicSlots || plan.topicSlots.length === 0) {
    return "题目结构未定义。";
  }

  const basicSlots = plan.topicSlots.filter((s) => s.type === "basic");
  const advancedSlots = plan.topicSlots.filter((s) => s.type === "extension");

  const basicList = basicSlots
    .map((slot, index) => {
      const label = GRADE2_TOPIC_LABELS[slot.category];
      const spec = GRADE2_TOPIC_SPECS[slot.category];
      const focus =
        plan.balance?.focusSkills.includes(slot.category as ProfileSkill)
          ? " ★重点训练"
          : "";
      return `  basic[${index}] category: ${slot.category}（${label}）— ${spec}${focus}`;
    })
    .join("\n");

  const advancedList = advancedSlots
    .map((slot, index) => {
      const label = GRADE2_TOPIC_LABELS[slot.category];
      const spec = GRADE2_TOPIC_SPECS[slot.category];
      const tierNote = plan.balance
        ? `；思维难度=${plan.balance.advancedTierLabel}`
        : "";
      return `  advanced[${index}] category: ${slot.category}（${label}）— ${spec}${tierNote}`;
    })
    .join("\n");

  const pathHeader = plan.pathWeekConfig
    ? `
【学习路径 · 第 ${plan.pathWeekConfig.weekNumber} 周 / 共 12 周】
主题：${plan.pathWeekConfig.title}
本周目标：${plan.pathWeekConfig.goal}
重点知识点：${plan.pathWeekConfig.focusCategories.map((c) => GRADE2_TOPIC_LABELS[c]).join("、")}`
    : "";

  const focusHeader = plan.focusSkill
    ? `
【薄弱专项练习 — 必须遵守】
本轮重点加强：${SKILL_LABELS[plan.focusSkill]}
要求：basic 数组中至少 3 道题为该知识点；数字难度应低于学生当前水平，情境直观易懂。`
    : "";

  return `
${pathHeader}${focusHeader}
【JSON 槽位 — basic / advanced 数组顺序必须与下表完全一致】
【题型保障】basic 含计算+应用；advanced 含思维题（${FOCUS_TRAINING_SKILLS.map((s) => SKILL_LABELS[s]).join("、")} 在基础题中重点练）

basic 数组（${basicSlots.length} 项，严格二年级）：
${basicList}

advanced 数组（${advancedSlots.length} 项，浅奥拓展）：
${advancedList}`;
}

export function buildTransitionStructureSection(plan: GenerationPlan): string {
  return `
题目结构（共 ${plan.total} 题，必须严格匹配）：
- ${plan.transitionBasic} 道过渡基础题（type: basic, level: transition）— 100 以内加减法
- ${plan.grade2Basic} 道二年级基础题（type: basic, level: grade2）— 表内乘除
- ${plan.transitionWordProblem} 道过渡应用题（type: extension, level: transition, category: two_step_word）
- ${plan.grade2WordProblem} 道二年级应用题（type: extension, level: grade2, category: multi_step_word）`;
}
