const fs = require("fs");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  VerticalAlign,
  LevelFormat,
  PageBreak,
} = require("docx");

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };
const headerShading = { fill: "D5E8F0", type: ShadingType.CLEAR };

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, children: [new TextRun(text)] });
}

function para(text, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text, ...opts })] });
}

function bullet(ref, text) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    children: [new TextRun(text)],
  });
}

function tableRow(cells, header = false) {
  const width = Math.floor(9360 / cells.length);
  return new TableRow({
    tableHeader: header,
    children: cells.map((text) =>
      new TableCell({
        borders: cellBorders,
        width: { size: width, type: WidthType.DXA },
        shading: header ? headerShading : undefined,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            children: [new TextRun({ text, bold: header, size: header ? 22 : 24 })],
          }),
        ],
      })
    ),
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 24 } } },
    paragraphStyles: [
      {
        id: "Title",
        name: "Title",
        basedOn: "Normal",
        run: { size: 52, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 200 }, alignment: AlignmentType.CENTER },
      },
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 32, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 180 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 200, after: 140 }, outlineLevel: 1 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "\u2022",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "numbers",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "checklist",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "\u2610",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      children: [
        new Paragraph({
          heading: HeadingLevel.TITLE,
          children: [new TextRun("Resplan Småland 2026")],
        }),
        para("Uppdaterad: 23 juli 2026", { italics: true, color: "666666" }),
        para("2 personer | Elbil | Bas i Älmhult | Hemma i Stavsnäs senast 30 juli"),

        heading("1. Översikt"),
        new Table({
          columnWidths: [2800, 6560],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            tableRow(["Datum", "Plan"], true),
            tableRow(["25 juli (lör)", "Avresa Stavsnäs → Älmhult. Incheckning."]),
            tableRow(["26 juli (sön)", "Jeppas trädgård 10:00–16:00. Tillbaka till Älmhult."]),
            tableRow(["27 juli (mån)", "Träffa syster vid Bolmen (hon kommer från Tyskland)."]),
            tableRow(["28 juli (tis)", "Utcheckning Älmhult. Kör mot Jönköping. Hälsa på Daniel."]),
            tableRow(["29 juli (ons)", "Mer tid i Jönköping. Hemresa mot Stavsnäs."]),
            tableRow(["30 juli (tors)", "Hemma i Stavsnäs."]),
          ],
        }),

        heading("2. Boende"),
        bullet("bullets", "Älmhult: incheck 25 juli, utcheck 28 juli."),
        bullet("bullets", "Max 1 timmes bilresa till Jeppas trädgård (Älmhult ~40 min)."),
        bullet("bullets", "28–29 juli: hos Daniel i Jönköping, hotell eller Airbnb (bestäm med Daniel)."),

        heading("3. Viktiga adresser"),
        new Table({
          columnWidths: [2600, 6760],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            tableRow(["Plats", "Adress"], true),
            tableRow(["Jeppas trädgård", "Jeppa Svenstorp 2089, 283 91 Osby"]),
            tableRow(["Jeppas lager", "Svetsvägen 6, 283 43 Osby"]),
            tableRow(["Möte Bolmen", "Bolmens Camping, Strandsjövägen 4, 341 94 Ljungby"]),
            tableRow(["Ljungby laddning", "Ljungby Elservice, Bolmstadvägen 40A, Ljungby"]),
          ],
        }),

        heading("4. Körsträckor"),
        new Table({
          columnWidths: [4680, 2340, 2340],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            tableRow(["Sträcka", "Avstånd", "Tid"], true),
            tableRow(["Stavsnäs → Älmhult", "~510 km", "~6–7 h"]),
            tableRow(["Älmhult → Jeppa", "~40 km", "~40 min"]),
            tableRow(["Älmhult → Bolmen", "~80 km", "~1 h"]),
            tableRow(["Älmhult → Jönköping", "~120 km", "~1,5 h"]),
            tableRow(["Jönköping → Stavsnäs", "~350 km", "~4–5 h"]),
          ],
        }),

        new Paragraph({ children: [new PageBreak()] }),

        heading("5. Dag-för-dag"),

        heading("25 juli – Ankomst Älmhult", HeadingLevel.HEADING_2),
        bullet("bullets", "Avresa Stavsnäs (gärna 09:00–10:00)."),
        bullet("bullets", "Laddstopp: Jönköping (M2 Center), ev. Växjö/Klevshult."),
        bullet("bullets", "Valfritt stopp: Gränna (polkagrisar, Ravelsmarks gårdsbutik)."),
        bullet("bullets", "Incheckning Älmhult."),
        bullet("bullets", "Valfritt: Bårshult loppis (Bårshult 26) om ni hinner."),
        bullet("bullets", "Valfritt: IKEA Museum i Älmhult."),

        heading("26 juli – Jeppas trädgård", HeadingLevel.HEADING_2),
        bullet("bullets", "Jeppas trädgård öppen 10:00–16:00 (söndag)."),
        bullet("bullets", "Räkna med 2–3 timmar i trädgården + fika i växthuset."),
        bullet("bullets", "Valfritt före/efter: lagerutförsäljning Svetsvägen 6, Osby."),
        bullet("bullets", "Tillbaka till Älmhult på kvällen."),

        heading("27 juli – Systerdag vid Bolmen", HeadingLevel.HEADING_2),
        bullet("bullets", "Syster anländer från Tyskland (bil eller FlixBus till Ljungby)."),
        bullet("bullets", "Mötesplats: Bolmens Camping, Strandsjövägen 4."),
        bullet("bullets", "Aktiviteter: bad, promenad, kanot, fika."),
        bullet("bullets", "Tiraholms Fisk – lunch med fisk från sjön."),
        bullet("bullets", "Utflykt till Bolmsö med färja."),
        bullet("bullets", "Tillbaka till Älmhult på kvällen."),

        heading("28 juli – Utcheckning och Jönköping", HeadingLevel.HEADING_2),
        bullet("bullets", "08:00 – utcheckning Älmhult."),
        bullet("bullets", "Valfritt förmiddagsstopp: Ljungby (laddning + Jonas Second Hand)."),
        bullet("bullets", "Valfritt: Gränna (gårdar, loppis, Kaffestugan Grännaberget)."),
        bullet("bullets", "Eftermiddag/kväll – hälsa på Daniel (Elins bror) i Jönköping."),
        bullet("bullets", "Övernattning hos Daniel eller hotell."),

        heading("29 juli – Hemresa", HeadingLevel.HEADING_2),
        bullet("bullets", "Förmiddag med Daniel (fika/promenad)."),
        bullet("bullets", "Valfritt: PMU Second Hand, Sam-Hjälp i Jönköping."),
        bullet("bullets", "Ladda fullt innan avfärd (M2 Center eller hos Daniel)."),
        bullet("bullets", "Kör E4 norrut mot Stavsnäs. Laddstopp vid behov."),
        bullet("bullets", "Ankomst Stavsnäs på kvällen."),

        heading("30 juli – Hemma", HeadingLevel.HEADING_2),
        para("Hemma i Stavsnäs."),

        new Paragraph({ children: [new PageBreak()] }),

        heading("6. Saker att göra på vägen"),

        heading("Loppisar", HeadingLevel.HEADING_2),
        bullet("bullets", "Bårshult loppis – Bårshult 26, nära Älmhult (lördagar)."),
        bullet("bullets", "Östregård Antikt – Moheda (Loppisvägen)."),
        bullet("bullets", "Olofs Handelsbod – Moheda (handelsbod + loppis)."),
        bullet("bullets", "Lilla Loppan – Lekaryds Lantcafé."),
        bullet("bullets", "Jonas Second Hand – Ljungby."),
        bullet("bullets", "Gränna För Gott – Gränna centrum."),
        bullet("bullets", "Stallqvarn – Jönköping (antik i 1880-tals kvarn, fre–sön)."),
        bullet("bullets", "PMU Second Hand – Jönköping."),
        bullet("bullets", "Sam-Hjälp – Jönköping."),
        bullet("bullets", "Vetterstadens Antik – Huskvarna (tors + sön)."),

        heading("Gårdar och handelsbodar", HeadingLevel.HEADING_2),
        bullet("bullets", "Olofs Handelsbod – Moheda."),
        bullet("bullets", "Lekaryds Lantcafé – lanthandel-känsla, fika."),
        bullet("bullets", "Ravelsmarks gårdsbutik & café – Gränna."),
        bullet("bullets", "BauerGården – Bunn (vid Gränna)."),
        bullet("bullets", "Lupiners Magasin – Gränna."),
        bullet("bullets", "Flättinge Gårdscafé – Gränna."),
        bullet("bullets", "Grännaknäcke – Gränna centrum."),
        bullet("bullets", "Hooks Herrgård – Jönköping (spa, restaurang)."),

        heading("Fika och utsikt", HeadingLevel.HEADING_2),
        bullet("bullets", "Kaffestugan Grännaberget – utsikt över Vättern och Visingsö."),
        bullet("bullets", "Systrarna Skogströms Lantcafé – Ör."),
        bullet("bullets", "Café St. Clair – Alvesta."),
        bullet("bullets", "Sollans café – Bolmen."),
        bullet("bullets", "Tiraholms Fisk – Bolmen."),

        heading("Loppisvägen (halvdagsutflykt från Älmhult)", HeadingLevel.HEADING_2),
        para("Sträcka Alvesta–Ör–Moheda, ca 20 km med många stopp:"),
        bullet("numbers", "Uddabutiken, Ör"),
        bullet("numbers", "Systrarna Skogströms Lantcafé, Ör"),
        bullet("numbers", "Östregård Antikt, Moheda"),
        bullet("numbers", "Olofs Handelsbod, Moheda"),
        bullet("numbers", "Lekaryds Lantcafé + Lilla Loppan"),
        bullet("numbers", "Café St. Clair, Alvesta"),

        new Paragraph({ children: [new PageBreak()] }),

        heading("7. Elbil – laddplan"),
        bullet("bullets", "Ladda 100 % hemma i Stavsnäs före avfärd."),
        bullet("bullets", "Snabbladda till 80 % vid stopp (snabbare än till 100 %)."),
        bullet("bullets", "Huvudstopp: Jönköping M2 Center, Ljungby Elservice, Växjö/Klevshult."),
        bullet("bullets", "Fråga Daniel om laddplats i Jönköping."),
        bullet("bullets", "Appar: ChargeFinder, A Better Route Planner (ABRP)."),
        bullet("bullets", "Uppskattad elkostnad hela resan: ca 400–700 kr."),

        heading("8. Syskon och familj"),

        heading("Syster (27 juli, Bolmen)", HeadingLevel.HEADING_2),
        bullet("bullets", "Kommer från Tyskland."),
        bullet("bullets", "Möte: Bolmens Camping, Strandsjövägen 4, 341 94 Ljungby."),
        bullet("bullets", "Med bil: Hamburg via Danmark, E4, avfart Ljungby (~7–9 h)."),
        bullet("bullets", "Med buss: FlixBus Hamburg → Ljungby (~10 h), sedan taxi/buss 146 till Bolmen."),

        heading("Daniel (28–29 juli, Jönköping)", HeadingLevel.HEADING_2),
        bullet("bullets", "Elins bror – planera möte, middag och ev. övernattning."),
        bullet("bullets", "Skicka: ankomst 28 juli, hemma senast 30 juli."),
        bullet("bullets", "Fråga om laddplats för elbilen."),

        heading("9. Packlista"),
        bullet("bullets", "Badkläder och handdukar."),
        bullet("bullets", "Solskydd och myggmedel."),
        bullet("bullets", "Bekväma skor för trädgård och skog."),
        bullet("bullets", "Långärmad tröja till kvällar vid sjön."),
        bullet("bullets", "Laddkabel Typ 2 (för långsam laddning)."),
        bullet("bullets", "Kylväska om ni lagar mat i stuga."),
        bullet("bullets", "Kontanter/Swish för loppisar utan kort."),

        heading("10. Checklista före avresa"),
        bullet("checklist", "Bokat boende Älmhult 25–28 juli."),
        bullet("checklist", "Koordinerat med syster (datum, mötesplats Bolmen)."),
        bullet("checklist", "Koordinerat med Daniel (datum, övernattning, laddning)."),
        bullet("checklist", "Kollat öppettider för Jeppa (26 juli 10–16)."),
        bullet("checklist", "Laddat elbilen 100 % i Stavsnäs."),
        bullet("checklist", "Laddat ner ChargeFinder/ABRP."),
        bullet("checklist", "Packat enligt packlistan."),

        heading("11. Användbara länkar"),
        bullet("bullets", "Jeppas trädgård: jeppastradgard.se"),
        bullet("bullets", "Bolmendagarna: visitbolmen.se"),
        bullet("bullets", "Loppisar: svenskaloppisar.se"),
        bullet("bullets", "Småland tips: visitsmaland.se"),
        bullet("bullets", "FlixBus (syster): flixbus.se"),

        para(""),
        para("God resa!", { bold: true, size: 28 }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  const outPath = "e:\\Programmering\\Projekt\\Temp\\Resa\\Resplan-Smaland-2026.docx";
  fs.writeFileSync(outPath, buffer);
  console.log(`Created: ${outPath}`);
});
