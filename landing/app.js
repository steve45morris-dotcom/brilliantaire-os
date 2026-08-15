const worlds = [
  {
    name: "Brilliantaire Core",
    purpose: "Identity, philosophy, vision, standards, personal principles, and long-term direction.",
    outputs: ["positioning", "voice", "doctrine"]
  },
  {
    name: "Brilliantaire Labs",
    purpose: "AI, software, automation, dashboards, creator tools, and future product experiments.",
    outputs: ["apps", "AI workflows", "prototypes"]
  },
  {
    name: "Brilliantaire Media",
    purpose: "Visual storytelling, short-form series, documentaries, campaigns, and cinematic identity.",
    outputs: ["videos", "visuals", "campaigns"]
  },
  {
    name: "Brilliantaire Strategy",
    purpose: "Brand systems, rollout planning, artist development, content engines, and consulting.",
    outputs: ["rollouts", "audits", "offers"]
  },
  {
    name: "Tree Groove Records",
    purpose: "Music releases, performance identity, artist development, campaigns, and cultural sound.",
    outputs: ["songs", "freestyles", "releases"]
  },
  {
    name: "Brilliantaire Academy",
    purpose: "Education for artists, builders, creators, and young creative technologists.",
    outputs: ["lessons", "templates", "workshops"]
  }
];

const worldGrid = document.querySelector("#worldGrid");

worlds.forEach((world) => {
  const card = document.createElement("article");
  card.className = "world-card";

  const outputItems = world.outputs.map((output) => `<li>${output}</li>`).join("");

  card.innerHTML = `
    <div>
      <h3>${world.name}</h3>
      <p>${world.purpose}</p>
    </div>
    <ul>${outputItems}</ul>
  `;

  worldGrid.appendChild(card);
});

const canvas = document.querySelector("#brillianceCanvas");
const ctx = canvas.getContext("2d");
let nodes = [];

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  nodes = Array.from({ length: Math.max(34, Math.floor(rect.width / 24)) }, () => ({
    x: Math.random() * rect.width,
    y: Math.random() * rect.height,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: 1.2 + Math.random() * 2.8
  }));
}

function drawNetwork() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  nodes.forEach((node) => {
    node.x += node.vx;
    node.y += node.vy;

    if (node.x < 0 || node.x > rect.width) node.vx *= -1;
    if (node.y < 0 || node.y > rect.height) node.vy *= -1;
  });

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);

      if (distance < 150) {
        ctx.strokeStyle = `rgba(8, 9, 8, ${0.16 - distance / 1100})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  nodes.forEach((node, index) => {
    ctx.fillStyle = index % 5 === 0 ? "rgba(197, 138, 47, 0.8)" : "rgba(8, 9, 8, 0.55)";
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(drawNetwork);
}

resizeCanvas();
drawNetwork();
window.addEventListener("resize", resizeCanvas);
