// @ts-check
// When a Milestone is added or updated:
// 1. Leaves a comment on all the issues listed as blocked in body,

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ github, context }) => {
  const { repo, owner } = context.repo;
  const issue = /** @type {import('@octokit/webhooks-types').IssuesMilestonedEvent} */ (context.payload?.issue);

  if (issue && issue.milestone) {
    const milestone = issue.milestone;
    
    console.log("A milestone was created/updated");
    console.log("Milestone Title:", milestone.title);
    console.log("Milestone Description:", milestone.description);
    console.log("Milestone Due Date:", milestone.due_on); // If applicable

    // Add your logic here to update the due date in Monday.com
    
  } else {
    console.log(`No milestone found for issue #${payload.issue.number}.`);
  }
};
