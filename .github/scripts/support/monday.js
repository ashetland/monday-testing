// @ts-check
const {
  mondayBoard,
  mondayColumns,
  mondayLabels,
  mondayPeople,
  resources,
} = require("./resources");
const { notReadyForDev, notInLifecycle } = require("./utils");

/**
 * @param {import('@octokit/webhooks-types').Issue} issue - The GitHub issue object
 */
module.exports = function Monday(issue) {
  const { MONDAY_KEY } = process.env;
  console.log(
    MONDAY_KEY
      ? "Monday.com API key is set."
      : "Monday.com API key is NOT set.",
  );

  if (!MONDAY_KEY) {
    throw new Error("Monday.com API key is not set.");
  }
  if (!issue) {
    throw new Error("No GitHub issue provided.");
  }

  const {
    title,
    body,
    number: issueNumber,
    milestone,
    labels,
    assignee,
    assignees,
    html_url,
  } = issue;

  let columnUpdates = {};

  /** Private helper functions */

  /**
   * Formats the values object for use in Monday.com API calls
   * @private
   * @param {object} values - The values object to format
   * @return {string} - The formatted values string
   */
  function formatValues(values) {
    return JSON.stringify(values).replace(/"/g, '\\"');
  }
  /**
   * Assigns a person to columnUpdates based on their GitHub username/role
   * @private
   * @param {import('@octokit/webhooks-types').User} person
   */
  function addAssignee(person) {
    if (!person?.login) {
      console.warn("No person or login provided for assignment");
      return;
    }

    const info = mondayPeople.get(person.login);
    if (!info) {
      console.warn(`Assignee ${person.login} not found in peopleMap`);
      return;
    }

    if (columnUpdates[info.role]) {
      columnUpdates[info.role] += `, ${info.id}`;
    } else {
      columnUpdates[info.role] = `${info.id}`;
    }
  }
  /**
   * Calls the Monday.com API with a provided query
   * @private
   * @param {string} query - The GraphQL query string
   * @returns {Promise<string | undefined>}
   */
  async function runQuery(query) {
    // Double-check as TS doesn't seem to narrow based on the outer function check
    if (!MONDAY_KEY) {
      throw new Error("Monday.com API key is not set.");
    }

    try {
      const response = await fetch("https://api.monday.com/v2", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: MONDAY_KEY,
        },
        body: JSON.stringify({
          query: query,
        }),
      });

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
   * Creates and runs a query to update columns in a Monday.com item
   * @private
   * @param {object} values - The values to update in the item
   * @returns {Promise<string | undefined>} - The ID of the updated Monday.com item
   */
  async function updateMultipleColumns(values) {
    const mondayID = await getId();
    if (!mondayID) {
      return;
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

    const response = await runQuery(query);
    if (
      !response ||
      !response["data"] ||
      !response["data"]["change_multiple_column_values"] ||
      !response["data"]["change_multiple_column_values"]["id"]
    ) {
      console.log(query, response);
      throw new Error(`Failed to update columns for item ID ${mondayID}`);
    }

    return response["data"]["change_multiple_column_values"]["id"];
  }
  /**
   * Return the Monday.com item ID for a issue.
   * ID is parsed from the issue body or fetched based on the issue number
   * @private
   * @return {Promise<string | undefined>} - The Monday.com item ID
   */
  async function getId() {
    const mondayRegex = /(?<=\*\*monday\.com sync:\*\* #)(\d+)/;
    const mondayRegexMatch = body?.match(mondayRegex);
    let mondayID =
      mondayRegexMatch && mondayRegexMatch[0] ? mondayRegexMatch[0] : "";

    if (mondayID) {
      console.log(`Found existing Monday ID ${mondayID} in issue body.`);
      return mondayID;
    }

    const query = `query {
        items_page_by_column_values(
          board_id: "${mondayBoard}",
          columns: {
            column_id: "${mondayColumns.issueNumber}",
            column_values: ["${issueNumber}"]
          },
        ) {
          items {
            id
          }
        }
      }`;

    const response = await runQuery(query);

    if (!response) {
      throw new Error(`No response for Github Issue #${issueNumber}`);
    }

    const items = response["data"]["items_page_by_column_values"]["items"];

    // If no item found for the issue, return undefined as we can't proceed
    // but do not throw an error as this is a valid state.
    if (!items?.length) {
      console.log(`No items found for Github Issue #${issueNumber}`);
      return;
    }

    return items[0]["id"];
  }

  /** Public functions */

  /**
   * Commit any pending column updates to Monday.com
   */
  async function commitChanges() {
    if (Object.keys(columnUpdates).length === 0) {
      console.log("No column updates to commit.");
      return;
    }

    await updateMultipleColumns(columnUpdates);
    columnUpdates = {};
  }
  /**
   * Create a new task in Monday.com
   * @returns {Promise<string>} - The ID of the created Monday.com item
   */
  async function createTask() {
    /** @type {Record<string, string | number | object>} */
    columnUpdates = {
      [mondayColumns.issueNumber]: `${issueNumber}`,
      [mondayColumns.link]: {
        url: html_url,
        text: `${issueNumber}`,
      },
    };

    // Add labels if present
    if (labels?.length) {
      labels.forEach((label) => addLabel(label.name));
    }
    // If no lifecycle label: set default status
    if (notInLifecycle(labels)) {
      const needsTriage = mondayLabels.get(
        resources.labels.issueWorkflow.needsTriage,
      );
      if (needsTriage) {
        columnUpdates[needsTriage.column] = needsTriage.value;
      }
    }

    // Add assignees if present
    if (assignees.length) {
      assignees.forEach((person) => addAssignee(person));

      // Set to "assigned" if no lifecycle labels were applied
      // Overrides the default "needs triage" label
      if (notInLifecycle(labels)) {
        const assigned = mondayLabels.get(
          resources.labels.issueWorkflow.assigned,
        );
        if (assigned) {
          columnUpdates[assigned.column] = assigned.value;
        }
      }
    }

    // Handle milestone if present
    if (milestone) {
      handleMilestone();
    }

    const query = `mutation { 
      create_item (
        board_id: ${mondayBoard},
        item_name: "${title}",
        column_values: "${formatValues(columnUpdates)}"
      ) {
        id
      }
    }`;

    const response = await runQuery(query);
    if (
      !response ||
      !response["data"] ||
      !response["data"]["create_item"] ||
      !response["data"]["create_item"]["id"] 
    ) {
      throw new Error(`Failed to create item for issue #${issueNumber}`);
    }

    return response["data"]["create_item"]["id"];
  }
  /**
   * Set a specific column value in columnUpdates
   * @param {string} column - The column ID to set
   * @param {string | number | object} value - The value to set
   */
  function setColumnValue(column, value) {
    if (!column) {
      console.warn("No column provided to setColumnValue");
      return;
    }
    if (value === undefined || value === null) {
      console.warn("No value provided to setColumnValue");
      return;
    }

    columnUpdates[column] = value;
  }
  /**
   * Update columnUpdates based on milestone title
   */
  function handleMilestone() {
    const statusMilestones = [
      resources.milestone.stalled,
      resources.milestone.backlog,
      resources.milestone.freezer,
    ];

    // If removed, reset date
    if (!milestone) {
      columnUpdates[mondayColumns.date] = "";
      return;
    }
    const milestoneTitle = milestone.title;

    // Attempt to extract the date from the milestone title
    const dateRegex = /\d{4}-\d{2}-\d{2}/;
    const dueDate = milestoneTitle.match(dateRegex);

    if (dueDate) {
      columnUpdates[mondayColumns.date] = dueDate[0];

      // Assigned and NO lifecycle label - OUTSIDE OF "needs milestone"
      if (assignee && notInLifecycle(labels, { skipMilestone: true })) {
        const status = mondayLabels.get(
          resources.labels.issueWorkflow.assigned,
        );

        if (status) {
          columnUpdates[status.column] = status.value;
        }
      }
      // If unassigned and NOT "Ready for Dev"
      if (!assignee && notReadyForDev(labels)) {
        const status = mondayLabels.get(resources.labels.issueWorkflow.new);

        if (status) {
          columnUpdates[status.column] = status.value;
        }
      }
    } else if (statusMilestones.includes(milestoneTitle)) {
      columnUpdates[mondayColumns.status] = milestoneTitle;
      columnUpdates[mondayColumns.date] = "";
    }
  }
  /**
   * Assign each of the current assignees to columnUpdates.
   */
  function addAllAssignees() {
    assignees.forEach((assignee) => {
      addAssignee(assignee);
    });
  }
  /**
   * Add a label to columnUpdates
   * @param {string} label
   */
  function addLabel(label) {
    // Skip the sync label, as it is not needed in Monday.com
    if (label === "monday.com sync") {
      return;
    }

    // Skip "needs milestone" if "ready for dev" is applied
    const { needsMilestone, readyForDev } = resources.labels.issueWorkflow;
    if (label === needsMilestone && !notReadyForDev(labels)) {
      console.log(
        `Skipping '${needsMilestone}' label as '${readyForDev}' is already applied.`,
      );
      return;
    }

    if (!mondayLabels.has(label)) {
      console.warn(`Label ${label} not found in Monday Labels map`);
      return;
    }

    const info = mondayLabels.get(label);
    if (!info?.column || !info?.value) {
      console.warn(`Label ${label} is missing column or title information`);
      return;
    }

    columnUpdates[info.column] = info.value;
  }
  /**
   * Clear a column value in columnUpdates based on the label
   * @param {string} label - The label name to clear
   * @returns {void}
   */
  function clearLabel(label) {
    const labelColumn = mondayLabels.get(label)?.column;
    if (!labelColumn) {
      console.warn(`Label ${label} not found in Monday Labels map`);
      return;
    }
    // Clear the label by setting it to an empty string
    columnUpdates[labelColumn] = "";
  }
  /**
   * Inserts or replaces the Monday sync line in the issue body string
   * @param {string} mondayID - The Monday.com item ID
   * @returns {string} - The updated issue body
   */
  function addSyncLine(mondayID) {
    const syncMarkdown = `**monday.com sync:** #${mondayID}\n\n`;
    const syncLineRegex = /^\*\*monday\.com sync:\*\* #\d+\n\n?/m;
    if (body && syncLineRegex.test(body)) {
      return body.replace(syncLineRegex, syncMarkdown);
    } else {
      return syncMarkdown + (body || "");
    }
  }

  return {
    getId,
    commitChanges,
    createTask,
    setColumnValue,
    handleMilestone,
    addAllAssignees,
    addLabel,
    clearLabel,
    addSyncLine,
  };
};
