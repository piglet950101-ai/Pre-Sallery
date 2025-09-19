import { supabase } from '@/lib/supabase';

export interface VerificationRequest {
  userId: string;
  employeeId: string;
  type: 'email' | 'phone' | 'password_reset' | 'profile_change';
  contactInfo: string;
  expiryMinutes?: number;
}

export interface VerificationResult {
  success: boolean;
  code?: string;
  error?: string;
  attemptsRemaining?: number;
}

export interface VerifyCodeRequest {
  userId: string;
  code: string;
  type: 'email' | 'phone' | 'password_reset' | 'profile_change';
}

class VerificationService {
  private readonly RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_ATTEMPTS_PER_WINDOW = 5;
  private readonly MAX_ATTEMPTS_PER_CODE = 3;

  /**
   * Generate and send verification code
   */
  async generateVerificationCode(request: VerificationRequest): Promise<VerificationResult> {
    try {
      // Check rate limiting
      const rateLimitCheck = await this.checkRateLimit(request.userId, request.type);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          error: `Rate limit exceeded. Please wait ${Math.ceil(rateLimitCheck.retryAfter / 60000)} minutes before trying again.`,
          attemptsRemaining: 0
        };
      }

      // Generate code using Supabase function
      const { data, error } = await supabase.rpc('generate_verification_code', {
        p_user_id: request.userId,
        p_employee_id: request.employeeId,
        p_type: request.type,
        p_contact_info: request.contactInfo,
        p_expiry_minutes: request.expiryMinutes || 15
      });

      if (error) {
        console.error('Error generating verification code:', error);
        return {
          success: false,
          error: 'Failed to generate verification code'
        };
      }

      // Send the code via appropriate channel
      const sendResult = await this.sendVerificationCode(request.contactInfo, data, request.type);
      
      if (!sendResult.success) {
        return {
          success: false,
          error: sendResult.error || 'Failed to send verification code'
        };
      }

      return {
        success: true,
        code: data // For demo purposes, return the code
      };

    } catch (error) {
      console.error('Verification service error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }

  /**
   * Verify a code
   */
  async verifyCode(request: VerifyCodeRequest): Promise<VerificationResult> {
    try {
      const { data, error } = await supabase.rpc('verify_code', {
        p_user_id: request.userId,
        p_code: request.code,
        p_type: request.type
      });

      if (error) {
        console.error('Error verifying code:', error);
        return {
          success: false,
          error: 'Failed to verify code'
        };
      }

      if (!data) {
        // Get remaining attempts
        const { data: attemptsData } = await supabase
          .from('verification_codes')
          .select('attempts, max_attempts')
          .eq('user_id', request.userId)
          .eq('type', request.type)
          .is('used_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const attemptsRemaining = attemptsData 
          ? Math.max(0, attemptsData.max_attempts - attemptsData.attempts - 1)
          : 0;

        return {
          success: false,
          error: 'Invalid or expired verification code',
          attemptsRemaining
        };
      }

      return {
        success: true
      };

    } catch (error) {
      console.error('Verification service error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(userId: string, type: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    try {
      const windowStart = new Date(Date.now() - this.RATE_LIMIT_WINDOW);
      
      const { data, error } = await supabase
        .from('verification_codes')
        .select('created_at')
        .eq('user_id', userId)
        .eq('type', type)
        .gte('created_at', windowStart.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Rate limit check error:', error);
        return { allowed: true }; // Allow on error
      }

      const attemptsInWindow = data?.length || 0;
      
      if (attemptsInWindow >= this.MAX_ATTEMPTS_PER_WINDOW) {
        const oldestAttempt = data?.[data.length - 1];
        const retryAfter = oldestAttempt 
          ? this.RATE_LIMIT_WINDOW - (Date.now() - new Date(oldestAttempt.created_at).getTime())
          : this.RATE_LIMIT_WINDOW;
        
        return { allowed: false, retryAfter };
      }

      return { allowed: true };

    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true }; // Allow on error
    }
  }

  /**
   * Send verification code via appropriate channel
   */
  private async sendVerificationCode(contactInfo: string, code: string, type: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (type === 'email') {
        return await this.sendEmailVerification(contactInfo, code);
      } else if (type === 'phone') {
        return await this.sendSMSVerification(contactInfo, code);
      } else {
        return { success: true }; // For other types, just return success
      }
    } catch (error) {
      console.error('Send verification error:', error);
      return { success: false, error: 'Failed to send verification code' };
    }
  }

  /**
   * Send email verification (using Supabase Edge Functions or external service)
   */
  private async sendEmailVerification(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Option 1: Use Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-verification-email', {
        body: {
          email,
          code,
          type: 'profile_verification'
        }
      });

      if (error) {
        console.error('Email sending error:', error);
        return { success: false, error: 'Failed to send email' };
      }

      return { success: true };

    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: 'Failed to send email' };
    }
  }

  /**
   * Send SMS verification (using external service like Twilio)
   */
  private async sendSMSVerification(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Option 1: Use Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-verification-sms', {
        body: {
          phone,
          code,
          type: 'profile_verification'
        }
      });

      if (error) {
        console.error('SMS sending error:', error);
        return { success: false, error: 'Failed to send SMS' };
      }

      return { success: true };

    } catch (error) {
      console.error('SMS sending error:', error);
      return { success: false, error: 'Failed to send SMS' };
    }
  }

  /**
   * Clean up expired codes
   */
  async cleanupExpiredCodes(): Promise<void> {
    try {
      await supabase.rpc('cleanup_expired_verification_codes');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * Get verification attempts for a user
   */
  async getVerificationAttempts(userId: string, type: string): Promise<{ attempts: number; maxAttempts: number; remaining: number }> {
    try {
      const { data, error } = await supabase
        .from('verification_codes')
        .select('attempts, max_attempts')
        .eq('user_id', userId)
        .eq('type', type)
        .is('used_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return { attempts: 0, maxAttempts: this.MAX_ATTEMPTS_PER_CODE, remaining: this.MAX_ATTEMPTS_PER_CODE };
      }

      return {
        attempts: data.attempts,
        maxAttempts: data.max_attempts,
        remaining: Math.max(0, data.max_attempts - data.attempts)
      };

    } catch (error) {
      console.error('Get attempts error:', error);
      return { attempts: 0, maxAttempts: this.MAX_ATTEMPTS_PER_CODE, remaining: this.MAX_ATTEMPTS_PER_CODE };
    }
  }
}

export const verificationService = new VerificationService();
