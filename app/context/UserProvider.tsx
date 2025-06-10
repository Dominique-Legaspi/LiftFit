import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface UserContextType {
    user: User | null
    session: Session | null
    loading: boolean
};

const UserContext = createContext<UserContextType>({
    user: null,
    session: null,
    loading: true,
});

type Props = {
    children: ReactNode
};

export function UserProvider ({ children }: Props) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        let mounted = true;

        async function getSession() {
            if (!mounted) return;

            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error('Error getting session:', error);
            }
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        }

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        }
    }, []);

    return (
        <UserContext.Provider
            value={{
                user,
                session,
                loading,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

export function useUser() {
    return useContext(UserContext);
}