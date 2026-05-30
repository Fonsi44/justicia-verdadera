import { AppError } from "@/lib/errors";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CLIENT_ID = process.env.AUTH_GOOGLE_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.AUTH_GOOGLE_SECRET ?? "";

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export interface SyncEventInput {
  id: string;
  title: string;
  description?: string | null;
  date: Date;
  endDate?: Date | null;
  location?: string | null;
  googleEventId?: string | null;
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new AppError(`Error al refrescar token de Google: ${res.status} ${body}`, 502, "GOOGLE_TOKEN_REFRESH_FAILED");
  }

  const data = await res.json();
  return data.access_token as string;
}

async function fetchWithRefresh(
  url: string,
  options: RequestInit,
  accessToken: string,
  refreshToken: string,
): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && refreshToken) {
    const newAccessToken = await refreshAccessToken(refreshToken);
    headers.set("Authorization", `Bearer ${newAccessToken}`);
    res = await fetch(url, { ...options, headers });
  }

  return res;
}

export async function syncEventToGoogle(
  accessToken: string,
  refreshToken: string,
  event: SyncEventInput,
): Promise<string> {
  const body: Record<string, unknown> = {
    summary: event.title,
    start: {
      dateTime: event.date instanceof Date ? event.date.toISOString() : new Date(event.date).toISOString(),
      timeZone: "America/Tegucigalpa",
    },
    end: {
      dateTime: event.endDate instanceof Date
        ? event.endDate.toISOString()
        : event.endDate
          ? new Date(event.endDate).toISOString()
          : new Date(event.date.getTime() + 60 * 60 * 1000).toISOString(),
      timeZone: "America/Tegucigalpa",
    },
  };

  if (event.description) body.description = event.description;
  if (event.location) body.location = event.location;

  const isUpdate = !!event.googleEventId;
  const url = isUpdate
    ? `${GOOGLE_CALENDAR_API}/${event.googleEventId}`
    : GOOGLE_CALENDAR_API;

  const res = await fetchWithRefresh(
    url,
    {
      method: isUpdate ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    accessToken,
    refreshToken,
  );

  if (!res.ok) {
    const text = await res.text();
    throw new AppError(
      `Error al ${isUpdate ? "actualizar" : "crear"} evento en Google Calendar: ${res.status} ${text}`,
      502,
      "GOOGLE_CALENDAR_ERROR",
    );
  }

  const data = await res.json();
  return data.id as string;
}

export async function deleteEventFromGoogle(
  accessToken: string,
  refreshToken: string,
  googleEventId: string,
): Promise<void> {
  const res = await fetchWithRefresh(
    `${GOOGLE_CALENDAR_API}/${googleEventId}`,
    { method: "DELETE" },
    accessToken,
    refreshToken,
  );

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new AppError(
      `Error al eliminar evento de Google Calendar: ${res.status} ${text}`,
      502,
      "GOOGLE_CALENDAR_DELETE_ERROR",
    );
  }
}

export async function listGoogleEvents(
  accessToken: string,
  refreshToken: string,
  maxResults: number = 50,
): Promise<GoogleCalendarEvent[]> {
  const url = `${GOOGLE_CALENDAR_API}?maxResults=${maxResults}&orderBy=startTime&singleEvents=true`;

  const res = await fetchWithRefresh(
    url,
    { method: "GET" },
    accessToken,
    refreshToken,
  );

  if (!res.ok) {
    const text = await res.text();
    throw new AppError(
      `Error al obtener eventos de Google Calendar: ${res.status} ${text}`,
      502,
      "GOOGLE_CALENDAR_LIST_ERROR",
    );
  }

  const data = await res.json();
  return (data.items ?? []).map((item: { id: string; summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }) => ({
    id: item.id,
    summary: item.summary ?? "",
    start: item.start ?? {},
    end: item.end ?? {},
  }));
}
