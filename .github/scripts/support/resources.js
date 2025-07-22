module.exports = {
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
  mondayBoard: "8780429793",
  mondayColumns: {
    issue_id: "numeric_mknk2xhh",
    date: "date6",
    link: "link",
    people: "people",
    designers: "multiple_person_mkt2rtfv",
    developers: "multiple_person_mkt2q89j",
    product_engineers: "multiple_person_mkt2hhzm",
    status: "dup__of_overall_status__1",
    issue_type: "color_mksw3bdr",
    priority: "priority",
  },
  /**
   * @typedef {object} MondayPerson
   * @property {string} role - The role of the person (e.g., developers, designers, product_engineers)
   * @property {number} id - The Monday.com user ID
   */
  /** @type {Map<string, MondayPerson>} */
  mondayPeople: new Map([
    ["anveshmekala", { role: columns.developers, id: 48387134 }],
    ["aPreciado88", { role: columns.developers, id: 6079524 }],
    ["ashetland", { role: columns.designers, id: 45851619 }],
    ["benelan", { role: columns.developers, id: 49704471 }],
    ["chezHarper", { role: columns.designers, id: 71157966 }],
    ["DitwanP", { role: columns.product_engineers, id: 53683093 }],
    ["driskull", { role: columns.developers, id: 45944985 }],
    ["Elijbet", { role: columns.developers, id: 55852207 }],
    ["eriklharper", { role: columns.developers, id: 49699973 }],
    // Kitty set to dev temporarily
    ["geospatialem", { role: columns.developers, id: 45853373 }],
    ["isaacbraun", { role: columns.product_engineers, id: 76547859 }],
    ["jcfranco", { role: columns.developers, id: 45854945 }],
    ["josercarcamo", { role: columns.developers, id: 56555749 }],
    ["macandcheese", { role: columns.developers, id: 45854918 }],
    ["matgalla",  { role: columns.designers, id: 69473378 }],
    ["rmstinson", { role: columns.designers, id: 47277636 }],
    ["SkyeSeitz", { role: columns.designers, id: 45854937 }],
    ["Amretasre002762670", { role: columns.developers, id: 77031889 }],
  ]),
  /** @type {Map<string, string>} */
  mondayIssueTypes: new Map([
    [this.labels.issueType.bug, "Bug"],
    [this.labels.issueType.enhancement, "Enhancement"],
    // [this.labels, "A11y"],
    // [this.labels.issueType.docs, "Docs"],
    // [this.labels.issueType.refactor, "Refactor"],
    // [this.labels.planning.spike, "Spike"],
    // [this.labels.issueType.test, "Testing"],
    // [this.labels.issueType.tooling, "Tooling"],
  ]),
  /** @type {Map<string, string>} */
  mondayStatuses: new Map([
    [this.labels.issueWorkflow.new, "Unassigned"],
    [this.labels.issueWorkflow.assigned, "Assigned 🤖"],
    [this.labels.issueWorkflow.inDevelopment, "In Dev 🤖"],
    // [this.labels.issueWorkflow.installed, "Installed 🤖"],
    // [this.labels.issueWorkflow.verified, "Verified 🤖"],
    [this.labels.planning.needsTriage, "Needs Triage 🤖"],
    [this.labels.planning.needsMilestone, "Needs Milestone 🤖"],
    [this.labels.handoff.readyForDev, "Ready for dev 🤖"],
    // NEEDS LABEL
    ["design", "In Design 🤖"],
    // [, "Done"],
    // [, "Stalled"],
    // [, "In Review"],
    // [, "Adding to Kit"]
  ]),
  /** @type {Map<string, string>} */
  mondayPriorities: new Map([
    [this.labels.priority.high, "High"],
    [this.labels.priority.medium, "Medium"],
    [this.labels.priority.low, "Low"],
    [this.labels.priority.critical, "Critical"],
  ]),
}
