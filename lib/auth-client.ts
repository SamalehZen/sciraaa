// Better Auth removed. Provide minimal stubs to avoid build-time errors.
export const signIn = {
  social: async () => {
    throw new Error('Social sign-in disabled');
  },
} as any;

export const signOut = async () => {};
export const signUp = async () => {
  throw new Error('Sign up disabled');
};

export const useSession = () => ({ data: null, isPending: false } as any);
