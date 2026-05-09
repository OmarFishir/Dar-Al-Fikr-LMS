import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Organelle {
  id: string;
  name: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  color: string;
  function: string;
  details: string;
  shape?: "circle" | "ellipse" | "irregular";
}

const ORGANELLES: Organelle[] = [
  {
    id: "nucleus",
    name: "Nucleus",
    cx: 50, cy: 48, rx: 10, ry: 10,
    color: "#6366f1",
    function: "Control center of the cell",
    details: "Contains the cell's DNA and controls gene expression. It directs all cellular activities including growth, metabolism, and reproduction. Surrounded by a double membrane called the nuclear envelope with nuclear pores.",
  },
  {
    id: "nucleolus",
    name: "Nucleolus",
    cx: 50, cy: 46, rx: 4, ry: 4,
    color: "#4f46e5",
    function: "Produces ribosomes",
    details: "A dense region inside the nucleus where ribosomal RNA (rRNA) is synthesized and ribosome subunits are assembled. It disappears during cell division.",
  },
  {
    id: "mitochondria",
    name: "Mitochondria",
    cx: 72, cy: 38, rx: 7, ry: 4,
    color: "#ef4444",
    function: "Powerhouse of the cell",
    details: "Produces ATP (energy) through cellular respiration. Has a double membrane — the inner membrane is folded into cristae to increase surface area. Contains its own DNA, suggesting it was once a free-living bacterium (endosymbiotic theory).",
  },
  {
    id: "er_rough",
    name: "Rough ER",
    cx: 34, cy: 42, rx: 9, ry: 5,
    color: "#f97316",
    function: "Protein synthesis & transport",
    details: "Studded with ribosomes, giving it a 'rough' appearance. Proteins made here are folded, modified, and packaged for secretion or use within the cell. Connected to the nuclear envelope.",
  },
  {
    id: "er_smooth",
    name: "Smooth ER",
    cx: 28, cy: 55, rx: 8, ry: 4,
    color: "#fb923c",
    function: "Lipid synthesis & detoxification",
    details: "Lacks ribosomes. Synthesizes lipids and steroids, detoxifies drugs and poisons, and stores calcium ions. Abundant in liver cells and muscle cells.",
  },
  {
    id: "golgi",
    name: "Golgi Apparatus",
    cx: 62, cy: 60, rx: 9, ry: 4,
    color: "#eab308",
    function: "Packaging & shipping center",
    details: "Receives proteins from the ER, modifies them (adds sugar chains), and packages them into vesicles for secretion or delivery to other organelles. Often called the 'post office' of the cell.",
  },
  {
    id: "lysosome",
    name: "Lysosome",
    cx: 74, cy: 62, rx: 4, ry: 4,
    color: "#a855f7",
    function: "Digestion & waste removal",
    details: "Contains digestive enzymes that break down waste materials, cellular debris, and foreign invaders. Maintains an acidic interior (pH ~4.8). Involved in autophagy — recycling damaged organelles.",
  },
  {
    id: "ribosome",
    name: "Ribosomes",
    cx: 40, cy: 30, rx: 2, ry: 2,
    color: "#22c55e",
    function: "Protein synthesis",
    details: "Tiny organelles made of rRNA and proteins. Found free in cytoplasm or attached to rough ER. Translate mRNA into proteins. Every cell contains thousands of ribosomes.",
  },
  {
    id: "vacuole",
    name: "Vacuole",
    cx: 50, cy: 68, rx: 8, ry: 6,
    color: "#06b6d4",
    function: "Storage & waste disposal",
    details: "Stores water, nutrients, and waste products. In plant cells, a large central vacuole maintains turgor pressure. In animal cells, vacuoles are smaller and more numerous.",
  },
  {
    id: "centriole",
    name: "Centrioles",
    cx: 30, cy: 70, rx: 3, ry: 5,
    color: "#14b8a6",
    function: "Cell division",
    details: "Cylindrical structures made of microtubules. Organize the mitotic spindle during cell division. Found only in animal cells. Cells have two centrioles arranged at right angles (forming a centrosome).",
  },
  {
    id: "cell_membrane",
    name: "Cell Membrane",
    cx: 50, cy: 50, rx: 46, ry: 44,
    color: "#64748b",
    function: "Controls what enters/exits the cell",
    details: "A phospholipid bilayer with embedded proteins. Selectively permeable — controls the movement of substances in and out. Contains receptor proteins, transport proteins, and glycoproteins for cell recognition.",
  },
];

