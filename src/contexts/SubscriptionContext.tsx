import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionData {
  plan: 'trial' | 'monthly' | 'annual';
  expires_at: string;
  is_active: boolean;
  isExpired: boolean;
  timeRemaining: string;
}

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  loading: boolean;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  /** True if user has an active, non-expired subscription (trial or paid) */
  hasActiveSubscription: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const userDismissedRef = useRef(false);

  const handleSetShowUpgradeModal = (show: boolean) => {
    if (!show) {
      userDismissedRef.current = true;
    }
    setShowUpgradeModal(show);
  };

  useEffect(() => {
    if (!user || user.role === 'admin') {
      setLoading(false);
      return;
    }

    const fetchSub = async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan, expires_at, is_active')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        setLoading(false);
        return;
      }

      if (data) {
        const expiresAt = new Date(data.expires_at);
        const isExpired = expiresAt < new Date();
        const diff = expiresAt.getTime() - Date.now();

        let timeRemaining = 'Expirado';
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          timeRemaining = days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        }

        const sub: SubscriptionData = {
          plan: data.plan as SubscriptionData['plan'],
          expires_at: data.expires_at,
          is_active: data.is_active,
          isExpired,
          timeRemaining,
        };

        setSubscription(sub);

        if (isExpired && !userDismissedRef.current) {
          setShowUpgradeModal(true);
        }
      } else {
        if (!userDismissedRef.current) {
          setShowUpgradeModal(true);
        }
      }

      setLoading(false);
    };

    fetchSub();
  }, [user]);

  const hasActiveSubscription = !!subscription && !subscription.isExpired && subscription.is_active;

  return (
    <SubscriptionContext.Provider value={{ subscription, loading, showUpgradeModal, setShowUpgradeModal: handleSetShowUpgradeModal, hasActiveSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
