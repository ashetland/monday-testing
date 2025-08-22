// @ts-check
const { resources } = require("./support/resources");
const {
  notReadyForDev,
  assignLabel,
  updateMultipleColumns,
} = require("./support/utils");

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

  // TEMP: Skip "needs milestone" if "ready for dev" is applied
  if (
    label.name === resources.labels.issueWorkflow.needsMilestone &&
    !notReadyForDev(issue.labels)
  ) {
    console.log(
      `Skipping '${resources.labels.issueWorkflow.needsMilestone}' label as '${resources.labels.issueWorkflow.readyForDev}' is already applied.`,
    );
    process.exit(0);
  }

  try {
    await updateMultipleColumns(
      MONDAY_KEY,
      issue.body,
      issue.number,
      assignLabel(label.name, {}),
    );
    console.log(`Finished at: ${new Date().toTimeString()}`);
    process.exit(0);
  } catch (error) {
    console.log(
      `Error updating Monday.com task with label '${label.name}': ${error}`,
    );
    process.exit(1);
  }
};
