import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config({ path: "api.env" });

const port = Number(process.env.PORT || 4173);
const baseUrl = "https://developer.nps.gov/api/v1";
const root = fileURLToPath(new URL(".", import.meta.url));

async function getRandomPark() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY is not configured in api.env");

  const headers = { "X-Api-Key": apiKey };
  const initialResponse = await fetch(`${baseUrl}/parks?limit=1&start=0`, { headers });
  if (!initialResponse.ok) throw new Error(`National Parks API returned ${initialResponse.status}`);

  const initialData = await initialResponse.json();
  const total = Number(initialData.total);
  if (!total) throw new Error("The National Parks API returned no parks");

  const start = Math.floor(Math.random() * total);
  const parkResponse = await fetch(`${baseUrl}/parks?limit=1&start=${start}`, { headers });
  if (!parkResponse.ok) throw new Error(`National Parks API returned ${parkResponse.status}`);

  const parkData = await parkResponse.json();
  const park = parkData.data?.[0];
  if (!park) throw new Error("Could not retrieve a random park");
  return park;
}

createServer(async (request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (pathname === "/api/random-park") {
    try {
      const park = await getRandomPark();
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      response.end(JSON.stringify(park));
    } catch (error) {
      response.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: error.message || "Unable to fetch a park right now." }));
    }
    return;
  }

  if (pathname === "/" || pathname === "/index.html") {
    try {
      const html = await readFile(`${root}index.html`);
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(html);
    } catch {
      response.writeHead(500);
      response.end("Could not load the website.");
    }
    return;
  }

  response.writeHead(404);
  response.end("Not found");
}).listen(port, () => {
  console.log(`National Parks experience running at http://localhost:${port}`);
});