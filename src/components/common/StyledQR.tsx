"use client";

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
        type: "rounded",
        color: "#0F0E0C",
      },
      backgroundOptions: {
        color: "transparent",
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: "#0F0E0C",
      },
      cornersDotOptions: {
        type: "dot",
        color: "#0F0E0C",
      },
    });

    if (ref.current) {
      ref.current.innerHTML = "";
      qr.append(ref.current);
    }
  }, [url]);

  return <div ref={ref} />;
}
