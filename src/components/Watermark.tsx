import logo from "@/assets/logo.png";

export function Watermark() {
  return (
    <img
      src={logo}
      alt=""
      className="
        pointer-events-none
        absolute
        left-1/2
        top-1/2
        z-0
        h-[30vh]
        w-[30vh]
        max-h-[280px]
        max-w-[280px]
        -translate-x-1/2
        -translate-y-1/2
        opacity-10
        blur-[2px]
        select-none
      "
      draggable={false}
    />
  );
}
