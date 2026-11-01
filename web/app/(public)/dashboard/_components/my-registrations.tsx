"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  MapPin,
  Tag,
  Clock,
  CreditCard,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface Participation {
  id: string;
  status: string;
  registeredAt: Date;
  paymentSubmittedAt: Date | null;
  paymentVerifiedAt: Date | null;
  paymentAmount: number | null;
  transactionId: string | null;
  event: {
    id: string;
    title: string;
    slugId: string;
    category: string;
    date: Date;
    venue: string;
    price: number;
  };
}

interface MyRegistrationsProps {
  participations: Participation[];
}

export function MyRegistrations({ participations }: MyRegistrationsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PAYMENT_SUBMITTED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PAYMENT_REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'REGISTERED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="w-4 h-4" />;
      case 'PAYMENT_SUBMITTED':
        return <Clock className="w-4 h-4" />;
      case 'PAYMENT_REJECTED':
        return <AlertCircle className="w-4 h-4" />;
      case 'REGISTERED':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (participations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            My Registrations
          </CardTitle>
          <CardDescription>
            Your event registrations and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No registrations yet</h3>
            <p className="text-muted-foreground mb-4">
              You haven't registered for any events yet. Start exploring!
            </p>
            <Button asChild>
              <Link href="/dashboard/events">
                Browse Events
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          My Registrations
        </CardTitle>
        <CardDescription className="text-sm">
          Your event registrations and their status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {participations.slice(0, 5).map((participation) => (
            <div 
              key={participation.id} 
              className="flex flex-col sm:flex-row sm:items-start justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors space-y-3 sm:space-y-0"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-2 sm:space-y-0">
                  <div>
                    <h4 className="font-semibold text-base sm:text-lg">{participation.event.title}</h4>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{format(new Date(participation.event.date), "MMM dd, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="truncate">{participation.event.venue}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="self-start sm:ml-2 text-xs">
                    <Tag className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                    {participation.event.category}
                  </Badge>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <Badge className={getStatusColor(participation.status)} variant="outline">
                      {getStatusIcon(participation.status)}
                      <span className="ml-1 text-xs">{formatStatus(participation.status)}</span>
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatCurrency(participation.paymentAmount || 0)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Button size="sm" variant="ghost" asChild className="text-xs">
                      <Link href={`/dashboard/events/${participation.event.slugId}`}>
                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="ml-1 sm:ml-0 sm:sr-only lg:not-sr-only">View Details</span>
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Timeline */}
                <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t sm:border-t-0 sm:pt-0">
                  <div>
                    Registered: {format(new Date(participation.registeredAt), "MMM dd, yyyy 'at' h:mm a")}
                  </div>
                  {participation.paymentSubmittedAt && (
                    <div>
                      Payment Submitted: {format(new Date(participation.paymentSubmittedAt), "MMM dd, yyyy 'at' h:mm a")}
                    </div>
                  )}
                  {participation.paymentVerifiedAt && (
                    <div className="text-green-600">
                      Payment Verified: {format(new Date(participation.paymentVerifiedAt), "MMM dd, yyyy 'at' h:mm a")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {participations.length > 5 && (
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Showing 5 of {participations.length} registrations
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}