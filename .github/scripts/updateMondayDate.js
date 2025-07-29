// @ts-check
const { handleMilestone, updateMultipleColumns } = require("./support/utils");

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const { MONDAY_KEY } = process.env;
  const payload = /** @type {import('@octokit/webhooks-types').IssuesMilestonedEvent} */ (context.payload);
  const {
    body,
    number,
    milestone,
    assignee,
    labels,
  } = payload.issue;

  const columnUpdates = handleMilestone(milestone, assignee, labels);

  const valuesObject = {};
  columnUpdates.forEach((value) => {
    valuesObject[value.column] = value.value;
  });

  try {
    await updateMultipleColumns(MONDAY_KEY, body, number, valuesObject);
  }
  catch (error) {
    throw new Error(`Error updating Milestone values in Monday.com: ${error}`);
  }
};
