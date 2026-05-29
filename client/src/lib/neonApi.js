/**
 * Slotly — Neon Data API (PostgREST) client + typed helpers.
 *
 * Every request injects the JWT from Neon Auth via getJwt(), which is what
 * the database evaluates inside `request.jwt.claims` for RLS policies.
 *
 * Note: There is *no* static API key for the Neon Data API. If you ever
 * see "Neon API key is missing" — that's stale code; throw it out.
 */
import { NeonPostgrestClient, fetchWithToken } from '@neondatabase/postgrest-js';
import { authClient, getJwt } from './auth.js';

const dataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL;
if (!dataApiUrl) {
  throw new Error(
    'VITE_NEON_DATA_API_URL is missing. Set it in client/.env.local and restart `npm run dev`.'
  );
}

export const db = new NeonPostgrestClient({
  dataApiUrl,
  options: {
    global: {
      fetch: fetchWithToken(getJwt),
    },
  },
});

/* ── Profile / role helpers ─────────────────────────────────────── */

/**
 * Insert the Slotly profile row that pairs with a freshly-signed-up user.
 * `userId` must equal the Neon Auth user id (== JWT `sub`).
 */
export async function createProfile({
  userId,
  role,
  firstName,
  lastName,
  mobile,
  gender,
  dateOfBirth,
}) {
  const MAX_ATTEMPTS = 8;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const { data, error } = await db
      .from('profiles')
      .insert({
        id: userId,
        role,
        first_name: firstName,
        last_name: lastName || null,
        mobile,
        gender: gender || null,
        date_of_birth: dateOfBirth || null,
      })
      .select()
      .single();

    if (!error) {
      if (attempt > 1) {
        console.log(`[Slotly] createProfile: succeeded on attempt ${attempt}`);
      }
      return data;
    }

    lastError = error;
    const code = error.code || '';
    const msg  = (error.message || '').toLowerCase();
    const isFkLag = code === '23503' || msg.includes('foreign key') || msg.includes('not present');
    const isDuplicate = code === '23505' || msg.includes('duplicate') || msg.includes('already exists');
    // JWT might not be ready immediately after signup — treat as retryable
    const isAuthLag = msg.includes('missing authentication') || msg.includes('bearer token') || msg.includes('jwt');

    if (isDuplicate) {
      // Profile already exists — treat as success (idempotent signup)
      console.warn('[Slotly] createProfile: profile already exists, treating as success');
      return null;
    }

    if (!isFkLag && !isAuthLag) {
      // Non-retryable error — bail immediately
      console.error('[Slotly] createProfile: non-retryable error', error);
      throw new Error(error.message || 'Failed to create profile.');
    }

    // FK lag or JWT not yet ready — wait with exponential-ish backoff (max 2s)
    const delayMs = Math.min(500 * attempt, 2000);
    const reason = isAuthLag ? 'JWT not ready' : 'FK lag';
    console.log(`[Slotly] createProfile: attempt ${attempt} hit ${reason}, retrying in ${delayMs}ms`);
    await new Promise((r) => setTimeout(r, delayMs));
  }

  throw new Error(
    `Profile creation failed after ${MAX_ATTEMPTS} attempts: ${lastError?.message || 'unknown error'}. ` +
    `The Neon Auth user mirror may not have synced yet.`
  );
}

export async function createDoctorDetails({
  userId,
  qualification,
  experience,
  speciality,
  appointmentPrice,
  documentsName,
}) {
  const { data, error } = await db
    .from('doctors')
    .insert({
      id: userId,
      qualification,
      experience,
      speciality,
      appointment_price: Number(appointmentPrice),
      documents_name: documentsName || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Fetch the signed-in user's profile (one row, by RLS). */
export async function fetchMyProfile() {
  const session = await authClient.getSession();
  const userId = session?.data?.user?.id;
  if (!userId) return null;

  const { data, error } = await db
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .limit(1);

  if (error) throw new Error(error.message);
  return data?.[0] ?? null;
}

/* ── Doctor browsing ────────────────────────────────────────────── */

/**
 * Fetch all doctors with their profile info.
 * Joins `profiles` (role='doctor') with `doctors` via the shared `id`.
 */
export async function fetchDoctors() {
  const { data, error } = await db
    .from('profiles')
    .select('id, first_name, last_name, mobile, gender, doctors(qualification, experience, speciality, appointment_price)')
    .eq('role', 'doctor');
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    mobile: p.mobile,
    gender: p.gender,
    qualification: p.doctors?.[0]?.qualification ?? p.doctors?.qualification ?? '',
    experience: p.doctors?.[0]?.experience ?? p.doctors?.experience ?? '',
    speciality: p.doctors?.[0]?.speciality ?? p.doctors?.speciality ?? '',
    appointmentPrice: p.doctors?.[0]?.appointment_price ?? p.doctors?.appointment_price ?? 0,
  }));
}

/* ── Appointments ─────────────────────────────────────────────────── */

/**
 * Create a new appointment booking.
 */
