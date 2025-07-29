// @ts-check
const { updateMultipleColumns } = require("./support/utils");
const { mondayColumns } = require("./support/resources");

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

  const isDesign = labels?.some(label => label.name === "design");
  const status = isDesign
    ? "Adding to Kit"
    : "Done";

  const valueObject = {
    [mondayColumns.open]: "Closed",
    [mondayColumns.status]: status,
  };

  try {
    await updateMultipleColumns(MONDAY_KEY, body, number, valueObject);
  } catch (error) {
    throw new Error(`Error updating Monday.com task: ${error}`);
  }
}
