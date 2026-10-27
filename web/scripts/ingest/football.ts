import { fold, includesPhrase } from "./text";

type Club = {
  id: string;
  names: string[];
  big: boolean;
};

const clubs: Club[] = [
  { id: "boca", names: ["boca juniors"], big: true },
  { id: "river", names: ["river plate"], big: true },
  { id: "racing", names: ["racing club"], big: true },
  { id: "independiente", names: ["independiente"], big: true },
  { id: "san-lorenzo", names: ["san lorenzo"], big: true },
  { id: "huracan", names: ["huracan"], big: true },
  { id: "rosario-central", names: ["rosario central"], big: true },
  { id: "newells", names: ["newells old boys", "newells"], big: true },
  { id: "velez", names: ["velez sarsfield", "velez"], big: true },
  { id: "estudiantes", names: ["estudiantes de la plata"], big: true },
  { id: "gimnasia", names: ["gimnasia y esgrima de la plata", "gimnasia y esgrima la plata"], big: false },
  { id: "talleres", names: ["talleres de cordoba", "talleres"], big: false },
  { id: "belgrano", names: ["belgrano de cordoba", "belgrano"], big: false },
];

const clasicos = [
  ["boca", "river"],
  ["racing", "independiente"],
  ["rosario-central", "newells"],
  ["san-lorenzo", "huracan"],
  ["estudiantes", "gimnasia"],
  ["talleres", "belgrano"],
  ["boca", "san-lorenzo"],
  ["river", "independiente"],
  ["boca", "independiente"],
  ["river", "racing"],
];

function foldTeam(name: string) {
  return fold(name.replace(/['’]/g, ""));
}

export function clubId(name: string) {
  const folded = foldTeam(name);
  if (!folded) return null;
  if (folded.includes("rivadavia")) return null;
  const hit = clubs.find((club) =>
    club.names.some((alias) => folded === alias || includesPhrase(folded, alias)),
  );
  return hit?.id ?? null;
}

export function isImportantMatch(home: string, away: string) {
  const left = clubId(home);
  const right = clubId(away);
  if (!left || !right || left === right) return false;
  const classic = clasicos.some(
    ([a, b]) => (a === left && b === right) || (a === right && b === left),
  );
  if (classic) return true;
  const big = new Set(clubs.filter((club) => club.big).map((club) => club.id));
  return big.has(left) && big.has(right);
}
