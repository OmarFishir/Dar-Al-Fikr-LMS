export default function GeoGebraEmbed() {
  return (
    <div className="w-full h-[600px] bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
      <iframe
        src="https://www.geogebra.org/graphing?lang=en"
        className="w-full h-full border-0"
        title="GeoGebra Graphing Calculator"
        allow="fullscreen"
      />
    </div>
  );
}
