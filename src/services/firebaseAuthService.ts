/**
 * HomeEase Worker - Firebase Phone OTP Service Structure
 * 
 * In production, this service interfaces directly with `@react-native-firebase/auth`:
 * `import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';`
 * 
 * For this FRONTEND-ONLY architecture, it simulates real Firebase confirmation flow:
 * 1. signInWithPhoneNumber(phoneNumber) -> returns confirmationResult
 * 2. confirmationResult.confirm(verificationCode) -> returns userCredential & ID token
 */

export interface FirebasePhoneConfirmationResult {
  verificationId: string;
  phoneNumber: string;
  confirm: (code: string) => Promise<{
    user: {
      uid: string;
      phoneNumber: string;
    };
    idToken: string;
  }>;
}

class FirebaseAuthService {
  private activeVerificationId: string | null = null;
  private currentPhoneNumber: string | null = null;
  private mockValidOtp: string = '123456'; // Default test OTP

  /**
   * Request OTP for a worker's mobile number
   * Corresponds to `auth().signInWithPhoneNumber(fullPhoneNumber)`
   */
  public async signInWithPhoneNumber(
    phoneNumber: string,
    countryCode: string = '+91'
  ): Promise<FirebasePhoneConfirmationResult> {
    const fullNumber = `${countryCode}${phoneNumber.replace(/\s+/g, '')}`;
    this.currentPhoneNumber = fullNumber;
    
    // Simulate Firebase recaptcha & SMS dispatch latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    const verificationId = `v_id_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    this.activeVerificationId = verificationId;

    return {
      verificationId,
      phoneNumber: fullNumber,
      confirm: async (code: string) => {
        return this.confirmVerificationCode(code);
      },
    };
  }

  /**
   * Confirm the 6-digit OTP code entered by the worker
   */
  public async confirmVerificationCode(code: string): Promise<{
    user: {
      uid: string;
      phoneNumber: string;
    };
    idToken: string;
  }> {
    // Simulate network verification
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Support both standard test OTP and any 6-digit number in dev mode
    if (code.length !== 6) {
      throw new Error('Please enter a valid 6-digit OTP code.');
    }

    return {
      user: {
        uid: `firebase_usr_${Date.now()}`,
        phoneNumber: this.currentPhoneNumber || '',
      },
      idToken: `mock_firebase_jwt_token_${Date.now()}`,
    };
  }

  /**
   * Resend OTP code with fresh verification ID
   */
  public async resendCode(): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return true;
  }

  public getMockOtp(): string {
    return this.mockValidOtp;
  }
}

export const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;
