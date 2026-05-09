import { useState } from "react";
import { getSubjectTheme, type SubjectTheme } from "@/lib/subjectTheme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import BiologyCellDiagram from "./tools/BiologyCellDiagram";
import GeoGebraEmbed from "./tools/GeoGebraEmbed";
import PeriodicTable from "./tools/PeriodicTable";
import ReadingNotes from "./tools/ReadingNotes";
import WorldMapTool from "./tools/WorldMapTool";
import TimelineBuilder from "./tools/TimelineBuilder";
import CodingTool from "./tools/CodingTool";
import AiTutorTool from "./tools/AiTutorTool";
import Calculator from "./tools/Calculator";

interface SubjectToolboxProps {
  subject: string;
  classId: number;
  role: "teacher" | "student";
}

export default function SubjectToolbox({ subject, classId, role }: SubjectToolboxProps) {
  const theme = getSubjectTheme(subject);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const renderTool = () => {
    switch (activeTool) {
      case "calculator": return <Calculator />;
      case "biology-cell": return <BiologyCellDiagram />;
      case "geogebra": return <GeoGebraEmbed />;
      case "periodic-table": return <PeriodicTable />;
      case "reading-notes": return <ReadingNotes classId={classId} role={role} />;
      case "world-map": return <WorldMapTool />;
      case "timeline": return <TimelineBuilder />;
      case "coding": return <CodingTool classId={classId} role={role} />;
      case "ai-tutor": return <AiTutorTool classId={classId} subject={subject} />;
      default: return null;
    }
  };

  if (activeTool) {
    const tool = theme.tools.find(t => t.id === activeTool);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{tool?.icon}</span>
            <h2 className="text-xl font-bold">{tool?.label}</h2>
            <Badge className={`${theme.bgClass} ${theme.textClass} ${theme.borderClass} border`}>{theme.emoji} {subject}</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setActiveTool(null)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div
          className="rounded-2xl overflow-hidden border-2 min-h-[500px]"
          style={{ borderColor: theme.color + "40", backgroundImage: theme.bgPattern, backgroundSize: "60px 60px" }}
        >
          {renderTool()}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Subject header */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.color}cc)` }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: theme.bgPattern, backgroundSize: "60px 60px" }}
        />
        <div className="relative z-10 flex items-center gap-4">
          <span className="text-5xl">{theme.emoji}</span>
          <div>
            <h2 className="text-2xl font-black">{subject}</h2>
            <p className="text-white/80 text-sm mt-1">
              {theme.tools.length} interactive tool{theme.tools.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>
      </div>

      {/* Tool grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {theme.tools.map((tool) => (
          <Card
            key={tool.id}
            className={`cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-2 ${theme.borderClass}`}
            onClick={() => setActiveTool(tool.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{tool.icon}</span>
                <CardTitle className={`text-base ${theme.textClass}`}>{tool.label}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
              <Button
                size="sm"
                className={`mt-3 w-full bg-gradient-to-r ${theme.gradient} text-white border-0 hover:opacity-90`}
              >
                Open Tool →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
