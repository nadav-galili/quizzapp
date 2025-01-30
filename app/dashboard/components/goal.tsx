"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GoalProps {
  stats: {
    totalViews: number;
    passed: number;
    failed: number;
    incomplete: number;
    title?: string;
  };
}

export function Goal({ stats }: GoalProps) {
  const total = stats.totalViews;
  const passedPercentage = (stats.passed / total) * 100;
  const failedPercentage = (stats.failed / total) * 100;
  const incompletePercentage = (stats.incomplete / total) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">{stats.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-green-600">עברו בהצלחה</span>
            <span>{Math.round(passedPercentage)}%</span>
          </div>
          <Progress value={passedPercentage} className="bg-gray-200 h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-red-600">נכשלו</span>
            <span>{Math.round(failedPercentage)}%</span>
          </div>
          <Progress value={failedPercentage} className="bg-gray-200 h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-yellow-600">טרם השלימו</span>
            <span>{Math.round(incompletePercentage)}%</span>
          </div>
          <Progress value={incompletePercentage} className="bg-gray-200 h-2" />
        </div>

        <div className="text-right mt-4">
          <p>סה״כ צפיות: {total}</p>
        </div>
      </CardContent>
    </Card>
  );
}
