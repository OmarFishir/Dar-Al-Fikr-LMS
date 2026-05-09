import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Element {
  number: number;
  symbol: string;
  name: string;
  mass: string;
  category: string;
  group: number;
  period: number;
  electronegativity?: number;
  meltingPoint?: string;
  boilingPoint?: string;
  description: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "alkali metal": "#ef4444",
  "alkaline earth metal": "#f97316",
  "transition metal": "#eab308",
  "post-transition metal": "#84cc16",
  "metalloid": "#22c55e",
  "nonmetal": "#06b6d4",
  "halogen": "#3b82f6",
  "noble gas": "#a855f7",
  "lanthanide": "#ec4899",
  "actinide": "#f43f5e",
};

// Subset of elements for display (first 36 + noble gases)
const ELEMENTS: Element[] = [
  { number: 1, symbol: "H", name: "Hydrogen", mass: "1.008", category: "nonmetal", group: 1, period: 1, description: "Most abundant element in the universe. Forms water (H₂O) with oxygen." },
  { number: 2, symbol: "He", name: "Helium", mass: "4.003", category: "noble gas", group: 18, period: 1, description: "Second most abundant element. Used in balloons and MRI machines." },
  { number: 3, symbol: "Li", name: "Lithium", mass: "6.941", category: "alkali metal", group: 1, period: 2, description: "Lightest metal. Used in batteries and mood-stabilizing medication." },
  { number: 4, symbol: "Be", name: "Beryllium", mass: "9.012", category: "alkaline earth metal", group: 2, period: 2, description: "Very light, stiff metal. Used in aerospace and X-ray equipment." },
  { number: 5, symbol: "B", name: "Boron", mass: "10.81", category: "metalloid", group: 13, period: 2, description: "Used in glass, ceramics, and as a semiconductor." },
  { number: 6, symbol: "C", name: "Carbon", mass: "12.011", category: "nonmetal", group: 14, period: 2, description: "Basis of all organic life. Forms diamond, graphite, and graphene." },
  { number: 7, symbol: "N", name: "Nitrogen", mass: "14.007", category: "nonmetal", group: 15, period: 2, description: "Makes up 78% of Earth's atmosphere. Essential for proteins and DNA." },
  { number: 8, symbol: "O", name: "Oxygen", mass: "15.999", category: "nonmetal", group: 16, period: 2, description: "Essential for respiration. Makes up 21% of Earth's atmosphere." },
  { number: 9, symbol: "F", name: "Fluorine", mass: "18.998", category: "halogen", group: 17, period: 2, description: "Most electronegative element. Used in toothpaste (fluoride)." },
  { number: 10, symbol: "Ne", name: "Neon", mass: "20.18", category: "noble gas", group: 18, period: 2, description: "Used in neon signs. Glows orange-red when electricity passes through it." },
  { number: 11, symbol: "Na", name: "Sodium", mass: "22.99", category: "alkali metal", group: 1, period: 3, description: "Soft, reactive metal. Essential for nerve function. Found in table salt (NaCl)." },
  { number: 12, symbol: "Mg", name: "Magnesium", mass: "24.305", category: "alkaline earth metal", group: 2, period: 3, description: "Essential for chlorophyll in plants. Burns with bright white flame." },
  { number: 13, symbol: "Al", name: "Aluminium", mass: "26.982", category: "post-transition metal", group: 13, period: 3, description: "Most abundant metal in Earth's crust. Lightweight and corrosion-resistant." },
  { number: 14, symbol: "Si", name: "Silicon", mass: "28.085", category: "metalloid", group: 14, period: 3, description: "Basis of computer chips and solar cells. Second most abundant element in crust." },
  { number: 15, symbol: "P", name: "Phosphorus", mass: "30.974", category: "nonmetal", group: 15, period: 3, description: "Essential for DNA, ATP, and cell membranes. Used in fertilizers." },
  { number: 16, symbol: "S", name: "Sulfur", mass: "32.06", category: "nonmetal", group: 16, period: 3, description: "Yellow solid. Used in gunpowder, matches, and rubber vulcanization." },
  { number: 17, symbol: "Cl", name: "Chlorine", mass: "35.45", category: "halogen", group: 17, period: 3, description: "Used to disinfect water. Forms table salt (NaCl) with sodium." },
  { number: 18, symbol: "Ar", name: "Argon", mass: "39.948", category: "noble gas", group: 18, period: 3, description: "Third most abundant gas in atmosphere. Used in light bulbs and welding." },
  { number: 19, symbol: "K", name: "Potassium", mass: "39.098", category: "alkali metal", group: 1, period: 4, description: "Essential for nerve and muscle function. Found in bananas." },
  { number: 20, symbol: "Ca", name: "Calcium", mass: "40.078", category: "alkaline earth metal", group: 2, period: 4, description: "Essential for bones and teeth. Most abundant metal in the human body." },
  { number: 26, symbol: "Fe", name: "Iron", mass: "55.845", category: "transition metal", group: 8, period: 4, description: "Most used metal. Core of Earth. Essential for haemoglobin in blood." },
  { number: 29, symbol: "Cu", name: "Copper", mass: "63.546", category: "transition metal", group: 11, period: 4, description: "Excellent conductor. Used in wiring, plumbing, and coins." },
  { number: 30, symbol: "Zn", name: "Zinc", mass: "65.38", category: "transition metal", group: 12, period: 4, description: "Used to galvanize steel. Essential trace element for immune function." },
  { number: 35, symbol: "Br", name: "Bromine", mass: "79.904", category: "halogen", group: 17, period: 4, description: "Only liquid nonmetal at room temperature. Used in flame retardants." },
  { number: 36, symbol: "Kr", name: "Krypton", mass: "83.798", category: "noble gas", group: 18, period: 4, description: "Used in some fluorescent lamps. Named after the Greek word for 'hidden'." },
  { number: 47, symbol: "Ag", name: "Silver", mass: "107.87", category: "transition metal", group: 11, period: 5, description: "Best electrical conductor. Used in jewelry, mirrors, and antibacterials." },
  { number: 50, symbol: "Sn", name: "Tin", mass: "118.71", category: "post-transition metal", group: 14, period: 5, description: "Used in solder, bronze (with copper), and food cans." },
  { number: 53, symbol: "I", name: "Iodine", mass: "126.9", category: "halogen", group: 17, period: 5, description: "Essential for thyroid hormones. Used as antiseptic." },
  { number: 54, symbol: "Xe", name: "Xenon", mass: "131.29", category: "noble gas", group: 18, period: 5, description: "Used in flash lamps and ion propulsion engines." },
  { number: 79, symbol: "Au", name: "Gold", mass: "196.97", category: "transition metal", group: 11, period: 6, description: "Highly unreactive precious metal. Used in jewelry and electronics." },
  { number: 80, symbol: "Hg", name: "Mercury", mass: "200.59", category: "transition metal", group: 12, period: 6, description: "Only liquid metal at room temperature. Toxic. Used in thermometers." },
  { number: 82, symbol: "Pb", name: "Lead", mass: "207.2", category: "post-transition metal", group: 14, period: 6, description: "Dense, soft metal. Toxic. Used in batteries and radiation shielding." },
  { number: 86, symbol: "Rn", name: "Radon", mass: "222", category: "noble gas", group: 18, period: 6, description: "Radioactive gas. Naturally occurring from uranium decay in soil." },
  { number: 92, symbol: "U", name: "Uranium", mass: "238.03", category: "actinide", group: 3, period: 7, description: "Radioactive. Used as nuclear fuel. Heaviest naturally occurring element." },
];

