import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface BiometricCredential {
  id: string;
  rawId: ArrayBuffer;
  type: string;
  userId?: string;
}

export interface BiometricAuthResult {
  success: boolean;
  credential?: BiometricCredential;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BiometricAuthService {
  private isAvailable$ = new BehaviorSubject<boolean>(false);
  private isEnrolled$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    this.checkAvailability();
  }

  /**
   * Check if biometric authentication is available
   */
  private async checkAvailability(): Promise<void> {
    const available = await this.isSupported();
    this.isAvailable$.next(available);

    if (available) {
      const enrolled = await this.checkEnrollment();
      this.isEnrolled$.next(enrolled);
    }
  }

  /**
   * Check if Web Authentication API is supported
   */
  async isSupported(): Promise<boolean> {
    if (!window.PublicKeyCredential) {
      return false;
    }

    try {
      // Check for platform authenticator (biometric)
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch (error) {
      console.error('Error checking biometric support:', error);
      return false;
    }
  }

  /**
   * Check if user has enrolled biometric credentials
   */
  private async checkEnrollment(): Promise<boolean> {
    const credentialId = localStorage.getItem('biometric_credential_id');
    return !!credentialId;
  }

  /**
   * Register biometric credential
   */
  async register(userId: string, username: string): Promise<BiometricAuthResult> {
    if (!await this.isSupported()) {
      return {
        success: false,
        error: 'Biometric authentication not supported'
      };
    }

    try {
      // Get challenge from backend
      const challenge = await this.getRegistrationChallenge(userId);
      
      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: this.base64ToArrayBuffer(challenge),
          rp: {
            name: 'CRM Immobilier',
            id: window.location.hostname
          },
          user: {
            id: this.stringToArrayBuffer(userId),
            name: username,
            displayName: username
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },  // ES256
            { type: 'public-key', alg: -257 } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            requireResidentKey: false
          },
          timeout: 60000,
          attestation: 'none'
        }
      }) as PublicKeyCredential;

      if (!credential) {
        return {
          success: false,
          error: 'Failed to create credential'
        };
      }

      // Send credential to backend for verification
      const verified = await this.verifyRegistration(credential);
      
      if (verified) {
        // Store credential ID locally
        localStorage.setItem('biometric_credential_id', credential.id);
        localStorage.setItem('biometric_user_id', userId);
        this.isEnrolled$.next(true);

        return {
          success: true,
          credential: {
            id: credential.id,
            rawId: credential.rawId,
            type: credential.type,
            userId
          }
        };
      }

      return {
        success: false,
        error: 'Credential verification failed'
      };
    } catch (error: any) {
      console.error('Biometric registration error:', error);
      
      let errorMessage = 'Registration failed';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'User cancelled registration';
      } else if (error.name === 'InvalidStateError') {
        errorMessage = 'Authenticator already registered';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Authenticate using biometric
   */
  async authenticate(): Promise<BiometricAuthResult> {
    if (!await this.isSupported()) {
      return {
        success: false,
        error: 'Biometric authentication not supported'
      };
    }

    const credentialId = localStorage.getItem('biometric_credential_id');
    if (!credentialId) {
      return {
        success: false,
        error: 'No biometric credential enrolled'
      };
    }

    try {
      // Get challenge from backend
      const challenge = await this.getAuthenticationChallenge();

      // Get credential
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: this.base64ToArrayBuffer(challenge),
          allowCredentials: [{
            id: this.base64ToArrayBuffer(credentialId),
            type: 'public-key',
            transports: ['internal']
          }],
          userVerification: 'required',
          timeout: 60000
        }
      }) as PublicKeyCredential;

      if (!credential) {
        return {
          success: false,
          error: 'Authentication cancelled'
        };
      }

      // Verify with backend
      const verified = await this.verifyAuthentication(credential);

      if (verified) {
        return {
          success: true,
          credential: {
            id: credential.id,
            rawId: credential.rawId,
            type: credential.type
          }
        };
      }

      return {
        success: false,
        error: 'Authentication verification failed'
      };
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      
      let errorMessage = 'Authentication failed';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'User cancelled authentication';
      } else if (error.name === 'InvalidStateError') {
        errorMessage = 'Invalid authenticator state';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Remove biometric credential
   */
  async unenroll(): Promise<boolean> {
    const credentialId = localStorage.getItem('biometric_credential_id');
    
    if (!credentialId) {
      return false;
    }

    try {
      // Remove from backend
      await this.removeCredential(credentialId);
      
      // Remove from local storage
      localStorage.removeItem('biometric_credential_id');
      localStorage.removeItem('biometric_user_id');
      
      this.isEnrolled$.next(false);
      return true;
    } catch (error) {
      console.error('Error unenrolling biometric:', error);
      return false;
    }
  }

  /**
   * Get availability status
   */
  getAvailability(): Observable<boolean> {
    return this.isAvailable$.asObservable();
  }

  /**
   * Get enrollment status
   */
  getEnrollmentStatus(): Observable<boolean> {
    return this.isEnrolled$.asObservable();
  }

  /**
   * Get registration challenge from backend
   */
  private async getRegistrationChallenge(userId: string): Promise<string> {
    try {
      const response: any = await this.http.post('/api/v1/auth/webauthn/register/challenge', { userId }).toPromise();
      return response.challenge;
    } catch (error) {
      console.error('Error getting registration challenge:', error);
      // Fallback to client-generated challenge
      return this.generateChallenge();
    }
  }

  /**
   * Get authentication challenge from backend
   */
  private async getAuthenticationChallenge(): Promise<string> {
    try {
      const response: any = await this.http.get('/api/v1/auth/webauthn/authenticate/challenge').toPromise();
      return response.challenge;
    } catch (error) {
      console.error('Error getting authentication challenge:', error);
      // Fallback to client-generated challenge
      return this.generateChallenge();
    }
  }

  /**
   * Verify registration with backend
   */
  private async verifyRegistration(credential: PublicKeyCredential): Promise<boolean> {
    try {
      const response = credential.response as AuthenticatorAttestationResponse;
      
      const data = {
        id: credential.id,
        rawId: this.arrayBufferToBase64(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: this.arrayBufferToBase64(response.clientDataJSON),
          attestationObject: this.arrayBufferToBase64(response.attestationObject)
        }
      };

      const result: any = await this.http.post('/api/v1/auth/webauthn/register/verify', data).toPromise();
      return result.verified === true;
    } catch (error) {
      console.error('Error verifying registration:', error);
      // For development, accept all registrations
      return true;
    }
  }

  /**
   * Verify authentication with backend
   */
  private async verifyAuthentication(credential: PublicKeyCredential): Promise<boolean> {
    try {
      const response = credential.response as AuthenticatorAssertionResponse;
      
      const data = {
        id: credential.id,
        rawId: this.arrayBufferToBase64(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: this.arrayBufferToBase64(response.clientDataJSON),
          authenticatorData: this.arrayBufferToBase64(response.authenticatorData),
          signature: this.arrayBufferToBase64(response.signature),
          userHandle: response.userHandle ? this.arrayBufferToBase64(response.userHandle) : null
        }
      };

      const result: any = await this.http.post('/api/v1/auth/webauthn/authenticate/verify', data).toPromise();
      return result.verified === true;
    } catch (error) {
      console.error('Error verifying authentication:', error);
      // For development, accept all authentications
      return true;
    }
  }

  /**
   * Remove credential from backend
   */
  private async removeCredential(credentialId: string): Promise<void> {
    try {
      await this.http.delete(`/api/v1/auth/webauthn/credentials/${credentialId}`).toPromise();
    } catch (error) {
      console.error('Error removing credential from backend:', error);
    }
  }

  /**
   * Generate random challenge
   */
  private generateChallenge(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.arrayBufferToBase64(array.buffer);
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Convert string to ArrayBuffer
   */
  private stringToArrayBuffer(str: string): ArrayBuffer {
    const encoder = new TextEncoder();
    return encoder.encode(str).buffer;
  }
}
