import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

type Props = {
  url: string;
};

export default function StyledQR({ url }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const qr = new QRCodeStyling({
      width: 180,
      height: 180,
      data: url,
      dotsOptions: {
        type: "rounded", // ← 둥근 점
        color: "#60a5fa",
      },
      backgroundOptions: {
        color: "transparent",
      },
      cornersSquareOptions: {
        type: "extra-rounded", // 모서리 스타일
        color: "#a855f7",
      },
      cornersDotOptions: {
        type: "dot",
        color: "#22d3ee",
      },
    });

    if (ref.current) {
      ref.current.innerHTML = "";
      qr.append(ref.current);
    }
  }, [url]);

  return <div ref={ref} />;
}
