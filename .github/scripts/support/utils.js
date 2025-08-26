// @ts-check
const {
  mondayBoard,
  mondayColumns,
  mondayLabels,
  mondayPeople,
  resources,
} = require("./resources");

/**
 * @typedef {object} removeLabelParam
 * @property {InstanceType<typeof import('@actions/github/lib/utils').GitHub>} github
 * @property {import('@actions/github/lib/context').Context} context
 * @property {string} label
 *
 * @param {removeLabelParam} obj
 **/
async function removeLabel({ github, context, label }) {
  const { owner, repo } = context.repo;
  const issue_number = context.issue.number;

  try {
    await github.rest.issues.removeLabel({
      issue_number,
      owner,
      repo,
      name: label,
    });
  } catch (err) {
    if (err.status === 404) {
      console.log(
        `The label '${label}' is not associated with issue #${issue_number}.`,
        err,
      );
    } else {
      console.log("Error while attempting to remove issue label.", err);
    }
  }
}

/**
 * @typedef {object} createLabelIfMissingParam
 * @property {InstanceType<typeof import('@actions/github/lib/utils').GitHub>} github
 * @property {import('@actions/github/lib/context').Context} context
 * @property {string} label
 * @property {string} color
 * @property {string} description
 *
 * @param {createLabelIfMissingParam} obj
 **/
async function createLabelIfMissing({
  github,
  context,
  label,
  color,
  description,
}) {
  const { owner, repo } = context.repo;
  try {
    await github.rest.issues.getLabel({
      owner,
      repo,
      name: label,
    });
  } catch {
    await github.rest.issues.createLabel({
      owner,
      repo,
      name: label,
      color,
      description,
    });
  }
}

/**
 * Calls the Monday.com API with a provided query
 * @param {string | undefined} key - The Monday.com API key
 * @param {string} query - The GraphQL query to execute
 * @returns {Promise<string | undefined>}
 */
async function callMonday(key, query) {
  try {
    if (!key) {
      throw new Error("Monday.com API key is not set.");
    }

    const response = await fetch("https://api.monday.com/v2", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: key,
      },
      body: JSON.stringify({
        query: query,
      }),
    });
    console.log(`Query: ${query}`);

    const body = await response.json();

    if (!response.ok) {
      throw new Error(
        `HTTP error when calling the Monday API: ${JSON.stringify(body)}`,
      );
    }

    return body;
  } catch (error) {
    throw new Error(`Error calling Monday.com API: ${error}`);
  }
}

/**
 * Returns the Monday.com task ID for the passed GitHub Issue ID.
 * Matches based on the GitHub Issue ID column.
 * @param {string | undefined} key - The Monday.com API key
 * @param {number} githubID
 * @returns {Promise<string>}
 */
async function fetchMondayID(key, githubID) {
  const query = `query {
      items_page_by_column_values(
        board_id: "${mondayBoard}",
        columns: {
          column_id: "${mondayColumns.issueNumber}",
          column_values: ["${githubID}"]
        },
      ) {
        items {
          id
        }
      }
    }`;

  const response = await callMonday(key, query);

  if (!response) {
    throw new Error(`No response for Github Issue #${githubID}`);
  }

  const items = response["data"]["items_page_by_column_values"]["items"];

  if (!items?.length) {
    throw new Error(`No items found for Github Issue #${githubID}`);
  }

  return items[0]["id"];
}

/**
 * Updates multiple columns in a Monday.com item
 * @param {string | undefined} key - The Monday.com API key
 * @param {string | null} body - The issue body containing the sync line
 * @param {number} githubID - The GitHub issue number
 * @param {object} values - The values to update in the item
 * @returns {Promise<string | undefined>}
 */
async function updateMultipleColumns(key, body, githubID, values) {
  const mondayID = await getMondayID(key, body, githubID);
  if (!mondayID) {
    throw new Error(`No Monday ID found for GitHub issue #${githubID}`);
  }

  const query = `mutation { 
      change_multiple_column_values(
        board_id: ${mondayBoard},
        item_id: ${mondayID},
        column_values: "${formatValues(values)}"
      ) {
        id
      }
    }`;

  const response = await callMonday(key, query);
  if (
    !response ||
    !response["data"] ||
    !response["data"]["change_multiple_column_values"]
  ) {
    throw new Error(`Failed to update columns for item ID ${mondayID}`);
  }

  return response["data"]["change_multiple_column_values"]["id"];
}

