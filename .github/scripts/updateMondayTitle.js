// @ts-check
const { callMonday, getMondayID, formatValues } = require("./support/utils");
const { mondayBoard, mondayColumns } = require("./support/resources");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const { MONDAY_KEY } = process.env;
  const { issue, changes } =
    /** @type {import('@octokit/webhooks-types').IssuesEditedEvent} */ (
      context.payload
    );
  
  if(!changes.title) {
    console.log("No title change detected in the payload.");
    return;
  }

  const title = issue.title;

  const mondayID = await getMondayID(MONDAY_KEY, issue.body, issue.number);

  const query = `mutation {
    change_multiple_column_values(
      board_id: ${mondayBoard},
      item_id: ${mondayID},
      column_values: "${formatValues({ [mondayColumns.title]: title })}"
    ) {
      name
    }
  }`;

  const response = await callMonday(MONDAY_KEY, query);

  if (!response || !response["data"]["change_multiple_column_values"]) {
    throw new Error(`Failed to update Monday.com task title: ${JSON.stringify(response)}`);
  }
}
