import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

// SSE stream for live wall updates
export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let lastSent = 0;
      const send = () => {
        const recent = store.recentSignals(60);
        const newest = recent[0]?.postedAt || 0;
        if (newest > lastSent) {
          lastSent = newest;
          const payload = `data: ${JSON.stringify({ signals: recent })}\n\n`;
          controller.enqueue(encoder.encode(payload));
        }
      };
      // Immediate send
      send();
      const interval = setInterval(send, 2000);

      // Cleanup
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 15000);

      // @ts-ignore
      controller._cleanup = () => {
        clearInterval(interval);
        clearInterval(heartbeat);
      };
    },
    cancel(reason) {
      // @ts-ignore
      this._cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
