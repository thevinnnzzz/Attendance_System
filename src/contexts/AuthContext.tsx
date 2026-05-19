import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../firebase';

interface User {
  id: string;
  email: string;
  role: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async (session: any) => {
      if (session?.user) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('fullname, role, email')
            .eq('auth_id', session.user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error("Error fetching user data:", error);
            setUser(null);
          } else if (data) {
            setUser({
              id: session.user.id,
              email: data.email || session.user.email || '',
              role: data.role || 'teacher',
              name: data.fullname || session.user.user_metadata?.full_name || 'User'
            });
          } else {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: 'teacher',
              name: session.user.user_metadata?.full_name || 'User'
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserData(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserData(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
