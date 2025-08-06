// @ts-check
const { assignLabel, updateMultipleColumns } = require("./support/utils");

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

  try {
    await updateMultipleColumns(MONDAY_KEY, issue.body, issue.number, assignLabel(label, {}));
    console.log(`Finished at: ${new Date().toTimeString()}`);
  } catch (error) {
    throw new Error(`Error updating Monday.com task with label '${label.name}': ${error}`);
  }
};
