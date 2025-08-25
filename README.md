# Financial Times News Scraper

Un scraper automatisé pour extraire et sauvegarder les articles du Financial Times à partir de leurs flux RSS. Le système utilise une approche de "swarm scraping" pour traiter plusieurs articles en parallèle tout en évitant la détection.

## 📋 Fonctionnalités

- **Scraping RSS** : Extraction automatique des URLs d'articles depuis les flux RSS du FT
- **Scraping parallèle** : Traitement concurrent de plusieurs articles pour optimiser la vitesse
- **Anti-détection** : Utilisation de Puppeteer Stealth et rotation d'user-agents
- **Gestion des paywalls** : Tentative de contournement des overlays de paywall
- **Sauvegarde multiple** : Export en JSON et CSV avec détection des doublons
- **Planification** : Exécution automatique quotidienne via cron
- **Gestion d'erreurs** : Retry automatique et logging des erreurs

## 🔧 Dépendances

### Dependencies principales
```json
{
  "puppeteer-extra": "^3.3.6",
  "puppeteer-extra-plugin-stealth": "^2.11.2",
  "rss-parser": "^3.13.0",
  "mongodb": "^6.0.0",
  "csv-writer": "^1.6.0",
  "node-cron": "^3.0.3"
}
```

### Installation
```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth rss-parser mongodb csv-writer node-cron
```

## 🏗️ Architecture et Fonctions

### 1. Configuration (`config`)
```javascript
const config = {
  feedUrls: ['https://www.ft.com/world?format=rss', 'https://www.ft.com/companies?format=rss'],
  maxConcurrent: 5,
  limit: 20,
  proxies: [null],
  userAgents: [...]
}
```
**Intérêt** : Centralise tous les paramètres configurables (flux RSS, limite de concurrence, proxies, user-agents) pour faciliter la maintenance et les ajustements.

### 2. Lancement du navigateur (`launchBrowser`)
```javascript
async function launchBrowser(proxy = null)
```
**Étapes de traitement** :
- Sélection aléatoire d'un user-agent
- Configuration des arguments Puppeteer (sandbox, proxy)
- Lancement en mode headless

**Intérêt** : Initialise un navigateur configuré pour éviter la détection avec rotation d'user-agents et support proxy.

### 3. Scraping d'article (`scrapeArticle`)
```javascript
async function scrapeArticle(page, url, retries = 2)
```
**Étapes de traitement** :
1. Navigation vers l'URL avec timeout
2. Suppression des éléments de paywall via JavaScript
3. Attente pour le chargement du contenu
4. Extraction des données (titre, corps, date, auteur)
5. Retry automatique en cas d'échec

**Intérêt** : Fonction core qui extrait le contenu d'un article en gérant les obstacles (paywall, timeouts) avec un système de retry robuste.

### 4. Récupération des URLs (`getArticleUrls`)
```javascript
async function getArticleUrls(feeds = config.feedUrls, limit = config.limit)
```
**Étapes de traitement** :
1. Parse de chaque flux RSS
2. Filtrage des articles du jour uniquement
3. Limitation du nombre d'articles par flux
4. Déduplication des URLs

**Intérêt** : Collecte intelligente des URLs à scraper en se concentrant sur le contenu récent et en évitant les doublons.

### 5. Sauvegarde JSON (`saveToJson`)
```javascript
async function saveToJson(articles)
```
**Étapes de traitement** :
1. Lecture du fichier JSON existant
2. Détection des articles déjà présents via URL
3. Ajout uniquement des nouveaux articles
4. Sauvegarde avec formatage

**Intérêt** : Maintient un historique complet en JSON tout en évitant la duplication de données.

### 6. Sauvegarde CSV (`saveToCsv`)
```javascript
async function saveToCsv(articles)
```
**Étapes de traitement** :
1. Configuration du writer CSV avec headers
2. Lecture du CSV existant pour détecter les doublons
3. Append des nouveaux articles uniquement

**Intérêt** : Format CSV pour l'analyse de données et l'import dans des outils externes (Excel, BI tools).

### 7. Scraping en essaim (`swarmScrape`)
```javascript
async function swarmScrape()
```
**Étapes de traitement** :
1. Lancement du navigateur avec proxy aléatoire
2. Récupération de la liste des URLs à scraper
3. Traitement par batches concurrents
4. Création de pages multiples pour le parallélisme
5. Exécution simultanée des scraping d'articles
6. Fermeture propre des pages et du navigateur
7. Sauvegarde des résultats

**Intérêt** : Orchestration complète du processus avec optimisation des performances via le traitement parallèle tout en respectant les limites du serveur.

## 🚀 Utilisation

### Exécution manuelle
```bash
node scraper.js
```

### Avec planificateur (recommandé)
```bash
node scheduler.js
```
Le planificateur exécute le scraper quotidiennement à minuit UTC.

## 📁 Structure des données

### Format JSON
```json
{
  "url": "https://www.ft.com/content/...",
  "title": "Article Title",
  "body": "Full article content...",
  "date": "Published date",
  "author": "Author name"
}
```

### Format CSV
```csv
URL,Title,Body,Date,Author
https://www.ft.com/content/...,Article Title,Full content...,Date,Author
```

## ⚙️ Configuration avancée

### Ajout de proxies
```javascript
proxies: [
  'http://user:pass@proxy1:8080',
  'http://user:pass@proxy2:8080',
  null // Direct connection
]
```

### Modification des flux RSS
```javascript
feedUrls: [
  'https://www.ft.com/world?format=rss',
  'https://www.ft.com/companies?format=rss',
  'https://www.ft.com/markets?format=rss'
]
```

### Ajustement de la concurrence
```javascript
maxConcurrent: 3 // Réduire pour des sites plus sensibles
```

## 📝 Logs et monitoring

- Logs de progression en temps réel
- Sauvegarde des erreurs dans `errors.log`
- Compteurs de nouveaux articles sauvegardés
- Retry automatique avec logging des tentatives

## ⚠️ Avertissements

- Respectez les conditions d'utilisation du Financial Times
- Utilisez des délais appropriés pour éviter la surcharge des serveurs
- Testez avec des limites faibles avant le déploiement en production
- Le contournement de paywall peut violer les ToS du site

## 🔍 Troubleshooting

**Problème** : `waitForTimeout is not a function`
**Solution** : Utiliser `new Promise(resolve => setTimeout(resolve, ms))` pour la compatibilité

**Problème** : Articles vides ou "No body"
**Solution** : Ajuster les sélecteurs CSS dans `scrapeArticle()`

**Problème** : Trop d'erreurs 429 (Rate limiting)
**Solution** : Réduire `maxConcurrent` et ajouter plus de délais
