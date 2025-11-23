// Google Analytics 4 tracking utilities

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

// Track page views
export const trackPageView = (url: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: url,
    });
  }
};

// Track custom events
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
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
