// @ts-check
/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const BOARD = "8780429793";
  const columns = {
    issue_id: "numeric_mknk2xhh",
    date: "date6",
    link: "link",
    people: "people",
    status: "dup__of_overall_status__1",
    issue_type: "color_mksw3bdr",
    priority: "priority",
  };
  const { MONDAY_KEY } = process.env;

  const payload = /** @type {import('@octokit/webhooks-types').IssuesCreatedEvent} */ (context.payload);

  /**
   * @typedef {object} Issue
   * @property {string} title
   * @property {string} url
   * @property {string} body
   * @property {string} number
   * @property {object} milestone
   * @property {string} milestone.title
   * @property {People[]} assignees
   * @property {Label[]} labels
   */

  /**
   * @typedef {object} People
   * @property {string} login
   * @property {string} id
   * @property {string} node_id
   * @property {string} avatar_url
   * @property {string} url
   * @property {string} html_url
   * @property {string} type
   * @property {boolean} site_admin
   */

  /**
   * @typedef {object} Label
   * @property {string} name
   * @property {string} color
   * @property {string} description
   * @property {string} url
   * @property {string} id
   * @property {string} node_id
   * @property {boolean} default
   */

  /** @type {Issue} */
  const {
    title,
    url,
    body,
    number,
    labels,
    assignees,
  } = payload.issue;

  /**
   * Calls the Monday.com API with a provided query
   * @param {string} query
   * @returns {Promise<string | undefined>}
   */
  async function callMonday(query) {
    try {
      const response = await fetch("https://api.monday.com/v2", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: MONDAY_KEY,
        },
        body: JSON.stringify({
          query: query,
        }),
      });

      const body = await response.json();

      if (!response.ok) {
        console.log(body);
        throw new Error(`HTTP error when callid the Monday API: ${body}`);
      }

      return body;
    } catch (error) {
      console.log(error);
    }
  }

  const issueTypeLabels = ["bug", "enhancement", "a11y", "docs", "refactor", "spike", "testing", "tooling"];
  const statusLabels = ["needs triage", "needs milestone", "ready for dev", "1 - assigned", "2 - in development", "3 - installed", "4 - verified"];
  const priorityLabels = ["p - high", "p - medium", "p - low"];

  let issueType, status, priority = "";

  for (const label of labels) {
    if (issueTypeLabels.includes(label.name)) {
      issueType = label.name;
      break;
    }
    if (statusLabels.includes(label.name)) {
      status = label.name;
      break;
    }
    if (priorityLabels.includes(label.name)) {
      priority = label.name;
      break;
    }
  }

  const columnValuesObj = {
    [columns.issue_id]: number,
    [columns.link]: url,
    // [columns.people]: assignees.length ? assignees.map(a => (`${a.login}@esri.com`)) : [],
    // myColumnValue: "123456, 654321" - requres people IDs. I assume Monday mapped GitHub emails to IDs
    // [columns.status]: status || "needs triage",
    // [columns.issue_type]: issueType,
    // [columns.priority]: priority,
  };

  let columnValues = JSON.stringify(columnValuesObj);
  // Escape double quotes for GraphQL
  columnValues = columnValues.replace(/"/g, '\\"');

  const query = `mutation { 
    create_item (
      board_id: ${BOARD},
      item_name: "${title}",
      column_values: "${columnValues}"
    ) {
      id
    }
  }`;
  console.log(query);

  const response = await callMonday(query);
  console.log(response.data, response.errors[0].message, response.errors[0].locations);

  // console.log(`Created Monday.com task with ID: ${id}`);
};
