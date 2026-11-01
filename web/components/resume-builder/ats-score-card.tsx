"use client";

import { useMemo } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  KeyRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { analyzeResumeATS } from "@/lib/resume/ats-analyzer";
import type { ResumeData } from "@/lib/resume/types";

interface AtsScoreCardProps {
  data: ResumeData;
  latexContent?: string;
}

export function AtsScoreCard({ data, latexContent }: AtsScoreCardProps) {
  const analysis = useMemo(() => {
    return analyzeResumeATS(data, latexContent);
  }, [data, latexContent]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-500";
    if (score >= 70) return "text-blue-500";
    if (score >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  const getProgressColor = (score: number) => {
    if (score >= 85) return "bg-emerald-500";
    if (score >= 70) return "bg-blue-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <Card className="border-border/60 shadow-xs bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">ATS Readability Score</CardTitle>
              <CardDescription className="text-[11px]">
                Real-time Applicant Tracking System Optimization
              </CardDescription>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-2xl font-black ${getScoreColor(analysis.overallScore)}`}>
              {analysis.overallScore}%
            </span>
            <span className="text-[10px] text-muted-foreground block font-medium">
              {analysis.level}
            </span>
          </div>
        </div>

        <Progress
          value={analysis.overallScore}
          className="h-2 mt-2 bg-muted"
        />
      </CardHeader>

      <CardContent className="space-y-4 pt-1 text-xs">
        {/* Metric Criteria Breakdown */}
        <div className="space-y-2.5">
          {analysis.metrics.map((metric, i) => (
            <div key={i} className="space-y-1 p-2 rounded-xl bg-muted/40 border border-border/40">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  {metric.status === "good" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : metric.status === "warning" ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  )}
                  {metric.category}
                </span>
                <span className={`font-mono font-bold ${getScoreColor(metric.score)}`}>
                  {metric.score}/100
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground pl-5">{metric.feedback}</p>
              {metric.actionableTip && (
                <div className="pl-5 pt-0.5">
                  <span className="text-[10.5px] text-primary flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {metric.actionableTip}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Impact & Keywords Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              Quantified Metrics
            </span>
            <p className="text-sm font-bold text-foreground">
              {analysis.bulletPointStats.withMetricsOrNumbers} /{" "}
              {analysis.bulletPointStats.totalBulletPoints} Bullets
            </p>
            <span className="text-[10px] text-muted-foreground block">
              Numbers, %, $ values
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-blue-500" />
              Tech Keywords
            </span>
            <p className="text-sm font-bold text-foreground">
              {analysis.detectedKeywords.length} Detected
            </p>
            <span className="text-[10px] text-muted-foreground block">
              Skills and technologies
            </span>
          </div>
        </div>

        {/* Suggested Keywords Pill Cloud */}
        {analysis.suggestedKeywords.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Suggested High-Demand Tech Keywords:
            </span>
            <div className="flex flex-wrap gap-1">
              {analysis.suggestedKeywords.map((kw, i) => (
                <Badge key={i} variant="outline" className="text-[10px] py-0 px-2 bg-muted/50">
                  + {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
