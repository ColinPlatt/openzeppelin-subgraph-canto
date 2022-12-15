#!/usr/bin/env bash

set -xo errexit



  npx graph-compiler --config ~/dev/altoAll/oz-canto/configs/live/canto/nfts.json --include ~/dev/altoAll/oz-canto/src/datasources --export-schema --export-subgraph
  npx graph codegen ~/dev/altoAll/oz-canto/generated/live/canto/nfts.subgraph.yaml

  npx graph create --node http://localhost:8020 canto/nfts_totalSupply --access-token {$ACCESS_TOKEN} ~/dev/altoAll/oz-canto/generated/live/canto/nfts.subgraph.yaml
  sleep 5
  npx graph deploy --node http://localhost:8020 --ipfs http://localhost:5001 canto/nfts_totalSupply --access-token {$ACCESS_TOKEN} ~/dev/altoAll/oz-canto/generated/live/canto/nfts.subgraph.yaml


