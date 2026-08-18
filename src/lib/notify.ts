export async function sendBroadcast(title: string, body: string): Promise<{ success: boolean; sentCount?: number; error?: string }> {
  const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;
  if (!workerUrl) {
    throw new Error("Missing NEXT_PUBLIC_WORKER_URL environment variable.");
  }

  const response = await fetch(workerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "broadcast",
      title,
      body,
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || "Failed to send broadcast");
  }

  return data;
}
