export const deviceTimeZone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; }
};

function allZones(): string[] {
  const list = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.("timeZone");
  return list && list.length ? list : [];
}

// A real list of IANA zones, so a value like "UTC+05:00" cannot be typed by mistake.
export default function TimeZonePicker({ name, defaultValue, className }: { name: string; defaultValue: string; className: string }) {
  const zones = allZones();
  if (zones.length === 0) {
    return <input className={className} name={name} required defaultValue={defaultValue} placeholder="Asia/Karachi" />;
  }
  const options = zones.includes(defaultValue) || defaultValue === "UTC" ? zones : [defaultValue, ...zones];
  return (
    <select className={className} name={name} required defaultValue={defaultValue}>
      {!options.includes("UTC") && <option value="UTC">UTC</option>}
      {options.map((zone) => <option key={zone} value={zone}>{zone.replace(/_/g, " ")}</option>)}
    </select>
  );
}
