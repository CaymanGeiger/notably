import { TemplateStudioClient } from "@/components/template-studio-client";
import type { ThemeMode } from "@/lib/theme";

type TemplateWorkspace = {
  id: string;
  name: string;
  role: "OWNER" | "MEMBER";
  noteCount: number;
  templateCount: number;
};

type TemplateAuthor = {
  id: string;
  name: string | null;
  email: string;
};

type TemplateItem = {
  id: string;
  name: string;
  description: string | null;
  contentYdocState: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: TemplateAuthor;
};

type TemplateStudioProps = {
  initialTheme: ThemeMode;
  userDisplayName: string;
  selectedWorkspaceId: string;
  workspaces: TemplateWorkspace[];
  templates: TemplateItem[];
};

export function TemplateStudio(props: TemplateStudioProps) {
  return <TemplateStudioClient {...props} />;
}
