import { sendGAEvent } from "@next/third-parties/google";
import type { Format } from "./converters";

export function trackFileUploaded(format: Format, source: "drop" | "sample") {
  sendGAEvent("event", "file_uploaded", { format, source });
}

export function trackSampleLoaded(format: Format) {
  sendGAEvent("event", "sample_loaded", { format });
}

export function trackFileConverted(from: Format, to: Format) {
  sendGAEvent("event", "file_converted", {
    source_format: from,
    target_format: to,
    pair: `${from}-to-${to}`,
  });
}

export function trackConvertError(from: Format, to: Format, message: string) {
  sendGAEvent("event", "convert_error", {
    source_format: from,
    target_format: to,
    error: message.slice(0, 100),
  });
}