export default function PeriodicTable() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Element | null>(null);

  const filtered = search
    ? ELEMENTS.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.symbol.toLowerCase().includes(search.toLowerCase()) ||
        e.number.toString() === search
      )
    : ELEMENTS;

  return (
    <div className="p-4 min-h-[500px] bg-purple-50/50 dark:bg-purple-950/20">
      <div className="flex gap-3 mb-4">
        <Input
          placeholder="Search by name, symbol, or atomic number…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <span key={cat} className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: color }}>
            {cat}
          </span>
        ))}
      </div>

      {/* Element grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5 mb-4">
        {filtered.map(el => (
          <button
            key={el.number}
            onClick={() => setSelected(selected?.number === el.number ? null : el)}
            className="rounded-lg p-1.5 text-white text-center transition-all hover:scale-110 hover:z-10 relative shadow-sm"
            style={{
              backgroundColor: CATEGORY_COLORS[el.category] ?? "#6366f1",
              opacity: selected && selected.number !== el.number ? 0.6 : 1,
              outline: selected?.number === el.number ? "2px solid white" : "none",
            }}
          >
            <div className="text-[9px] opacity-70">{el.number}</div>
            <div className="text-sm font-black leading-none">{el.symbol}</div>
            <div className="text-[8px] opacity-80 truncate">{el.name}</div>
          </button>
        ))}
      </div>

      {/* Selected element detail */}
      {selected && (
        <Card className="border-2" style={{ borderColor: CATEGORY_COLORS[selected.category] + "60" }}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-4">
              <div
                className="w-20 h-20 rounded-xl flex flex-col items-center justify-center text-white shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[selected.category] }}
              >
                <div className="text-xs opacity-70">{selected.number}</div>
                <div className="text-3xl font-black">{selected.symbol}</div>
                <div className="text-[10px] opacity-80">{selected.mass}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-black">{selected.name}</h3>
                  <Badge style={{ backgroundColor: CATEGORY_COLORS[selected.category] + "20", color: CATEGORY_COLORS[selected.category], border: `1px solid ${CATEGORY_COLORS[selected.category]}40` }}>
                    {selected.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{selected.description}</p>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Group {selected.group}</span>
                  <span>Period {selected.period}</span>
                  <span>Atomic mass: {selected.mass} u</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
