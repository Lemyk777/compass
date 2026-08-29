import { PlannerWindow } from "@/components/planner/PlannerWindow";
import { NextMoveCard } from "@/components/planner/NextMoveCard";
import { PlannerMaps } from "@/components/planner/PlannerMaps";

export const dynamic = "force-dynamic";

export default function PlannerPreviewPage() {
  const mockMove = {
    id: "mock_move_1",
    headline: "Expand your target list beyond the US.",
    tone: "normal" as const,
    why: "You've marked interest in Business & Economics. Given the high competition, it's safer to have backups in Europe or Asia.",
    action: { label: "Explore Global Hubs", href: "/guide/cities" },
  };

  const mockSimulation = {
    title: "Investment Banking Virtual Experience",
    provider: "J.P. Morgan",
    url: "https://www.theforage.com/virtual-internships/theme/investment-banking",
  };

  const mockPicks = [
    { ref: "work:business_economics", href: "/guide/work/business_economics", label: "Business & Economics" },
  ];

  const mockRoadmap = {
    headline: "Your Strategic Roadmap",
    subhead: "Based on your interest in Business & Economics and a 2-year runway.",
    regime: "building",
    phases: [
      {
        id: "foundation",
        rangeLabel: "Right Now (Aug - Oct)",
        name: "Foundation & Skills",
        focus: "Build a strong analytical baseline before applying to specialized competitions.",
        urgency: "now",
        actions: [
          { text: "Complete the J.P. Morgan Forage simulation", source: "profile", tag: "Simulation", urgency: "now" },
          { text: "Draft initial college list (US & UK)", source: "note", tag: "Logistics", urgency: "now" }
        ]
      },
      {
        id: "build",
        rangeLabel: "Winter (Nov - Feb)",
        name: "Competitions & Spikes",
        focus: "Test your skills against peers to build a track record.",
        urgency: "soon",
        actions: [
          { text: "FBLA National Fall Conference", source: "competition", why: "Register by Oct 15", tag: "National", urgency: "soon" },
          { text: "SAT Test Day: Dec 5", source: "sat", why: "Register by Nov 2", tag: "Last sitting before Spring", urgency: "now" }
        ]
      },
      {
        id: "run-up",
        rangeLabel: "Spring (Mar - May)",
        name: "Pre-application Run-up",
        focus: "Lock scores, finalize schools, and secure recommenders.",
        urgency: "later",
        actions: [
          { text: "Ask teachers for letters of recommendation", source: "note", tag: "Decision", urgency: "later" }
        ]
      }
    ]
  };

  return (
    <div className="bg-surface min-h-screen py-8">
      <div className="w-full max-w-[90rem] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-14 space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Advisory
        </h1>
        <PlannerWindow
          months={[]}
          overdue={[]}
          undated={[]}
          columns={{ todo: [], doing: [], done: [] }}
          droppedCount={0}
          todayISO="2026-08-28"
          picks={mockPicks as any}
          mapCount={1}
          initialView="board"
          nextMove={<NextMoveCard move={mockMove as any} simulation={mockSimulation as any} />}
          mapsLens={<PlannerMaps roadmap={mockRoadmap as any} picks={mockPicks as any} />}
        />
      </div>
    </div>
  );
}
