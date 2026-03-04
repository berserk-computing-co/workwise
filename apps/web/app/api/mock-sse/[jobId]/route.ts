import { NextRequest } from 'next/server';
import { generateSSEEvents } from '@/app/mocks/mock-sse';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } },
) {
  // Only active in mock mode
  if (process.env.NEXT_PUBLIC_MOCK_API !== 'true') {
    return new Response('Not found', { status: 404 });
  }

  const simulateError = req.nextUrl.searchParams.get('_mockError') === 'true';
  const duration = parseInt(
    req.nextUrl.searchParams.get('_mockDuration') ?? '10000',
    10,
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of generateSSEEvents({
          duration,
          simulateError,
        })) {
          const chunk = `event: ${event.event}\ndata: ${event.data}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch {
        // Client disconnected
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
