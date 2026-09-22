'use server';

import { loginSchema, LoginInput } from '@/server/validators/auth.schema';
import * as authService from '@/server/services/auth.service';
import { UserProfile } from '@/types/auth';
import type { User } from '@supabase/supabase-js';

export async function loginAction(
  input: LoginInput
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Input tidak valid',
    };
  }

  return authService.loginWithIdentifier(parsed.data.identifier, parsed.data.password);
}

export async function logoutAction(): Promise<void> {
  await authService.logoutUser();
}

export async function getCurrentUserAction(): Promise<{
  user: User | null;
  profile: UserProfile | null;
}> {
  return authService.getCurrentUser();
}
