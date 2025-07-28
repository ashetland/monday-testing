// @ts-check
const { callMonday, getMondayID, formatValues } = require("./support/utils");
const { mondayBoard, mondayColumns } = require("./support/resources");

// When a Milestone is added or updated:
// 1. Find ID of task in Issue Body, if not found, find in Monday
// 2. Update Due Date column value in Monday to Due Date of Milestone, or clear it if not found.
/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const { MONDAY_KEY } = process.env;
  const payload =
    /** @type {import('@octokit/webhooks-types').IssuesClosedEvent} */ (
      context.payload
    );
  const {
    issue: { number, body, labels }
  } = payload;

  const mondayID = await getMondayID(MONDAY_KEY, body, number);
  if (!mondayID) {
    console.log(`No Monday ID found for issue #${number}. Skipping update.`);
    return;
  }

  const isDesign = labels?.some(label => label.name === "design");
  const status = isDesign
    ? "Adding to UI Kit"
    : "Done";

  const valueObject = {
    [mondayColumns.open]: "Closed",
    [mondayColumns.status]: status,
  };

  const query = `mutation {
    change_multiple_column_values(
      board_id: ${mondayBoard},
      item_id: ${mondayID},
      column_values: "${formatValues(valueObject)}"
    ) {
      id
    }
  }`;

  const response = await callMonday(MONDAY_KEY, query);
  if (!response || !response["data"]["change_multiple_column_values"]) {
    throw new Error(`Failed to update Monday.com status: ${JSON.stringify(response)}`);
  }
}
