import { describe, expect, it } from "vitest";
import {
  artistFromFicha,
  funcionExternalId,
  parseClockTime,
  parseFunciones,
  parseSpanishDate,
  showUrls,
} from "./sources/movistar-arena";

const ficha = `Volver
Jesse & Joy
Faltan
5
Días
Acerca del evento
La cita será el 1 de noviembre en el Movistar Arena. El show arranca a las 21:00.
`;

describe("movistar arena", () => {
  it("lee los shows del sitemap", () => {
    const xml = `<urlset><url><loc>https://www.movistararena.com.ar/show/fbc721c0-47d7-4e68-a7f5-d7206307675a</loc></url><url><loc>https://www.movistararena.com.ar/shows</loc></url></urlset>`;
    expect(showUrls(xml)).toEqual([
      {
        uuid: "fbc721c0-47d7-4e68-a7f5-d7206307675a",
        url: "https://www.movistararena.com.ar/show/fbc721c0-47d7-4e68-a7f5-d7206307675a",
      },
    ]);
  });

  it("saca artista, fecha y hora de la ficha", () => {
    expect(artistFromFicha(ficha)).toBe("Jesse & Joy");
    expect(parseSpanishDate("01 noviembre 2026 y 1 fecha más", "2026-10-27")).toBe("2026-11-01");
    expect(parseSpanishDate(ficha, "2026-10-27")).toBe("2026-11-01");
    expect(parseClockTime(ficha)).toBe("21:00");
  });

  it("se queda con el artista cuando la ficha abre con el nombre de la gira", () => {
    const text = `Volver
Quimera Tour
María Becerra
Faltan
Acerca del evento
HORARIOS
19:00 hs
Puertas
21:00 hs
Show
`;
    expect(artistFromFicha(text)).toBe("María Becerra");
    expect(parseClockTime(text)).toBe("21:00");
  });

  it("lee cada función del bloque de compra y no duplica la fecha del texto", () => {
    const text = `Volver
Andres Calamaro
Faltan
23
Días
Acerca del evento
¡CALAMARO SUMA UNA ÚLTIMA FECHA EL 23 DE NOVIEMBRE EN EL MOVISTAR ARENA!
El 23 de noviembre será una nueva oportunidad.
30 Octubre HORARIOS 19:00 hs Puertas 21:00 hs Show
23 Noviembre HORARIOS 19:00 hs Puertas 21:00 hs Show
`;
    expect(parseFunciones(text, "2026-10-27")).toEqual([
      { date: "2026-10-30", time: "21:00" },
      { date: "2026-11-23", time: "21:00" },
    ]);

    const ficha = `Acerca del evento
EL 23 DE NOVIEMBRE
Entradas desde
$ 45.000

23

Noviembre
HORARIOS

19:00 hs

Puertas

21:00 hs

Show
23 / Diciembre / HORARIOS / 19:00 hs Puertas / 21:00 hs Show
`;
    expect(parseFunciones(ficha, "2026-10-27")).toEqual([
      { date: "2026-11-23", time: "21:00" },
      { date: "2026-12-23", time: "21:00" },
    ]);
  });

  it("distingue dos horarios del mismo día en el id", () => {
    const uuid = "52226495-ef0d-441b-8bfe-253eba7d7d0c";
    const one = [{ startsAt: "2026-11-23T21:00:00-03:00" }];
    expect(funcionExternalId(uuid, one[0].startsAt, one)).toBe(`${uuid}#2026-11-23`);
    const two = [
      { startsAt: "2026-11-23T21:00:00-03:00" },
      { startsAt: "2026-11-23T23:00:00-03:00" },
    ];
    expect(funcionExternalId(uuid, two[0].startsAt, two)).toBe(`${uuid}#2026-11-23T21:00`);
    expect(funcionExternalId(uuid, two[1].startsAt, two)).toBe(`${uuid}#2026-11-23T23:00`);
  });

  it("descarta la ficha de error", () => {
    expect(
      artistFromFicha("Volver\nNo pudimos conectar con Movistar Arena. Probá de nuevo.\nREINTENTAR"),
    ).toBeNull();
  });
});
