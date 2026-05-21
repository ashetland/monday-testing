// @ts-check
const Monday = require("../support/monday");
const { createBodyUpdater } = require("../support/utils");

// testing pr
 
/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ github, context, core }) => {
  const { issue } =
    /** @type {import('@octokit/webhooks-types').IssuesOpenedEvent | import('@octokit/webhooks-types').IssuesLabeledEvent}*/ (
      context.payload
    );
  // If there is a related issue, exit
  
  const relatedRegex = /\*\*Related Issue:\*\* #\d+/;
  if (issue.body && relatedRegex.test(issue.body)) {
    core.info("Issue has a related issue, skipping Monday task creation.");
    return;
  }
  
  const monday = Monday(issue, core, createBodyUpdater({ github, context, core }));
  await monday.createTask();
};