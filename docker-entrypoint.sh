#!/bin/sh
set -e

# Wait for MongoDB, then count the cards (one Node start for both)
echo "Waiting for MongoDB..."
CARD_COUNT=$(node -e "
const { MongoClient } = require('mongodb');
const url = process.env.DB_PATH || 'mongodb://mongodb:27017/jigoku';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
(async () => {
  for(;;) {
    const client = new MongoClient(url);
    try {
      await client.connect();
      console.log(await client.db().collection('cards').countDocuments());
      await client.close();
      return;
    } catch {
      await client.close().catch(() => {});
      await wait(2000);
    }
  }
})();
" 2>/dev/null || echo "0")
echo "MongoDB ready"

if [ "$CARD_COUNT" = "0" ]; then
  echo "No cards found in database. Fetching card data..."
  node build/server/scripts/fetchdata.js ${ENVIRONMENT:-live}
else
  echo "Card data already exists ($CARD_COUNT cards)"
fi

# Token art ships with the repo but public/img/cards is a named volume, so the image's
# copy is hidden once that volume exists. version.json is fetchdata's, so leave it be.
if [ -d token-images ]; then
  for img in token-images/*.webp token-images/*.jpg token-images/*.png; do
    if [ -f "$img" ]; then
      cp -f "$img" public/img/cards/ || echo "Could not sync $img"
    fi
  done
  echo "Token images synced into public/img/cards"
fi

# Start the application
exec node build/index.js
