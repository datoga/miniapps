"use client";

import type { GoogleProfile, GISTokenResponse } from "./types";

// Default Drive scope for appDataFolder access
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const PROFILE_SCOPES =
  "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email";

// Type for Google Identity Services on window
interface GoogleWindow extends Window {
  google?: {
    accounts: {
      oauth2: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          prompt?: string;
          callback: (response: GISTokenResponse) => void;
          error_callback?: (error: { type: string; message?: string }) => void;
        }) => { requestAccessToken: (options?: { prompt?: string }) => void };
      };
    };
  };
}

// Storage keys
const STORAGE_KEY_TOKEN = "gis_access_token";
const STORAGE_KEY_TOKEN_EXPIRY = "gis_token_expiry";
const STORAGE_KEY_PROFILE = "gis_profile";

// In-memory cache (loaded from localStorage on first access)
let currentAccessToken: string | null = null;
let tokenExpiry: number | null = null;
let currentProfile: GoogleProfile | null = null;
let gisLoaded = false;
let storageLoaded = false;

/**
 * Load auth state from localStorage
 */
function loadFromStorage(): void {
  if (storageLoaded || typeof window === "undefined") return;
  storageLoaded = true;

  try {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const expiry = localStorage.getItem(STORAGE_KEY_TOKEN_EXPIRY);
    const profile = localStorage.getItem(STORAGE_KEY_PROFILE);

    console.log("[GIS] Loading from storage:", {
      hasToken: !!token,
      hasExpiry: !!expiry,
      hasProfile: !!profile
    });

    if (token && expiry) {
      const expiryTime = parseInt(expiry, 10);
      const timeUntilExpiry = expiryTime - Date.now();
      console.log("[GIS] Token expiry check:", {
        expiresIn: Math.round(timeUntilExpiry / 1000 / 60) + " minutes"
      });

      // Check if token is still valid (with 5 min buffer)
      if (Date.now() < expiryTime - 5 * 60 * 1000) {
        currentAccessToken = token;
        tokenExpiry = expiryTime;
        console.log("[GIS] Token loaded successfully");
      } else {
        // Token expired, clear it
        console.log("[GIS] Token expired, clearing");
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY);
      }
    }

    if (profile) {
      currentProfile = JSON.parse(profile);
      console.log("[GIS] Profile loaded:", currentProfile?.name || currentProfile?.email);
    }
  } catch (error) {
    console.warn("Failed to load auth from storage:", error);
  }
}

/**
 * Save auth state to localStorage
 */
function saveToStorage(): void {
  if (typeof window === "undefined") return;

  try {
    if (currentAccessToken && tokenExpiry) {
      localStorage.setItem(STORAGE_KEY_TOKEN, currentAccessToken);
      localStorage.setItem(STORAGE_KEY_TOKEN_EXPIRY, tokenExpiry.toString());
      console.log("[GIS] Token saved to storage");
    } else {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY);
    }

    if (currentProfile) {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(currentProfile));
      console.log("[GIS] Profile saved to storage:", currentProfile.name || currentProfile.email);
    } else {
      localStorage.removeItem(STORAGE_KEY_PROFILE);
    }
  } catch (error) {
    console.warn("Failed to save auth to storage:", error);
  }
}

/**
 * Check if Google Client ID is configured
 */
export function isGoogleConfigured(clientId?: string): boolean {
  const id = clientId || getClientIdFromEnv();
  return !!id;
}

/**
 * Get Google Client ID from environment
 */
function getClientIdFromEnv(): string {
  return (
    (typeof process !== "undefined" &&
      process.env?.["NEXT_PUBLIC_GOOGLE_CLIENT_ID"]) ||
    ""
  );
}

/**
 * Load Google Identity Services script
 */
