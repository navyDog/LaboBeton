# Étape 1 : Construction (Builder)
FROM node:20-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# 1. Copier les fichiers de définition de dépendances (Racine + Client + Serveur)
COPY package.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# 2. Installer les dépendances
# Racine (pour concurrently etc)
RUN npm install
# Client
RUN cd client && npm install
# Serveur
RUN cd server && npm install

# 3. Copier tout le code source
COPY . .

# 4. Construire l'application React (dans client/)
# Cela va créer le dossier /app/client/dist
RUN npm run build --prefix client

# Étape 2 : Image de Production (Runner)
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# 1. Copier le package.json du serveur pour la prod
COPY server/package.json ./

# 2. Installer uniquement les dépendances de production du serveur
RUN npm install --omit=dev

# 3. Copier le code du serveur
# Note: On suppose que server.js est dans le dossier server/
COPY server/server.js ./
COPY server/src ./src

# 4. Copier le build frontend (dist) généré à l'étape précédente
# On le place dans un dossier 'dist' à la racine de l'image, car server.js sert 'dist'
COPY --from=builder /app/client/dist ./dist

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=8080

# Exposer le port
EXPOSE 8080

# Démarrer le serveur

CMD ["node", "server.js"]



