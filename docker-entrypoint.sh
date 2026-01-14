#!/bin/sh
set -e

# Wait for MongoDB to be ready
echo "Waiting for MongoDB..."
until node -e "const monk = require('monk'); const db = monk(process.env.DB_PATH || 'mongodb://mongodb:27017/ringteki'); db.get('cards').count().then(() => { console.log('MongoDB ready'); db.close(); process.exit(0); }).catch(() => { db.close(); process.exit(1); });" 2>/dev/null; do
  sleep 2
done

# Check if cards have been fetched
CARD_COUNT=$(node -e "const monk = require('monk'); const db = monk(process.env.DB_PATH || 'mongodb://mongodb:27017/ringteki'); db.get('cards').count().then(count => { console.log(count); db.close(); });" 2>/dev/null || echo "0")

if [ "$CARD_COUNT" = "0" ]; then
  echo "No cards found in database. Fetching card data..."
  node server/scripts/fetchdata.js ${ENVIRONMENT:-live}
else
  echo "Card data already exists ($CARD_COUNT cards)"
fi

# Start the application
exec node index.js
