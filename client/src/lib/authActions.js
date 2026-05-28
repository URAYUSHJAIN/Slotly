/**
 * Slotly — Auth actions (single source of truth).
 *
 * All signup / signin / signout flows live here. UI components call these
 * functions; they never speak to authClient directly.
 *
 * Why this exists:
 *   - Signup is *not* atomic — it creates a Neon Auth user, then inserts
 *     into our `profiles` table, then optionally into `doctors`. Each step
 *     can fail. The retry + recovery logic for that dance lives here, not
 *     in components.
 *   - Login needs role validation (a Patient should not be able to log in
 *     on the Doctor tab and vice versa). That check is centralised here.
 *   - Errors from BetterAuth are often empty objects on 422s; we re-issue
 *     the request manually to capture the real body, then translate it
 *     into a clear user-facing message.
 */
import { authClient } from './auth.js';
import {
  createProfile,
  createDoctorDetails,
  fetchMyProfile,
} from './neonApi.js';

const AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL;

/* ─────────────────────────────────────────────────────────────────── */
/* Helpers                                                              */
/* ─────────────────────────────────────────────────────────────────── */

async function fetchRawAuthError(path, body) {
  try {
    const res = await fetch(`${AUTH_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, body: json };
  } catch {
    return { status: 0, body: {} };
  }
}

function translateSignupError(error, raw) {
  const status = raw.status || error.status || error.statusCode;
  const msg = (raw.body?.message || error.message || error.error || '').toLowerCase();
  const code = (raw.body?.code || error.code || '').toLowerCase();

  if (
    code.includes('user_already_exists') ||
    msg.includes('already') ||
    msg.includes('exist') ||
    msg.includes('in use') ||
    msg.includes('duplicate')
  ) {
    return 'An account with this email already exists. Please switch to Login.';
  }
  if (msg.includes('password') || msg.includes('weak') || msg.includes('short') || msg.includes('character')) {
    return raw.body?.message || 'Password is too weak. Use at least 8 characters with a mix of letters and numbers.';
  }
  if (msg.includes('email') && msg.includes('invalid')) {
    return 'That email address is not valid.';
  }
  return raw.body?.message || error.message || `Signup failed (HTTP ${status || '?'}).`;
}

function translateLoginError(error, raw) {
  const status = raw.status || error.status || error.statusCode;
  const msg = (raw.body?.message || error.message || error.error || '').toLowerCase();

  if (status === 401 || msg.includes('credential') || msg.includes('invalid') || msg.includes('password')) {
    return 'Incorrect email or password.';
  }
  if (status === 404 || msg.includes('not found') || msg.includes('no user')) {
    return 'No account found with this email. Please sign up first.';
  }
  return raw.body?.message || error.message || `Login failed (HTTP ${status || '?'}).`;
}

/* ─────────────────────────────────────────────────────────────────── */
/* signUp                                                               */
/* ─────────────────────────────────────────────────────────────────── */

/**
 * Create a new Slotly account.
 *
 * Steps:
 *   1. Create the Neon Auth user (email/password).
 *   2. Insert the `profiles` row (retries — the neon_auth.users_sync mirror
 *      can lag by a couple of seconds, causing FK violations).
 *   3. If role === 'doctor', insert the `doctors` row.
 *
 * Returns the auth user on success. Throws a user-facing Error on failure.
 */
export async function signUp(payload) {
  const {
    email,
    password,
    firstName,
    lastName,
    mobile,
    gender,
    dob,
    role,
    doctorDetails, // { qualification, experience, speciality, appointmentPrice }
  } = payload;

  // Step 1 — Neon Auth signup
  const { data, error } = await authClient.signUp.email({
    email,
    password,
    name: `${firstName} ${lastName || ''}`.trim(),
  });

  if (error) {
    const raw = await fetchRawAuthError('/sign-up/email', {
      email,
      password,
      name: `${firstName} ${lastName || ''}`.trim(),
    });
    console.error('[Slotly] Signup rejected by Neon Auth:', { error, raw });
    throw new Error(translateSignupError(error, raw));
  }

  const userId = data?.user?.id;
  if (!userId) {
    console.error('[Slotly] Signup succeeded but user.id was missing in response:', data);
    throw new Error('Signup succeeded but no user ID was returned. Please try logging in.');
  }

  // Step 2 — profile row (this retries internally for FK lag)
  try {
    await createProfile({
      userId,
      role,
      firstName,
      lastName,
      mobile,
      gender,
      dateOfBirth: dob || null,
    });
  } catch (err) {
    console.error('[Slotly] Profile insert failed after auth user creation:', err);
    throw new Error(
      `Your account was created but we could not save your profile (${err.message}). ` +
      `Please try logging in — if it still fails, contact support.`
    );
  }

  // Step 3 — doctor extras (optional)
  if (role === 'doctor') {
    try {
      await createDoctorDetails({
        userId,
        qualification: doctorDetails.qualification,
        experience: doctorDetails.experience,
        speciality: doctorDetails.speciality,
        appointmentPrice: doctorDetails.appointmentPrice,
      });
    } catch (err) {
      console.error('[Slotly] Doctor detail insert failed:', err);
      throw new Error(
        `Profile saved but doctor details could not be stored (${err.message}). ` +
        `Please log in and complete your profile from the dashboard.`
      );
    }
  }

  return data.user;
}

/* ─────────────────────────────────────────────────────────────────── */
/* signIn                                                               */
/* ─────────────────────────────────────────────────────────────────── */

/**
 * Sign in an existing user.
 * If `expectedRole` is provided and the profile's role doesn't match,
 * the user is immediately signed out and we throw.
 */
export async function signIn({ email, password, expectedRole }) {
  const { error } = await authClient.signIn.email({ email, password });

  if (error) {
    const raw = await fetchRawAuthError('/sign-in/email', { email, password });
    console.error('[Slotly] Login rejected by Neon Auth:', { error, raw });
    throw new Error(translateLoginError(error, raw));
  }

  // Profile fetch — may take a beat for the session to be readable
  let profile = null;
  for (let attempt = 0; attempt < 3 && !profile; attempt += 1) {
    try {
      profile = await fetchMyProfile();
    } catch (err) {
      if (attempt === 2) {
        await authClient.signOut().catch(() => {});
        throw new Error(`Could not load your profile: ${err.message}`);
      }
    }
    if (!profile) await new Promise((r) => setTimeout(r, 500));
  }

  if (!profile) {
    await authClient.signOut().catch(() => {});
    throw new Error(
      'Your account is missing a Slotly profile. Please sign up again or contact support.'
    );
  }

  if (expectedRole && profile.role !== expectedRole) {
    await authClient.signOut().catch(() => {});
    const actual = profile.role === 'doctor' ? 'Doctor' : 'Patient';
    throw new Error(
      `This account is registered as a ${actual}. Switch to the ${actual} tab to log in.`
    );
  }

  return { profile };
}

/* ─────────────────────────────────────────────────────────────────── */
/* signOutUser                                                          */
/* ─────────────────────────────────────────────────────────────────── */

export async function signOutUser() {
  try {
    await authClient.signOut();
  } catch (err) {
    console.warn('[Slotly] signOut error (ignored):', err);
  }
}
