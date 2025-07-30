// @ts-check
const {
  callMonday,
  addSyncLine,
  assignLabel,
  assignPerson,
  handleMilestone,
  formatValues,
  notReadyForDev,
  notInLifecycle,
} = require("./support/utils");
const {
  mondayBoard,
  mondayColumns,
  mondayLabels,
  resources,
} = require("./support/resources");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ github, context }) => {
  const { MONDAY_KEY } = process.env;
  const payload =
    /** @type {import('@octokit/webhooks-types').IssuesOpenedEvent | import('@octokit/webhooks-types').IssuesLabeledEvent}*/ (
      context.payload
    );
  const {
    title,
    body,
    number,
    labels,
    assignee,
    assignees,
    html_url,
    milestone,
  } = payload.issue;

  /**
   * Creates the GraphQL query to create a new item in Monday.com
   * @returns {string} - The GraphQL query string
   */
  function createTaskQuery() {
    /** @type {Record<string, string | number | object>} */
    let values = {
      [mondayColumns.issueNumber]: `${number}`,
      [mondayColumns.link]: {
        url: html_url,
        text: `${number}`,
      },
    };

    if (labels) {
      labels.forEach((label) => {
        values = assignLabel(label, values);
      });
    }
    console.log(`after labels: ${JSON.stringify(values)}`);

    if (assignees) {
      assignees.forEach((person) => {
        values = assignPerson(person, values);
      });

      if (notInLifecycle(labels)) {
        const assigned = mondayLabels.get(
          resources.labels.issueWorkflow.assigned,
        );
        if (assigned) {
          values[assigned.column] = assigned.value;
        }
      }
      console.log(`after assignees: ${JSON.stringify(values)}`);
    } else if (notReadyForDev(labels)) {
      const unassigned = mondayLabels.get(resources.labels.issueWorkflow.new);
      if (unassigned) {
        values[unassigned.column] = unassigned.value;
      }
      console.log(`after no assignees: ${JSON.stringify(values)}`);
    }

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

  const response = await callMonday(MONDAY_KEY, createTaskQuery());
  if (
    !response ||
    !response["data"] ||
    !response["data"]["create_item"]["id"]
  ) {
    throw new Error(`Missing or bad response for Github Issue #${number}`);
  }

  const mondayID = response["data"]["create_item"]["id"];

  const updatedBody = addSyncLine(body, mondayID);

  // Update the issue with the new body
  await github.rest.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: number,
    body: updatedBody,
  });
};
