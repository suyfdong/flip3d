import type { Format } from "./converters";

type GtagFn = (
  command: "event" | "config" | "set" | "js",
  ...args: unknown[]
) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

function track(event: string, params: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("event", event, params);
    return;
  }
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event, ...params });
  }
}

export function trackFileUploaded(
  format: string,
  source: "drop" | "sample" | "url",
) {
  // Param must NOT be named "source": gtag treats it as a campaign source and
  // overwrites session attribution (showed up in GA4 as source "drop" / (not set)).
  track("file_uploaded", { format, input_method: source });
}

export function trackSampleLoaded(format: string) {
  track("sample_loaded", { format });
}

export function trackFileConverted(from: Format, to: Format) {
  track("file_converted", {
    source_format: from,
    target_format: to,
    pair: `${from}-to-${to}`,
  });
}

// `from`/`to` are free strings so image/svg/dxf/gcode tools can label errors
// honestly (they used to all report "stl" → "stl", which made the
// source_format breakdown in GA4 useless).
export function trackConvertError(from: string, to: string, message: string) {
  track("convert_error", {
    source_format: from,
    target_format: to,
    pair: `${from}-to-${to}`,
    error: message.slice(0, 100),
  });
}

export function trackImageConverted(
  sourceExt: string,
  mode: "relief" | "lithophane",
) {
  track("file_converted", {
    source_format: sourceExt,
    target_format: "stl",
    pair: `${sourceExt}-to-stl`,
    image_mode: mode,
  });
}

export function trackSvgConverted() {
  track("file_converted", {
    source_format: "svg",
    target_format: "stl",
    pair: "svg-to-stl",
  });
}

export function trackRendered(sourceExt: string, imageFormat: string) {
  track("file_converted", {
    source_format: sourceExt,
    target_format: imageFormat,
    pair: `${sourceExt}-to-${imageFormat}`,
  });
}
