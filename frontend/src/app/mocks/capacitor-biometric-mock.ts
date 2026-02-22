export const BiometricAuth = {
    checkBiometry: async () => ({ isAvailable: true, biometryType: 'fingerprint' }),
    authenticate: async () => ({ hasVerified: true })
};
export type BiometricAuthOptions = any;
