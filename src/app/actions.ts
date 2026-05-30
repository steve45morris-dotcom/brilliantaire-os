import fs from "fs";
import path from "path";
import { Brand, Project, Module, WeeklyData } from "./types";

const getFilePath = (folder: "data" | "brain", subpath: string) => {
  return path.join(process.cwd(), "..", folder, subpath);
};

// Read modules
export async function getModules(): Promise<{ brand: Partial<Brand>; modules: Module[] }> {
  try {
    const filePath = getFilePath("data", "modules.json");
    if (!fs.existsSync(filePath)) {
      return { brand: {}, modules: [] };
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading modules:", error);
    return { brand: {}, modules: [] };
  }
}

// Read projects
export async function getProjects(): Promise<{ projects: Project[] }> {
  try {
    const filePath = getFilePath("data", "projects.json");
    if (!fs.existsSync(filePath)) {
      return { projects: [] };
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading projects:", error);
    return { projects: [] };
  }
}

// Read weekly settings
export async function getWeekly(): Promise<WeeklyData> {
  try {
    const filePath = getFilePath("data", "weekly.json");
    if (!fs.existsSync(filePath)) {
      return {
        week_of: new Date().toISOString().split("T")[0],
        outcomes: [],
        completed_outcomes: [],
        metrics: {
          system_improvements: 0,
          public_proof_posts: 0,
          music_or_media_assets: 0,
          business_actions: 0,
          learning_notes: 0,
        },
      };
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading weekly data:", error);
    return {
      week_of: new Date().toISOString().split("T")[0],
      outcomes: [],
      completed_outcomes: [],
      metrics: {
        system_improvements: 0,
        public_proof_posts: 0,
        music_or_media_assets: 0,
        business_actions: 0,
        learning_notes: 0,
      },
    };
  }
}

// Read Command Center markdown file
export async function getCommandCenterMd(): Promise<string> {
  try {
    const filePath = getFilePath("brain", "00-command-center/Command Center.md");
    if (!fs.existsSync(filePath)) {
      return "# Command Center\nNo file found at brain/00-command-center/Command Center.md";
    }
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error("Error reading Command Center.md:", error);
    return "# Command Center\nError reading markdown file.";
  }
}

// Read One System Execution Stack reports
export async function getExecutionReports() {
  const reportsDir = "/Users/alexanderanthony/codex-workspace/reports";
  
  let missionRouter: Record<string, unknown> | null = null;
  try {
    const p = path.join(reportsDir, "mission-router", "latest.json");
    if (fs.existsSync(p)) {
      missionRouter = JSON.parse(fs.readFileSync(p, "utf-8"));
    }
  } catch (err) {
    console.error("Error reading mission router report:", err);
  }

  let projectLaneRunner: Record<string, unknown> | null = null;
  try {
    const p = path.join(reportsDir, "project-lane-runner", "latest.json");
    if (fs.existsSync(p)) {
      projectLaneRunner = JSON.parse(fs.readFileSync(p, "utf-8"));
    }
  } catch (err) {
    console.error("Error reading project lane runner report:", err);
  }

  return {
    missionRouter,
    projectLaneRunner
  };
}

// Trigger Dagu workflow run
export async function triggerDagRun(dagId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`http://localhost:8080/api/v1/dags/${encodeURIComponent(dagId)}/start`, {
      method: "POST"
    });
    if (response.ok) {
      return { success: true };
    }
    return { success: false, message: `Status: ${response.status}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, message };
  }
}

