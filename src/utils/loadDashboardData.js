export async function loadDashboardData() {
  const response = await fetch("/output/frontend/bottleneck_dashboard.json", {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load dashboard data.");
  }

  return response.json();
}
