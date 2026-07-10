import { broadcaster } from "@/lib/events/broadcaster";
import { ensureBackgroundJobs } from "@/lib/pipeline/init";

export const dynamic = "force-dynamic";

export async function GET() {
  ensureBackgroundJobs();

  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      send({ type: "connected", timestamp: new Date().toISOString() });

      for (const event of broadcaster.getHistory(100)) {
        send(event);
      }

      const onEvent = (event: unknown) => send(event);
      broadcaster.on("event", onEvent);

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 15000);

      cleanup = () => {
        broadcaster.off("event", onEvent);
        clearInterval(heartbeat);
      };
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
