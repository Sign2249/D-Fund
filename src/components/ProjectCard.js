// src/components/ProjectCard.js
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Clock, Users, Target, Zap } from "lucide-react";

export default function ProjectCard({
  title,
  description,
  image,
  goalAmount,
  fundedAmount,
  percent,
  deadline,
  backerCount = 0,
  category = "Innovation",
  onClick,
}) {
  const calculateDaysLeft = (deadline) => {
    const now = new Date();
    const diff = Math.ceil((deadline * 1000 - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff}일 남음` : "마감";
  };

  const getProgressColor = (percent) => {
    if (percent >= 100) return "bg-chart-4";
    if (percent >= 75) return "bg-primary";
    if (percent >= 50) return "bg-accent";
    return "bg-chart-2";
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden bg-card border-card-border hover-elevate transition-all duration-300"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Zap className="w-16 h-16 text-primary/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            {category}
          </Badge>
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex justify-between text-white">
          <span className="text-2xl font-bold font-mono">{percent}%</span>
          <span className="text-sm">달성</span>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-card-foreground mb-2 line-clamp-2">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>

        <div className="space-y-2">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressColor(percent)} transition-all duration-500`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-mono text-primary font-semibold">{fundedAmount} ETH</span>
            <span className="text-muted-foreground">목표: {goalAmount} ETH</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-card-border">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{backerCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{calculateDaysLeft(deadline)}</span>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="text-primary hover:text-primary/80">
            <Target className="w-4 h-4 mr-1" />
            보기
          </Button>
        </div>
      </div>
    </Card>
  );
}
