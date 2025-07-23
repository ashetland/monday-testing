const resources = {
  labels: {
    bug: {
      regression: "regression",
    },
    handoff: {
      figmaChanges: "figma changes",
    },
    issueType: {
      bug: "bug",
      chore: "chore",
      docs: "docs",
      enhancement: "enhancement",
      perf: "perf",
      refactor: "refactor",
      test: "testing",
      tooling: "tooling",
      a11y: "a11y",
      newComponent: "new component",
      design: "design",
    },
    issueWorkflow: {
      new: "_0 - new",
      assigned: "_1 - assigned",
      inDesign: "1 - in design",
      readyForDev: "2 - ready for dev",
      inDevelopment: "3 - in development",
      installed: "4 - installed",
      verified: "5 - verified",
    },
    planning: {
      needsTriage: "needs triage",
      needsMilestone: "needs milestone",
      needsInfo: "needs more info",
      spike: "spike",
      spikeComplete: "spike complete",
      noChangelogEntry: "no changelog entry",
    },
    priority: {
      low: "p - low",
      medium: "p - medium",
      high: "p - high",
      critical: "p - critical",
    },
    risk: {
      low: "low risk",
    },
    snapshots: {
      skip: "skip visual snapshots",
      run: "pr ready for visual snapshots",
    },
  },
  teams: {
    admins: "calcite-design-system-admins",
    iconDesigners: "calcite-icon-designers",
    translationReviewers: "calcite-translation-reviewers",
  },
  packages: {
    icons: "calcite-ui-icons",
  },
};

const mondayBoard = "8780429793";

const mondayColumns = {
  issueNumber: "numeric_mknk2xhh",
  link: "link",
  people: "people",
  designers: "multiple_person_mkt2rtfv",
  developers: "multiple_person_mkt2q89j",
  productEngineers: "multiple_person_mkt2hhzm",
  status: "dup__of_overall_status__1",
  date: "date6",
  priority: "priority",
  issueType: "color_mksw3bdr",
  designEstimate: "color_mkqr3y8a",
  devPoints: "numeric_mksvm3v7",
  designIssue: "color_mkrdhk8",
  open: "color_mknkrb2n",
};

const mondayLabels = new Map([
  [
    resources.labels.planning.needsTriage,
    {
      column: mondayColumns.status,
      title: "Needs Triage",
    },
  ],
  [
    resources.labels.planning.needsMilestone,
    {
      column: mondayColumns.status,
      title: "Needs Milestone",
    },
  ],
  [
    resources.labels.issueWorkflow.new,
    {
      column: mondayColumns.status,
      title: "Unassigned",
    },
  ],
  [
    resources.labels.issueWorkflow.assigned,
    {
      column: mondayColumns.status,
      title: "Assigned",
    },
  ],
  [
    resources.labels.issueWorkflow.inDesign,
    {
      column: mondayColumns.status,
      title: "In Design",
    },
  ],
  [
    resources.labels.issueWorkflow.inDevelopment,
    {
      column: mondayColumns.status,
      title: "In Development",
    },
  ],
  [
    resources.labels.issueWorkflow.installed,
    {
      column: mondayColumns.status,
      title: "Installed",
    },
  ],
  [
    resources.labels.issueWorkflow.verified,
    {
      column: mondayColumns.status,
      title: "Verified",
    },
  ],
  [
    resources.labels.handoff.readyForDev,
    {
      column: mondayColumns.status,
      title: "Ready for dev",
    },
  ],
  [
    resources.labels.issueType.design,
    {
      column: mondayColumns.issueType,
      title: "In Design",
    },
  ],
  [
    resources.labels.issueType.bug,
    {
      column: mondayColumns.issueType,
      title: "Bug",
    },
  ],
  [
    resources.labels.issueType.enhancement,
    {
      column: mondayColumns.issueType,
      title: "Enhancement",
    },
  ],
  [
    resources.labels.issueType.design,
    {
      column: mondayColumns.designIssue,
      title: "Design",
    },
  ],
  // [resources.labels.planning.spike, {
  //   column: mondayColumns.issueType,
  //   title: "Spike"
  // }],
  // [resources.labels.issueType.docs, {
  //   column: mondayColumns.issueType,
  //   title: "Docs"
  // }],
  // [resources.labels.issueType.refactor, {
  //   column: mondayColumns.issueType,
  //   title: "Refactor"
  // }],
  // [resources.labels.issueType.test, {
  //   column: mondayColumns.issueType,
  //   title: "Testing"
  // }],
  // [resources.labels.issueType.tooling, {
  //   column: mondayColumns.issueType,
  //   title: "Tooling"
  // }],
  // [resources.labels.issueType.a11y, {
  //   column: mondayColumns.issueType,
  //   title: "A11y"
  // }],
  [
    resources.labels.priority.low,
    {
      column: mondayColumns.priority,
      title: "Low",
    },
  ],
  [
    resources.labels.priority.medium,
    {
      column: mondayColumns.priority,
      title: "Medium",
    },
  ],
  [
    resources.labels.priority.high,
    {
      column: mondayColumns.priority,
      title: "High",
    },
  ],
  // [resources.labels.priority.critical, {
  //   column: mondayColumns.priority,
  //   title: "Critical"
  // }],
]);

/**
 * @typedef {object} MondayPerson
 * @property {string} role - The role of the person (e.g., developers, designers, productEngineers)
 * @property {number} id - The Monday.com user ID
 */
/** @type {Map<string, MondayPerson>} */
const mondayPeople = new Map([
  ["anveshmekala", { role: mondayColumns.developers, id: 48387134 }],
  ["aPreciado88", { role: mondayColumns.developers, id: 6079524 }],
  ["ashetland", { role: mondayColumns.designers, id: 45851619 }],
  ["benelan", { role: mondayColumns.developers, id: 49704471 }],
  ["chezHarper", { role: mondayColumns.designers, id: 71157966 }],
  ["DitwanP", { role: mondayColumns.productEngineers, id: 53683093 }],
  ["driskull", { role: mondayColumns.developers, id: 45944985 }],
  ["Elijbet", { role: mondayColumns.developers, id: 55852207 }],
  ["eriklharper", { role: mondayColumns.developers, id: 49699973 }],
  // Kitty set to dev temporarily
  ["geospatialem", { role: mondayColumns.developers, id: 45853373 }],
  ["isaacbraun", { role: mondayColumns.productEngineers, id: 76547859 }],
  ["jcfranco", { role: mondayColumns.developers, id: 45854945 }],
  ["josercarcamo", { role: mondayColumns.developers, id: 56555749 }],
  ["macandcheese", { role: mondayColumns.developers, id: 45854918 }],
  ["matgalla", { role: mondayColumns.designers, id: 69473378 }],
  ["rmstinson", { role: mondayColumns.designers, id: 47277636 }],
  ["SkyeSeitz", { role: mondayColumns.designers, id: 45854937 }],
  ["Amretasre002762670", { role: mondayColumns.developers, id: 77031889 }],
]);

module.exports = {
  resources,
  mondayBoard,
  mondayColumns,
  mondayLabels,
  mondayPeople,
};
