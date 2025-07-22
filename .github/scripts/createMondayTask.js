// @ts-check
/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ context }) => {
  const BOARD = "8780429793";
  const columns = {
    issue_id: "numeric_mknk2xhh",
    date: "date6",
    link: "link",
    people: "people",
    designers: "multiple_person_mkt2rtfv",
    developers: "multiple_person_mkt2q89j",
    product_engineers: "multiple_person_mkt2hhzm",
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

  /**
   * @typedef {object} Person
   * @property {string} role - The role of the person (e.g., developers, designers, product_engineers)
   * @property {number} id - The Monday.com user ID
   */

  /** @type {Map<string, Person>} */
  const peopleMap = new Map([
    ["anveshmekala", { role: columns.developers, id: 48387134 }],
    ["aPreciado88", { role: columns.developers, id: 6079524 }],
    ["ashetland", { role: columns.designers, id: 45851619 }],
    ["benelan", { role: columns.developers, id: 49704471 }],
    ["chezHarper", { role: columns.designers, id: 71157966 }],
    ["DitwanP", { role: columns.product_engineers, id: 53683093 }],
    ["driskull", { role: columns.developers, id: 45944985 }],
    ["Elijbet", { role: columns.developers, id: 55852207 }],
    ["eriklharper", { role: columns.developers, id: 49699973 }],
    // Kitty set to dev temporarily
    ["geospatialem", { role: columns.developers, id: 45853373 }],
    ["isaacbraun", { role: columns.product_engineers, id: 76547859 }],
    ["jcfranco", { role: columns.developers, id: 45854945 }],
    ["josercarcamo", { role: columns.developers, id: 56555749 }],
    ["macandcheese", { role: columns.developers, id: 45854918 }],
    ["matgalla",  { role: columns.designers, id: 69473378 }],
    ["rmstinson", { role: columns.designers, id: 47277636 }],
    ["SkyeSeitz", { role: columns.designers, id: 45854937 }],
    ["Amretasre002762670", { role: columns.developers, id: 77031889 }],
  ]);

  // ["bug", "enhancement", "a11y", "docs", "refactor", "spike", "testing", "tooling"];
  const issueTypeLabels = new Map([
    ["bug", "Bug"],
    ["enhancement", "Enhancement"],
  ]);
  // ["needs triage", "needs milestone", "ready for dev", "1 - assigned", "2 - in development", "3 - installed", "4 - verified"];
  const statusLabels = new Map([
    ["1 - assigned", "Assigned 🤖"],
    // [, "Done"],
    ["needs triage", "Needs Triage 🤖"],
    ["ready for dev", "Ready for dev 🤖"],
    ["2 - in development", "In Dev 🤖"],
    ["needs milestone", "Needs Milestone 🤖"],
    // [, "In Design 🤖"],
    ["0 - new", "Unassigned"],
    // [, "Stalled"],
    // [, "In Review"],
    // [, "Adding to Kit 🤖"]
  ]);
  const priorityLabels = new Map([
    ["p - high", "High"],
    ["p - medium", "Medium"],
    ["p - low", "Low"],
  ]);

  let issueType = "";
  let status = "";
  let priority = "";

  for (const label of labels) {
    if (issueTypeLabels.has(label.name)) {
      issueType = label.name;
      continue;
    }
    if (statusLabels.has(label.name)) {
      status = label.name;
      continue;
    }
    if (priorityLabels.has(label.name)) {
      priority = label.name;
      continue;
    }
  }

  const columnValuesObj = {
    [columns.issue_id]: number,
    [columns.link]: {
      "url": url,
      "text": title
    },
    [columns.status]: statusLabels.get(status || "needs triage"),
    [columns.issue_type]: issueTypeLabels.get(issueType),
    [columns.priority]: priorityLabels.get(priority),
  };

  if (assignees) {
    for (const person of assignees) {
      const info = peopleMap.get(person.login);

      if (info) {
        columnValuesObj[info.role] = `${info.id}`;
      } else {
        console.warn(`Assignee ${person.login} not found in peopleMap`);
      }
    }
  }

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
  console.log(response.data);
  if (response?.errors) {
    console.error(`Error creating Monday.com task: ${response.errors[0].message}, locations: ${response.errors[0].locations}`);
    throw new Error(`Error creating Monday.com task: ${response.errors[0].message}`);
  }

  // console.log(`Created Monday.com task with ID: ${id}`);
};
