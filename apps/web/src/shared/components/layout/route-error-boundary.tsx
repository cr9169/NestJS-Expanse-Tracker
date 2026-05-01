import { AlertTriangle } from 'lucide-react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';

import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';

/**
 * Route-level fallback. Catches anything thrown during render or by a loader.
 * Without this, React Router shows its developer overlay — fine for dev, ugly
 * in production. We render a friendly card and offer a way back home.
 *
 * Logging belongs here too: in a real app, send the error to Sentry/etc.
 */
export function RouteErrorBoundary(): JSX.Element {
  const error = useRouteError();
  const message = describeError(error);

  // eslint-disable-next-line no-console
  console.error('Route error caught by boundary:', error);

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Something went wrong
          </CardTitle>
          <CardDescription>
            The page hit an unexpected error. You can go back home and try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
            {message}
          </pre>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload
          </Button>
          <Button asChild>
            <Link to="/">Back to dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function describeError(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === 'string' ? error : 'Unknown error';
}
