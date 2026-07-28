// Client-side analytics: GA4 via gtag + GTM dataLayer events for Meta (pixel fired in GTM)

type AnalyticsParams = Record<string, unknown>;
type DataLayerEvent = Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: AnalyticsParams
    ) => void;
    dataLayer?: DataLayerEvent[];
  }
}

function pushDataLayer(event: DataLayerEvent): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

function createClientEventId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}.${crypto.randomUUID()}`;
  }
  return `${prefix}.${Date.now()}`;
}

export type MetaLeadEventParams = {
  leadType: "contact_form" | "enrollment_form";
  eventId?: string;
  interest?: string;
  numberOfChildren?: number;
  languagePreference?: string;
};

/** Push a GTM dataLayer Lead event for Meta (no PII). GTM maps this to Meta Pixel Lead. */
export function pushMetaLeadEvent(params: MetaLeadEventParams): void {
  pushDataLayer({
    event: "meta_lead",
    event_id: params.eventId,
    lead_type: params.leadType,
    ...(params.interest ? { interest: params.interest } : {}),
    ...(params.numberOfChildren != null
      ? { number_of_children: params.numberOfChildren }
      : {}),
    ...(params.languagePreference
      ? { language_preference: params.languagePreference }
      : {}),
    page_path: window.location.pathname,
  });
}

export type MetaContactEventParams = {
  linkLocation: string;
  eventId?: string;
};

/** Push a GTM dataLayer Contact event for Meta tel: clicks (no PII). GTM maps this to Meta Pixel Contact. */
export function pushMetaContactEvent(params: MetaContactEventParams): void {
  pushDataLayer({
    event: "meta_contact",
    event_id: params.eventId ?? createClientEventId("phone"),
    contact_method: "phone",
    link_location: params.linkLocation,
    page_path: window.location.pathname,
  });
}

/** Track a phone link click without blocking navigation to tel:. */
export function trackPhoneLinkClick(linkLocation: string): void {
  pushMetaContactEvent({ linkLocation });
}

/** Safe onClick handler for tel: anchors in shared components. */
export function handlePhoneLinkClick(linkLocation: string): () => void {
  return () => {
    trackPhoneLinkClick(linkLocation);
  };
}

// Track page views
export const trackPageView = (url: string) => {
  if (typeof window.gtag !== "undefined") {
    window.gtag("config", "G-CHVPLXV45M", {
      page_path: url,
    });
  }
};

// Track custom events
export const trackEvent = (
  eventName: string,
  eventParams?: AnalyticsParams
) => {
  if (typeof window.gtag !== "undefined") {
    window.gtag("event", eventName, eventParams);
  }
};

// Track enrollment form submission (conversion)
export const trackEnrollmentSubmission = (data: {
  numberOfChildren: number;
  languagePreference: string;
  submissionId?: string;
}) => {
  trackEvent("enrollment_form_submit", {
    event_category: "engagement",
    event_label: "enrollment_form",
    value: data.numberOfChildren,
    number_of_children: data.numberOfChildren,
    language_preference: data.languagePreference,
  });

  trackEvent("conversion", {
    send_to: "AW-CONVERSION_ID/CONVERSION_LABEL",
    event_category: "conversion",
    event_label: "enrollment_lead",
    value: 1,
  });

  pushMetaLeadEvent({
    leadType: "enrollment_form",
    eventId: data.submissionId,
    numberOfChildren: data.numberOfChildren,
    languagePreference: data.languagePreference,
  });
};

// Track contact / visit request form submission
export const trackContactSubmission = (data: {
  interest: string;
  submissionId?: string;
}) => {
  trackEvent("contact_form_submit", {
    event_category: "engagement",
    event_label: "contact_form",
    interest: data.interest,
  });

  trackEvent("conversion", {
    send_to: "AW-CONVERSION_ID/CONVERSION_LABEL",
    event_category: "conversion",
    event_label: "contact_lead",
    value: 1,
  });

  pushMetaLeadEvent({
    leadType: "contact_form",
    eventId: data.submissionId,
    interest: data.interest,
  });
};

// Track form field interactions
export const trackFormInteraction = (fieldName: string) => {
  trackEvent("form_interaction", {
    event_category: "form",
    event_label: fieldName,
  });
};

// Track CTA clicks
export const trackCTAClick = (ctaName: string, ctaLocation: string) => {
  trackEvent("cta_click", {
    event_category: "engagement",
    event_label: ctaName,
    cta_location: ctaLocation,
  });
};
