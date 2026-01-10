import { NextResponse } from 'next/server';

interface ReadinessResponse {
  status: 'ready' | 'not_ready';
  timestamp: string;
  checks: {
    name: string;
    status: 'pass' | 'fail';
    message?: string;
  }[];
}

/**
 * Check if the application is ready to receive traffic
 */
async function checkApplicationReady(): Promise<{ ready: boolean; message?: string }> {
  // Application is ready if it can respond to requests
  return { ready: true };
}

/**
 * Check backend API connectivity (optional)
 */
async function checkBackendConnectivity(): Promise<{ ready: boolean; message?: string }> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!backendUrl) {
    // No backend configured - skip this check
    return { ready: true, message: 'Backend not configured' };
  }

  try {
    const response = await fetch(`${backendUrl}/health`, {
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      return { ready: true };
    }

    return { ready: false, message: `Backend returned ${response.status}` };
  } catch (error) {
    return { ready: false, message: 'Backend unreachable' };
  }
}

/**
 * Readiness probe endpoint for Kubernetes
 *
 * Returns 200 if the application is ready to receive traffic.
 * Returns 503 if any critical checks fail.
 *
 * @route GET /api/readiness
 * @returns Readiness status with check details
 */
export async function GET(): Promise<NextResponse<ReadinessResponse>> {
  const checks: ReadinessResponse['checks'] = [];

  // Check application readiness
  const appCheck = await checkApplicationReady();
  checks.push({
    name: 'application',
    status: appCheck.ready ? 'pass' : 'fail',
    message: appCheck.message,
  });

  // Check backend connectivity (non-blocking for frontend)
  const backendCheck = await checkBackendConnectivity();
  checks.push({
    name: 'backend',
    status: backendCheck.ready ? 'pass' : 'fail',
    message: backendCheck.message,
  });

  // Determine overall readiness
  // For frontend, only application check is critical
  const isReady = checks.find((c) => c.name === 'application')?.status === 'pass';

  const response: ReadinessResponse = {
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks,
  };

  return NextResponse.json(response, {
    status: isReady ? 200 : 503,
  });
}
