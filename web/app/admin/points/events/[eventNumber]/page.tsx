import { notFound, redirect } from "next/navigation";
import { getEventPointByNumber, getAllMembers, getEventParticipations } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Award, FileText, Users } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import MemberParticipationList from "./_components/member-participation-list";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

interface PageProps {
  params: Promise<{
    eventNumber: string;
  }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { eventNumber } = await params;
  const eventNum = parseInt(eventNumber, 10);

  if (isNaN(eventNum)) {
    notFound();
  }

  const result = await getEventPointByNumber(eventNum);

  if (result.status === "error" || !result.data) {
    notFound();
  }

  const event = result.data;

  // Get current admin user
  const authSession = await auth.api.getSession({
    headers: await headers(),
  });

  if (!authSession?.user?.id) {
    redirect("/login");
  }

  // Fetch all members
  const membersResult = await getAllMembers();
  const members = membersResult.status === "success" ? membersResult.data : [];

  // Fetch participation data for this event
  const participationsResult = await getEventParticipations(event.id);
  const initialParticipations = participationsResult.status === "success" ? participationsResult.data : {};

  // Calculate event statistics
  const totalMembers = members.length;
  const participatedCount = Object.values(initialParticipations).filter(part => part.status === "participated" || part.status === "approved" || part.status === "rejected").length;
  const approvedCount = Object.values(initialParticipations).filter(part => part.status === "approved").length;
  const rejectedCount = Object.values(initialParticipations).filter(part => part.status === "rejected").length;
  const pendingCount = totalMembers - participatedCount;

  // Calculate event status
  const now = new Date();
  const eventDate = new Date(event.eventDate);
  const daysDiff = differenceInDays(eventDate, now);
  
  let eventStatus: { label: string; variant: "default" | "secondary" | "destructive" } = {
    label: "Today",
    variant: "default"
  };
  
  if (daysDiff < 0) {
    eventStatus = { label: "Completed", variant: "secondary" };
  } else if (daysDiff > 0 && daysDiff <= 7) {
    eventStatus = { label: "Upcoming", variant: "default" };
  } else if (daysDiff > 7) {
    eventStatus = { label: "Scheduled", variant: "secondary" };
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Event #{event.eventNumber}
          </h1>
          <Badge variant={eventStatus.variant} className="text-base">
            {eventStatus.label}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          View event details and manage member participation
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Event Information</CardTitle>
            <CardDescription>Basic details about this event</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Event Title</p>
                <p className="text-lg font-semibold">{event.title}</p>
              </div>
            </div>

            {event.description && (
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-purple-500/10 p-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm text-foreground mt-1">{event.description}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-500/10 p-2">
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Event Date</p>
                <p className="text-lg font-semibold">
                  {format(new Date(event.eventDate), "MMMM dd, yyyy")}
                </p>
                {eventStatus.label === "Upcoming" && daysDiff > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {daysDiff} {daysDiff === 1 ? "day" : "days"} away
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-green-500/10 p-2">
                <Award className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Points</p>
                <p className="text-lg font-semibold">{event.points} points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participation Statistics</CardTitle>
            <CardDescription>Member participation for this event</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
                <p className="text-sm text-green-600 font-medium">Approved</p>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
                <p className="text-sm text-red-600 font-medium">Rejected</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-3xl font-bold text-blue-600">{participatedCount}</p>
                <p className="text-sm text-blue-600 font-medium">Participated</p>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                <p className="text-sm text-yellow-600 font-medium">Pending</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Members</span>
                <span className="text-lg font-semibold">{totalMembers}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Participation Rate</span>
                <span className="text-lg font-semibold">
                  {totalMembers > 0 ? Math.round((participatedCount / totalMembers) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Approval Rate</span>
                <span className="text-lg font-semibold">
                  {participatedCount > 0 ? Math.round((approvedCount / participatedCount) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Member Participation</CardTitle>
          <CardDescription>List of members and their participation status</CardDescription>
        </CardHeader>
        <CardContent>
          <MemberParticipationList 
            members={members} 
            eventId={event.id}
            eventPoints={event.points}
            initialParticipations={initialParticipations}
            adminId={authSession.user.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
