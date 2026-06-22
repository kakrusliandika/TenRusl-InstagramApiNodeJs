export const PROVIDER_CAPABILITIES = Object.freeze({
  mock: Object.freeze({
    readProfile: true,
    readPublicMedia: true,
    readComments: true,
    readInsights: true,
    publishMedia: false,
    writeActions: false,
    liveMessaging: false,
    dryRunWrites: true
  }),
  official: Object.freeze({
    readProfile: true,
    readPublicMedia: false,
    readComments: false,
    readInsights: true,
    publishMedia: false,
    writeActions: false,
    liveMessaging: false,
    dryRunWrites: false
  }),
  public: Object.freeze({
    readProfile: true,
    readPublicMedia: true,
    readComments: true,
    readInsights: false,
    publishMedia: false,
    writeActions: false,
    liveMessaging: false,
    dryRunWrites: false
  }),
  authorized: Object.freeze({
    readProfile: false,
    readPublicMedia: false,
    readComments: false,
    readInsights: false,
    publishMedia: false,
    writeActions: false,
    liveMessaging: false,
    dryRunWrites: false
  })
});

export function capabilitiesFor(providerName) {
  return PROVIDER_CAPABILITIES[providerName] || PROVIDER_CAPABILITIES.mock;
}
