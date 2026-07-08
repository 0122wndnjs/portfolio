"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ChainData = {
  ethBlock: number | null;
  gasGwei: number | null;
};

async function rpc(url: string, method: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: [] }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.result ?? null;
  } catch {
    return null;
  }
}

function Num({ value }: { value: string }) {
  return (
    <span className="relative inline-flex overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function ChainTicker() {
  const [data, setData] = useState<ChainData>({ ethBlock: null, gasGwei: null });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const [ethBlockHex, gasHex] = await Promise.all([
        rpc("https://eth.llamarpc.com", "eth_blockNumber"),
        rpc("https://eth.llamarpc.com", "eth_gasPrice"),
      ]);
      if (!mounted) return;
      setData((prev) => ({
        ethBlock: ethBlockHex ? parseInt(ethBlockHex, 16) : prev.ethBlock,
        gasGwei: gasHex ? Number(BigInt(gasHex)) / 1e9 : prev.gasGwei,
      }));
    };

    load();
    const timer = setInterval(load, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const hasData = data.ethBlock !== null || data.gasGwei !== null;
  if (!hasData) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="hidden md:flex items-center gap-5 text-[11px] font-mono tracking-wider"
      style={{ color: "rgba(14,13,31,0.35)" }}
    >
      {data.ethBlock !== null && (
        <span className="flex items-center gap-1.5">
          <span style={{ color: "rgba(91,77,255,0.7)" }}>ETH</span>
          <Num value={`#${data.ethBlock.toLocaleString()}`} />
        </span>
      )}

      {data.gasGwei !== null && (
        <span className="flex items-center gap-1.5">
          <span style={{ color: "rgba(91,77,255,0.7)" }}>GAS</span>
          <Num value={`${data.gasGwei < 1 ? data.gasGwei.toFixed(2) : data.gasGwei.toFixed(1)} gwei`} />
        </span>
      )}
    </motion.div>
  );
}
