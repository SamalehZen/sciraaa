// Better Auth removed. Provide minimal stubs to avoid build-time errors.
export const signIn = {
  social: async () => {
    // No-op: social sign-in disabled

    return Promise.resolve();
  },
} as any;

type SignOutOptions = {
  fetchOptions?: {
    onRequest?: () => void;
    onSuccess?: () => void;
    onError?: (error?: unknown) => void;
  };
};

export const signOut = async (options?: SignOutOptions): Promise<void> => {
  options?.fetchOptions?.onRequest?.();

  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to sign out');
    }

    options?.fetchOptions?.onSuccess?.();
  } catch (error) {
    options?.fetchOptions?.onError?.(error);
    throw error;
  }
};
export const signUp = async () => {
  throw new Error('Sign up disabled');
};

export const useSession = () => ({ data: null, isPending: false } as any);
