"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
    TrendingUpIcon, 
    TrendingDownIcon, 
    CalendarIcon,
    UsersIcon,
    IndianRupeeIcon,
    ExternalLinkIcon
} from "lucide-react";

interface EventAnalyticsProps {
    events: Array<{
        id: string;
        title: string;
        slugId: string;
        category: string;
        date: Date;
        price: number;
        participationCount: number;
        teamCount: number;
        revenue: number;
        createdAt: Date;
    }>;
}

interface MonthlyStatsProps {
    monthlyData: Array<{
        month: string;
        registrations: number;
        revenue: number;
    }>;
}

export function EventAnalytics({ events }: EventAnalyticsProps) {
    // Sort events by participation count
    const topEvents = [...events]
        .sort((a, b) => b.participationCount - a.participationCount)
        .slice(0, 5);

    const totalParticipations = events.reduce((sum, event) => sum + event.participationCount, 0);
    const totalRevenue = events.reduce((sum, event) => sum + event.revenue, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <TrendingUpIcon className="w-5 h-5 shrink-0" />
                    <span>Top Performing Events</span>
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                    Events ranked by registration count
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {topEvents.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                            <p className="text-sm sm:text-base text-muted-foreground">
                                No events found
                            </p>
                        </div>
                    ) : (
                        topEvents.map((event, index) => {
                            const participationPercentage = totalParticipations > 0 
                                ? (event.participationCount / totalParticipations) * 100 
                                : 0;

                            return (
                                <div key={event.id} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-sm font-medium shrink-0">#{index + 1}</span>
                                                <h4 className="text-sm font-medium truncate">{event.title}</h4>
                                                <Badge variant="secondary" className="text-xs shrink-0">
                                                    {event.category}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <UsersIcon className="w-3 h-3 shrink-0" />
                                                    <span>{event.participationCount} participants</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <IndianRupeeIcon className="w-3 h-3 shrink-0" />
                                                    <span>₹{event.revenue.toLocaleString()} revenue</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <CalendarIcon className="w-3 h-3 shrink-0" />
                                                    <span>{new Date(event.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" asChild className="shrink-0">
                                            <Link href={`/admin/events/${event.slugId}`}>
                                                <ExternalLinkIcon className="w-3 h-3" />
                                            </Link>
                                        </Button>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span>Participation Rate</span>
                                            <span>{participationPercentage.toFixed(1)}%</span>
                                        </div>
                                        <Progress value={participationPercentage} className="h-2" />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function MonthlyStats({ monthlyData }: MonthlyStatsProps) {
    const formatMonth = (monthString: string) => {
        const [year, month] = monthString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const calculateGrowth = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    const maxRegistrations = Math.max(...monthlyData.map(d => d.registrations), 1);
    const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <CalendarIcon className="w-5 h-5 shrink-0" />
                    <span>Monthly Trends</span>
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                    Registration and revenue trends over the last 6 months
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {monthlyData.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                            <p className="text-sm sm:text-base text-muted-foreground">
                                No monthly data available
                            </p>
                        </div>
                    ) : (
                        monthlyData.map((data, index) => {
                            const previousData = index > 0 ? monthlyData[index - 1] : null;
                            const registrationGrowth = previousData 
                                ? calculateGrowth(data.registrations, previousData.registrations)
                                : 0;
                            const revenueGrowth = previousData 
                                ? calculateGrowth(data.revenue, previousData.revenue)
                                : 0;

                            return (
                                <div key={data.month} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-sm">
                                            {formatMonth(data.month)}
                                        </h4>
                                        <div className="flex items-center gap-2 sm:gap-4 text-xs">
                                            {previousData && (
                                                <div className="flex items-center gap-1">
                                                    {registrationGrowth >= 0 ? (
                                                        <TrendingUpIcon className="w-3 h-3 text-green-600 shrink-0" />
                                                    ) : (
                                                        <TrendingDownIcon className="w-3 h-3 text-red-600 shrink-0" />
                                                    )}
                                                    <span className={registrationGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                                                        {Math.abs(registrationGrowth).toFixed(1)}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Registrations</span>
                                                <span className="font-medium">{data.registrations}</span>
                                            </div>
                                            <Progress 
                                                value={(data.registrations / maxRegistrations) * 100} 
                                                className="h-2" 
                                            />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Revenue</span>
                                                <span className="font-medium">₹{data.revenue.toLocaleString()}</span>
                                            </div>
                                            <Progress 
                                                value={(data.revenue / maxRevenue) * 100} 
                                                className="h-2"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
}