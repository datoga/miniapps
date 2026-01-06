"use client";

import { useTranslations } from "next-intl";
import { memo } from "react";
import type { RecordingInfo } from "@/lib/useRecorder";

interface RecordingInfoTooltipProps {
  info: RecordingInfo;
  isMicEnabled: boolean;
  onClose?: () => void;
}

export const RecordingInfoTooltip = memo(function RecordingInfoTooltip({
  info,
  isMicEnabled,
}: RecordingInfoTooltipProps) {
  const t = useTranslations();

  return (
    <div
      className="absolute right-0 top-10 min-w-64 max-w-md whitespace-nowrap rounded-xl bg-black/90 p-4 text-xs text-white shadow-xl backdrop-blur-md"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="space-y-2">
        <InfoRow label={t("overlay.infoFolder")} value={info.folderName} />
        <InfoRow label={t("overlay.infoFilename")} value={info.filename} />
        
        <div className="flex items-baseline gap-2 border-t border-white/20 pt-2">
          <span className="shrink-0 text-white/60">{t("overlay.infoFormat")}</span>
          <span className="font-mono text-white/90">{info.mimeType}</span>
        </div>
        
        <div className="flex items-baseline gap-4">
          <InfoRow 
            label={t("overlay.infoResolution")} 
            value={`${info.width}×${info.height}`} 
            inline 
          />
          <InfoRow label={t("overlay.infoFps")} value={String(info.fps)} inline />
          <InfoRow 
            label={t("overlay.infoBitrate")} 
            value={`${info.bitrateMbps} Mbps`} 
            inline 
          />
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className="shrink-0 text-white/60">{t("overlay.infoAudio")}</span>
          <span className="font-mono text-white/90">
            {isMicEnabled ? "✓ ON" : "✗ OFF"}
            {isMicEnabled && info.audioCodec && (
              <span className="ml-2 text-white/60">
                {info.audioCodec.toUpperCase()}
                {info.audioSampleRate && ` · ${Math.round(info.audioSampleRate / 1000)}kHz`}
                {info.audioChannels && ` · ${info.audioChannels}ch`}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
});

// Helper component for info rows
const InfoRow = memo(function InfoRow({ 
  label, 
  value,
  inline = false,
}: { 
  label: string; 
  value: string;
  inline?: boolean;
}) {
  return (
    <div className={`flex items-baseline gap-2 ${inline ? "" : ""}`}>
      <span className={`${inline ? "" : "shrink-0"} text-white/60`}>{label}</span>
      <span className="font-mono text-white/90">{value}</span>
    </div>
  );
});

