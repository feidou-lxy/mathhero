# MathHero V4 产品需求文档（PRD）

> 版本：V4.0-draft  
> 状态：设计阶段（不写代码）  
> 基于项目：mathhero（Next.js 16 + DeepSeek AI 数学练习）  
> 最后更新：2026-06-22

---

## 1. 文档说明

### 1.1 背景

当前项目（V3）已具备：

- `/practice` 一题一屏练习流程（7 题/轮）
- AI 出题（`/api/generate-questions`）+ 动态难度（`GenerationPlan`）
- AI 老师批改（`/api/tutor-feedback`）+ 3 轮引导提示 + 巩固练习
- 6 类知识点能力画像（`StudentProfile.skills`）
- 本轮学习总结（`lib/learning/sessionSummary.ts`，仅当轮展示，不持久化）

V3 的不足：缺少长期激励、任务引导、历史错题沉淀，学习动力与回访率依赖用户自驱。

### 1.2 V4 目标

将 MathHero 从「单次练习工具」升级为「有目标、有成长、有回顾」的儿童数学学习产品。

V4 核心五大模块：

1. **今日任务系统** — 每天知道「该练什么」
2. **星星成长体系** — 即时正向反馈
3. **等级系统** — 长期成长可视化
4. **勋章系统** — 里程碑成就
5. **错题本** — 错题可复习、可消灭

### 1.3 设计原则

- **与现有结构兼容**：复用 `QuestionCategory`、`StudentProfile`、`PracticeSet`、`SessionSummary`，不推翻 V3 练习主流程
- **小学生友好**：文案简单、图标清晰、反馈即时
- **渐进增强**：V4.0 可先 localStorage + JSON 文件，V4.1 再迁数据库
- **激励不过度**：星星/等级服务于学习，不引入付费或复杂社交

### 1.4 不在 V4 范围

- 多账号登录 / OAuth
- 家长端独立 App
- 实时语音、拍照识题
- 付费订阅

---

## 2. 现有项目结构映射

V4 功能与现有代码的对应关系：

| 现有模块 | 路径 | V4 复用方式 |
|---------|------|------------|
| 练习主流程 | `app/practice/page.tsx` | 嵌入任务入口、星星动画、等级展示 |
| 题目类型 | `lib/types/practice.ts` | 任务目标、错题分类依据 |
| 能力画像 | `lib/types/profile.ts` | 任务推荐、勋章判定输入 |
| 出题计划 | `lib/profile/generationPlan.ts` | 今日任务「专项练习」题量/难度 |
| 学习总结 | `lib/learning/sessionSummary.ts` | 任务完成判定、星星结算 |
| 画像存储 | `lib/profile/clientStorage.ts` + `data/student-profile.json` | 扩展为 `StudentProgress` |
| AI 巩固题 | `/api/generate-reinforcement` | 错题本「再练一次」可复用 |

V4 建议新增（后续实现，本文仅规划）：

```
app/
├── page.tsx                 # 首页：今日任务 + 成长概览
├── practice/page.tsx        # 练习页：接入任务模式
├── wrong-book/page.tsx      # 错题本
└── growth/page.tsx          # 等级 / 勋章详情（可选）

lib/
├── types/progress.ts        # 星星、等级、勋章、任务、错题
├── progress/                # 任务生成、星星结算、等级计算、勋章判定
├── wrong-book/              # 错题收集、复习队列
└── learning/sessionStore.ts # 练习 Session 持久化（支撑错题本）

data/
├── student-profile.json     # 扩展字段
├── student-progress.json    # 星星/等级/勋章
└── wrong-book.json          # 错题快照（或合并进 session）
```

---

## 3. 用户与场景

### 3.1 目标用户

- 主用户：小学一升二 / 二年级学生（6–8 岁）
- 辅助用户：家长（查看进度，非 V4 必做独立端）

### 3.2 核心场景

| 场景 | 用户行为 | V4 价值 |
|------|---------|--------|
| 每日打开 | 看到今日 1–3 个任务 | 降低「不知道练什么」的决策成本 |
| 完成练习 | 获得星星、可能升级 | 即时成就感 |
| 连续学习 | 解锁勋章 | 长期坚持 |
| 做错题目 | 自动进入错题本 | 可回顾、可专项消灭 |
| 周末复习 | 从错题本发起练习 | 巩固薄弱点 |

