import logo from "@/assets/logo.png";

export function Watermark() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
      <img
        src={logo}
        alt=""
        className="h-[40vh] w-[40vh] max-h-[400px] max-w-[400px] opacity-[0.03] select-none"
        draggable={false}
      />
    </div>
  );
}
