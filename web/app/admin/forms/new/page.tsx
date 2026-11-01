import type { Metadata } from "next";
import { createBlankFormDefinition } from "@/lib/form-types";
import FormBuilder from "../_components/form-builder";

export const metadata: Metadata = {
  title: "Create Form",
  description: "Create a new manual verification form",
};

export default function NewFormPage() {
  return <FormBuilder initialDefinition={createBlankFormDefinition()} />;
}