/**
 * Inserts or replaces the Monday sync line in the issue body string
 * @param {string | null} body - The current issue body
 * @param {string} mondayID - The Monday.com item ID
 * @returns {string} - The updated issue body
 */
function addSyncLine(body, mondayID) {
  const syncMarkdown = `**monday.com sync:** #${mondayID}\n\n`;
  const syncLineRegex = /^\*\*monday\.com sync:\*\* #\d+\n\n?/m;
  if (body && syncLineRegex.test(body)) {
    return body.replace(syncLineRegex, syncMarkdown);
  } else {
    return syncMarkdown + (body || "");
  }
}

/**
 * Assigns a label to the Monday.com task object
 * @param {string} label
 * @param {object} values - The current column values object to update
 * @returns {object} - The updated column values object
 */
function assignLabel(label, values) {
  if (label === "monday.com sync") {
    // Skip the sync label, as it is not needed in Monday.com
    return values;
  }

  if (!mondayLabels.has(label)) {
    console.warn(`Label ${label} not found in Monday Labels map`);
    return values;
  }

  const info = mondayLabels.get(label);
  if (!info?.column || !info?.value) {
    console.warn(`Label ${label} is missing column or title information`);
    return values;
  }

  values[info.column] = info.value;

  return values;
}

/**
 * Assigns a person to the Monday.com task object based on their GitHub username/role
 * @param {import('@octokit/webhooks-types').User} person
 * @param {object} values - The current column values object to update
 * @returns {object} - The updated column values object
 */
function assignPerson(person, values) {
  if (!person?.login) {
    console.warn("No person or login provided for assignment");
    return;
  }

  const info = mondayPeople.get(person.login);

  if (!info) {
    console.warn(`Assignee ${person.login} not found in peopleMap`);
    return;
  }

  if (values[info.role]) {
    values[info.role] += `, ${info.id}`;
  } else {
    values[info.role] = `${info.id}`;
  }

  return values;
}

/**
 * Checks if the labels do not include any lifecycle labels
 * @param {import('@octokit/webhooks-types').Label[] | undefined} labels - The list of labels for the issue
 * @param {object} options - Options to skip specific labels
 * @return {boolean} - True if no lifecycle labels are present, false otherwise
 */
function notInLifecycle(labels, { skipMilestone = false } = {}) {
  if (!labels?.length) {
    return true;
  }

  let lifecycleLabels = Object.values(resources.labels.issueWorkflow);
  if (skipMilestone) {
    lifecycleLabels = lifecycleLabels.filter(
      (label) => label !== resources.labels.issueWorkflow.needsMilestone,
    );
  }

  return labels.every((label) => !lifecycleLabels.includes(label.name));
}

/**
 * Checks if the labels do not include the "Ready for Dev" label
 * @param {import('@octokit/webhooks-types').Label[] | undefined} labels - The list of labels for the issue
 * @return {boolean} - True if "Ready for Dev" label is not present, false otherwise
 */
function notReadyForDev(labels) {
  if (!labels) {
    return true;
  }

  return labels.every(
    (label) => label.name !== resources.labels.issueWorkflow.readyForDev,
  );
}

/**
 * Returns column and value to update from a milestone title
 * @param {import('@octokit/webhooks-types').Milestone | null} milestone - The milestone object from the issue
 * @param {import('@octokit/webhooks-types').User | null | undefined} assignee - The assignee of the issue
 * @param {import('@octokit/webhooks-types').Label[] | undefined} labels - The list of labels for the issue
 * @returns {{ column: string, value: string }[]} - The column ID and value to update in Monday.com
 */
function handleMilestone(milestone, assignee, labels) {
  const resetValues = [
    {
      column: mondayColumns.date,
      value: "",
    },
  ];

  // If removed and not ready for dev, reset date
  if (!milestone) {
    return resetValues;
  }

  // Attempt to extract the date from the milestone title
  const dateRegex = /\d{4}-\d{2}-\d{2}/;
  const dueDate = milestone.title.match(dateRegex);

  if (dueDate) {
    const updates = [
      {
        column: mondayColumns.date,
        value: dueDate[0],
      },
    ];

    // Assigned and NO lifecycle label - OUTSIDE OF "needs milestone"
    if (assignee && notInLifecycle(labels, { skipMilestone: true })) {
      const status = mondayLabels.get(resources.labels.issueWorkflow.assigned);

      if (status) {
        updates.push({
          column: status.column,
          value: String(status.value),
        });
      }
    }

    // If unassigned and NOT "Ready for Dev"
    if (!assignee && notReadyForDev(labels)) {
      const status = mondayLabels.get(resources.labels.issueWorkflow.new);

      if (status) {
        updates.push({
          column: status.column,
          value: String(status.value),
        });
      }
    }

    return updates;
  }

  const statusMilestones = [
    resources.milestone.stalled,
    resources.milestone.backlog,
    resources.milestone.freezer,
  ];
  if (statusMilestones.includes(milestone.title)) {
    return [
      {
        column: mondayColumns.status,
        value: milestone.title,
      },
      {
        column: mondayColumns.date,
        value: "",
      },
    ];
  }

  return [];
}

