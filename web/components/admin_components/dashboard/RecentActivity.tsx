"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { 
    CalendarIcon, 
    UsersIcon, 
    IndianRupeeIcon,
    ExternalLinkIcon,
    EyeIcon
} from "lucide-react";

interface RecentEventsProps {
    events: Array<{
        id: string;
        title: string;
        slugId: string;
        category: string;
        date: Date;
        price: number;
        venue: string;
        thumbnailKey: string;
        createdAt: Date;
        _count: {
            participations: number;
        };
    }>;
}

interface RecentParticipationsProps {
    participations: Array<{
        id: string;
        status: string;
        registeredAt: Date;
        fullName: string;
        email: string;
        user: {
            name: string;
            email: string;
            image: string | null;
        };
    }>;
}

export function RecentEvents({ events }: RecentEventsProps) {
    const getFileUrl = (key: string) => {
        if (!key) return '/placeholder-event.jpg';
        if (key.startsWith('http://') || key.startsWith('https://')) {
            return key;
        }
        return `https://codebreakers.t3.storage.dev/${key}`;
    };

    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                <div className="space-y-1">
                    <CardTitle className="text-lg sm:text-xl">Recent Events</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                        Latest events added to the platform
                    </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <Link href="/admin/events">
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View All
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {events.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                            <p className="text-sm sm:text-base text-muted-foreground">
                                No events found
                            </p>
                        </div>
                    ) : (
                        events.map((event) => (
                            <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                                        <img
                                            src={getFileUrl(event.thumbnailKey)}
                                            alt={event.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <h4 className="font-medium text-sm truncate">{event.title}</h4>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <CalendarIcon className="w-3 h-3 shrink-0" />
                                                <span className="truncate">{new Date(event.date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <UsersIcon className="w-3 h-3 shrink-0" />
                                                <span>{event._count.participations} registered</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <IndianRupeeIcon className="w-3 h-3 shrink-0" />
                                                <span>{event.price}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                                    <Badge variant="secondary" className="text-xs">{event.category}</Badge>
                                    <Button variant="ghost" size="sm" asChild className="p-1 sm:p-2">
                                        <Link href={`/admin/events/${event.slugId}`}>
                                            <ExternalLinkIcon className="w-3 h-3" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function RecentParticipations({ participations }: RecentParticipationsProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return 'bg-green-100 text-green-800';
            case 'PAYMENT_SUBMITTED':
                return 'bg-yellow-100 text-yellow-800';
            case 'PENDING_PAYMENT':
                return 'bg-red-100 text-red-800';
            case 'REGISTERED':
                return 'bg-blue-100 text-blue-800';
            case 'CANCELLED':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return 'Confirmed';
            case 'PAYMENT_SUBMITTED':
                return 'Payment Submitted';
            case 'PENDING_PAYMENT':
                return 'Pending Payment';
            case 'REGISTERED':
                return 'Registered';
            case 'CANCELLED':
                return 'Cancelled';
            default:
                return status;
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                <div className="space-y-1">
                    <CardTitle className="text-lg sm:text-xl">Recent Registrations</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                        Latest event registrations
                    </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <Link href="/admin/participants">
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View All
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {participations.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                            <p className="text-sm sm:text-base text-muted-foreground">
                                No recent registrations
                            </p>
                        </div>
                    ) : (
                        participations.map((participation) => (
                            <div key={participation.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <Avatar className="w-8 h-8 shrink-0">
                                        <AvatarImage src={participation.user.image || undefined} />
                                        <AvatarFallback>
                                            {participation.user.name?.charAt(0) || participation.fullName?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <h4 className="text-sm font-medium truncate">
                                            {participation.user.name || participation.fullName}
                                        </h4>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {participation.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(participation.status)}`}>
                                        {getStatusLabel(participation.status)}
                                    </span>
                                    <span className="text-xs text-muted-foreground hidden sm:block">
                                        {formatDistanceToNow(new Date(participation.registeredAt), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}