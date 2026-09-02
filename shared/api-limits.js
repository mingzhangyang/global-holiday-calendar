// Limits that the Worker enforces and the client has to respect. Kept here so
// the cap cannot drift between the API, the fetch batching and the picker.

// Countries per /api/holidays request. The client splits larger selections
// into several calls, and the country picker refuses to select more.
export const MAX_BATCH_COUNTRIES = 12;
