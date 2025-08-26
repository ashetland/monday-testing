// @ts-check
const { handleMilestone, updateMultipleColumns } = require("./support/utils");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const { MONDAY_KEY } = process.env;
  const {
    issue: { body, number, milestone, assignee, labels },
  } = /** @type {import('@octokit/webhooks-types').IssuesMilestonedEvent} */ (
    context.payload
  );

  const columnUpdates = handleMilestone(milestone, assignee, labels);

  if (columnUpdates.length === 0) {
    console.log("No columns to update for the milestone event.");
    process.exit(0);
  }

  const valuesObject = {};
  columnUpdates.forEach((value) => {
    valuesObject[value.column] = value.value;
  });

  try {
    await updateMultipleColumns(MONDAY_KEY, body, number, valuesObject);
    process.exit(0);
  } catch (error) {
    console.log(`Error updating Milestone values in Monday.com: ${error}`);
    process.exit(1);
  }
};
