const { program } = require('commander');
const http = require('http');
const fs = require('fs');
const path = require('path');
const fsPromises = require('fs').promises;

program
  .requiredOption('-h, --host <type>')
  .requiredOption('-p, --port <type>')
  .requiredOption('-c, --cache <type>');

program.parse(process.argv);
const options = program.opts();

const cacheDir = path.resolve(options.cache);

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

const server = http.createServer(async (request, response) => {
  const code = request.url.slice(1);
  const filePath = path.join(cacheDir, `${code}.jpg`);

  switch (request.method) {
    case "GET":
      try {
        const data = await fsPromises.readFile(filePath);
        response.writeHead(200, "Content-Type: image/jpeg");
        response.end(data);
      } catch (error) {
        response.writeHead(404);
        response.end("File not found.");
      }
      break;
    case "PUT":
      const chunks = [];
      request.on("data", (chunk) => {
        chunks.push(chunk);
      });
      request.on("end", async () => {
        const body = Buffer.concat(chunks);
        await fsPromises.writeFile(filePath, body);
        response.writeHead(201);
        response.end("File was successfully added.");
      });
      break;
    case "DELETE":
      try {
        await fsPromises.unlink(filePath);
        response.writeHead(200);
        response.end("File was successfully deleted.");
      } catch (error) {
        response.writeHead(404);
        response.end("File not found.");
      }
      break;
    default:
      response.writeHead(405);
      response.end("Method not allowed.");
  }
});

server.on('error', (e) => {
    console.error(e.message);
    process.exit(1);
  });

server.listen(options.port, options.host, () => {
  console.log(`Server address: http://${options.host}:${options.port}`);
});