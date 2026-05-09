export default function WorldMapTool() {
  return (
    <div className="w-full h-[600px] bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m2!1m1!1s0x0%3A0x0!2m2!1d0!2d0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1620000000000!5m2!1sen!2s"
        className="w-full h-full border-0"
        title="World Map"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