export async function loadGIS(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  // Check if already loaded
  if ((window as GoogleWindow).google?.accounts?.oauth2) {
    gisLoaded = true;
    return true;
  }

  // Load GIS script
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gisLoaded = true;
      resolve(true);
    };
    script.onerror = () => {
      console.error("Failed to load GIS script");
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

/**
 * Request an access token from Google Identity Services
 * @param promptMode "consent" for explicit user consent, "" for silent/background
 * @param clientId Google OAuth Client ID (optional, reads from env if not provided)
 * @param additionalScopes Additional OAuth scopes beyond drive.appdata
 */
export async function requestAccessToken(
  promptMode: "consent" | "",
  clientId?: string,
  additionalScopes?: string
): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const resolvedClientId = clientId || getClientIdFromEnv();
  if (!resolvedClientId) {
    console.warn("Google Client ID not configured");
    return null;
  }

  // Ensure GIS is loaded
  if (!gisLoaded) {
    const loaded = await loadGIS();
    if (!loaded) return null;
  }

  const google = (window as GoogleWindow).google;
  if (!google?.accounts?.oauth2) {
    console.error("GIS not available");
    return null;
  }

  // Build scope string
  const scopes = [DRIVE_SCOPE, PROFILE_SCOPES, additionalScopes]
    .filter(Boolean)
    .join(" ");

  return new Promise((resolve) => {
    // Timeout: short for silent, long for consent
    const timeout = promptMode === "" ? 5000 : 60000;
    const timeoutId = setTimeout(() => {
      console.warn("Token request timed out");
      resolve(null);
    }, timeout);

    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: resolvedClientId,
        scope: scopes,
        prompt: promptMode,
        callback: async (response: GISTokenResponse) => {
          clearTimeout(timeoutId);

          if (response.error) {
            console.error("Token error:", response.error);
            resolve(null);
            return;
          }

          currentAccessToken = response.access_token;
          // Google tokens expire in ~1 hour (3600 seconds)
          // Use expires_in from response or default to 3600
          const expiresIn = (response as { expires_in?: number }).expires_in || 3600;
          tokenExpiry = Date.now() + expiresIn * 1000;
          saveToStorage();
          resolve(response.access_token);
        },
        error_callback: (error) => {
          clearTimeout(timeoutId);
          // For silent requests, don't log errors (expected behavior)
          if (promptMode === "consent") {
            console.error("GIS error:", error.type, error.message);
          }
          resolve(null);
        },
      });

      tokenClient.requestAccessToken({ prompt: promptMode || undefined });
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Error initializing token client:", error);
      resolve(null);
    }
  });
}

/**
 * Get current access token (from memory or localStorage)
 */
export function getAccessToken(): string | null {
  loadFromStorage();
  return currentAccessToken;
}

/**
 * Clear the access token and profile (sign out)
 */
export function clearAuth(): void {
  currentAccessToken = null;
  tokenExpiry = null;
  currentProfile = null;
  storageLoaded = false;

  // Clear from localStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY);
      localStorage.removeItem(STORAGE_KEY_PROFILE);
    } catch (error) {
      console.warn("Failed to clear auth from storage:", error);
    }
  }
}

/**
 * Fetch user profile from Google
 */
export async function fetchUserProfile(
  token: string
): Promise<GoogleProfile | null> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) return null;

    const data = await response.json();
    currentProfile = {
      name: data.name || "",
      email: data.email || "",
      pictureUrl: data.picture || "",
    };
    saveToStorage();
    return currentProfile;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return null;
  }
}

/**
 * Get current profile (from memory or localStorage)
 */
export function getProfile(): GoogleProfile | null {
  loadFromStorage();
  return currentProfile;
}

/**
 * Sign in with Google and get access token + profile
 * Convenience function that combines token request and profile fetch
 */
export async function signInWithGoogle(
  clientId?: string
): Promise<{ token: string; profile: GoogleProfile } | null> {
  const token = await requestAccessToken("consent", clientId);
  if (!token) return null;

  const profile = await fetchUserProfile(token);
  if (!profile) return null;

  return { token, profile };
}
