// @ts-check
const { callMonday, assignLabel } = require("./support/utils");
const { mondayBoard } = require("./support/resources");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const { MONDAY_KEY } = process.env;
  const { issue, label } =
    /** @type {import('@octokit/webhooks-types').IssuesLabeledEvent} */ (
      context.payload
    );

  if (!label || !label.name) {
    console.log("No label found in the payload.");
    return;
  }

  const values = assignLabel(label, {});
  const valuesString = JSON.stringify(values).replace(/"/g, '\\"');

  const query = `mutation {
    change_multiple_column_values(
      board_id: ${mondayBoard},
      item_id: ${issue.number},
      column_values: "${valuesString}"
    ) {
      id
    }
  }`;

  const response = await callMonday(MONDAY_KEY, query);

  if (!response || !response["data"]["change_simple_column_value"]) {
    console.error(
      "Failed to update Monday.com label:",
      JSON.stringify(response),
    );
    return;
  }
};