export async function createAppointment({
  patientId,
  doctorId,
  appointmentDate,
  startTime,
  endTime,
  fee,
}) {
  const { data, error } = await db
    .from('appointments')
    .insert({
      patient_id: patientId,
      doctor_id: doctorId,
      appointment_date: appointmentDate,
      start_time: startTime,
      end_time: endTime,
      fee: Number(fee),
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update the status of an appointment. Used by doctors (approve / reject /
 * complete) and patients (cancel). RLS enforces who is allowed.
 */
export async function updateAppointmentStatus(appointmentId, newStatus) {
  const allowed = ['pending', 'upcoming', 'completed', 'cancelled', 'rejected'];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }
  const { data, error } = await db
    .from('appointments')
    .update({ status: newStatus })
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Fetch all appointments for the current patient, joined with doctor profile details.
 */
export async function fetchPatientAppointments() {
  const { data, error } = await db
    .from('appointments')
    .select(`
      id, appointment_date, start_time, end_time, fee, status,
      doctor:doctors (
        speciality,
        profile:profiles ( first_name, last_name )
      )
    `)
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw new Error(error.message);
  
  // Flatten the nested relation for easier consumption on frontend
  return (data ?? []).map(appt => ({
    id: appt.id,
    date: appt.appointment_date,
    start: appt.start_time,
    end: appt.end_time,
    fee: appt.fee,
    status: appt.status,
    doctorName: `${appt.doctor?.profile?.first_name || ''} ${appt.doctor?.profile?.last_name || ''}`.trim(),
    speciality: appt.doctor?.speciality || ''
  }));
}

/* ── Doctor Availability ────────────────────────────────────────────── */

/**
 * Fetch all availability blocks for the logged-in doctor.
 */
export async function fetchDoctorSlots(doctorId) {
  const { data, error } = await db
    .from('doctor_availability')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('available_date', { ascending: true })
    .order('start_time', { ascending: true });
    
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Add a new availability block.
 */
export async function addDoctorAvailability(availabilityData) {
  const { data, error } = await db
    .from('doctor_availability')
    .insert([availabilityData])
    .select()
    .single();
    
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Remove an availability block by its ID.
 */
export async function removeDoctorAvailability(slotId) {
  const { error } = await db
    .from('doctor_availability')
    .delete()
    .eq('id', slotId);
    
  if (error) throw new Error(error.message);
  return true;
}

/**
 * Fetch a doctor's availability for a specific date (used by patients in booking modal).
 */
export async function fetchDoctorAvailabilityForDate(doctorId, dateString) {
  const { data, error } = await db
    .from('doctor_availability')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('available_date', dateString)
    .order('start_time', { ascending: true });
    
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Fetch a doctor's existing appointments for a specific date to prevent double-booking.
 */
export async function fetchDoctorAppointmentsForDate(doctorId, dateString) {
  // Pending + upcoming + completed block the slot.
  // Cancelled and rejected free it up again for someone else to book.
  const { data, error } = await db
    .from('appointments')
    .select('start_time, end_time, status')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', dateString)
    .in('status', ['pending', 'upcoming', 'completed']);

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Fetch every distinct patient who has any appointment with this doctor.
 * Returns one row per patient with their profile details and a summary of
 * how many appointments they have.
 */
export async function fetchDoctorPatients(doctorId) {
  const { data, error } = await db
    .from('appointments')
    .select(`
      patient_id,
      appointment_date,
      status,
      profiles!patient_id (
        id,
        first_name,
        last_name,
        mobile,
        gender,
        date_of_birth
      )
    `)
    .eq('doctor_id', doctorId)
    .order('appointment_date', { ascending: false });

  if (error) throw new Error(error.message);

  const byPatient = new Map();
  for (const row of data || []) {
    const p = row.profiles;
    if (!p?.id) continue;
    const existing = byPatient.get(p.id);
    if (existing) {
      existing.totalAppointments += 1;
      if (row.appointment_date > existing.lastVisit) {
        existing.lastVisit = row.appointment_date;
      }
    } else {
      byPatient.set(p.id, {
        id: p.id,
        firstName: p.first_name,
        lastName:  p.last_name,
        mobile:    p.mobile,
        gender:    p.gender,
        dateOfBirth: p.date_of_birth,
        lastVisit: row.appointment_date,
        totalAppointments: 1,
      });
    }
  }
  return Array.from(byPatient.values()).sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
}

/**
 * Fetch a doctor's booked appointments along with patient details.
 */
export async function fetchDoctorBookedAppointments(doctorId) {
  const { data, error } = await db
    .from('appointments')
    .select(`
      id,
      appointment_date,
      start_time,
      end_time,
      fee,
      status,
      profiles!patient_id (
        first_name,
        last_name,
        mobile,
        gender,
        date_of_birth
      )
    `)
    .eq('doctor_id', doctorId)
    .order('appointment_date', { ascending: false })
    .order('start_time', { ascending: false });

  if (error) throw new Error(error.message);
  
  // Format the response so it's easy to consume in the frontend
  return (data || []).map(appt => ({
    id: appt.id,
    date: appt.appointment_date,
    start: appt.start_time,
    end: appt.end_time,
    fee: appt.fee,
    status: appt.status,
    patientName: [appt.profiles?.first_name, appt.profiles?.last_name].filter(Boolean).join(' ') || 'Unknown Patient',
    patientMobile: appt.profiles?.mobile,
    patientGender: appt.profiles?.gender,
    patientDob: appt.profiles?.date_of_birth,
  }));
}

