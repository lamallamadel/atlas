import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { BiometricAuth, BiometricAuthOptions } from '@capacitor/biometric';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export interface BiometricAvailability {
  available: boolean;
  biometryType?: 'fingerprint' | 'face' | 'iris' | 'none';
  strongBiometricAvailable: boolean;
}

/**
 * Service for biometric authentication on mobile devices
 * Supports Face ID, Touch ID, and Android biometrics
 */
@Injectable({
  providedIn: 'root'
})
export class NativeBiometricService {
  private readonly isNativePlatform = Capacitor.isNativePlatform();

  constructor() { }

  /**
   * Check if biometric authentication is available on the device
   */
  checkBiometricAvailability(): Observable<BiometricAvailability> {
    if (!this.isNativePlatform) {
      return of({
        available: false,
        biometryType: 'none',
        strongBiometricAvailable: false
      } as BiometricAvailability);
    }

    return from(BiometricAuth.checkBiometry()).pipe(
      map((result: any) => ({
        available: !!result.isAvailable,
        biometryType: this.mapBiometryType(result.biometryType),
        strongBiometricAvailable: !!result.strongBiometryIsAvailable
      })),
      catchError((error) => {
        console.error('Error checking biometric availability:', error);
        return of({
          available: false,
          biometryType: 'none',
          strongBiometricAvailable: false
        } as BiometricAvailability);
      })
    );
  }

  /**
   * Authenticate user with biometrics
   * @param reason - The reason for authentication (displayed to user)
   */
  authenticate(reason: string = 'Veuillez vous authentifier'): Observable<BiometricAuthResult> {
    if (!this.isNativePlatform) {
      return of({
        success: false,
        error: 'Biometric authentication not available on web'
      });
    }

    const options: BiometricAuthOptions = {
      reason,
      cancelTitle: 'Annuler',
      allowDeviceCredential: true,
      iosFallbackTitle: 'Utiliser le code',
      androidTitle: 'Authentification',
      androidSubtitle: 'Atlas Immobilier',
      androidConfirmationRequired: false,
      androidBiometryStrength: 2 // BIOMETRIC_STRONG
    };

    return from(BiometricAuth.authenticate(options)).pipe(
      map(() => ({ success: true })),
      catchError((error) => {
        console.error('Biometric authentication failed:', error);
        return of({
          success: false,
          error: this.mapErrorToMessage(error)
        });
      })
    );
  }

  /**
   * Resume authentication after app was backgrounded during biometric prompt
   */
  resumeAuthentication(): Observable<BiometricAuthResult> {
    if (!this.isNativePlatform) {
      return of({ success: false, error: 'Not available on web' });
    }

    return from(BiometricAuth.resume()).pipe(
      map(() => ({ success: true })),
      catchError((error) => of({
        success: false,
        error: this.mapErrorToMessage(error)
      }))
    );
  }

  /**
   * Check if biometric authentication is enrolled
   */
  isEnrolled(): Observable<boolean> {
    if (!this.isNativePlatform) {
      return of(false);
    }

    return from(BiometricAuth.checkBiometry()).pipe(
      map((result: any) => result.isAvailable && result.strongBiometryIsAvailable),
      catchError(() => of(false))
    );
  }

  /**
   * Map platform-specific biometry types to common types
   */
  private mapBiometryType(type: number): 'fingerprint' | 'face' | 'iris' | 'none' {
    // iOS: 1 = Touch ID, 2 = Face ID
    // Android: 1 = Fingerprint, 11 = Face, 12 = Iris
    switch (type) {
      case 1:
        return 'fingerprint';
      case 2:
      case 11:
        return 'face';
      case 12:
        return 'iris';
      default:
        return 'none';
    }
  }

  /**
   * Map error codes to user-friendly messages
   */
  private mapErrorToMessage(error: any): string {
    const errorCode = error?.code || error?.message || '';

    if (errorCode.includes('user_cancel') || errorCode.includes('USER_CANCELED')) {
      return 'Authentification annulée par l\'utilisateur';
    }

    if (errorCode.includes('not_available') || errorCode.includes('NOT_AVAILABLE')) {
      return 'L\'authentification biométrique n\'est pas disponible';
    }

    if (errorCode.includes('lockout') || errorCode.includes('LOCKOUT')) {
      return 'Trop de tentatives échouées. Veuillez réessayer plus tard.';
    }

    if (errorCode.includes('no_hardware') || errorCode.includes('NO_HARDWARE')) {
      return 'Aucun capteur biométrique détecté sur cet appareil';
    }

    if (errorCode.includes('not_enrolled') || errorCode.includes('NONE_ENROLLED')) {
      return 'Aucune donnée biométrique enregistrée sur cet appareil';
    }

    return 'Erreur d\'authentification biométrique';
  }

  /**
   * Get human-readable biometry type name
   */
  getBiometryTypeName(type: string): string {
    switch (type) {
      case 'fingerprint':
        return 'Empreinte digitale';
      case 'face':
        return 'Reconnaissance faciale';
      case 'iris':
        return 'Reconnaissance de l\'iris';
      default:
        return 'Biométrie';
    }
  }
}
