"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { BlockUserActions } from "./block-user-actions";
import { ShieldBan } from "lucide-react";
import { getQuizzesWithBlockedMembers } from "../actions";
import { getUserProfileImageUrl } from "@/lib/image-utils";

type BlockedMember = {
  id: string;
  name: string;
  email: string;
  branch: string | null;
  profileImageKey: string | null;
  image: string | null;
  banReason: string | null;
  banExpires: Date | null;
  banned: boolean | null;
  quizBlockId?: string;
  quizBlockReason?: string;
  violationType?: string;
  violationCount?: number;
  blockedAt?: Date;
};

type QuizWithBlocked = {
  id: string;
  title: string;
  quizId: string;
  isActive: boolean;
  blockedMembers: BlockedMember[];
  blockedCount: number;
};


export function BlockedMembersList({ initialData }: { initialData: QuizWithBlocked[] }) {
  const [quizzesWithBlocked, setQuizzesWithBlocked] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleUpdate = async () => {
    setIsRefreshing(true);
    try {
      const result = await getQuizzesWithBlockedMembers();
      if (result.status === "success") {
        setQuizzesWithBlocked(result.data);
      }
    } catch (error) {
      console.error("Failed to refresh blocked members:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (quizzesWithBlocked.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShieldBan className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Blocked Members</h3>
        <p className="text-muted-foreground">
          There are currently no members blocked from accessing quizzes.
        </p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full space-y-4">
      {quizzesWithBlocked.map((quiz) => (
        <AccordionItem
          key={quiz.id}
          value={quiz.id}
          className="border rounded-lg overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-3 hover:bg-muted/50">
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 text-left">
                <div className="font-semibold">{quiz.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {quiz.quizId}
                  </Badge>
                  <Badge
                    variant={quiz.isActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {quiz.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {quiz.blockedCount} blocked
                  </span>
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3 mt-2">
              {quiz.blockedMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-start gap-3 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage
                      src={getUserProfileImageUrl({
                        profileImageKey: member.profileImageKey,
                        image: member.image,
                      }) || undefined}
                      alt={member.name}
                    />
                    <AvatarFallback>
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{member.name}</p>
                      <Badge variant="destructive" className="text-xs">
                        Banned
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    {member.branch && (
                      <p className="text-sm text-muted-foreground">{member.branch}</p>
                    )}
                    {member.quizBlockReason && (
                      <div className="mt-2 p-2 bg-destructive/10 rounded text-sm">
                        <span className="font-medium">Quiz Block Reason: </span>
                        {member.quizBlockReason}
                      </div>
                    )}
                    {member.violationType && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="border-orange-500 text-orange-500">
                          {member.violationType.replace(/_/g, ' ')}
                        </Badge>
                        {member.violationCount && (
                          <span className="text-muted-foreground">
                            {member.violationCount} violation{member.violationCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    )}
                    {member.blockedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Blocked: {format(new Date(member.blockedAt), "PPp")}
                      </p>
                    )}
                    {member.banReason && member.banReason !== member.quizBlockReason && (
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <span className="font-medium">Global Ban Reason: </span>
                        {member.banReason}
                      </div>
                    )}
                    {member.banExpires && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Ban Expires: {format(new Date(member.banExpires), "PPp")}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <BlockUserActions
                      userId={member.id}
                      userName={member.name}
                      isBanned={member.banned ?? false}
                      quizId={quiz.id}
                      onUpdate={handleUpdate}
                    />
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
