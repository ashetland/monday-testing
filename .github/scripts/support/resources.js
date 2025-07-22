const MONDAY_DEVELOPERS = "multiple_person_mkt2q89j";
const MONDAY_DESIGNERS = "multiple_person_mkt2rtfv";
const MONDAY_PRODUCT_ENGINEERS = "multiple_person_mkt2hhzm";

const resources = {
  labels: {
    bug: {
      regression: "regression",
    },
    handoff: {
      readyForDev: "ready for dev",
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
    },
    issueWorkflow: {
      new: "0 - new",
      assigned: "1 - assigned",
      inDevelopment: "2 - in development",
      installed: "3 - installed",
      verified: "4 - verified",
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

const monday = {
  board: "8780429793",
  columns: {
    issue_id: "numeric_mknk2xhh",
    date: "date6",
    link: "link",
    people: "people",
    designers: MONDAY_DESIGNERS,
    developers: MONDAY_DEVELOPERS,
    product_engineers: MONDAY_PRODUCT_ENGINEERS,
    status: "dup__of_overall_status__1",
    issue_type: "color_mksw3bdr",
    priority: "priority",
  },
  /** @type {Map<string, string>} */
  issueTypes: new Map([
    [resources.labels.issueType.bug, "Bug"],
    [resources.labels.issueType.enhancement, "Enhancement"],
    // [resources.labels, "A11y"],
    // [resources.labels.issueType.docs, "Docs"],
    // [resources.labels.issueType.refactor, "Refactor"],
    // [resources.labels.planning.spike, "Spike"],
    // [resources.labels.issueType.test, "Testing"],
    // [resources.labels.issueType.tooling, "Tooling"],
  ]),
  /** @type {Map<string, string>} */
  statuses: new Map([
    [resources.labels.issueWorkflow.new, "Unassigned"],
    [resources.labels.issueWorkflow.assigned, "Assigned 🤖"],
    [resources.labels.issueWorkflow.inDevelopment, "In Dev 🤖"],
    // [resources.labels.issueWorkflow.installed, "Installed 🤖"],
    // [resources.labels.issueWorkflow.verified, "Verified 🤖"],
    [resources.labels.planning.needsTriage, "Needs Triage 🤖"],
    [resources.labels.planning.needsMilestone, "Needs Milestone 🤖"],
    [resources.labels.handoff.readyForDev, "Ready for dev 🤖"],
    // NEEDS LABEL
    ["design", "In Design 🤖"],
    // [, "Done"],
    // [, "Stalled"],
    // [, "In Review"],
    // [, "Adding to Kit"]
  ]),
  /** @type {Map<string, string>} */
  priorities: new Map([
    [resources.labels.priority.high, "High"],
    [resources.labels.priority.medium, "Medium"],
    [resources.labels.priority.low, "Low"],
    [resources.labels.priority.critical, "Critical"],
  ]),
  /**
   * @typedef {object} MondayPerson
   * @property {string} role - The role of the person (e.g., developers, designers, product_engineers)
   * @property {number} id - The Monday.com user ID
   */
  /** @type {Map<string, MondayPerson>} */
  people: new Map([
    ["anveshmekala", { role: MONDAY_DEVELOPERS, id: 48387134 }],
    ["aPreciado88", { role: MONDAY_DEVELOPERS, id: 6079524 }],
    ["ashetland", { role: MONDAY_DESIGNERS, id: 45851619 }],
    ["benelan", { role: MONDAY_DEVELOPERS, id: 49704471 }],
    ["chezHarper", { role: MONDAY_DESIGNERS, id: 71157966 }],
    ["DitwanP", { role: MONDAY_PRODUCT_ENGINEERS, id: 53683093 }],
    ["driskull", { role: MONDAY_DEVELOPERS, id: 45944985 }],
    ["Elijbet", { role: MONDAY_DEVELOPERS, id: 55852207 }],
    ["eriklharper", { role: MONDAY_DEVELOPERS, id: 49699973 }],
    // Kitty set to dev temporarily
    ["geospatialem", { role: MONDAY_DEVELOPERS, id: 45853373 }],
    ["isaacbraun", { role: MONDAY_PRODUCT_ENGINEERS, id: 76547859 }],
    ["jcfranco", { role: MONDAY_DEVELOPERS, id: 45854945 }],
    ["josercarcamo", { role: MONDAY_DEVELOPERS, id: 56555749 }],
    ["macandcheese", { role: MONDAY_DEVELOPERS, id: 45854918 }],
    ["matgalla", { role: MONDAY_DESIGNERS, id: 69473378 }],
    ["rmstinson", { role: MONDAY_DESIGNERS, id: 47277636 }],
    ["SkyeSeitz", { role: MONDAY_DESIGNERS, id: 45854937 }],
    ["Amretasre002762670", { role: MONDAY_DEVELOPERS, id: 77031889 }],
  ]),
};

module.exports = {
  resources,
  monday,
};
