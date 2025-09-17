import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue>({ user: null, session: null, isLoading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ user, session, isLoading }), [user, session, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export const getUserRole = (user: User | null): string | null => {
  if (!user) return null;
  return (user.app_metadata as any)?.role ?? (user.user_metadata as any)?.role ?? null;
};

// // Function to get the actual user role from database (more reliable)
// export const getActualUserRole = async (userId: string): Promise<string | null> => {
//   try {
    
//     // First try to get role from user_roles table (most secure)
//     const { data: userRoleData, error: userRoleError } = await supabase
//     .from('user_roles')
//     .select('role')
//     .eq('user_id', userId)
//     .single();
    
//     console.log("///////////// userRoleData", userRoleError);


//     // If table doesn't exist (404 error), skip database query
//     if (userRoleError && userRoleError.code === 'PGRST116') {
//       console.log('user_roles table not found, using metadata fallback');
//       // Fallback to user metadata
//       const { data: userData, error: userError } = await supabase.auth.getUser();
//       if (userError || !userData.user) {
//         return null;
//       }
//       return (userData.user.app_metadata as any)?.role ?? (userData.user.user_metadata as any)?.role ?? null;
//     }

//     if (!userRoleError && userRoleData) {
//       return userRoleData[0].role;
//     }

//     // Fallback to user metadata
//     const { data: userData, error: userError } = await supabase.auth.getUser();
//     if (userError || !userData.user) {
//       return null;
//     }

//     return (userData.user.app_metadata as any)?.role ?? (userData.user.user_metadata as any)?.role ?? null;
//   } catch (error) {
//     console.error('Error getting actual user role:', error);
//     // Fallback to metadata only
//     try {
//       const { data: userData, error: userError } = await supabase.auth.getUser();
//       if (userError || !userData.user) {
//         return null;
//       }
//       return (userData.user.app_metadata as any)?.role ?? (userData.user.user_metadata as any)?.role ?? null;
//     } catch (fallbackError) {
//       console.error('Fallback error getting user role:', fallbackError);
//       return null;
//     }
//   }
// };


// Function to get the actual user role from database (more reliable)
export const getActualUserRole = async (userId: string): Promise<string | null> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return null;
    }
    return (userData.user.app_metadata as any)?.role ?? (userData.user.user_metadata as any)?.role ?? null;
  } catch (fallbackError) {
    console.error('Fallback error getting user role:', fallbackError);
    return null;
  }
};

