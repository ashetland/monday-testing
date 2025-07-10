// @ts-check
// When a Milestone is added or updated:
// 1. Leaves a comment on all the issues listed as blocked in body,

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ github, context }) => {
  const { repo, owner } = context.repo;
  const { MONDAY_KEY } = process.env;
  const issue = /** @type {import('@octokit/webhooks-types').IssuesMilestonedEvent} */ (context.payload?.issue);

  /**
   * Queries the Monday.com API to find the task created for this issue.
   * Matches on the GitHub Issue ID column.
   * @param githubID string
   * @returns string
   */
  function findMondayID(githubID) {
    const query = `query {
      items_page_by_column_values(
        board_id: "8780429793",
        columns: {
          column_id: "numeric_mknk2xhh",
          column_values: ["${githubID}"]
        },
      ) {
        items {
          id
        }
      }
    }`;

    fetch ("https://api.monday.com/v2", {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization' : MONDAY_KEY,
      },
      body: JSON.stringify({
        'query' : query,
      })
    })
      .then(res => res.json())
      .then(res => {
        const body = JSON.stringify(res, null, 2);
        const id = JSON.parse(body);
        console.log(id);
        return id;
      });
  }

  if (issue && issue.milestone) {
    const milestone = issue.milestone;
    
    console.log(`A milestone was created/updated on issue #${issue.number}`);
    console.log(`Milestone Due Date: ${milestone.due_on}`);

    const mondayID = findMondayID(issue.number);
    console.log(`Monday ID: ${mondayID}`);
  } else {
    console.log(`No milestone found for issue #${issue.number}.`);
  }
};