---

## 4. 功能一：今日任务系统

### 4.1 功能描述

每天为学生生成 **1 个主任务 + 0–2 个可选任务**，明确「今天练什么、练多少、完成标准是什么」。

### 4.2 任务类型

| 任务 ID | 名称 | 触发条件 | 练习内容 | 完成标准 |
|---------|------|---------|---------|---------|
| `daily_main` | 今日闯关 | 每天首次 | 现有 7 题 AI 闯关（`transition` 模式） | 完成 7 题并进入 review |
| `weak_skill` | 薄弱专项 | 画像中存在 `needs_improvement` 且 `total ≥ 2` | 5 题同类专项（调用现有出题链路，category 固定为最弱项） | 正确率 ≥ 60% |
| `wrong_review` | 错题复习 | 错题本中「待复习」≥ 3 道 | 从错题本抽 3–5 道（可 AI 生成同类变式） | 全部答对或完成设定题数 |
| `streak_bonus` | 连续打卡加成 | 连续学习 ≥ 3 天 | 完成主任务后额外 1 题「挑战题」 | 答对即完成 |

**V4.0 最小集**：`daily_main`（必做）+ `weak_skill`（有薄弱项时出现）+ `wrong_review`（错题足够时出现）。

### 4.3 任务生成逻辑

输入：

- `StudentProfile`（6 类知识点统计）
- `StudentProgress`（星星、连续天数、今日完成状态）
- `WrongBook`（待复习数量）
- 当前日期 `date`

输出：`DailyTaskPlan`

```typescript
// 概念结构（PRD 级，非实现代码）
DailyTaskPlan {
  date: string
  tasks: DailyTask[]
  allRequiredDone: boolean   // 是否完成所有必做任务
}

DailyTask {
  id: string
  type: "daily_main" | "weak_skill" | "wrong_review" | "streak_bonus"
  title: string              // 如「今日数学闯关」
  description: string        // 如「完成 7 道题，和 AI 老师一起练」
  required: boolean          // 是否必做
  status: "pending" | "in_progress" | "completed"
  reward: { stars: number }  // 完成可获得星星（见模块二）
  target?: {
    questionCount?: number
    minAccuracy?: number
    skill?: QuestionCategory
  }
}
```

生成规则（优先级）：

1. 每日 0 点（或首次打开 App）生成当日 `DailyTaskPlan`
2. `daily_main` 始终存在，`required: true`
3. 取 `weakSkills` 中 `total` 最高且 level 为 `needs_improvement` 的 1 项 → 生成 `weak_skill`
4. 错题本 `pendingCount ≥ 3` → 生成 `wrong_review`
5. `streakDays ≥ 3` 且主任务已完成 → 解锁 `streak_bonus`

### 4.4 与现有练习流程的集成

| 环节 | 改造点 |
|------|--------|
| 首页 `/` | 展示今日任务卡片列表，点击进入对应练习模式 |
| `/practice` | URL 或 state 携带 `taskId` + `taskType`，决定出题 API 参数 |
| 出题 API | 扩展 `GenerateQuestionsOptions`：`mode: "daily" \| "weak_skill" \| "wrong_review"` |
| review 阶段 | 任务完成 → 调用星星结算 → 更新任务状态 → 检查勋章 |

### 4.5 UI 要求

- 任务卡片：图标 + 标题 + 一句话说明 + 星星奖励预览 + 状态（未完成 / 进行中 / 已完成 ✓）
- 必做任务置顶，可选任务折叠或置后
- 全部必做完成：展示「今日任务完成 🎉」横幅

### 4.6 验收标准

- [ ] 每天首次打开可看到至少 1 个主任务
- [ ] 有薄弱知识点时自动出现专项任务
- [ ] 完成任务后状态持久化，刷新页面仍为「已完成」
- [ ] 完成任务与星星、等级、勋章联动（见下文）

---

## 5. 功能二：星星成长体系

### 5.1 功能描述

