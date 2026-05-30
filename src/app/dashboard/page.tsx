import React from "react";
import { getWeekly, getProjects, getCommandCenterMd, getExecutionReports } from "../actions";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const weekly = await getWeekly();
  const { projects } = await getProjects();
  const commandCenterMd = await getCommandCenterMd();
  const executionReports = await getExecutionReports();

  return (
    <DashboardClient
      initialWeekly={weekly}
      initialProjects={projects}
      commandCenterMd={commandCenterMd}
      executionReports={executionReports}
    />
  );
}

