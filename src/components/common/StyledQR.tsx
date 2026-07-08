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
        color: "#0e0d1f",
      },
      backgroundOptions: {
        color: "transparent",
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: "#5b4dff",
      },
      cornersDotOptions: {
        type: "dot",
        color: "#5b4dff",
      },
    });

    if (ref.current) {
      ref.current.innerHTML = "";
      qr.append(ref.current);
    }
  }, [url]);

  return <div ref={ref} />;
}