学生通过练习获得 **星星（⭐）**，作为即时、可累积的正向反馈货币。星星用于等级提升，部分勋章也与星星相关。

### 5.2 星星获取规则

| 行为 | 星星数 | 说明 |
|------|--------|------|
| 完成「今日闯关」主任务 | +10 | 进入 review 即算完成，不要求全对 |
| 主任务全对（7/7） | +5 | 额外奖励 |
| 完成「薄弱专项」 | +8 | |
| 专项正确率 100% | +3 | 额外奖励 |
| 完成「错题复习」 | +6 | |
| 错题复习单题答对（首次） | +1 | 每道最多计 1 次 |
| 完成「连续打卡加成」 | +5 | |
| 单题答对（主流程） | +1 | 每题即时反馈，上限 7/轮 |
| 巩固练习单题答对 | +1 | 不计入主流程 results，但计星星 |
| 使用 3 轮提示后答对 | +0 | 仍算对题，但不加单题星（鼓励独立思考） |
| 揭晓答案后（主流程错题） | +0 | 该题不加星 |

**V4.0 每日星星软上限**：建议 50 颗（防刷，可选配置）。

### 5.3 星星展示

| 位置 | 展示内容 |
|------|---------|
| 首页顶部 | 当前星星总数 + 今日获得 |
| 练习页顶栏 | 本轮已获星星（实时 +1 动画） |
| review 页 | 本轮星星结算明细 |
| 成长页 | 历史累计、近 7 日趋势（V4.1） |

### 5.4 数据结构

扩展 `StudentProgress`（独立于 `StudentProfile` 或合并存储）：

```typescript
StudentProgress {
  studentId: string
  totalStars: number
  todayStars: number
  todayDate: string          // 用于每日重置 todayStars
  streakDays: number
  lastPracticeDate: string
  level: number              // 见模块三
  levelTitle: string
  badges: BadgeRecord[]      // 见模块四
}
```

存储：`localStorage`（`mathhero-student-progress`）+ `data/student-progress.json`（与 profile 同步策略一致）。

### 5.5 与现有流程的集成

- 在 `saveQuestionResult()` 时触发单题星星
- 在 `phase → review` 时触发任务完成星星 + 全对奖励
- 星星变更 → 重新计算等级（模块三）→ 检查勋章（模块四）

### 5.6 验收标准

- [ ] 答对一题有即时星星反馈
- [ ] 完成今日主任务获得 10 星
- [ ] 星星总数跨会话持久化
- [ ] 跨日 `todayStars` 正确重置

---

## 6. 功能三：等级系统

### 6.1 功能描述

根据 **累计星星** 划分学生等级，提供长期成长目标。等级称号贴合小学生语境，避免「青铜/王者」等游戏化过重表述。

### 6.2 等级表（V4.0）

| 等级 | 称号 | 累计星星 | 解锁说明（可选文案） |
|------|------|---------|---------------------|
| Lv.1 | 数学小苗 | 0 | 刚开始探索数学世界 |
| Lv.2 | 计算新手 | 30 | 已经会做好多道题啦 |
| Lv.3 | 闯关能手 | 80 | 越来越熟练了 |
| Lv.4 | 思维达人 | 150 | 会动脑筋想问题 |
| Lv.5 | 应用高手 | 250 | 应用题也难不倒你 |
| Lv.6 | 数学小英雄 | 400 | 真正的数学小英雄！ |

等级计算公式：

```
level = 根据 totalStars 查表，取满足条件的最高等级
```

升级时触发：全屏或卡片式「升级啦！」动画 + 新称号展示（V4.0 可简化为 review 页提示）。

### 6.3 等级与出题难度的关系（可选，V4.1）

V4.0 **不强制**绑定等级与 `DifficultyTier`，避免高等级低水平学生受挫。  
V4.1 可考虑：Lv.4+ 且画像 proficient 项 ≥ 2 时，出题计划默认倾向 `hard`。

### 6.4 UI 要求

- 首页：等级徽章 + 称号 + 距下一级进度条（`currentStars / nextLevelStars`）
- 练习页：顶栏小型等级图标
- 成长页：等级时间线（何时达成各级）

### 6.5 验收标准

