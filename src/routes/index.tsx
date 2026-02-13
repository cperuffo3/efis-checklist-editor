import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

function RedirectToEditor() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/editor" });
  }, [navigate]);

  return null;
}

export const Route = createFileRoute("/")({
  component: RedirectToEditor,
});
