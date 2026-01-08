# Étape 1 : Construction du Frontend (Builder)
FROM node:20-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances
RUN npm install

# Copier tout le code source
COPY . .

# Construire l'application React (génère le dossier /dist)
RUN npm run build

# Étape 2 : Image de Production (Runner)
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm install --omit=dev

# Copier les artefacts construits depuis l'étape précédente
COPY --from=builder /app/dist ./dist

# Copier le serveur et les modèles (Backend)
COPY --from=builder /app/server.js ./
COPY --from=builder /app/models ./models

# Définir les variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=8080

# Exposer le port
EXPOSE 8080

# Démarrer le serveur directement avec node
CMD ["node", "server.js"]
