#!/bin/sh
set -e

# Wait for MongoDB to be ready
echo "Waiting for MongoDB..."
until node -e "
const { MongoClient } = require('mongodb');
const url = process.env.DB_PATH || 'mongodb://mongodb:27017/ringteki';
const client = new MongoClient(url);
client.connect()
  .then(() => client.db().collection('cards').countDocuments())
  .then(() => { console.log('MongoDB ready'); client.close(); process.exit(0); })
  .catch(() => { client.close(); process.exit(1); });
" 2>/dev/null; do
  sleep 2
done

# Check if cards have been fetched
CARD_COUNT=$(node -e "
const { MongoClient } = require('mongodb');
const url = process.env.DB_PATH || 'mongodb://mongodb:27017/ringteki';
const client = new MongoClient(url);
client.connect()
  .then(() => client.db().collection('cards').countDocuments())
  .then(count => { console.log(count); client.close(); })
  .catch(() => { console.log(0); client.close(); });
" 2>/dev/null || echo "0")

if [ "$CARD_COUNT" = "0" ]; then
  echo "No cards found in database. Fetching card data..."
  node server/scripts/fetchdata.js ${ENVIRONMENT:-live}
else
  echo "Card data already exists ($CARD_COUNT cards)"
fi

# Start the application
exec node index.js