- [ ] 星星达到阈值自动升级
- [ ] 升级后称号与进度条正确更新
- [ ] 等级数据持久化

---

## 7. 功能四：勋章系统

### 7.1 功能描述

勋章用于标记 **里程碑成就**，补充星星/等级之外的收藏与展示需求。已解锁勋章永久保留。

### 7.2 勋章列表（V4.0）

| 勋章 ID | 名称 | 图标建议 | 解锁条件 |
|---------|------|---------|---------|
| `first_practice` | 初次闯关 | 🌱 | 完成第一次今日主任务 |
| `first_perfect` | 全对小能手 | 💯 | 任意一轮 7 题全对 |
| `streak_3` | 三天小坚持 | 🔥 | 连续 3 天完成主任务 |
| `streak_7` | 一周小达人 | ⭐ | 连续 7 天完成主任务 |
| `star_100` | 百星收集 | ✨ | 累计星星 ≥ 100 |
| `star_500` | 五百星闪耀 | 🌟 | 累计星星 ≥ 500 |
| `skill_addition` | 加法小达人 | ➕ | 加法 proficiency ≥ 80% 且 total ≥ 10 |
| `skill_subtraction` | 减法小达人 | ➖ | 减法同上 |
| `skill_multiplication` | 乘法小达人 | ✖️ | 乘法同上 |
| `skill_division` | 除法小达人 | ➗ | 除法同上 |
| `skill_word_problem` | 应用题能手 | 📖 | 应用题同上 |
| `wrong_clear_10` | 错题清零员 | 🧹 | 累计从错题本「消灭」10 道错题 |
| `no_hint_win` | 独立思考 | 💪 | 累计 20 道题在 0 提示轮内答对 |
| `level_5` | 数学小英雄 | 🦸 | 达到 Lv.6 |

**V4.0 首发**：至少实现 8 枚（上表加粗优先：`first_practice`、`first_perfect`、`streak_3`、`star_100`、4 个 skill 类选 2 个、`wrong_clear_10`、`level_5`）。

### 7.3 勋章判定时机

| 触发点 | 检测勋章 |
|--------|---------|
| 主任务完成 | `first_practice`、`streak_*` |
| review 结算 | `first_perfect`、skill 类、星星类 |
| 星星/等级变更 | `star_*`、`level_5` |
| 错题本消灭 | `wrong_clear_10` |
| 单题答对（0 提示） | `no_hint_win`（累计计数） |

判定逻辑建议集中为 `checkAndUnlockBadges(progress, profile, session)`，返回新解锁列表供 UI 弹窗。

### 7.4 数据结构

```typescript
BadgeRecord {
  id: string
  unlockedAt: string       // ISO 时间
  seen: boolean            // 是否已展示过解锁动画
}

BadgeDefinition {
  id: string
  name: string
  description: string
  icon: string
  category: "practice" | "streak" | "skill" | "star" | "wrong_book"
}
```

### 7.5 UI 要求

- 成长页 / 首页入口：「我的勋章」网格，未解锁为灰色剪影 + 解锁条件提示
- 新解锁：review 完成后弹窗「恭喜获得勋章：XXX」
- 支持「标记已读」避免重复弹窗

### 7.6 验收标准

- [ ] 满足条件时自动解锁且仅解锁一次
- [ ] 勋章列表正确展示已解锁 / 未解锁状态
- [ ] 解锁时间与持久化正确

---

## 8. 功能五：错题本

### 8.1 功能描述

自动收集学生在 **主流程** 中最终未答对的题目（含揭晓答案、经巩固后仍算错的主流程结果），形成可复习、可消灭的错题档案。

### 8.2 错题收录规则

| 情况 | 是否收录 | 说明 |
|------|---------|------|
| 主流程 3 轮提示后揭晓答案 | ✅ 收录 | 核心错题场景 |
| 主流程经巩固后进入下一题（原题算错） | ✅ 收录 | 已在 V3 记为 `results[id].correct = false` |
| 主流程一次答对 | ❌ | |
| 巩固练习题 | ❌ 默认不收录 | V4.0 简化；V4.1 可配置 |
| 同一道题多次做错 | 合并为 1 条，增加 `wrongCount` | 去重键：`prompt` 哈希或题目快照 id |