export default function BiologyCellDiagram() {
  const [selected, setSelected] = useState<Organelle | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="p-4 min-h-[500px] bg-teal-50/50 dark:bg-teal-950/20">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* SVG Cell */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground mb-3 text-center">
            Click on any organelle to learn about it
          </p>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-teal-200 dark:border-teal-800 overflow-hidden">
            <svg
              viewBox="0 0 100 100"
              className="w-full"
              style={{ maxHeight: "420px" }}
            >
              {/* Cytoplasm background */}
              <ellipse cx="50" cy="50" rx="46" ry="44" fill="#e0f7fa" opacity="0.6" />

              {/* Organelles — render cell membrane last so it's on top for clicking */}
              {ORGANELLES.filter(o => o.id !== "cell_membrane").map((org) => (
                <g key={org.id}>
                  <ellipse
                    cx={org.cx}
                    cy={org.cy}
                    rx={org.rx}
                    ry={org.ry}
                    fill={org.color}
                    fillOpacity={hovered === org.id || selected?.id === org.id ? 0.9 : 0.7}
                    stroke={selected?.id === org.id ? "#fff" : org.color}
                    strokeWidth={selected?.id === org.id ? 0.8 : 0.3}
                    className="cursor-pointer transition-all duration-200"
                    style={{
                      filter: hovered === org.id ? `drop-shadow(0 0 3px ${org.color})` : "none",
                      transform: hovered === org.id ? "scale(1.05)" : "scale(1)",
                      transformOrigin: `${org.cx}% ${org.cy}%`,
                    }}
                    onClick={() => setSelected(org)}
                    onMouseEnter={() => setHovered(org.id)}
                    onMouseLeave={() => setHovered(null)}
                  />
                  {/* Label */}
                  {(hovered === org.id || selected?.id === org.id) && (
                    <text
                      x={org.cx}
                      y={org.cy - org.ry - 1.5}
                      textAnchor="middle"
                      fontSize="2.5"
                      fill={org.color}
                      fontWeight="bold"
                      style={{ pointerEvents: "none" }}
                    >
                      {org.name}
                    </text>
                  )}
                </g>
              ))}

              {/* Cell membrane — transparent, just for click */}
              {(() => {
                const org = ORGANELLES.find(o => o.id === "cell_membrane")!;
                return (
                  <ellipse
                    key={org.id}
                    cx={org.cx}
                    cy={org.cy}
                    rx={org.rx}
                    ry={org.ry}
                    fill="transparent"
                    stroke={selected?.id === org.id ? "#64748b" : "#94a3b8"}
                    strokeWidth={hovered === org.id ? 1.5 : 0.8}
                    className="cursor-pointer"
                    onClick={() => setSelected(org)}
                    onMouseEnter={() => setHovered(org.id)}
                    onMouseLeave={() => setHovered(null)}
                  />
                );
              })()}

              {/* Hover tooltip */}
              {hovered && hovered !== selected?.id && (() => {
                const org = ORGANELLES.find(o => o.id === hovered);
                if (!org) return null;
                return (
                  <text
                    x={org.cx}
                    y={Math.max(org.cy - org.ry - 2, 5)}
                    textAnchor="middle"
                    fontSize="2.2"
                    fill="#0f172a"
                    fontWeight="600"
                    style={{ pointerEvents: "none" }}
                  >
                    {org.name}
                  </text>
                );
              })()}
            </svg>
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {ORGANELLES.filter(o => o.id !== "cell_membrane").map(org => (
              <button
                key={org.id}
                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition-all hover:scale-105"
                style={{
                  borderColor: org.color + "60",
                  backgroundColor: selected?.id === org.id ? org.color + "20" : "transparent",
                  color: org.color,
                }}
                onClick={() => setSelected(org)}
              >
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: org.color }} />
                {org.name}
              </button>
            ))}
          </div>
        </div>

        {/* Info panel */}
        <div className="lg:w-72 shrink-0">
          {selected ? (
            <Card className="border-2" style={{ borderColor: selected.color + "60" }}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-black text-lg" style={{ color: selected.color }}>{selected.name}</h3>
                    <Badge
                      className="mt-1 text-xs"
                      style={{ backgroundColor: selected.color + "20", color: selected.color, border: `1px solid ${selected.color}40` }}
                    >
                      {selected.function}
                    </Badge>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{selected.details}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-dashed border-teal-200 dark:border-teal-800">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-3">🔬</div>
                <p className="font-semibold text-teal-700 dark:text-teal-300">Click an organelle</p>
                <p className="text-sm text-muted-foreground mt-1">to see its name, function, and detailed description</p>
              </CardContent>
            </Card>
          )}

          {/* Quick facts */}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Quick Facts</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>🔵 This is an <strong>animal cell</strong> (has centrioles, no cell wall)</p>
              <p>🟢 Plant cells also have: cell wall, chloroplasts, large central vacuole</p>
              <p>🔴 Mitochondria have their own DNA (endosymbiotic theory)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
