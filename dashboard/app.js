async function loadJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }

  return response.json();
}

function renderModules(data) {
  const grid = document.querySelector("#moduleGrid");
  grid.innerHTML = "";

  data.modules.forEach((module) => {
    const card = document.createElement("article");
    card.className = "module-card";
    card.innerHTML = `
      <small>${module.id}</small>
      <h3>${module.name}</h3>
      <p>${module.purpose}</p>
      <ul>${module.outputs.slice(0, 4).map((output) => `<li>${output}</li>`).join("")}</ul>
    `;
    grid.appendChild(card);
  });
}

function renderProjects(data) {
  const list = document.querySelector("#projectList");
  list.innerHTML = "";

  data.projects.forEach((project) => {
    const card = document.createElement("article");
    card.className = "project-card";
    card.innerHTML = `
      <div>
        <div class="project-meta">${project.lane} / ${project.priority}</div>
        <h3>${project.name}</h3>
        <p>${project.next_action}</p>
      </div>
      <span class="status ${project.status}">${project.status}</span>
    `;
    list.appendChild(card);
  });
}

function renderWeekly(data) {
  const outcomes = document.querySelector("#outcomeList");
  const metrics = document.querySelector("#metricList");

  outcomes.innerHTML = data.outcomes.map((outcome) => `<li>${outcome}</li>`).join("");
  metrics.innerHTML = Object.entries(data.metrics)
    .map(([key, value]) => `<dt>${key.replaceAll("_", " ")}</dt><dd>${value}</dd>`)
    .join("");
}

async function boot() {
  try {
    const [modules, projects, weekly] = await Promise.all([
      loadJson("../data/modules.json"),
      loadJson("../data/projects.json"),
      loadJson("../data/weekly.json")
    ]);

    renderModules(modules);
    renderProjects(projects);
    renderWeekly(weekly);
  } catch (error) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<p class="load-error">Dashboard data could not load. Start the local server from the project root.</p>`
    );
    console.error(error);
  }
}

boot();
