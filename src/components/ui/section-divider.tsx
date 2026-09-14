export default function SectionDivider() {
  return (
    <div
      className="flex items-center gap-3 max-w-xs mx-auto py-2"
      aria-hidden="true"
    >
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D4A017]/40 to-transparent" />
      <div className="h-2 w-2 rotate-45 bg-[#D4A017]/40" />
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D4A017]/40 to-transparent" />
    </div>
  );
}
