import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// In-memory token cache (as mandated by the workspace-integration guidelines)
let cachedGoogleAccessToken: string | null = null;
let googleAuthListeners: ((token: string | null) => void)[] = [];

export interface GoogleChatSpace {
  name: string; // e.g., "spaces/AAAAA123"
  displayName: string;
  type: string; // "SPACE" or "GROUP_CHAT" or "DIRECT_MESSAGE"
}

export interface GoogleChatConfig {
  newOrderSpaceId: string;
  orderReadySpaceId: string;
  paymentReminderSpaceId: string;
  broadcastSpaceId: string;
  autoNotificationsEnabled: boolean;
  connectedEmail: string | null;
}

// Subscribe to auth token changes
export const subscribeToGoogleChatAuth = (callback: (token: string | null) => void) => {
  googleAuthListeners.push(callback);
  callback(cachedGoogleAccessToken);
  return () => {
    googleAuthListeners = googleAuthListeners.filter(l => l !== callback);
  };
};

const notifyGoogleAuthListeners = (token: string | null) => {
  googleAuthListeners.forEach(listener => listener(token));
};

/**
 * Initiates standard Google login popup specifically with the Google Chat scope.
 * This links/authorizes Google Chat without replacing existing firebase configurations.
 */
export const linkGoogleChat = async (): Promise<{ accessToken: string; email: string } | null> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/chat');
    
    // We open popup for credential acquisition
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential || !credential.accessToken) {
      throw new Error('Failed to obtain Google OAuth access token.');
    }

    cachedGoogleAccessToken = credential.accessToken;
    notifyGoogleAuthListeners(cachedGoogleAccessToken);
    
    // If we have a user login, save their connection state to Firestore
    if (auth.currentUser) {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        googleChatConnected: true,
        googleChatConnectedEmail: result.user.email,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    return {
      accessToken: credential.accessToken,
      email: result.user.email || 'Connected Account'
    };
  } catch (error) {
    console.error('Error linking Google Chat:', error);
    throw error;
  }
};

/**
 * Returns cached token. If none, returns null.
 */
export const getGoogleAccessToken = (): string | null => {
  return cachedGoogleAccessToken;
};

/**
 * Remove cached token and update user doc.
 */
export const disconnectGoogleChat = async (): Promise<void> => {
  cachedGoogleAccessToken = null;
  notifyGoogleAuthListeners(null);
  
  if (auth.currentUser) {
    await setDoc(doc(db, 'users', auth.currentUser.uid), {
      googleChatConnected: false,
      googleChatConnectedEmail: null,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
};

/**
 * Fetches Google Chat spaces authorized for this user
 */
export const fetchGoogleChatSpaces = async (token: string): Promise<GoogleChatSpace[]> => {
  try {
    const response = await fetch('https://chat.googleapis.com/v1/spaces', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired
        cachedGoogleAccessToken = null;
        notifyGoogleAuthListeners(null);
        throw new Error('Google connection expired. Please reconnect.');
      }
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Failed to fetch Google Chat spaces (${response.status})`);
    }

    const data = await response.json();
    return data.spaces || [];
  } catch (error) {
    console.error('Error fetching Google Chat Spaces:', error);
    throw error;
  }
};

/**
 * Sends a message to a specific Google Chat space
 */
export const sendGoogleChatMessage = async (
  token: string,
  spaceName: string, // e.g., "spaces/AAAAA123"
  text: string
): Promise<any> => {
  try {
    // API Route is https://chat.googleapis.com/v1/{spaceName}/messages
    const response = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      if (response.status === 401) {
        cachedGoogleAccessToken = null;
        notifyGoogleAuthListeners(null);
      }
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Failed to send Google Chat message (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending Google Chat message:', error);
    throw error;
  }
};

/**
 * Saves configuration for spaces matching business event notifications
 */
export const saveGoogleChatConfig = async (userId: string, config: Partial<GoogleChatConfig>): Promise<void> => {
  await setDoc(doc(db, 'googleChatConfig', userId), config, { merge: true });
};

/**
 * Fetches configuration for user's Google Chat settings
 */
export const fetchGoogleChatConfig = async (userId: string): Promise<GoogleChatConfig> => {
  const docRef = doc(db, 'googleChatConfig', userId);
  const docSnap = await getDoc(docRef);
  
  const defaultConfig: GoogleChatConfig = {
    newOrderSpaceId: '',
    orderReadySpaceId: '',
    paymentReminderSpaceId: '',
    broadcastSpaceId: '',
    autoNotificationsEnabled: true,
    connectedEmail: null
  };

  if (docSnap.exists()) {
    return { ...defaultConfig, ...docSnap.data() } as GoogleChatConfig;
  }

  return defaultConfig;
};

/**
 * Checks for auto-notifications config and sends if active
 */
export const sendAutoWorkspaceNotification = async (
  userId: string,
  eventType: 'newOrder' | 'orderReady' | 'paymentReminder' | 'broadcast',
  message: string
): Promise<boolean> => {
  // If no token is cached, we cannot silently send.
  if (!cachedGoogleAccessToken) {
    console.log('Google Chat automatic notification skipped: No active session (token and session is in-memory).');
    return false;
  }

  try {
    const config = await fetchGoogleChatConfig(userId);
    if (!config.autoNotificationsEnabled) return false;

    let targetSpaceId = '';
    switch (eventType) {
      case 'newOrder':
        targetSpaceId = config.newOrderSpaceId;
        break;
      case 'orderReady':
        targetSpaceId = config.orderReadySpaceId;
        break;
      case 'paymentReminder':
        targetSpaceId = config.paymentReminderSpaceId;
        break;
      case 'broadcast':
        targetSpaceId = config.broadcastSpaceId;
        break;
    }

    if (!targetSpaceId) {
      return false;
    }

    await sendGoogleChatMessage(cachedGoogleAccessToken, targetSpaceId, message);
    return true;
  } catch (err) {
    console.error('Error sending auto Google Chat notification:', err);
    return false;
  }
};
