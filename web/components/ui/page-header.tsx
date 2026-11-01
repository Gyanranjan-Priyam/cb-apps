"use client";

import { PageBackButton } from "./page-back-button";
import { DynamicBreadcrumb } from "./dynamic-breadcrumb";
import { Separator } from "./separator";

interface PageHeaderProps {
  title?: string;
  description?: string;
  showBackButton?: boolean;
  showBreadcrumbs?: boolean;
  backButtonProps?: {
    fallbackUrl?: string;
    label?: string;
    variant?: "default" | "ghost" | "outline" | "secondary" | "destructive" | "link";
  };
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  showBackButton = true,
  showBreadcrumbs = false,
  backButtonProps,
  children,
  className = ""
}: PageHeaderProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Navigation Section */}
      {(showBackButton || showBreadcrumbs) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <PageBackButton 
                {...backButtonProps}
              />
            )}
            {showBreadcrumbs && <DynamicBreadcrumb />}
          </div>
        </div>
      )}

      {/* Header Content */}
      {(title || description || children) && (
        <>
          {(showBackButton || showBreadcrumbs) && <Separator />}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {title && (
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {children && (
              <div className="flex items-center space-x-2">
                {children}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}