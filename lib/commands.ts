/** Definición de los slash commands (se registran con `npm run register`). */
const STRING = 3, USER = 6;
const MANAGE_GUILD = "32"; // solo capitanes/admins ven estos comandos

export const COMMANDS = [
  {
    name: "convocatoria",
    description: "Crea una convocatoria con botones de asistencia",
    default_member_permissions: MANAGE_GUILD,
    options: [
      { type: STRING, name: "fecha", description: "AAAA-MM-DD, 'hoy' o 'mañana'", required: true },
      { type: STRING, name: "hora", description: "Hora de inicio, formato 24h (ej. 21:00)", required: true },
      {
        type: STRING, name: "tipo", description: "Tipo de partido", required: true,
        choices: [{ name: "Liga", value: "liga" }, { name: "Amistoso", value: "amistoso" }],
      },
      { type: STRING, name: "nota", description: "Rival, torneo, indicaciones…", required: false },
    ],
  },
  {
    name: "vincular",
    description: "Vincula tu cuenta de Discord con tu gamertag de EA",
    options: [{ type: STRING, name: "gamertag", description: "Tu gamertag exacto (PSN/Xbox/EA)", required: true }],
  },
  {
    name: "fiabilidad",
    description: "Muestra la fiabilidad y las tarjetas de un jugador",
    options: [{ type: USER, name: "jugador", description: "Por defecto, tú", required: false }],
  },
  {
    name: "tarjeta",
    description: "Pone una tarjeta manual a un jugador",
    default_member_permissions: MANAGE_GUILD,
    options: [
      { type: USER, name: "jugador", description: "Jugador sancionado", required: true },
      {
        type: STRING, name: "tipo", description: "Tipo de tarjeta", required: true,
        choices: [{ name: "🟨 Amarilla", value: "amarilla" }, { name: "🟥 Roja", value: "roja" }],
      },
      { type: STRING, name: "motivo", description: "Motivo", required: true },
    ],
  },
];
