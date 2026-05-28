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
  let retries = 5;
  let lastError = null;

  while (retries > 0) {
    const { data, error } = await db
      .from('profiles')
      .insert({
        id: userId,
        role,
        first_name: firstName,
        last_name: lastName || null,
        mobile,
        // gender: gender || null,
        // date_of_birth: dateOfBirth || null,
      })
      .select()
      .single();

    if (!error) return data;

    // If it's a foreign key violation (23503), the user hasn't synced yet.
    lastError = error;
    retries -= 1;
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000)); // wait 1 second
    }
  }

  throw new Error(`Failed to create profile after retries: ${lastError.message}`);
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
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
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
      status: 'upcoming'
    })
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
  const { data, error } = await db
    .from('appointments')
    .select('start_time, end_time, status')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', dateString)
    .neq('status', 'cancelled');
    
  if (error) throw new Error(error.message);
  return data;
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

/* ── Re-exports ─────────────────────────────────────────────────── */
export { authClient };
