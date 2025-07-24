// @ts-check
const { callMonday, addSyncLine, assignLabels, assignPerson, handleMilestone } = require("./support/utils");
const { mondayBoard, mondayColumns } = require("./support/resources");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ github, context }) => {
  const { MONDAY_KEY } = process.env;
  const payload =
    /** @type {import('@octokit/webhooks-types').IssuesOpenedEvent} */ (
      context.payload
    );
  const { title, body, number, labels, assignees, html_url, milestone } = payload.issue;

  /**
   * Creates the GraphQL query to create a new item in Monday.com
   * @returns {string} - The GraphQL query string
   */
  function createTaskQuery() {
    let values = {
      [mondayColumns.issueNumber]: `${number}`,
      [mondayColumns.link]: {
        url: html_url,
        text: `${number}`,
      },
    };

    if (assignees) {
      assignees.forEach((person) => {
        values = assignPerson(person, values);
      });
    }

    if (labels) {
      labels.forEach((label) => {
        values = assignLabel(labels, values);
      });
    }

    if (milestone) {
      handleMilestone(milestone.title).forEach(({ column, value }) => {
        values[column] = value;
      });
    }

    // Escape double quotes for GraphQL
    const valuesString = JSON.stringify(values).replace(/"/g, '\\"');

    const query = `mutation { 
      create_item (
        board_id: ${mondayBoard},
        item_name: "${title}",
        column_values: "${valuesString}"
      ) {
        id
      }
    }`;

    return query;
  }

  const response = await callMonday(MONDAY_KEY, createTaskQuery());
  if (!response || !response["data"] || !response["data"]["create_item"]["id"]) {
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
