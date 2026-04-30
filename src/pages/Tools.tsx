import { AppShell } from "@/components/console/AppShell";
import { TapTempo } from "@/components/console/TapTempo";
import { PhaseCalc } from "@/components/console/PhaseCalc";
import { FrequencyGuide } from "@/components/console/FrequencyGuide";

const Tools = () => {
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
        <div className="label-mono mb-3">// utilities</div>
        <h1 className="font-display text-4xl font-bold tracking-tight mb-2">Tools<span className="text-primary">.</span></h1>
        <p className="text-muted-foreground mb-8">Quick calculators and references for the control room.</p>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <TapTempo />
          <div className="lg:col-span-2"><PhaseCalc /></div>
        </div>
        <FrequencyGuide />
      </div>
    </AppShell>
  );
};

export default Tools;
