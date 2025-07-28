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
    devEstimate: {
      one: "estimate - 1",
      two: "estimate - 2",
      three: "estimate - 3",
      five: "estimate - 5",
    },
    designEstimate: {
      small: "estimate - design - sm",
      medium: "estimate - design - md",
      large: "estimate - design - lg",
    },
  },
  milestone: {
    backlog: "Dev Backlog",
    stalled: "Stalled",
    freezer: "Freezer",
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
  title: "name",
  issueNumber: "numeric_mknk2xhh",
  link: "link",
  designers: "multiple_person_mkt2rtfv",
  developers: "multiple_person_mkt2q89j",
  productEngineers: "multiple_person_mkt2hhzm",
  status: "dup__of_overall_status__1",
  date: "date6",
  priority: "priority",
  issueType: "color_mksw3bdr",
  designEstimate: "color_mkqr3y8a",
  devEstimate: "numeric_mksvm3v7",
  designIssue: "color_mkrdhk8",
  a11y: "color_mkt5c4q6",
  spike: "color_mkt5vd8a",
  figmaChanges: "color_mkt58h3r",
  open: "color_mknkrb2n",
};

const mondayLabels = new Map([
  [
    resources.labels.planning.needsTriage,
    {
      column: mondayColumns.status,
      value: "Needs Triage",
    },
  ],
  [
    resources.labels.planning.needsMilestone,
    {
      column: mondayColumns.status,
      value: "Needs Milestone",
    },
  ],
  [
    resources.labels.planning.spike,
    {
      column: mondayColumns.spike,
      value: "Spike",
    },
  ],
  [
    resources.labels.planning.spikeComplete,
    {
      column: mondayColumns.spike,
      value: "Spike Complete",
    },
  ],
  [
    resources.labels.issueWorkflow.new,
    {
      column: mondayColumns.status,
      value: "Unassigned",
    },
  ],
  [
    resources.labels.issueWorkflow.assigned,
    {
      column: mondayColumns.status,
      value: "Assigned",
    },
  ],
  [
    resources.labels.issueWorkflow.inDesign,
    {
      column: mondayColumns.status,
      value: "In Design",
    },
  ],
  [
    resources.labels.issueWorkflow.readyForDev,
    {
      column: mondayColumns.status,
      value: "Ready for dev",
    },
  ],
  [
    resources.labels.issueWorkflow.inDevelopment,
    {
      column: mondayColumns.status,
      value: "In Development",
    },
  ],
  [
    resources.labels.issueWorkflow.installed,
    {
      column: mondayColumns.status,
      value: "Installed",
    },
  ],
  [
    resources.labels.issueWorkflow.verified,
    {
      column: mondayColumns.status,
      value: "Verified",
    },
  ],
  [
    resources.labels.issueType.design,
    {
      column: mondayColumns.designIssue,
      value: "Design",
    },
  ],
  [
    resources.labels.issueType.bug,
    {
      column: mondayColumns.issueType,
      value: "Bug",
    },
  ],
  [
    resources.labels.issueType.chore,
    {
      column: mondayColumns.issueType,
      value: "Chore",
    },
  ],
  [
    resources.labels.issueType.enhancement,
    {
      column: mondayColumns.issueType,
      value: "Enhancement",
    },
  ],
  [
    resources.labels.issueType.newComponent,
    {
      column: mondayColumns.issueType,
      value: "New Component",
    },
  ],
  [
    resources.labels.issueType.refactor,
    {
      column: mondayColumns.issueType,
      value: "Refactor",
    },
  ],
  [
    resources.labels.issueType.docs,
    {
      column: mondayColumns.issueType,
      value: "Docs",
    },
  ],
  [
    resources.labels.issueType.test,
    {
      column: mondayColumns.issueType,
      value: "Testing",
    },
  ],
  [
    resources.labels.issueType.tooling,
    {
      column: mondayColumns.issueType,
      value: "Tooling",
    },
  ],
  [
    resources.labels.issueType.a11y,
    {
      column: mondayColumns.a11y,
      value: "a11y",
    },
  ],
  [
    resources.labels.priority.low,
    {
      column: mondayColumns.priority,
      value: "Low",
    },
  ],
  [
    resources.labels.priority.medium,
    {
      column: mondayColumns.priority,
      value: "Medium",
    },
  ],
  [
    resources.labels.priority.high,
    {
      column: mondayColumns.priority,
      value: "High",
    },
  ],
  [
    resources.labels.devEstimate.one,
    {
      column: mondayColumns.devEstimate,
      value: 1,
    },
  ],
  [
    resources.labels.devEstimate.two,
    {
      column: mondayColumns.devEstimate,
      value: 2,
    },
  ],
  [
    resources.labels.devEstimate.three,
    {
      column: mondayColumns.devEstimate,
      value: 3,
    },
  ],
  [
    resources.labels.devEstimate.five,
    {
      column: mondayColumns.devEstimate,
      value: 5,
    },
  ],
  [
    resources.labels.designEstimate.small,
    {
      column: mondayColumns.designEstimate,
      value: "Small",
    },
  ],
  [
    resources.labels.designEstimate.medium,
    {
      column: mondayColumns.designEstimate,
      value: "Medium",
    },
  ],
  [
    resources.labels.designEstimate.large,
    {
      column: mondayColumns.designEstimate,
      value: "Large",
    },
  ],
  [
    resources.labels.handoff.figmaChanges,
    {
      column: mondayColumns.figmaChanges,
      value: "Figma Changes Only",
    },
  ],
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
