const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let cachedMembers: Set<string> | null = null;
let lastFetchTime = 0;

async function fetchLifetimeMembers(): Promise<Set<string>> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedMembers && now - lastFetchTime < CACHE_DURATION) {
    return cachedMembers;
  }

  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.split('\n');

    const members = new Set<string>();

    // Skip header row, parse emails from first column
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // CSV format: "email","","",... - extract first quoted value
      const match = line.match(/^"([^"]+)"/);
      if (match && match[1] && match[1].includes('@')) {
        members.add(match[1].toLowerCase());
      }
    }

    cachedMembers = members;
    lastFetchTime = now;

    console.log(`Loaded ${members.size} lifetime members`);
    return members;
  } catch (error) {
    console.error('Error fetching lifetime members:', error);
    // Return cached data if available, even if stale
    return cachedMembers || new Set();
  }
}

export async function isLifetimeMember(email: string): Promise<boolean> {
  const members = await fetchLifetimeMembers();
  return members.has(email.toLowerCase());
}
