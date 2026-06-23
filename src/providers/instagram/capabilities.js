export const PROVIDER_CAPABILITIES = Object.freeze({
  mock: Object.freeze({
    readProfile: true,
    readPublicMedia: true,
    readComments: true,
    readInsights: true,
    publishMedia: false,
    writeActions: false,
    liveMessaging: false,
    dryRunWrites: true,
    officialApiOnly: false,
    requiresCompliantUpstream: false,
    requiresReviewedIntegration: false
  }),
  official: Object.freeze({
    readProfile: true,
    readPublicMedia: false,
    readComments: false,
    readInsights: true,
    publishMedia: false,
    writeActions: false,
    liveMessaging: false,
    dryRunWrites: false,
    officialApiOnly: true,
    requiresCompliantUpstream: false,
    requiresReviewedIntegration: false
  }),
  public: Object.freeze({
    readProfile: true,
    readPublicMedia: true,
    readComments: true,
    readInsights: false,
    publishMedia: false,
    writeActions: false,
    liveMessaging: false,
    dryRunWrites: false,
    officialApiOnly: false,
    requiresCompliantUpstream: true,
    requiresReviewedIntegration: false
  }),
  authorized: Object.freeze({
    readProfile: false,
    readPublicMedia: false,
    readComments: false,
    readInsights: false,
    publishMedia: false,
    writeActions: false,
    liveMessaging: false,
    dryRunWrites: false,
    officialApiOnly: false,
    requiresCompliantUpstream: false,
    requiresReviewedIntegration: true
  })
});

export function capabilitiesFor(providerName) {
  return PROVIDER_CAPABILITIES[providerName] || PROVIDER_CAPABILITIES.mock;
}
