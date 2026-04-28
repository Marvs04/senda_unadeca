import app from './app.mjs';

const { PORT = '4000' } = process.env;

app.listen(Number(PORT), () => {
  console.info(`SENDA backend API listening on http://localhost:${PORT}`);
});
