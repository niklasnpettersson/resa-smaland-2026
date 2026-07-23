const TRIP_DATA = {
  overview: [
    { date: "25 juli", weekday: "lör", title: "Ankomst Älmhult", summary: "Avresa Stavsnäs → incheckning i Älmhult." },
    { date: "26 juli", weekday: "sön", title: "Jeppas trädgård", summary: "Öppet 10:00–16:00. Tillbaka till Älmhult." },
    { date: "27 juli", weekday: "mån", title: "Syster vid Bolmen", summary: "Möte vid Bolmens Camping." },
    { date: "28 juli", weekday: "tis", title: "Mot Jönköping", summary: "Utcheckning. Hälsa på Daniel." },
    { date: "29 juli", weekday: "ons", title: "Hemresa", summary: "Mer tid i Jönköping. Kör mot Stavsnäs." },
    { date: "30 juli", weekday: "tors", title: "Hemma", summary: "Ankomst Stavsnäs." },
  ],

  days: [
    {
      id: "2026-07-25",
      label: "25",
      title: "25 juli – Ankomst Älmhult",
      emoji: "🚗",
      items: [
        "Avresa Stavsnäs (gärna 09:00–10:00).",
        "Laddstopp: Jönköping (M2 Center), ev. Växjö/Klevshult.",
        "Valfritt stopp: Gränna (polkagrisar, Ravelsmarks gårdsbutik).",
        "Incheckning Älmhult.",
        "Valfritt: Bårshult loppis (Bårshult 26) om ni hinner.",
        "Valfritt: IKEA Museum i Älmhult.",
      ],
      addresses: ["almhult"],
    },
    {
      id: "2026-07-26",
      label: "26",
      title: "26 juli – Jeppas trädgård",
      emoji: "🌿",
      items: [
        "Jeppas trädgård öppen 10:00–16:00 (söndag).",
        "Räkna med 2–3 timmar i trädgården + fika i växthuset.",
        "Valfritt före/efter: lagerutförsäljning Svetsvägen 6, Osby.",
        "Tillbaka till Älmhult på kvällen.",
      ],
      addresses: ["jeppa", "jeppa-lager", "almhult"],
    },
    {
      id: "2026-07-27",
      label: "27",
      title: "27 juli – Systerdag vid Bolmen",
      emoji: "💚",
      items: [
        "Syster anländer från Tyskland (bil eller FlixBus till Ljungby).",
        "Mötesplats: Bolmens Camping.",
        "Aktiviteter: bad, promenad, kanot, fika.",
        "Tiraholms Fisk – lunch med fisk från sjön.",
        "Utflykt till Bolmsö med färja.",
        "Tillbaka till Älmhult på kvällen.",
      ],
      addresses: ["bolmen", "ljungby-ladd"],
    },
    {
      id: "2026-07-28",
      label: "28",
      title: "28 juli – Utcheckning och Jönköping",
      emoji: "👋",
      items: [
        "08:00 – utcheckning Älmhult.",
        "Valfritt förmiddagsstopp: Ljungby (laddning + Jonas Second Hand).",
        "Valfritt: Gränna (gårdar, loppis, Kaffestugan Grännaberget).",
        "Eftermiddag/kväll – hälsa på Daniel i Jönköping.",
        "Övernattning hos Daniel eller hotell.",
      ],
      addresses: ["almhult", "ljungby-ladd", "jonkoping"],
    },
    {
      id: "2026-07-29",
      label: "29",
      title: "29 juli – Hemresa",
      emoji: "🏠",
      items: [
        "Förmiddag med Daniel (fika/promenad).",
        "Valfritt: PMU Second Hand, Sam-Hjälp i Jönköping.",
        "Ladda fullt innan avfärd (M2 Center eller hos Daniel).",
        "Kör E4 norrut mot Stavsnäs. Laddstopp vid behov.",
        "Ankomst Stavsnäs på kvällen.",
      ],
      addresses: ["jonkoping"],
    },
    {
      id: "2026-07-30",
      label: "30",
      title: "30 juli – Hemma",
      emoji: "✨",
      items: ["Hemma i Stavsnäs."],
      addresses: [],
    },
  ],

  addresses: {
    stavnas: { name: "Hemma Stavsnäs", address: "Stavsnäs", maps: "Stavsnäs, Sverige", lat: 59.298, lng: 18.704 },
    almhult: { name: "Boende Älmhult", address: "Älmhult", maps: "Älmhult, Sverige", lat: 56.556, lng: 14.138 },
    jeppa: { name: "Jeppas trädgård", address: "Jeppa Svenstorp 2089, 283 91 Osby", maps: "Jeppa Svenstorp 2089, Osby", lat: 56.378, lng: 14.002 },
    "jeppa-lager": { name: "Jeppas lager", address: "Svetsvägen 6, 283 43 Osby", maps: "Svetsvägen 6, Osby", lat: 56.381, lng: 14.005 },
    bolmen: { name: "Möte Bolmen", address: "Bolmens Camping, Strandsjövägen 4, 341 94 Ljungby", maps: "Bolmens Camping, Ljungby", lat: 56.941, lng: 13.718 },
    "ljungby-ladd": { name: "Ljungby laddning", address: "Ljungby Elservice, Bolmstadvägen 40A, Ljungby", maps: "Ljungby Elservice, Ljungby", lat: 56.831, lng: 13.942 },
    jonkoping: { name: "Daniel i Jönköping", address: "Jönköping", maps: "Jönköping, Sverige", lat: 57.783, lng: 14.162 },
  },

  distances: [
    { route: "Stavsnäs → Älmhult", distance: "~510 km", time: "~6–7 h" },
    { route: "Älmhult → Jeppa", distance: "~40 km", time: "~40 min" },
    { route: "Älmhult → Bolmen", distance: "~80 km", time: "~1 h" },
    { route: "Älmhult → Jönköping", distance: "~120 km", time: "~1,5 h" },
    { route: "Jönköping → Stavsnäs", distance: "~350 km", time: "~4–5 h" },
  ],

  preTripChecklist: [
    "Bokat boende Älmhult 25–28 juli.",
    "Koordinerat med syster (datum, mötesplats Bolmen).",
    "Koordinerat med Daniel (datum, övernattning, laddning).",
    "Kollat öppettider för Jeppa (26 juli 10–16).",
    "Laddat elbilen 100 % i Stavsnäs.",
    "Laddat ner ChargeFinder/ABRP.",
    "Packat enligt packlistan.",
  ],

  evTips: [
    "Ladda 100 % hemma i Stavsnäs före avfärd.",
    "Snabbladda till 80 % vid stopp (snabbare än till 100 %).",
    "Huvudstopp: Jönköping M2 Center, Ljungby Elservice, Växjö/Klevshult.",
    "Fråga Daniel om laddplats i Jönköping.",
    "Appar: ChargeFinder, A Better Route Planner (ABRP).",
    "Uppskattad elkostnad hela resan: ca 400–700 kr.",
  ],

  packing: [
    {
      id: "niklas",
      name: "Niklas",
      emoji: "🧔",
      groups: [
        {
          title: "Viktigast",
          items: ["Sertraline", "Elin 💚"],
        },
        {
          title: "Kläder",
          items: [
            "T-shirts och shorts",
            "Långärmad tröja till kvällar vid sjön",
            "Underkläder och strumpor",
            "Bekväma skor för trädgård och skog",
            "Keps eller solhatt",
          ],
        },
        {
          title: "Badrumsartiklar",
          items: ["Tandborste och tandkräm", "Deo", "Rakgrejer", "Solkräm"],
        },
        {
          title: "Badkläder",
          items: ["Badbyxor", "Handduk"],
        },
      ],
    },
    {
      id: "elin",
      name: "Elin",
      emoji: "🤰",
      groups: [
        {
          title: "Viktigast (gravid)",
          items: [
            "Fragmin (sprutor + burk för kanyler)",
            "Mödravårdsjournal / vårdpapper",
            "Barnmorskans telefonnummer",
            "Vitaminer/järntabletter (om du tar)",
          ],
        },
        {
          title: "Sköna saker för gravid",
          items: [
            "Stödstrumpor till bilresan",
            "Gravidkudde eller extra kudde",
            "Egen vattenflaska — drick ofta",
            "Snacks mot illamående (ingefära, kex)",
            "Gaviscon eller liknande mot halsbränna",
          ],
        },
        {
          title: "Kläder",
          items: [
            "Bekväma, luftiga kläder",
            "Långärmad tröja till kvällar vid sjön",
            "Bekväma skor (lätta att ta av och på)",
            "Solhatt",
          ],
        },
        {
          title: "Badrumsartiklar",
          items: ["Tandborste och tandkräm", "Deo", "Hudkräm", "Solkräm med hög faktor"],
        },
        {
          title: "Badkläder",
          items: ["Baddräkt", "Handduk"],
        },
      ],
    },
    {
      id: "gemensamt",
      name: "Gemensamt",
      emoji: "🎒",
      groups: [
        {
          title: "Viktigast",
          items: ["Madrass", "Mobilladdare", "Laddkabel Typ 2 till elbilen"],
        },
        {
          title: "Övrigt",
          items: [
            "Solskydd och myggmedel",
            "Kylväska",
            "Kontanter/Swish för loppisar",
            "Kassar till loppisfynd",
          ],
        },
      ],
    },
  ],

  links: [
    { label: "Jeppas trädgård", url: "https://jeppastradgard.se" },
    { label: "Bolmendagarna", url: "https://visitbolmen.se" },
    { label: "Loppisar", url: "https://svenskaloppisar.se" },
    { label: "Småland tips", url: "https://visitsmaland.se" },
    { label: "FlixBus (syster)", url: "https://flixbus.se" },
  ],

  smalandQuotes: [
    { text: "Låt aldrig förnuftet hindra dig från att göra det hjärtat vill.", by: "Astrid Lindgren, Vimmerby" },
    { text: "Allt stort som skedde i världen skedde först i någon människas fantasi.", by: "Astrid Lindgren" },
    { text: "Än lever Emil i Lönneberga!", by: "Astrid Lindgren" },
    { text: "Den som är väldigt stark måste också vara väldigt snäll.", by: "Astrid Lindgren" },
    { text: "En dag vid Bolmen är aldrig bortkastad.", by: "Småländskt visdomsord" },
    { text: "Smålänningen köper inget nytt förrän loppisen är genomsökt.", by: "Småländskt visdomsord" },
    { text: "Kaffet smakar bäst i ett växthus.", by: "Småländskt visdomsord" },
    { text: "Skogen har alltid rätt.", by: "Småländskt visdomsord" },
    { text: "Det ordnar sig — och gör det inte det, så fikar vi först.", by: "Småländskt visdomsord" },
    { text: "Hemma är där laddkabeln räcker fram.", by: "Elbilsresenärens ordspråk" },
  ],
};
