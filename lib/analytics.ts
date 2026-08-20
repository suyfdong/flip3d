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

export function trackFileUploaded(format: Format, source: "drop" | "sample") {
  track("file_uploaded", { format, source });
}

export function trackSampleLoaded(format: Format) {
  track("sample_loaded", { format });
}

export function trackFileConverted(from: Format, to: Format) {
  track("file_converted", {
    source_format: from,
    target_format: to,
    pair: `${from}-to-${to}`,
  });
}

export function trackConvertError(from: Format, to: Format, message: string) {
  track("convert_error", {
    source_format: from,
    target_format: to,
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
