import { Outlet, createRootRoute } from "@tanstack/react-router";

function Root() {
  return <Outlet />;
}

export const Route = createRootRoute({
  component: Root,
});
