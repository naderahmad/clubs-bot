// La web app llega en la fase 2. Por ahora esta página solo confirma que el despliegue funciona.
export default function Home() {
  return (
    <main style={{ padding: 40 }}>
      <h1>⚽ Bot del club activo</h1>
      <p>Endpoint de Discord: <code>/api/discord/interactions</code></p>
    </main>
  );
}
