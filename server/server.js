// --- SÉCURITÉ : CORS ---
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  process.env.FRONTEND_URL 
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Autorise les requêtes sans origine (ex : Postman, curl)

    // En développement, autoriser toutes les origines locales
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // En production, vérifier que l'origine est dans la liste des allowedOrigins
    if (allowedOrigins.includes(origin)) {
    return callback(null, true);
    }

    // Si l'origine n'est pas autorisée, refuser la requête
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

