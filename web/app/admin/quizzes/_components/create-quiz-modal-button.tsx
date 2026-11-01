"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Users, Globe } from "lucide-react";

export default function CreateQuizModalButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSelect = (audience: "INTERNAL" | "EXTERNAL") => {
    setOpen(false);
    router.push(`/admin/quizzes/create?audience=${audience}`);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full sm:w-auto cursor-pointer">
        <Plus className="h-4 w-4 mr-2" />
        Create Quiz
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Select Quiz Type</DialogTitle>
            <DialogDescription>
              Choose the target audience model before creating your quiz.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleSelect("INTERNAL")}
              className="text-left p-4 border-2 border-border rounded-xl hover:border-primary hover:bg-muted/50 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-1.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-base">Internal Club Members</div>
                  <p className="text-xs text-muted-foreground">Standard quiz for registered members</p>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground pt-2 border-t border-border/40 flex items-center gap-2">
                <span>✓ Member login required</span>
                <span>•</span>
                <span>✓ Auto set assignment</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelect("EXTERNAL")}
              className="text-left p-4 border-2 border-border rounded-xl hover:border-primary hover:bg-muted/50 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-1.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-base">External / Venue Kiosks</div>
                  <p className="text-xs text-muted-foreground">For external candidates using kiosk computers</p>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground pt-2 border-t border-border/40 flex items-center gap-2">
                <span>✓ 6-digit access code</span>
                <span>•</span>
                <span>✓ Real-time candidate assignment</span>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
