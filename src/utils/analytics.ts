// Google Analytics 4 tracking utilities

type AnalyticsParams = Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: AnalyticsParams
    ) => void;
    dataLayer?: unknown[];
  }
}

// Track page views
export const trackPageView = (url: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', 'G-CHVPLXV45M', {
      page_path: url,
    });
  }
};

// Track custom events
export const trackEvent = (
  eventName: string,
  eventParams?: AnalyticsParams
) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, eventParams);
  }
};

// Track enrollment form submission (conversion)
export const trackEnrollmentSubmission = (data: {
  parentName: string;
  email: string;
  numberOfChildren: number;
  childAges: string[];
  languagePreference: string;
}) => {
  trackEvent('enrollment_form_submit', {
    event_category: 'engagement',
    event_label: 'enrollment_form',
    value: data.numberOfChildren,
    number_of_children: data.numberOfChildren,
    language_preference: data.languagePreference,
  });

  // Track as conversion
  trackEvent('conversion', {
    send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL', // User will replace with their conversion ID
    event_category: 'conversion',
    event_label: 'enrollment_lead',
    value: 1,
  });
};

// Track contact / visit request form submission
export const trackContactSubmission = (data: {
  parentName: string;
  email: string;
  interest: string;
}) => {
  trackEvent('contact_form_submit', {
    event_category: 'engagement',
    event_label: 'contact_form',
    interest: data.interest,
  });

  trackEvent('conversion', {
    send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',
    event_category: 'conversion',
    event_label: 'contact_lead',
    value: 1,
  });
};

// Track form field interactions
export const trackFormInteraction = (fieldName: string) => {
  trackEvent('form_interaction', {
    event_category: 'form',
    event_label: fieldName,
  });
};

// Track CTA clicks
export const trackCTAClick = (ctaName: string, ctaLocation: string) => {
  trackEvent('cta_click', {
    event_category: 'engagement',
    event_label: ctaName,
    cta_location: ctaLocation,
  });
};
