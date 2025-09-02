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
      console.log("No person or login provided for assignment.");
      return;
    }

    const info = mondayPeople.get(person.login);
    if (!info) {
      console.log(`Assignee ${person.login} not found in peopleMap.`);
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
   * @returns {Promise<any>}
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
   * @param {string} id - The ID of the Monday.com item to update
   * @returns {Promise<string | undefined>} - The ID of the updated Monday.com item
   */
  async function updateMultipleColumns(id = "") {
    const mondayId = id || (await getId());
    if (!mondayId) {
      console.log("No Monday ID found, cannot update columns.");
      return;
    }

    const query = `mutation { 
      change_multiple_column_values(
        board_id: ${mondayBoard},
        item_id: ${mondayId},
        column_values: "${formatValues(columnUpdates)}"
      ) {
        id
      }
    }`;

    const response = await runQuery(query);
    if (!response?.data?.change_multiple_column_values?.id) {
      throw new Error(
        `Failed to update columns for item ID ${mondayId}: ${JSON.stringify(response)}`,
      );
    }

    return response.data.change_multiple_column_values.id;
  }
  /**
   * Query Monday.com for an item matching the issue number
   * @private
   * @returns {Promise<string | undefined>} - The Monday.com item ID if found
   * @throws {Error} - If the query fails or no response is received
   */
  async function queryForId() {
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

    const items = response?.data?.items_page_by_column_values?.items;

    // If no item found for the issue, return undefined as we can't proceed
    // but do not throw an error as this is a valid state.
    if (!items?.length) {
      console.log(`No Monday task found for Github Issue #${issueNumber}.`);
      return;
    }

    if (items.length > 1) {
      throw new Error(
        `Multiple Monday items found for Issue #${issueNumber}. Requires manual review.`,
      );
    }

    const id = items[0].id;
    console.log(`Found existing Monday task for Issue #${issueNumber}: ${id}.`);
    return id;
  }
  /**
   * Attempt to extract a Monday.com item ID from the issue body
   * @private
   * @returns {string | undefined} - The extracted Monday.com item ID, or undefined
   */
  function extractIdFromBody() {
    const syncRegex = /(?<=\*\*monday\.com sync:\*\* #)(\d+)/;
    const syncMatch = body?.match(syncRegex);
    const id = syncMatch && syncMatch[0] ? syncMatch[0] : undefined;

    if (!id) {
      return;
    }

    console.log(`Found existing Monday ID ${id} in issue body.`);
    return id;
  }

  /** Public functions */

  /**
   * Return the Monday.com item ID for a issue.
   * ID is parsed from the issue body or fetched based on the issue number
   * @param {("body" | "query" | "both")} location - Where to look for the ID: "body", "query", or "both" (default: "both")
   * @return {Promise<string | undefined>} - The Monday.com item ID
   */
  async function getId(location = "both") {
    if (location === "query") {
      return await queryForId();
    }
    if (location === "body") {
      return extractIdFromBody();
    }

    const id = extractIdFromBody();
    if (id) {
      return id;
    }

    return await queryForId();
  }
  /**
   * Commit any pending column updates to Monday.com
   */
  async function commitChanges() {
    if (Object.keys(columnUpdates).length === 0) {
      console.log("No updates to commit.");
      return;
    }

    const id = await updateMultipleColumns();
    if (!id) {
      console.log("Changes NOT committed.");
    } else {
      console.log(`Changes committed to Monday task: ${id}.`);
    }
    columnUpdates = {};
  }
  /**
   * Create a new task in Monday.com, or update an existing one if syncId is provided
   * @param {string} syncId = When provided, updates item in Monday instead of creating new
   * @returns {Promise<string>} - The ID of the created Monday.com item
   */
  async function createTask(syncId = "") {
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
      addLabel(resources.labels.issueWorkflow.needsTriage);
    }

    // Add assignees if present
    if (assignees.length) {
      assignees.forEach((person) => addAssignee(person));

      // Set to "assigned" if no lifecycle labels were applied
      // Overrides the default "needs triage" label
      if (notInLifecycle(labels)) {
        addLabel(resources.labels.issueWorkflow.assigned);
      }
    }

    // Handle milestone if present
    if (milestone) {
      handleMilestone();
    }

    if (syncId) {
      console.log(
        `Sync ID ${syncId} provided, updating existing item instead of creating new.`,
      );
      const updatedId = await updateMultipleColumns(syncId);
      if (!updatedId) {
        throw new Error(`Failed to update existing item with ID ${syncId}`);
      }
      return updatedId;
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
    if (!response?.data?.create_item?.id) {
      throw new Error(`Failed to create item for issue #${issueNumber}`);
    }

    return response.data.create_item.id;
  }
  /**
   * Set a specific column value in columnUpdates
   * @param {string} column
   * @param {string | number | object} value
   */
  function setColumnValue(column, value) {
    if (!column) {
      console.log("No column provided to setColumnValue.");
      return;
    }
    if (value === undefined || value === null) {
      console.log("No value provided to setColumnValue.");
      return;
    }

    columnUpdates[column] = value;
  }
  /**
   * Update columnUpdates based on milestone title
   */
  function handleMilestone() {
    // If removed, reset date
    if (!milestone) {
      columnUpdates[mondayColumns.date] = "";
      clearLabel(resources.milestone.stalled);
      return;
    }
    const milestoneTitle = milestone.title;

    // Attempt to extract the date from the milestone title
    const dateRegex = /\d{4}-\d{2}-\d{2}/;
    const dueDate = milestoneTitle.match(dateRegex);

    if (dueDate) {
      columnUpdates[mondayColumns.date] = dueDate[0];
      clearLabel(resources.milestone.stalled);

      // Assigned and NO lifecycle label - OUTSIDE OF "needs milestone"
      if (assignee && notInLifecycle(labels, { skipMilestone: true })) {
        addLabel(resources.labels.issueWorkflow.assigned);
      }
      // If unassigned and NOT "Ready for Dev"
      if (!assignee && notReadyForDev(labels)) {
        addLabel(resources.labels.issueWorkflow.new);
      }
    } else {
      columnUpdates[mondayColumns.date] = "";

      if (milestoneTitle === resources.milestone.stalled) {
        addLabel(resources.milestone.stalled);
      } else if (inMilestoneStatus()) {
        columnUpdates[mondayColumns.status] = milestoneTitle;
        clearLabel(resources.milestone.stalled);
      }
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
    if (label === resources.labels.planning.monday) {
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
      console.log(`Label "${label}" not found in Monday Labels map.`);
      return;
    }

    const info = mondayLabels.get(label);
    if (!info?.column || !info?.value) {
      console.log(`Label "${label}" is missing column or title information.`);
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
      console.log(`Label "${label}" not found in Monday Labels map.`);
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
  /**
   * Check if the current milestone is one of the "status" milestones
   * @returns {boolean} - True if in a status milestone, false otherwise
   */
  function inMilestoneStatus() {
    if (!milestone) {
      return false;
    }

    const statusMilestones = [
      resources.milestone.backlog,
      resources.milestone.freezer,
    ];

    return statusMilestones.includes(milestone.title);
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
    inMilestoneStatus,
  };
};
