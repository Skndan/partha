import { readFileSync } from "node:fs";
import path from "node:path";

import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  electionAllianceMembers,
  electionAlliances,
  elections,
  parties,
  state,
} from "../lib/db/schema";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run scripts/seed-parties-alliances.ts");
}

const client = postgres(databaseUrl);
const db = drizzle(client, {
  schema: {
    electionAllianceMembers,
    electionAlliances,
    elections,
    parties,
    state,
  },
});

type PartyRow = {
  id: string;
  name: string;
  abbreviation: string;
  level: "national" | "state";
  symbol?: string | null;
  eciCode?: string | null;
};

type AllianceRow = {
  id: string;
  name: string;
  leaderPartyId: string;
  notes?: string | null;
  partyIds: string[];
};

type SeedFile = {
  electionId: string;
  mirrorPostPollFromPrePoll?: boolean;
  notes?: string;
  parties: PartyRow[];
  prePollAlliances: AllianceRow[];
};

const DATA_PATH = path.join(
  process.cwd(),
  "data/indian-elections-domain/tn-2026-parties-alliances.json",
);

const POST_POLL_MIRROR_NOTE =
  "Provisional mirror of pre_poll; not a prediction of government formation. Update after results.";

function loadSeed(): SeedFile {
  const raw = readFileSync(DATA_PATH, "utf8");
  return JSON.parse(raw) as SeedFile;
}

function postAllianceIdFromPre(preId: string): string {
  if (!preId.includes("-pre-")) {
    throw new Error(
      `Expected pre-poll alliance id to contain "-pre-" (got ${preId}) for post-poll mirror.`,
    );
  }
  return preId.replace("-pre-", "-post-");
}

async function getTamilNaduStateId() {
  const byCode = await db.query.state.findFirst({
    where: eq(state.code, "TN"),
    columns: { id: true },
  });

  if (byCode) {
    return byCode.id;
  }

  const byName = await db.query.state.findFirst({
    where: eq(state.name, "Tamil Nadu"),
    columns: { id: true },
  });

  if (!byName) {
    throw new Error(
      "Tamil Nadu state row not found. Seed states/districts/AC data first.",
    );
  }

  return byName.id;
}

async function ensureElectionExists(electionId: string) {
  const row = await db.query.elections.findFirst({
    where: eq(elections.id, electionId),
    columns: { id: true },
  });
  if (!row) {
    throw new Error(
      `Election ${electionId} not found. Run bun run db:seed:elections first.`,
    );
  }
}

async function seedParties(stateId: string, rows: PartyRow[]) {
  for (const p of rows) {
    await db
      .insert(parties)
      .values({
        id: p.id,
        stateId,
        name: p.name,
        abbreviation: p.abbreviation,
        level: p.level,
        symbol: p.symbol ?? null,
        eciCode: p.eciCode ?? null,
      })
      .onConflictDoUpdate({
        target: parties.id,
        set: {
          stateId: sql`excluded.state_id`,
          name: sql`excluded.name`,
          abbreviation: sql`excluded.abbreviation`,
          level: sql`excluded.level`,
          symbol: sql`excluded.symbol`,
          eciCode: sql`excluded.eci_code`,
          updatedAt: sql`now()`,
        },
      });
  }
}

async function replaceAllianceMembers(allianceId: string, partyIds: string[]) {
  await db
    .delete(electionAllianceMembers)
    .where(eq(electionAllianceMembers.allianceId, allianceId));

  if (partyIds.length === 0) {
    return;
  }

  await db.insert(electionAllianceMembers).values(
    partyIds.map((partyId, index) => ({
      id: `${allianceId}__${partyId}`,
      allianceId,
      partyId,
      sortOrder: index,
    })),
  );
}

async function upsertAlliance(
  row: AllianceRow,
  electionId: string,
  phase: "pre_poll" | "post_poll",
  notesOverride?: string,
) {
  const notes =
    notesOverride ??
    (phase === "post_poll" ? POST_POLL_MIRROR_NOTE : row.notes ?? null);

  await db
    .insert(electionAlliances)
    .values({
      id: row.id,
      electionId,
      name: row.name,
      phase,
      leaderPartyId: row.leaderPartyId,
      notes,
    })
    .onConflictDoUpdate({
      target: electionAlliances.id,
      set: {
        name: sql`excluded.name`,
        electionId: sql`excluded.election_id`,
        phase: sql`excluded.phase`,
        leaderPartyId: sql`excluded.leader_party_id`,
        notes: sql`excluded.notes`,
        updatedAt: sql`now()`,
      },
    });

  await replaceAllianceMembers(row.id, row.partyIds);
}

async function warnExtraDbParties(stateId: string, jsonPartyIds: Set<string>) {
  const existing = await db
    .select({ id: parties.id })
    .from(parties)
    .where(eq(parties.stateId, stateId));

  for (const { id } of existing) {
    if (!jsonPartyIds.has(id)) {
      console.warn(
        `[seed-parties-alliances] Party ${id} exists in DB for this state but is not in ${path.basename(DATA_PATH)}; left unchanged.`,
      );
    }
  }
}

async function main() {
  const data = loadSeed();
  const stateId = await getTamilNaduStateId();
  await ensureElectionExists(data.electionId);

  const jsonPartyIds = new Set(data.parties.map((p) => p.id));
  await seedParties(stateId, data.parties);
  await warnExtraDbParties(stateId, jsonPartyIds);

  for (const alliance of data.prePollAlliances) {
    await upsertAlliance(alliance, data.electionId, "pre_poll");
  }

  if (data.mirrorPostPollFromPrePoll) {
    for (const pre of data.prePollAlliances) {
      const post: AllianceRow = {
        ...pre,
        id: postAllianceIdFromPre(pre.id),
      };
      await upsertAlliance(post, data.electionId, "post_poll", POST_POLL_MIRROR_NOTE);
    }
  }

  const preCount = data.prePollAlliances.length;
  const postCount = data.mirrorPostPollFromPrePoll ? preCount : 0;

  console.log(`Seeded parties: ${data.parties.length} (upserted)`);
  console.log(
    `Seeded pre_poll alliances: ${preCount}; post_poll alliances: ${postCount} (mirror=${Boolean(data.mirrorPostPollFromPrePoll)})`,
  );
  console.log(`Election: ${data.electionId}`);
  if (data.notes) {
    console.log(`Data file notes: ${data.notes}`);
  }
}

main()
  .then(() => {
    console.log("Party and alliance seed complete.");
    client.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error("Party and alliance seed failed:", error);
    client.end();
    process.exit(1);
  });