/**
 * Returns the Monday.com item ID from the issue body or fetches it based on the issue number
 * @param {string | undefined} key - The Monday.com API key
 * @param {string | null} body - The issue body containing the sync line
 * @param {number} number - The GitHub issue number
 * @return {Promise<string>} - The Monday.com item ID
 */
async function getMondayID(key, body, number) {
  const mondayRegex = /(?<=\*\*monday\.com sync:\*\* #)(\d+)/;
  const mondayRegexMatch = body?.match(mondayRegex);
  let mondayID =
    mondayRegexMatch && mondayRegexMatch[0] ? mondayRegexMatch[0] : "";

  if (!mondayID) {
    mondayID = await fetchMondayID(key, number);
  }

  return mondayID;
}

/**
 * Creates the GraphQL query to create a new item in Monday.com
 * @param {import('@octokit/webhooks-types').Issue} issue
 * @returns {string} - The GraphQL query string
 */
function createTaskQuery(issue) {
  const { title, number, labels, assignee, assignees, html_url, milestone } =
    issue;

  /** @type {Record<string, string | number | object>} */
  let values = {
    [mondayColumns.issueNumber]: `${number}`,
    [mondayColumns.link]: {
      url: html_url,
      text: `${number}`,
    },
  };

  // Add labels if present
  if (labels?.length) {
    labels.forEach((label) => {
      // TEMP: Skip "needs milestone" if "ready for dev" is applied
      if (
        label.name === resources.labels.issueWorkflow.needsMilestone &&
        !notReadyForDev(labels)
      ) {
        console.log(
          `Skipping '${resources.labels.issueWorkflow.needsMilestone}' label as '${resources.labels.issueWorkflow.readyForDev}' is already applied.`,
        );
      }

      values = assignLabel(label.name, values);
    });
  }
  // If no lifecycle label: set default status
  if (notInLifecycle(labels)) {
    const needsTriage = mondayLabels.get(
      resources.labels.issueWorkflow.needsTriage,
    );
    if (needsTriage) {
      values[needsTriage.column] = needsTriage.value;
    }
  }

  // Add assignees if present
  if (assignees.length) {
    assignees.forEach((person) => {
      values = assignPerson(person, values);
    });

    // Set to "assigned" if no lifecycle labels were applied
    // Overrides the default "needs triage" label
    if (notInLifecycle(labels)) {
      const assigned = mondayLabels.get(
        resources.labels.issueWorkflow.assigned,
      );
      if (assigned) {
        values[assigned.column] = assigned.value;
      }
    }
  }

  // Handle milestone if present
  if (milestone) {
    handleMilestone(milestone, assignee, labels).forEach(
      ({ column, value }) => {
        values[column] = value;
      },
    );
  }

  const query = `mutation { 
      create_item (
        board_id: ${mondayBoard},
        item_name: "${title}",
        column_values: "${formatValues(values)}"
      ) {
        id
      }
    }`;

  return query;
}

/**
 * Assignes each of the current assignees to the value object.
 * @param {import('@octokit/webhooks-types').User[]} assignees - The list of assignees from the GitHub issue
 * @param {Object} valueObject - The value object to update.
 * @returns {Object} - The updated value object with assignees added to respective columns.
 */
function updateAssignees(assignees, valueObject) {
  assignees.forEach((assignee) => {
    valueObject = assignPerson(assignee, valueObject);
  });
  return valueObject;
}

/**
 * Formats the values object for use in Monday.com API calls
 * @param {object} values - The values object to format
 * @return {string} - The formatted values string
 */
function formatValues(values) {
  return JSON.stringify(values).replace(/"/g, '\\"');
}

module.exports = {
  removeLabel,
  createLabelIfMissing,
  callMonday,
  getMondayID,
  fetchMondayID,
  updateMultipleColumns,
  addSyncLine,
  assignLabel,
  assignPerson,
  notInLifecycle,
  notReadyForDev,
  handleMilestone,
  createTaskQuery,
  updateAssignees,
  formatValues,
};
