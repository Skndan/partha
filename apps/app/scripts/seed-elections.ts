import { config } from "dotenv";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  assemblyConstituencies,
  contests,
  electionPhases,
  elections,
  state,
} from "../lib/db/schema";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run scripts/seed-elections.ts");
}

const client = postgres(databaseUrl);
const db = drizzle(client, {
  schema: {
    assemblyConstituencies,
    contests,
    electionPhases,
    elections,
    state,
  },
});

const ELECTION_ID = "tn-2026-la";
const PHASE_ID = "tn-2026-la-phase-1";
const EXPECTED_CONTESTS = 234;

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

async function main() {
  const stateId = await getTamilNaduStateId();

  await db
    .insert(elections)
    .values({
      id: ELECTION_ID,
      stateId,
      name: "Tamil Nadu Assembly Election 2026",
      type: "assembly",
      year: 2026,
      description: "Tamil Nadu legislative assembly election (2026)",
      source: "Election Commission of India",
    })
    .onConflictDoNothing();

  await db
    .insert(electionPhases)
    .values({
      id: PHASE_ID,
      electionId: ELECTION_ID,
      name: "Single Phase",
      code: "phase-1",
    })
    .onConflictDoNothing();

  const acRows = await db
    .select({ id: assemblyConstituencies.id, reservationStatus: assemblyConstituencies.reservationStatus })
    .from(assemblyConstituencies);

  const contestRows = acRows.map((ac) => ({
    id: `tn-2026-la-${ac.id}`,
    electionId: ELECTION_ID,
    electionPhaseId: PHASE_ID,
    assemblyConstituencyId: ac.id,
    reservedStatus: ac.reservationStatus,
  }));

  if (contestRows.length === 0) {
    throw new Error(
      "No assembly constituencies found. Seed assembly constituency data first.",
    );
  }

  await db
    .insert(contests)
    .values(contestRows)
    .onConflictDoNothing({
      target: [
        contests.electionId,
        contests.electionPhaseId,
        contests.assemblyConstituencyId,
      ],
    });

  const [{ contestCount }] = await db
    .select({ contestCount: sql<number>`count(*)` })
    .from(contests)
    .where(
      and(
        eq(contests.electionId, ELECTION_ID),
        eq(contests.electionPhaseId, PHASE_ID),
      ),
    );

  console.log(`Seeded election: ${ELECTION_ID}`);
  console.log(`Seeded phase: ${PHASE_ID}`);
  const contestCountValue = Number(contestCount);

  console.log(`Contests for phase: ${contestCountValue}`);

  if (contestCountValue !== EXPECTED_CONTESTS) {
    throw new Error(
      `Expected ${EXPECTED_CONTESTS} contests for ${ELECTION_ID}, found ${contestCountValue}.`,
    );
  }
}

main()
  .then(() => {
    console.log("Election seed complete.");
    client.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error("Election seed failed:", error);
    client.end();
    process.exit(1);
  });
