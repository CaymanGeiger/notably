import { redirect } from "next/navigation";

export default function NotesPageRedirect() {
  redirect("/workspaces");
}
