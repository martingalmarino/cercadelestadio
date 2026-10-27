import { describe, expect, it } from "vitest";
import { artistFromFicha, parseClockTime, parseSpanishDate, showUrls } from "./sources/movistar-arena";

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

  it("descarta la ficha de error", () => {
    expect(
      artistFromFicha("Volver\nNo pudimos conectar con Movistar Arena. Probá de nuevo.\nREINTENTAR"),
    ).toBeNull();
  });
});
