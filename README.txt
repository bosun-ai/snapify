To run use:
install node.js
 - e.g. sudo apt install nodejs npm

In assets/forsure-data-loader.js 
 - check server_url,  websocket_url, auth_url, client_secret to match local/live settings

cd ForSURE_Frontend

## Python nodeenv setup
python3 -m venv .venv
. .venv/bin/activate
pip install nodeenv

## node env setup
which nodeenv         
nodeenv .env 
. .env/bin/activate

## Check path is in env
which node
node -v
which npm
npm install @shopify/cli@latest

## first time
shopify theme dev --store=https://fe12dd.myshopify.com

shopify theme dev