### 8.3 错题状态

```typescript
WrongBookEntry {
  id: string
  question: Question           // 题目快照（含 prompt、answer、category）
  userAnswer?: string          // 最后一次错误答案
  sessionDate: string
  wrongCount: number
  status: "pending" | "reviewing" | "mastered"
  masteredAt?: string
  tutorMessage?: string        // AI 老师最后一条反馈
  explanation?: string
}
```

状态流转：

```
pending（待复习）
  → reviewing（复习中，从错题本发起练习）
  → mastered（连续答对 1 次或完成专项消灭任务）
```

### 8.4 错题本能力

| 能力 | 描述 |
|------|------|
| 列表浏览 | 按 category 筛选、按时间排序 |
| 单题复习 | 进入单题练习模式，复用 `/api/tutor-feedback` |
| 批量复习 | 对接「今日任务 - 错题复习」 |
| 同类再练 | 复用 `/api/generate-reinforcement` 生成 2 道同类简题 |
| 消灭错题 | 答对后标记 `mastered`，从「待复习」移除，计入勋章 |

### 8.5 与 Session 持久化的关系

V3 无 Session 持久化，V4 需新增 `PracticeSession` 存储每轮完整记录；错题本可从 Session 的 `results` 中提取，也可在 `saveQuestionResult(false)` 时实时写入。

推荐：**实时写入错题本** + Session 存档备查。

### 8.6 页面结构

新增 `/wrong-book`：

- 顶栏：待复习数量、已消灭数量
- Tab：待复习 / 已消灭
- 卡片：题干摘要、知识点标签、错误次数、「再练一次」「同类练习」
- 空状态：「太棒了，暂时没有错题！」

### 8.7 验收标准

- [ ] 主流程错题自动进入错题本
- [ ] 同一题重复错只保留一条并累加次数
- [ ] 复习答对后可标记为已消灭
- [ ] 错题本数据跨会话持久化
- [ ] 待复习 ≥ 3 时今日任务出现「错题复习」

---

## 9. 模块联动总览

```mermaid
flowchart TB
    subgraph daily [每日入口]
        Home[首页 /]
        Tasks[今日任务 DailyTaskPlan]
    end

    subgraph practice [练习]
        Practice[/practice]
        AI[AI 出题 / 批改]
        Review[review 学习总结]
    end

    subgraph progress [成长]
        Stars[星星结算]
        Level[等级计算]
        Badges[勋章判定]
    end

    subgraph book [错题]
        WB[错题本]
    end

    Home --> Tasks
    Tasks -->|taskType| Practice
    Practice --> AI
    AI -->|答错| WB
    Practice --> Review
    Review --> Stars
    Stars --> Level
    Stars --> Badges
    Level --> Badges
    WB -->|wrong_review 任务| Practice
    Profile[StudentProfile] --> Tasks
    Profile --> Badges
```

### 9.1 一次完整「今日闯关」的数据流

1. 首页读取 `DailyTaskPlan`，用户点击「今日闯关」
2. `/practice?task=daily_main` 加载 7 题（现有流程）
3. 答题过程：答对 +1 星；答错 → 3 轮提示 → 可能巩固 → 错题写入错题本
4. 进入 review：`buildSessionSummary` + 任务完成 +10 星 + 全对奖励
5. 更新 `StudentProgress`：星星、连续天数、等级
6. `checkAndUnlockBadges` → 弹窗新勋章
7. 返回首页，任务卡片标记已完成

---

## 10. 数据与 API 规划

### 10.1 存储扩展（V4.0）

| 文件 / Key | 内容 |
|-----------|------|
| `mathhero-student-profile` | 现有画像（不变） |
| `mathhero-student-progress` | 星星、等级、连续天、勋章 |
| `mathhero-daily-tasks` | 当日任务计划与状态 |
| `mathhero-wrong-book` | 错题列表 |
| `data/student-progress.json` | 服务端镜像 |
| `data/wrong-book.json` | 服务端镜像 |
| `data/sessions/*.json` | 可选：每轮练习存档 |

### 10.2 新增 API（规划）

| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/api/daily-tasks?date=` | 获取或生成今日任务 |
| POST | `/api/daily-tasks/complete` | 标记任务完成 |
| GET/POST | `/api/student-progress` | 读写星星/等级/勋章 |
| GET/POST | `/api/wrong-book` | 错题列表 CRUD |
| POST | `/api/wrong-book/master` | 标记错题已消灭 |
| GET | `/api/badges` | 勋章定义 + 用户解锁状态 |

现有 API 扩展：

- `POST /api/generate-questions` 增加 `mode`、`targetSkill`、`questionCount`
- 可选 `POST /api/generate-questions/from-wrong-book`

---

## 11. 页面信息架构（V4）

```
/                     首页：今日任务 + 星星/等级概览 + 快捷入口
/practice             练习（携带 task 参数）
/wrong-book           错题本
/growth               等级进度 + 勋章墙（可与首页合并，V4.0 二选一）


首页模块：
├── 顶部：Lv.X 称号 | ⭐ 总星星 | 🔥 连续 N 天
├── 今日任务（卡片列表）
├── 快捷入口：错题本 (N) | 我的勋章
└── 开始练习（默认主任务）

练习页新增：
├── 顶栏：本轮星星 + 当前任务名
├── （其余保持 V3 一题一屏）
└── review：星星结算 + 勋章解锁 + 学习总结（现有）

错题本页：
├── 待复习 / 已消灭
└── 单题操作：再练 | 同类练习
```

---

## 12. 非功能需求

| 项 | 要求 |
|----|------|
| 性能 | 星星动画、任务状态更新不阻塞答题 |
| 离线 | localStorage 优先，API 失败时本地仍可练习，后续同步 |
| 文案 | 全部小学低年级可读懂的中文 |
| 无障碍 | 星星/等级不仅依赖颜色，需有文字或图标 |
| 隐私 | 错题与进度仅存本地 + 项目 data 目录，不上传第三方 |

---

## 13. 版本分期建议

### V4.0（MVP）

- 今日任务：`daily_main` + `weak_skill` + `wrong_review`
- 星星：完整获取规则 + 持久化
- 等级：6 级称号 + 进度条
- 勋章：8 枚核心勋章
- 错题本：收录、列表、单题复习、消灭、对接任务

### V4.1

- Session 历史与趋势图
- `streak_bonus` 挑战任务
- 等级与难度软联动
- AI 生成错题变式
- 首页 / 成长页拆分优化

### V4.2

- 多学生 profile 切换
- 家长只读简报页
- 数据库替代 JSON 文件

---

## 14. 成功指标（V4）

| 指标 | 目标（内测） |
|------|-------------|
| 日活回访 | 完成主任务的用户 7 日内回访 ≥ 40% |
| 任务完成率 | 打开首页用户中 ≥ 60% 完成 daily_main |
| 错题复习率 | 有错题用户中 ≥ 30% 使用错题本 |
| 平均会话时长 | 较 V3 提升 20%（激励带来的额外练习） |

---

## 15. 风险与对策

| 风险 | 对策 |
|------|------|
| 功能过多导致 `/practice` 更臃肿 | 严格拆分 hooks / 组件，任务逻辑进 `lib/progress/` |
| 星星规则复杂难懂 | review 页展示明细；家长说明页（可选） |
| 错题重复收录 | 去重键 + 合并 wrongCount |
| localStorage 与 JSON 不一致 | 统一 `syncProgress()`，以时间戳较新者为准 |
| 与 V3 学习总结重复 | 总结保留；星星/任务/勋章在总结下方或独立区块 |

---

## 16. 附录：与 V3 概念对照

| V3 概念 | V4 扩展 |
|---------|--------|
| `StudentProfile.skills` | 驱动 weak_skill 任务、skill 类勋章 |
| `GenerationPlan.weakSkills` | 专项任务 category 选择 |
| `SessionSummary` | 任务完成判定、review 展示增强 |
| `results[questionId]` | 错题本收录来源 |
| `phase: review` | 星星结算、勋章弹窗触发点 |
| `saveQuestionResult` | 挂接星星、错题写入 |

---

**文档结束。** 下一步：评审 PRD → 拆分技术任务 → 按 V4.0 MVP 分期实现。
