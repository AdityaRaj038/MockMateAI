import logo from "@/assets/logo.png";

export function Watermark() {
  return (
    <img
      src={logo}
      alt=""
      className="
        h-[42vh]
        w-[42vh]
        max-h-[420px]
        max-w-[420px]
        opacity-10
        blur-[2px]
        select-none
      "
      draggable={false}
    />
  );
}