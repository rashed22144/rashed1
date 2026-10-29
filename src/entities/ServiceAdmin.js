import { backend } from '@/api/backendClient';

// Admin-only: reads the base `services` table (incl. reports / report_reasons).
// Use ONLY in AdminDashboard's reported-services section — everywhere else
// must read the safe `services_public` view via Service / ServicePublic.
export const ServiceAdmin = backend.entities.ServiceAdmin;
