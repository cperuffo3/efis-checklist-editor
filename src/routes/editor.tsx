import { createFileRoute } from "@tanstack/react-router";
import EditorLayout from "@/layouts/editor-layout";

function EditorPage() {
  return <EditorLayout />;
}

export const Route = createFileRoute("/editor")({
  component: EditorPage,
});
