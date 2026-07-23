# Resa Småland 2026

Mobilanpassad resesajt med resplan, dag-för-dag-vy, checklista och anteckningar som sparas lokalt och kan laddas ner.

## Snabbstart

```bash
npm start
```

Öppna sedan `http://localhost:3000` på datorn eller mobilen (samma wifi).

## Funktioner

- **Plan** – GPS ("Var är vi nu?"), översikt och checklista
- **Dagar** – välj dag och se vad som händer (idag väljs automatiskt)
- **Anteckningar** – skriv, spara automatiskt, ladda ner
- **Bilder** – ladda upp/ta foton, sparas lokalt, ladda ner hem
- **Mer** – adresser (öppna i kartor), körsträckor, laddplan, packlista, länkar

## GPS

GPS kräver att du tillåter platsåtkomst i webbläsaren. Fungerar bäst via `https://` eller `localhost` (inte om filen öppnas direkt som `file://`).

## Bilder

## Dela med mobilen

1. Kör `npm start` på datorn
2. Hitta datorns IP (t.ex. `192.168.1.10`)
3. Öppna `http://192.168.1.10:3000` på mobilen

Alternativt: lägg upp mappen `web/` som statisk sajt (t.ex. Render Static Site).

## Word-dokument

```bash
npm run doc
```

Skapar `Resplan-Smaland-2026.docx`.
